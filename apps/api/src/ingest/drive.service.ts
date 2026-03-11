import { Injectable, Logger } from "@nestjs/common";
import { google, type drive_v3 } from "googleapis";
import { OAuth2Client } from "google-auth-library";

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
}

/** MIME types we can ingest in this prototype. */
const SUPPORTED_MIME_TYPES = new Set([
  "application/pdf",
  "application/vnd.google-apps.document", // Google Docs → export as text
  "text/plain",
  "text/markdown",
  "text/csv",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
]);

/** Google Docs export MIME for plain-text extraction. */
const GOOGLE_DOC_EXPORT_MIME = "text/plain";

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
   * List all supported files in a Drive folder (non-recursive, single level).
   */
  async listFiles(
    folderId: string,
    accessToken: string,
  ): Promise<DriveFile[]> {
    const drive = this.buildDriveClient(accessToken);
    const files: DriveFile[] = [];
    let pageToken: string | undefined;

    do {
      const res = await drive.files.list({
        q: `'${folderId}' in parents and trashed = false`,
        fields: "nextPageToken, files(id, name, mimeType)",
        pageSize: 100,
        pageToken,
      });

      for (const f of res.data.files ?? []) {
        if (f.id && f.name && f.mimeType && SUPPORTED_MIME_TYPES.has(f.mimeType)) {
          files.push({ id: f.id, name: f.name, mimeType: f.mimeType });
        }
      }
      pageToken = res.data.nextPageToken ?? undefined;
    } while (pageToken);

    this.logger.log(
      `Found ${files.length} supported file(s) in folder ${folderId}`,
    );
    return files;
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
}

