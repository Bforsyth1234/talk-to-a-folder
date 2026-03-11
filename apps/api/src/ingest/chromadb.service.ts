import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { ChromaClient, type Collection } from "chromadb";

/** Metadata stored alongside each chunk in ChromaDB. */
export interface ChunkMetadata {
  fileName: string;
  fileId: string;
  googleDriveLink: string;
  folderId: string;
  mimeType: string;
  chunkIndex: number;
}

const COLLECTION_NAME = "drive_chunks";

@Injectable()
export class ChromaDbService implements OnModuleInit {
  private readonly logger = new Logger(ChromaDbService.name);
  private client!: ChromaClient;
  private collection!: Collection;

  async onModuleInit(): Promise<void> {
    const host = process.env["CHROMA_HOST"] ?? "http://localhost:8000";
    this.client = new ChromaClient({ path: host });
    this.collection = await this.client.getOrCreateCollection({
      name: COLLECTION_NAME,
    });
    this.logger.log(
      `ChromaDB collection "${COLLECTION_NAME}" ready`,
    );
  }

  /**
   * Persist an array of text chunks with their embeddings and metadata.
   */
  async addChunks(
    chunks: {
      id: string;
      text: string;
      embedding: number[];
      metadata: ChunkMetadata;
    }[],
  ): Promise<void> {
    if (chunks.length === 0) return;

    await this.collection.add({
      ids: chunks.map((c) => c.id),
      documents: chunks.map((c) => c.text),
      embeddings: chunks.map((c) => c.embedding),
      metadatas: chunks.map((c) => c.metadata as unknown as Record<string, string | number | boolean>),
    });

    this.logger.log(`Stored ${chunks.length} chunk(s) in ChromaDB`);
  }

  /**
   * Expose the collection for downstream query use (e.g. chat pipeline).
   */
  getCollection(): Collection {
    return this.collection;
  }
}

