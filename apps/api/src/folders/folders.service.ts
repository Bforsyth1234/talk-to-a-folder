import { Injectable, Logger } from "@nestjs/common";
import type { SavedFolder } from "@talk-to-a-folder/shared";
import { DatabaseService } from "../database/database.service";
import { randomUUID } from "node:crypto";

interface FolderRow {
  id: string;
  user_email: string;
  folder_id: string;
  name: string;
  file_count: number;
  saved_at: string;
}

@Injectable()
export class FoldersService {
  private readonly logger = new Logger(FoldersService.name);

  constructor(private readonly databaseService: DatabaseService) {}

  private toSavedFolder(row: FolderRow): SavedFolder {
    return {
      id: row.id,
      folderId: row.folder_id,
      name: row.name,
      fileCount: row.file_count,
      savedAt: row.saved_at,
    };
  }

  /** List all saved folders for a user. */
  list(userEmail: string): SavedFolder[] {
    const db = this.databaseService.getDb();
    const rows = db
      .prepare("SELECT * FROM saved_folders WHERE user_email = ? ORDER BY saved_at DESC")
      .all(userEmail) as FolderRow[];
    return rows.map((r) => this.toSavedFolder(r));
  }

  /** Save a folder for a user. Upserts by (user_email, folder_id). */
  save(
    userEmail: string,
    folderId: string,
    name: string,
    fileCount: number,
  ): SavedFolder {
    const db = this.databaseService.getDb();
    const now = new Date().toISOString();

    // Try to update first
    const existing = db
      .prepare("SELECT * FROM saved_folders WHERE user_email = ? AND folder_id = ?")
      .get(userEmail, folderId) as FolderRow | undefined;

    if (existing) {
      db.prepare(
        "UPDATE saved_folders SET name = ?, file_count = ?, saved_at = ? WHERE id = ?",
      ).run(name, fileCount, now, existing.id);
      return this.toSavedFolder({ ...existing, name, file_count: fileCount, saved_at: now });
    }

    const id = randomUUID();
    db.prepare(
      "INSERT INTO saved_folders (id, user_email, folder_id, name, file_count, saved_at) VALUES (?, ?, ?, ?, ?, ?)",
    ).run(id, userEmail, folderId, name, fileCount, now);

    this.logger.log(`Saved folder ${folderId} for ${userEmail}`);
    return { id, folderId, name, fileCount, savedAt: now };
  }

  /** Delete a saved folder by its record id. Returns true if found and deleted. */
  delete(userEmail: string, id: string): boolean {
    const db = this.databaseService.getDb();
    const result = db
      .prepare("DELETE FROM saved_folders WHERE id = ? AND user_email = ?")
      .run(id, userEmail);
    if (result.changes > 0) {
      this.logger.log(`Deleted saved folder ${id} for ${userEmail}`);
      return true;
    }
    return false;
  }
}

