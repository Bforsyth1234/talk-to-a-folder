import { Injectable, Logger } from "@nestjs/common";
import { ChromaDbService } from "../ingest/chromadb.service";
import type { Citation, ChatStreamEvent } from "@talk-to-a-folder/shared";
import OpenAI from "openai";
import Groq from "groq-sdk";

const EMBEDDING_MODEL = "text-embedding-3-small";
const GROQ_MODEL = "groq/compound";
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
   * Detect file names referenced in the user query by matching against known file names.
   * Handles partial matches, ordinal references ("first file", "1st file", "file 3"), etc.
   */
  private findReferencedFiles(query: string, sortedFileNames: string[]): string[] {
    const q = query.toLowerCase();
    const matched: string[] = [];

    // Ordinal word map
    const ordinals: Record<string, number> = {
      first: 1, second: 2, third: 3, fourth: 4, fifth: 5,
      sixth: 6, seventh: 7, eighth: 8, ninth: 9, tenth: 10,
    };

    // Check ordinal words: "first file", "second file", etc.
    for (const [word, idx] of Object.entries(ordinals)) {
      if (q.includes(word) && (q.includes("file") || q.includes("document"))) {
        if (idx <= sortedFileNames.length) {
          matched.push(sortedFileNames[idx - 1]!);
        }
      }
    }

    // Check numeric ordinals: "1st", "2nd", "3rd", "4th", "file 1", "file #2", etc.
    const numericPatterns = [
      /(\d+)(?:st|nd|rd|th)\s*(?:file|document)/gi,
      /(?:file|document)\s*#?\s*(\d+)/gi,
    ];
    for (const pattern of numericPatterns) {
      let m;
      while ((m = pattern.exec(q)) !== null) {
        const idx = parseInt(m[1]!, 10);
        if (idx >= 1 && idx <= sortedFileNames.length) {
          matched.push(sortedFileNames[idx - 1]!);
        }
      }
    }

    // Check direct file name matches (partial, case-insensitive)
    for (const name of sortedFileNames) {
      const nameLower = name.toLowerCase();
      // Strip extension for matching
      const nameNoExt = nameLower.replace(/\.[^.]+$/, "");
      // Match if the query contains the file name or a significant portion of it
      if (q.includes(nameLower) || q.includes(nameNoExt)) {
        matched.push(name);
      }
    }

    return [...new Set(matched)];
  }

  /**
   * Retrieve relevant chunks from ChromaDB, filtered by folderId.
   * Supplements similarity results with file-targeted chunks when the query
   * references specific files.
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

      // ChromaDB returns L2 distances; convert to a 0-1 similarity score
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

    // Supplement with file-targeted retrieval when the query references specific files
    if (allFileNames && allFileNames.length > 0) {
      const referencedFiles = this.findReferencedFiles(query, allFileNames);
      if (referencedFiles.length > 0) {
        this.logger.log(`Detected file references: ${referencedFiles.join(", ")}`);
        const existingChunkIds = new Set(
          chunks.map((c) => `${c.metadata.fileId}_${c.metadata.chunkIndex}`),
        );

        for (const fileName of referencedFiles) {
          const fileChunks = await this.chromaDbService.getChunksByFileName(folderId, fileName);
          for (let i = 0; i < fileChunks.documents.length; i++) {
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
              score: 0.9, // High score since explicitly requested
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
  ): AsyncGenerator<ChatStreamEvent> {
    const allFileNames = await this.chromaDbService.getAllFileNames(folderId);
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

