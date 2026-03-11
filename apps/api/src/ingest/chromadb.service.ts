import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { ChromaClient, type ChromaClientArgs, type Collection } from "chromadb";

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

function getChromaUrl(): string {
  return (
    process.env["CHROMA_URL"] ??
    process.env["CHROMA_HOST"] ??
    "http://localhost:8000"
  );
}

function getChromaClientArgs(chromaUrl: string): ChromaClientArgs {
  let parsedUrl: URL;

  try {
    parsedUrl = new URL(chromaUrl);
  } catch {
    throw new Error(
      `Invalid Chroma URL: ${chromaUrl}. Set CHROMA_URL (or CHROMA_HOST) to a valid URL such as http://localhost:8000.`,
    );
  }

  const defaultPort = parsedUrl.protocol === "https:" ? 443 : 8000;
  const port = Number(parsedUrl.port || defaultPort);

  return {
    host: parsedUrl.hostname,
    port,
    ssl: parsedUrl.protocol === "https:",
  };
}

@Injectable()
export class ChromaDbService implements OnModuleInit {
  private readonly logger = new Logger(ChromaDbService.name);
  private client!: ChromaClient;
  private collection!: Collection;

  async onModuleInit(): Promise<void> {
    const chromaUrl = getChromaUrl();

    try {
      this.client = new ChromaClient(getChromaClientArgs(chromaUrl));
      this.collection = await this.client.getOrCreateCollection({
        name: COLLECTION_NAME,
        embeddingFunction: null,
      });
      this.logger.log(
        `ChromaDB collection "${COLLECTION_NAME}" ready at ${chromaUrl}`,
      );
    } catch (error) {
      this.logger.error(`Failed to connect to ChromaDB at ${chromaUrl}`);
      throw new Error(
        `Failed to connect to ChromaDB at ${chromaUrl}. Set CHROMA_URL (or CHROMA_HOST) to a running Chroma service.`,
        { cause: error },
      );
    }
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

  /**
   * Return all unique file names stored for a given folderId.
   */
  async getAllFileNames(folderId: string): Promise<string[]> {
    const result = await this.collection.get({
      where: { folderId },
      include: ["metadatas"],
    });

    const names = new Set<string>();
    for (const meta of result.metadatas ?? []) {
      if (meta && typeof meta["fileName"] === "string") {
        names.add(meta["fileName"]);
      }
    }
    return Array.from(names).sort();
  }

  /**
   * Delete all chunks for a specific file by fileId.
   * Used when a file is updated/moved so it can be re-ingested.
   */
  async deleteByFileId(fileId: string): Promise<void> {
    const result = await this.collection.get({
      where: { fileId },
      include: [],
    });

    if (result.ids.length > 0) {
      await this.collection.delete({ ids: result.ids });
      this.logger.log(`Deleted ${result.ids.length} chunk(s) for fileId ${fileId}`);
    }
  }

  /**
   * Return all chunks for a specific file within a folder, identified by fileName.
   */
  async getChunksByFileName(
    folderId: string,
    fileName: string,
  ): Promise<{ documents: string[]; metadatas: Record<string, string | number | boolean>[] }> {
    const result = await this.collection.get({
      where: { $and: [{ folderId }, { fileName }] },
      include: ["documents", "metadatas"],
    });

    return {
      documents: (result.documents ?? []).filter((d): d is string => d !== null),
      metadatas: (result.metadatas ?? []).filter(
        (m): m is Record<string, string | number | boolean> => m !== null,
      ),
    };
  }
}

