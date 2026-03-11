import { Injectable, Logger } from "@nestjs/common";
import { DriveService, type DriveFile } from "./drive.service";
import { ChromaDbService, type ChunkMetadata } from "./chromadb.service";
import type { IngestResponse, IngestedFile } from "@talk-to-a-folder/shared";
import { randomUUID } from "node:crypto";
import OpenAI from "openai";
import { PDFParse } from "pdf-parse";

const EMBEDDING_MODEL = "text-embedding-3-small";
const CHUNK_SIZE = 1024;
const CHUNK_OVERLAP = 200;

@Injectable()
export class IngestService {
  private readonly logger = new Logger(IngestService.name);
  private readonly openai: OpenAI;

  constructor(
    private readonly driveService: DriveService,
    private readonly chromaDbService: ChromaDbService,
  ) {
    this.openai = new OpenAI({
      apiKey: process.env["OPENAI_API_KEY"] ?? "",
    });
  }

  /**
   * Normalise a folder URL or ID to a plain folder ID.
   */
  normaliseFolderId(input: string): string {
    // Handle full Drive URLs like https://drive.google.com/drive/folders/<id>
    const match = input.match(/\/folders\/([a-zA-Z0-9_-]+)/);
    return match ? match[1]! : input;
  }

  /**
   * Ingest all supported files from a Google Drive folder.
   */
  async ingestFolder(
    rawFolderId: string,
    accessToken: string,
  ): Promise<IngestResponse> {
    const folderId = this.normaliseFolderId(rawFolderId);
    this.logger.log(`Starting ingestion for folder ${folderId}`);

    const listing = await this.driveService.listFiles(folderId, accessToken);
    const fileResults: IngestedFile[] = [];

    for (const file of listing.supported) {
      try {
        const result = await this.processFile(file, folderId, accessToken);
        fileResults.push(result);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        this.logger.error(`Failed to process ${file.name}: ${message}`);
        fileResults.push({
          fileId: file.id,
          fileName: file.name,
          mimeType: file.mimeType,
          chunkCount: 0,
          status: "error",
          error: message,
        });
      }
    }

    const response: IngestResponse = {
      folderId,
      totalFiles: listing.totalCount,
      processedFiles: fileResults.filter((f) => f.status === "success").length,
      skippedFiles: fileResults.filter((f) => f.status === "skipped").length,
      errorFiles: fileResults.filter((f) => f.status === "error").length,
      files: fileResults,
    };

    this.logger.log(
      `Ingestion complete: ${response.processedFiles}/${response.totalFiles} files processed`,
    );
    return response;
  }

  private async processFile(
    file: DriveFile,
    folderId: string,
    accessToken: string,
  ): Promise<IngestedFile> {
    const raw = await this.driveService.downloadFileContent(file, accessToken);

    let content: string;
    if (Buffer.isBuffer(raw)) {
      // PDF file – extract text using pdf-parse v2
      const parser = new PDFParse({ data: new Uint8Array(raw) });
      const result = await parser.getText();
      content = result.text;
      await parser.destroy();
    } else {
      content = raw;
    }

    if (!content.trim()) {
      return {
        fileId: file.id,
        fileName: file.name,
        mimeType: file.mimeType,
        chunkCount: 0,
        status: "skipped",
        error: "Empty file content",
      };
    }

    // Use LlamaIndex SentenceSplitter for chunking (dynamic import for ESM)
    const { Document, SentenceSplitter } = await import("llamaindex");

    const doc = new Document({
      text: content,
      metadata: {
        fileName: file.name,
        fileId: file.id,
        folderId,
      },
    });

    const splitter = new SentenceSplitter({
      chunkSize: CHUNK_SIZE,
      chunkOverlap: CHUNK_OVERLAP,
    });

    const nodes = splitter.getNodesFromDocuments([doc]);

    if (nodes.length === 0) {
      return {
        fileId: file.id,
        fileName: file.name,
        mimeType: file.mimeType,
        chunkCount: 0,
        status: "skipped",
        error: "No chunks produced",
      };
    }

    // Generate embeddings via OpenAI
    const texts = nodes.map((n) => n.getText());
    const embeddings = await this.generateEmbeddings(texts);

    const googleDriveLink = `https://drive.google.com/file/d/${file.id}/view`;

    const chunks = nodes.map((node, idx) => ({
      id: `${file.id}_chunk_${idx}_${randomUUID().slice(0, 8)}`,
      text: node.getText(),
      embedding: embeddings[idx]!,
      metadata: {
        fileName: file.name,
        fileId: file.id,
        googleDriveLink,
        folderId,
        mimeType: file.mimeType,
        chunkIndex: idx,
      } satisfies ChunkMetadata,
    }));

    await this.chromaDbService.addChunks(chunks);

    return {
      fileId: file.id,
      fileName: file.name,
      mimeType: file.mimeType,
      chunkCount: chunks.length,
      status: "success",
    };
  }

  private async generateEmbeddings(texts: string[]): Promise<number[][]> {
    // Batch in groups of 100 (OpenAI limit is 2048 but keep batches reasonable)
    const batchSize = 100;
    const allEmbeddings: number[][] = [];

    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);
      const res = await this.openai.embeddings.create({
        model: EMBEDDING_MODEL,
        input: batch,
      });
      for (const item of res.data) {
        allEmbeddings.push(item.embedding);
      }
    }

    return allEmbeddings;
  }
}

