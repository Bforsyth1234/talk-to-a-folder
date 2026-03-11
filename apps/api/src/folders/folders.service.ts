import { Injectable } from "@nestjs/common";
import type { SavedFolder } from "@talk-to-a-folder/shared";
import { DatabaseService } from "../database/database.service";
import { randomUUID } from "node:crypto";

@Injectable()
export class FoldersService {
  constructor(private readonly databaseService: DatabaseService) {}

  /** List all saved folders for a user. */
  list(userEmail: string): SavedFolder[] {
    return this.databaseService.listSavedFolders(userEmail);
  }

  /** Save a folder for a user. Upserts by (user_email, folder_id). */
  save(
    userEmail: string,
    folderId: string,
    name: string,
    fileCount: number,
  ): SavedFolder {
    const now = new Date().toISOString();
    const existing = this.list(userEmail).find((folder) => folder.folderId === folderId);
    const savedFolder: SavedFolder = {
      id: existing?.id ?? randomUUID(),
      folderId,
      name,
      fileCount,
      savedAt: now,
    };

    return this.databaseService.saveSavedFolder(userEmail, savedFolder);
  }

  /** Delete a saved folder by its record id. Returns true if found and deleted. */
  delete(userEmail: string, id: string): boolean {
    return this.databaseService.deleteSavedFolder(userEmail, id);
  }
}

