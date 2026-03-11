import { Injectable, Logger } from "@nestjs/common";
import { ChromaDbService } from "../ingest/chromadb.service";
import type { Citation, ChatStreamEvent } from "@talk-to-a-folder/shared";
import OpenAI from "openai";
import Groq from "groq-sdk";

const EMBEDDING_MODEL = "text-embedding-3-small";
const GROQ_MODEL = "llama-3.3-70b-versatile";
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
   * Retrieve relevant chunks from ChromaDB, filtered by folderId.
   */
  async retrieve(query: string, folderId: string): Promise<RetrievedChunk[]> {
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
  private buildSystemPrompt(chunks: RetrievedChunk[]): string {
    const contextBlock = chunks
      .map(
        (c, i) =>
          `[Source ${i + 1}: ${c.metadata.fileName}]\n${c.text}`,
      )
      .join("\n\n---\n\n");

    return `You are a helpful assistant that answers questions based ONLY on the provided context documents. If the answer cannot be found in the context, say so clearly. Do not make up information.

CONTEXT:
${contextBlock}

INSTRUCTIONS:
- Answer the user's question using ONLY the context above.
- Reference source file names when relevant.
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
    const chunks = await this.retrieve(message, folderId);
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

    const systemPrompt = this.buildSystemPrompt(chunks);
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

