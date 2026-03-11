import { Injectable, Logger } from "@nestjs/common";
import { ChromaDbService } from "../ingest/chromadb.service";
import type { Citation, ChatStreamEvent } from "@talk-to-a-folder/shared";
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

  constructor(private readonly chromaDbService: ChromaDbService) {
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
   * Stream a chat response using Groq, yielding ChatStreamEvent objects.
   */
  async *streamChat(
    message: string,
    folderId: string,
    history?: { role: "user" | "assistant"; content: string }[],
    savedAllFileNames?: string[],
  ): AsyncGenerator<ChatStreamEvent> {
    // Use saved allFileNames (includes unsupported files) if available,
    // otherwise fall back to ChromaDB (ingested files only)
    const allFileNames = savedAllFileNames ?? await this.chromaDbService.getAllFileNames(folderId);
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

