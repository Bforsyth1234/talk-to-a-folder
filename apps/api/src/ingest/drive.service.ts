import { Injectable, Logger } from "@nestjs/common";
import { google, type drive_v3 } from "googleapis";
import { OAuth2Client } from "google-auth-library";

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
}

export interface ListFilesResult {
  supported: DriveFile[];
  allFileNames: string[];
  totalCount: number;
}

/** MIME types we can ingest in this prototype. */
const SUPPORTED_MIME_TYPES = new Set([
  "application/pdf",
  "application/vnd.google-apps.document", // Google Docs → export as text
  "application/vnd.google-apps.spreadsheet", // Google Sheets → export as CSV
  "application/vnd.google-apps.presentation", // Google Slides → export as text
  "text/plain",
  "text/markdown",
  "text/csv",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
]);

/** Google Docs export MIME for plain-text extraction. */
const GOOGLE_DOC_EXPORT_MIME = "text/plain";
/** Google Sheets export MIME for CSV extraction. */
const GOOGLE_SHEET_EXPORT_MIME = "text/csv";
/** Google Slides export MIME for plain-text extraction. */
const GOOGLE_SLIDES_EXPORT_MIME = "text/plain";

@Injectable()
export class DriveService {
  private readonly logger = new Logger(DriveService.name);

  /**
   * Build a Drive client authenticated with the user's access token.
   */
  private buildDriveClient(accessToken: string): drive_v3.Drive {
    const auth = new OAuth2Client();
    auth.setCredentials({ access_token: accessToken });
    return google.drive({ version: "v3", auth });
  }

  /**
   * Get the display name of a Drive folder by its ID.
   */
  async getFolderName(folderId: string, accessToken: string): Promise<string> {
    const drive = this.buildDriveClient(accessToken);
    const res = await drive.files.get({
      fileId: folderId,
      fields: "name",
    });
    return res.data.name ?? folderId;
  }

  /**
   * List all supported files in a Drive folder (non-recursive, single level).
   */
  async listFiles(
    folderId: string,
    accessToken: string,
  ): Promise<ListFilesResult> {
    const drive = this.buildDriveClient(accessToken);
    const supported: DriveFile[] = [];
    const allFileNames: string[] = [];
    let pageToken: string | undefined;

    do {
      const res = await drive.files.list({
        q: `'${folderId}' in parents and trashed = false`,
        fields: "nextPageToken, files(id, name, mimeType)",
        pageSize: 100,
        pageToken,
      });

      for (const f of res.data.files ?? []) {
        if (f.id && f.name && f.mimeType) {
          allFileNames.push(f.name);
          if (SUPPORTED_MIME_TYPES.has(f.mimeType)) {
            supported.push({ id: f.id, name: f.name, mimeType: f.mimeType });
          } else {
            this.logger.warn(
              `Skipping unsupported file "${f.name}" (mimeType: ${f.mimeType})`,
            );
          }
        }
      }
      pageToken = res.data.nextPageToken ?? undefined;
    } while (pageToken);

    this.logger.log(
      `Found ${supported.length} supported file(s) out of ${allFileNames.length} total in folder ${folderId}`,
    );
    return { supported, allFileNames, totalCount: allFileNames.length };
  }

  /**
   * Download file content as a UTF-8 string.
   * Google Docs are exported as plain text; PDFs are returned as a Buffer;
   * other files are downloaded as text directly.
   */
  async downloadFileContent(
    file: DriveFile,
    accessToken: string,
  ): Promise<string | Buffer> {
    const drive = this.buildDriveClient(accessToken);

    if (file.mimeType === "application/vnd.google-apps.document") {
      const res = await drive.files.export(
        { fileId: file.id, mimeType: GOOGLE_DOC_EXPORT_MIME },
        { responseType: "text" },
      );
      return String(res.data);
    }

    if (file.mimeType === "application/vnd.google-apps.spreadsheet") {
      const res = await drive.files.export(
        { fileId: file.id, mimeType: GOOGLE_SHEET_EXPORT_MIME },
        { responseType: "text" },
      );
      return String(res.data);
    }

    if (file.mimeType === "application/vnd.google-apps.presentation") {
      const res = await drive.files.export(
        { fileId: file.id, mimeType: GOOGLE_SLIDES_EXPORT_MIME },
        { responseType: "text" },
      );
      return String(res.data);
    }

    if (file.mimeType === "application/pdf") {
      const res = await drive.files.get(
        { fileId: file.id, alt: "media" },
        { responseType: "arraybuffer" },
      );
      return Buffer.from(res.data as ArrayBuffer);
    }

    const res = await drive.files.get(
      { fileId: file.id, alt: "media" },
      { responseType: "text" },
    );
    return String(res.data);
  }

  /**
   * List all files and sub-folders in a Drive folder with full metadata.
   */
  async listFolderContents(
    folderId: string,
    accessToken: string,
  ): Promise<{ id: string; name: string; mimeType: string }[]> {
    const drive = this.buildDriveClient(accessToken);
    const items: { id: string; name: string; mimeType: string }[] = [];
    let pageToken: string | undefined;

    do {
      const res = await drive.files.list({
        q: `'${folderId}' in parents and trashed = false`,
        fields: "nextPageToken, files(id, name, mimeType, parents)",
        pageSize: 100,
        pageToken,
      });

      for (const f of res.data.files ?? []) {
        if (f.id && f.name && f.mimeType) {
          items.push({ id: f.id, name: f.name, mimeType: f.mimeType });
        }
      }
      pageToken = res.data.nextPageToken ?? undefined;
    } while (pageToken);

    return items;
  }

  /**
   * Create a new file in a Drive folder.
   */
  async createFile(
    parentFolderId: string,
    name: string,
    mimeType: string,
    content: string | undefined,
    accessToken: string,
  ): Promise<{ id: string; name: string; mimeType: string }> {
    const drive = this.buildDriveClient(accessToken);
    const { Readable } = await import("node:stream");

    const res = await drive.files.create({
      requestBody: {
        name,
        mimeType,
        parents: [parentFolderId],
      },
      media: content != null
        ? { mimeType, body: Readable.from(Buffer.from(content, "utf-8")) }
        : undefined,
      fields: "id, name, mimeType",
    });

    const file = res.data;
    this.logger.log(`Created file "${file.name}" (${file.id}) in ${parentFolderId}`);
    return { id: file.id!, name: file.name!, mimeType: file.mimeType! };
  }

  /**
   * Create a new folder inside a parent folder.
   */
  async createFolder(
    parentFolderId: string,
    name: string,
    accessToken: string,
  ): Promise<{ id: string; name: string; mimeType: string }> {
    const drive = this.buildDriveClient(accessToken);

    const res = await drive.files.create({
      requestBody: {
        name,
        mimeType: "application/vnd.google-apps.folder",
        parents: [parentFolderId],
      },
      fields: "id, name, mimeType",
    });

    const folder = res.data;
    this.logger.log(`Created folder "${folder.name}" (${folder.id}) in ${parentFolderId}`);
    return { id: folder.id!, name: folder.name!, mimeType: folder.mimeType! };
  }

  /**
   * Update a file's name and/or content.
   */
  async updateFile(
    fileId: string,
    updates: { name?: string; content?: string; mimeType?: string },
    accessToken: string,
  ): Promise<{ id: string; name: string; mimeType: string }> {
    const drive = this.buildDriveClient(accessToken);
    const { Readable } = await import("node:stream");

    const requestBody: Record<string, string> = {};
    if (updates.name) requestBody["name"] = updates.name;

    const media = updates.content != null
      ? {
          mimeType: updates.mimeType ?? "text/plain",
          body: Readable.from(Buffer.from(updates.content, "utf-8")),
        }
      : undefined;

    const res = await drive.files.update({
      fileId,
      requestBody,
      media,
      fields: "id, name, mimeType",
    });

    const file = res.data;
    this.logger.log(`Updated file "${file.name}" (${file.id})`);
    return { id: file.id!, name: file.name!, mimeType: file.mimeType! };
  }

  /**
   * Copy a file, optionally to a different folder.
   */
  async copyFile(
    fileId: string,
    options: { name?: string; destinationFolderId?: string },
    accessToken: string,
  ): Promise<{ id: string; name: string; mimeType: string }> {
    const drive = this.buildDriveClient(accessToken);

    const requestBody: Record<string, unknown> = {};
    if (options.name) requestBody["name"] = options.name;
    if (options.destinationFolderId) requestBody["parents"] = [options.destinationFolderId];

    const res = await drive.files.copy({
      fileId,
      requestBody,
      fields: "id, name, mimeType",
    });

    const file = res.data;
    this.logger.log(`Copied file ${fileId} → "${file.name}" (${file.id})`);
    return { id: file.id!, name: file.name!, mimeType: file.mimeType! };
  }

  /**
   * Move a file or folder to a different parent folder.
   */
  async moveFile(
    fileId: string,
    destinationFolderId: string,
    accessToken: string,
  ): Promise<{ id: string; name: string; mimeType: string }> {
    const drive = this.buildDriveClient(accessToken);

    // First get current parents
    const current = await drive.files.get({
      fileId,
      fields: "id, name, mimeType, parents",
    });

    const previousParents = (current.data.parents ?? []).join(",");

    const res = await drive.files.update({
      fileId,
      addParents: destinationFolderId,
      removeParents: previousParents,
      fields: "id, name, mimeType",
    });

    const file = res.data;
    this.logger.log(`Moved file "${file.name}" (${file.id}) → folder ${destinationFolderId}`);
    return { id: file.id!, name: file.name!, mimeType: file.mimeType! };
  }

  /**
   * Get file content as text (for editing). Works for text files and Google Docs.
   */
  async getFileContent(
    fileId: string,
    accessToken: string,
  ): Promise<{ id: string; name: string; mimeType: string; content: string }> {
    const drive = this.buildDriveClient(accessToken);

    const meta = await drive.files.get({
      fileId,
      fields: "id, name, mimeType",
    });

    const file: DriveFile = {
      id: meta.data.id!,
      name: meta.data.name!,
      mimeType: meta.data.mimeType!,
    };

    const raw = await this.downloadFileContent(file, accessToken);
    const content = Buffer.isBuffer(raw) ? raw.toString("utf-8") : raw;

    return { id: file.id, name: file.name, mimeType: file.mimeType, content };
  }
}

