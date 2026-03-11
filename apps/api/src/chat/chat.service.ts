import { Injectable, Logger } from "@nestjs/common";
import { ChromaDbService } from "../ingest/chromadb.service";
import { DriveService } from "../ingest/drive.service";
import { FoldersService } from "../folders/folders.service";
import type { Citation, ChatStreamEvent, FileAction, FileActionResult } from "@talk-to-a-folder/shared";
import OpenAI from "openai";
import Groq from "groq-sdk";

const EMBEDDING_MODEL = "text-embedding-3-small";
const GROQ_MODEL = "groq/compound";
const ROUTING_MODEL = "llama-3.1-8b-instant";
const TOP_K = 8;

interface RetrievedChunk {
  text: string;
  metadata: {
    fileName: string;
    fileId: string;
    googleDriveLink: string;
    folderId: string;
    mimeType: string;
    chunkIndex: number;
  };
  score: number;
}

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);
  private readonly openai: OpenAI;
  private readonly groq: Groq;

  constructor(
    private readonly chromaDbService: ChromaDbService,
    private readonly driveService: DriveService,
    private readonly foldersService: FoldersService,
  ) {
    this.openai = new OpenAI({
      apiKey: process.env["OPENAI_API_KEY"] ?? "",
    });
    this.groq = new Groq({
      apiKey: process.env["GROQ_API_KEY"] ?? "",
    });
  }

  /**
   * Generate a query embedding using the same model as ingestion.
   */
  private async embedQuery(query: string): Promise<number[]> {
    const res = await this.openai.embeddings.create({
      model: EMBEDDING_MODEL,
      input: query,
    });
    return res.data[0]!.embedding;
  }

  /**
   * Use a fast LLM to decide which files are relevant to the user's query.
   * Returns an array of file names the query is about, or ALL file names
   * if the query is broad (e.g. "summarize everything").
   */
  private async routeQueryToFiles(
    query: string,
    allFileNames: string[],
  ): Promise<{ files: string[]; isAllFiles: boolean }> {
    const fileList = allFileNames
      .map((name, i) => `${i + 1}. ${name}`)
      .join("\n");

    try {
      const response = await this.groq.chat.completions.create({
        model: ROUTING_MODEL,
        messages: [
          {
            role: "system",
            content: `You are a file routing assistant. Given a user query and a list of files, determine which files are relevant.

Respond with ONLY a JSON object in this exact format:
{"files": [1, 3, 5], "all": false}

- "files": array of file NUMBERS (1-based) that the query is about
- "all": true if the query is about ALL files (e.g. "summarize everything", "what's in the folder", "contents of all files")

If the query is about all files, set "all": true and "files": [].
If the query is about specific files, set "all": false and list the relevant file numbers.
If unsure which files are relevant, include your best guesses.`,
          },
          {
            role: "user",
            content: `FILES:\n${fileList}\n\nQUERY: ${query}`,
          },
        ],
        temperature: 0,
        max_tokens: 256,
      });

      const raw = response.choices[0]?.message?.content?.trim() ?? "";
      this.logger.log(`File routing response: ${raw}`);

      // Parse the JSON response
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.all === true) {
          return { files: allFileNames, isAllFiles: true };
        }
        const fileIndices: number[] = Array.isArray(parsed.files) ? parsed.files : [];
        const selectedFiles = fileIndices
          .filter((idx: number) => idx >= 1 && idx <= allFileNames.length)
          .map((idx: number) => allFileNames[idx - 1]!);
        return { files: [...new Set(selectedFiles)], isAllFiles: false };
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.warn(`File routing LLM call failed, falling back to similarity only: ${message}`);
    }

    // Fallback: no supplemental files
    return { files: [], isAllFiles: false };
  }

  /**
   * Retrieve relevant chunks from ChromaDB, filtered by folderId.
   * Uses an LLM routing step to determine which files the query is about,
   * then supplements similarity results with targeted chunks from those files.
   */
  async retrieve(query: string, folderId: string, allFileNames?: string[]): Promise<RetrievedChunk[]> {
    const queryEmbedding = await this.embedQuery(query);
    const collection = this.chromaDbService.getCollection();

    const results = await collection.query({
      queryEmbeddings: [queryEmbedding],
      nResults: TOP_K,
      where: { folderId },
    });

    const chunks: RetrievedChunk[] = [];
    const docs = results.documents?.[0] ?? [];
    const metas = results.metadatas?.[0] ?? [];
    const distances = results.distances?.[0] ?? [];

    for (let i = 0; i < docs.length; i++) {
      const doc = docs[i];
      const meta = metas[i];
      if (!doc || !meta) continue;

      const distance = distances[i] ?? 0;
      const score = 1 / (1 + distance);

      chunks.push({
        text: doc,
        metadata: {
          fileName: String(meta["fileName"] ?? ""),
          fileId: String(meta["fileId"] ?? ""),
          googleDriveLink: String(meta["googleDriveLink"] ?? ""),
          folderId: String(meta["folderId"] ?? ""),
          mimeType: String(meta["mimeType"] ?? ""),
          chunkIndex: Number(meta["chunkIndex"] ?? 0),
        },
        score,
      });
    }

    // Use LLM routing to determine which files the query targets
    if (allFileNames && allFileNames.length > 0) {
      const { files: targetFiles, isAllFiles } = await this.routeQueryToFiles(query, allFileNames);

      if (targetFiles.length > 0) {
        this.logger.log(
          isAllFiles
            ? `LLM router: broad query – fetching chunks from all ${targetFiles.length} files`
            : `LLM router: targeted files – ${targetFiles.join(", ")}`,
        );

        const existingFileNames = new Set(chunks.map((c) => c.metadata.fileName));
        const existingChunkIds = new Set(
          chunks.map((c) => `${c.metadata.fileId}_${c.metadata.chunkIndex}`),
        );

        for (const fileName of targetFiles) {
          // For broad queries, skip files we already have chunks for
          if (isAllFiles && existingFileNames.has(fileName)) continue;

          const fileChunks = await this.chromaDbService.getChunksByFileName(folderId, fileName);
          // For broad queries, limit to first chunk per file to stay within context limits
          const limit = isAllFiles ? 1 : fileChunks.documents.length;

          for (let i = 0; i < Math.min(limit, fileChunks.documents.length); i++) {
            const doc = fileChunks.documents[i];
            const meta = fileChunks.metadatas[i];
            if (!doc || !meta) continue;

            const chunkKey = `${meta["fileId"]}_${meta["chunkIndex"]}`;
            if (existingChunkIds.has(chunkKey)) continue;
            existingChunkIds.add(chunkKey);

            chunks.push({
              text: doc,
              metadata: {
                fileName: String(meta["fileName"] ?? ""),
                fileId: String(meta["fileId"] ?? ""),
                googleDriveLink: String(meta["googleDriveLink"] ?? ""),
                folderId: String(meta["folderId"] ?? ""),
                mimeType: String(meta["mimeType"] ?? ""),
                chunkIndex: Number(meta["chunkIndex"] ?? 0),
              },
              score: 0.9,
            });
          }
        }
      }
    }

    this.logger.log(
      `Retrieved ${chunks.length} chunks for folder ${folderId}`,
    );
    return chunks;
  }

  /**
   * Build citations from retrieved chunks, deduplicating by fileId.
   */
  private buildCitations(chunks: RetrievedChunk[]): Citation[] {
    const seen = new Map<string, Citation>();
    for (const chunk of chunks) {
      if (!seen.has(chunk.metadata.fileId)) {
        seen.set(chunk.metadata.fileId, {
          fileName: chunk.metadata.fileName,
          fileId: chunk.metadata.fileId,
          googleDriveLink: chunk.metadata.googleDriveLink,
          snippet: chunk.text.slice(0, 200),
          score: chunk.score,
        });
      }
    }
    return Array.from(seen.values());
  }

  /**
   * Build the system prompt with retrieved context.
   */
  private buildSystemPrompt(chunks: RetrievedChunk[], allFileNames: string[]): string {
    const contextBlock = chunks
      .map(
        (c, i) =>
          `[Source ${i + 1}: ${c.metadata.fileName}]\n${c.text}`,
      )
      .join("\n\n---\n\n");

    const fileListBlock = allFileNames
      .map((name, i) => `${i + 1}. ${name}`)
      .join("\n");

    return `You are a helpful assistant that answers questions based ONLY on the provided context documents. If the answer cannot be found in the context, say so clearly. Do not make up information.

FOLDER CONTENTS (${allFileNames.length} files total):
${fileListBlock}

CONTEXT (most relevant excerpts):
${contextBlock}

INSTRUCTIONS:
- Answer the user's question using ONLY the context above.
- Reference source file names when relevant.
- When asked about the number of files or which files exist, use the FOLDER CONTENTS list above.
- If the context does not contain enough information, state that clearly.`;
  }

  /**
   * Use a fast LLM to detect if the user wants file operations.
   * Returns null if this is a normal question, or an array of FileActions if the user
   * wants to create/edit/copy/move/rename files.
   */
  private async detectFileActions(
    query: string,
    allFileNames: string[],
  ): Promise<FileAction[] | null> {
    const fileList = allFileNames
      .map((name, i) => `${i + 1}. ${name}`)
      .join("\n");

    try {
      const response = await this.groq.chat.completions.create({
        model: ROUTING_MODEL,
        messages: [
          {
            role: "system",
            content: `You are a file-action detector. Given a user message and a list of files in their Google Drive folder, determine if the user is requesting file operations (create, edit, copy, move, rename files/folders).

If the user is NOT requesting any file operation (they are just asking a question), respond with:
{"is_file_action": false}

If the user IS requesting file operations, respond with:
{"is_file_action": true, "actions": [...]}

Each action in the array must be an object with these fields:
- "action": one of "create_file", "create_folder", "edit_file", "copy_file", "move_file", "rename_file"
- "fileName": the target file name (for create_file, create_folder)
- "content": file content as a string (for create_file ONLY)
- "mimeType": MIME type (for create_file, e.g. "text/plain", "application/vnd.google-apps.document")
- "sourceFileName": existing file name from the folder (for edit_file, copy_file, move_file, rename_file)
- "destinationFolderName": folder name to move into (for move_file)
- "newName": new name (for rename_file, copy_file)
- "editInstruction": a clear description of what to change in the file (for edit_file ONLY)

Only include fields relevant to the action. Use the EXISTING FILES list to match file names exactly.
For create_file, default mimeType to "text/plain" unless the user specifies otherwise or the file extension suggests differently (e.g. .md → "text/markdown", .csv → "text/csv").
For edit_file, do NOT include "content". Instead, include "editInstruction" with a clear description of the change (e.g. "add a new row below the existing data with values: this is, awesome"). The system will read the current file content and apply the edit.

Respond with ONLY valid JSON, nothing else.`,
          },
          {
            role: "user",
            content: `EXISTING FILES IN FOLDER:\n${fileList || "(empty folder)"}\n\nUSER MESSAGE: ${query}`,
          },
        ],
        temperature: 0,
        max_tokens: 2048,
      });

      const raw = response.choices[0]?.message?.content?.trim() ?? "";
      this.logger.log(`File action detection response: ${raw}`);

      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.is_file_action === true && Array.isArray(parsed.actions)) {
          return parsed.actions as FileAction[];
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.warn(`File action detection failed: ${message}`);
    }

    return null;
  }

  /**
   * Execute a single file action against Google Drive and return the result.
   */
  private async executeFileAction(
    action: FileAction,
    folderId: string,
    accessToken: string,
    _allFileNames: string[],
  ): Promise<FileActionResult> {
    try {
      switch (action.action) {
        case "create_file": {
          const name = action.fileName ?? "untitled.txt";
          const mimeType = action.mimeType ?? "text/plain";
          const result = await this.driveService.createFile(
            folderId, name, mimeType, action.content, accessToken,
          );
          return {
            action: "create_file",
            fileName: result.name,
            success: true,
            fileId: result.id,
            googleDriveLink: `https://drive.google.com/file/d/${result.id}/view`,
            mimeType,
          };
        }

        case "create_folder": {
          const name = action.fileName ?? "New Folder";
          const result = await this.driveService.createFolder(
            folderId, name, accessToken,
          );
          return {
            action: "create_folder",
            fileName: result.name,
            success: true,
            fileId: result.id,
            googleDriveLink: `https://drive.google.com/drive/folders/${result.id}`,
            mimeType: "application/vnd.google-apps.folder",
          };
        }

        case "edit_file": {
          const sourceFile = await this.resolveFileByName(
            action.sourceFileName ?? action.fileName ?? "",
            folderId, accessToken,
          );
          if (!sourceFile) {
            return {
              action: "edit_file",
              fileName: action.sourceFileName ?? action.fileName ?? "unknown",
              success: false,
              error: `File "${action.sourceFileName ?? action.fileName}" not found in folder`,
            };
          }

          // Fetch current file content so the LLM can apply the edit intelligently
          const currentFile = await this.driveService.getFileContent(sourceFile.id, accessToken);
          const editInstruction = action.editInstruction ?? action.content ?? "";

          // Use LLM to produce the updated content
          const updatedContent = await this.applyEditWithLLM(
            currentFile.content,
            editInstruction,
            currentFile.mimeType,
          );

          const result = await this.driveService.updateFile(
            sourceFile.id,
            { content: updatedContent, name: action.fileName, mimeType: sourceFile.mimeType },
            accessToken,
          );
          return {
            action: "edit_file",
            fileName: result.name,
            success: true,
            fileId: result.id,
            googleDriveLink: `https://drive.google.com/file/d/${result.id}/view`,
            mimeType: sourceFile.mimeType,
          };
        }

        case "copy_file": {
          const sourceFile = await this.resolveFileByName(
            action.sourceFileName ?? action.fileName ?? "",
            folderId, accessToken,
          );
          if (!sourceFile) {
            return {
              action: "copy_file",
              fileName: action.sourceFileName ?? action.fileName ?? "unknown",
              success: false,
              error: `File "${action.sourceFileName ?? action.fileName}" not found in folder`,
            };
          }
          const result = await this.driveService.copyFile(
            sourceFile.id,
            { name: action.newName, destinationFolderId: undefined },
            accessToken,
          );
          return {
            action: "copy_file",
            fileName: result.name,
            success: true,
            fileId: result.id,
            googleDriveLink: `https://drive.google.com/file/d/${result.id}/view`,
            mimeType: sourceFile.mimeType,
          };
        }

        case "move_file": {
          const sourceFile = await this.resolveFileByName(
            action.sourceFileName ?? action.fileName ?? "",
            folderId, accessToken,
          );
          if (!sourceFile) {
            return {
              action: "move_file",
              fileName: action.sourceFileName ?? action.fileName ?? "unknown",
              success: false,
              error: `File "${action.sourceFileName ?? action.fileName}" not found in folder`,
            };
          }
          // Resolve destination folder by name
          const destFolder = await this.resolveFileByName(
            action.destinationFolderName ?? "",
            folderId, accessToken,
          );
          if (!destFolder) {
            return {
              action: "move_file",
              fileName: sourceFile.name,
              success: false,
              error: `Destination folder "${action.destinationFolderName}" not found`,
            };
          }
          const result = await this.driveService.moveFile(
            sourceFile.id, destFolder.id, accessToken,
          );
          return {
            action: "move_file",
            fileName: result.name,
            success: true,
            fileId: result.id,
            googleDriveLink: `https://drive.google.com/file/d/${result.id}/view`,
            mimeType: sourceFile.mimeType,
          };
        }

        case "rename_file": {
          const sourceFile = await this.resolveFileByName(
            action.sourceFileName ?? action.fileName ?? "",
            folderId, accessToken,
          );
          if (!sourceFile) {
            return {
              action: "rename_file",
              fileName: action.sourceFileName ?? action.fileName ?? "unknown",
              success: false,
              error: `File "${action.sourceFileName ?? action.fileName}" not found in folder`,
            };
          }
          const result = await this.driveService.updateFile(
            sourceFile.id,
            { name: action.newName ?? action.fileName },
            accessToken,
          );
          return {
            action: "rename_file",
            fileName: result.name,
            success: true,
            fileId: result.id,
            googleDriveLink: `https://drive.google.com/file/d/${result.id}/view`,
            mimeType: sourceFile.mimeType,
          };
        }

        default:
          return {
            action: String(action.action),
            fileName: action.fileName ?? "unknown",
            success: false,
            error: `Unknown action: ${action.action}`,
          };
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(`File action failed: ${message}`);
      return {
        action: action.action,
        fileName: action.fileName ?? action.sourceFileName ?? "unknown",
        success: false,
        error: message,
      };
    }
  }

  /**
   * Look up a file in the folder by name using the Drive API.
   */
  private async resolveFileByName(
    fileName: string,
    folderId: string,
    accessToken: string,
  ): Promise<{ id: string; name: string; mimeType: string } | null> {
    if (!fileName) return null;
    const items = await this.driveService.listFolderContents(folderId, accessToken);
    return items.find(
      (f) => f.name.toLowerCase() === fileName.toLowerCase(),
    ) ?? null;
  }

  /**
   * Use an LLM to apply an edit instruction to existing file content.
   * Returns the complete updated file content.
   */
  private async applyEditWithLLM(
    currentContent: string,
    editInstruction: string,
    mimeType: string,
  ): Promise<string> {
    const isSpreadsheet = mimeType.includes("spreadsheet") || mimeType.includes("csv");
    const formatHint = isSpreadsheet
      ? "This is CSV/spreadsheet data. Preserve the CSV format exactly. Do not add markdown formatting."
      : "Preserve the original file format exactly.";

    const response = await this.groq.chat.completions.create({
      model: ROUTING_MODEL,
      messages: [
        {
          role: "system",
          content: `You are a precise file editor. You will be given the current content of a file and an edit instruction. Apply the edit to the content and return ONLY the complete updated file content. Do not include any explanation, commentary, or markdown code fences. ${formatHint}`,
        },
        {
          role: "user",
          content: `CURRENT FILE CONTENT:\n${currentContent}\n\nEDIT INSTRUCTION: ${editInstruction}`,
        },
      ],
      temperature: 0,
      max_tokens: 4096,
    });

    const result = response.choices[0]?.message?.content?.trim() ?? currentContent;
    this.logger.log(`Applied edit via LLM (${result.length} chars)`);
    return result;
  }

  /**
   * Stream a chat response using Groq, yielding ChatStreamEvent objects.
   * Detects file action intents and executes them before/alongside the response.
   */
  async *streamChat(
    message: string,
    folderId: string,
    accessToken: string,
    history?: { role: "user" | "assistant"; content: string }[],
    savedAllFileNames?: string[],
    userEmail?: string,
  ): AsyncGenerator<ChatStreamEvent> {
    // Use saved allFileNames (includes unsupported files) if available,
    // otherwise fall back to ChromaDB (ingested files only)
    const allFileNames = savedAllFileNames ?? await this.chromaDbService.getAllFileNames(folderId);

    // Step 1: Detect if the user wants file operations
    const fileActions = await this.detectFileActions(message, allFileNames);

    if (fileActions && fileActions.length > 0) {
      // Execute file actions and stream results
      const actionResults: FileActionResult[] = [];
      for (const action of fileActions) {
        const result = await this.executeFileAction(action, folderId, accessToken, allFileNames);
        actionResults.push(result);
        yield { type: "file_action", fileAction: result };
      }

      // Refresh the saved folder's file list so subsequent chats see new files
      const hasSuccessfulAction = actionResults.some((r) => r.success);
      if (hasSuccessfulAction && userEmail) {
        try {
          const listing = await this.driveService.listFiles(folderId, accessToken);
          const savedFolder = this.foldersService.findByFolderId(userEmail, folderId);
          if (savedFolder) {
            this.foldersService.save(
              userEmail,
              folderId,
              savedFolder.name,
              listing.totalCount,
              listing.allFileNames,
            );
            this.logger.log(`Refreshed saved folder file list: ${listing.allFileNames.length} files`);
          }
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          this.logger.warn(`Failed to refresh folder file list after file actions: ${msg}`);
        }
      }

      // Generate a conversational summary of what was done
      const summaryParts = actionResults.map((r) => {
        if (r.success) {
          const link = r.googleDriveLink ? ` ([open in Drive](${r.googleDriveLink}))` : "";
          switch (r.action) {
            case "create_file": return `✅ Created file **${r.fileName}**${link}`;
            case "create_folder": return `✅ Created folder **${r.fileName}**${link}`;
            case "edit_file": return `✅ Updated file **${r.fileName}**${link}`;
            case "copy_file": return `✅ Copied to **${r.fileName}**${link}`;
            case "move_file": return `✅ Moved **${r.fileName}**${link}`;
            case "rename_file": return `✅ Renamed to **${r.fileName}**${link}`;
            default: return `✅ ${r.action} **${r.fileName}**${link}`;
          }
        } else {
          return `❌ Failed to ${r.action.replace("_", " ")} **${r.fileName}**: ${r.error}`;
        }
      });

      const summary = summaryParts.join("\n\n");
      yield { type: "token", token: summary };
      yield { type: "done", answer: summary, citations: [], fileActions: actionResults };
      return;
    }

    // Step 2: Normal RAG chat flow
    const chunks = await this.retrieve(message, folderId, allFileNames);
    const citations = this.buildCitations(chunks);

    if (chunks.length === 0) {
      const noContextAnswer =
        "I couldn't find any relevant information in the selected folder to answer your question.";
      yield { type: "token", token: noContextAnswer };
      yield { type: "citations", citations: [] };
      yield { type: "done", answer: noContextAnswer, citations: [] };
      return;
    }

    // Emit citations early so the frontend can render them while streaming
    yield { type: "citations", citations };

    const systemPrompt = this.buildSystemPrompt(chunks, allFileNames);
    const messages: { role: "system" | "user" | "assistant"; content: string }[] = [
      { role: "system", content: systemPrompt },
    ];

    // Add conversation history if provided
    if (history) {
      for (const msg of history) {
        messages.push({ role: msg.role, content: msg.content });
      }
    }

    messages.push({ role: "user", content: message });

    const stream = await this.groq.chat.completions.create({
      model: GROQ_MODEL,
      messages,
      stream: true,
      temperature: 0.1,
      max_tokens: 2048,
    });

    let fullAnswer = "";

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content;
      if (delta) {
        fullAnswer += delta;
        yield { type: "token", token: delta };
      }
    }

    yield { type: "done", answer: fullAnswer, citations };
  }
}

