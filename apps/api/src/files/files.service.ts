import { Injectable, Logger } from "@nestjs/common";
import { DriveService } from "../ingest/drive.service";
import { ChromaDbService } from "../ingest/chromadb.service";
import { IngestService } from "../ingest/ingest.service";
import type {
  DriveFileInfo,
  ListFolderContentsResponse,
  FileContentResponse,
} from "@talk-to-a-folder/shared";

@Injectable()
export class FilesService {
  private readonly logger = new Logger(FilesService.name);

  constructor(
    private readonly driveService: DriveService,
    private readonly chromaDbService: ChromaDbService,
    private readonly ingestService: IngestService,
  ) {}

  /** List all files and sub-folders in a Drive folder. */
  async listContents(
    folderId: string,
    accessToken: string,
  ): Promise<ListFolderContentsResponse> {
    const items = await this.driveService.listFolderContents(folderId, accessToken);
    const files: DriveFileInfo[] = items.map((item) => ({
      id: item.id,
      name: item.name,
      mimeType: item.mimeType,
    }));
    return { files, folderId };
  }

  /** Get file content for editing. */
  async getContent(
    fileId: string,
    accessToken: string,
  ): Promise<FileContentResponse> {
    const result = await this.driveService.getFileContent(fileId, accessToken);
    return {
      fileId: result.id,
      name: result.name,
      mimeType: result.mimeType,
      content: result.content,
    };
  }

  /** Create a new file and optionally re-ingest. */
  async createFile(
    parentFolderId: string,
    name: string,
    mimeType: string,
    content: string | undefined,
    accessToken: string,
  ): Promise<DriveFileInfo> {
    const file = await this.driveService.createFile(
      parentFolderId, name, mimeType, content, accessToken,
    );
    return { id: file.id, name: file.name, mimeType: file.mimeType };
  }

  /** Create a new folder. */
  async createFolder(
    parentFolderId: string,
    name: string,
    accessToken: string,
  ): Promise<DriveFileInfo> {
    const folder = await this.driveService.createFolder(
      parentFolderId, name, accessToken,
    );
    return { id: folder.id, name: folder.name, mimeType: folder.mimeType };
  }

  /** Update a file's name and/or content, then re-ingest if content changed. */
  async updateFile(
    fileId: string,
    updates: { name?: string; content?: string; mimeType?: string },
    folderId: string | undefined,
    accessToken: string,
  ): Promise<DriveFileInfo> {
    const file = await this.driveService.updateFile(fileId, updates, accessToken);

    // Re-ingest if content was updated and we know the folder
    if (updates.content != null && folderId) {
      await this.reIngestFile(fileId, file.name, file.mimeType, folderId, accessToken);
    }

    return { id: file.id, name: file.name, mimeType: file.mimeType };
  }

  /** Copy a file. */
  async copyFile(
    fileId: string,
    options: { name?: string; destinationFolderId?: string },
    accessToken: string,
  ): Promise<DriveFileInfo> {
    const file = await this.driveService.copyFile(fileId, options, accessToken);
    return { id: file.id, name: file.name, mimeType: file.mimeType };
  }

  /** Move a file/folder to a new parent. */
  async moveFile(
    fileId: string,
    destinationFolderId: string,
    accessToken: string,
  ): Promise<DriveFileInfo> {
    const file = await this.driveService.moveFile(fileId, destinationFolderId, accessToken);
    return { id: file.id, name: file.name, mimeType: file.mimeType };
  }

  /** Delete old chunks and re-ingest a single file. */
  private async reIngestFile(
    fileId: string,
    fileName: string,
    mimeType: string,
    folderId: string,
    accessToken: string,
  ): Promise<void> {
    try {
      await this.chromaDbService.deleteByFileId(fileId);
      // Re-ingest uses the ingest service's processFile indirectly
      // by re-running a single-file ingest
      this.logger.log(`Re-ingesting file "${fileName}" (${fileId}) after update`);
      await this.ingestService.ingestFolder(folderId, accessToken);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.warn(`Re-ingestion failed for ${fileId}: ${message}`);
    }
  }
}

