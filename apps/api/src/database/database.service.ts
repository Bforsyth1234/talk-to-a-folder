import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import type { SavedFolder } from "@talk-to-a-folder/shared";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const DATA_DIR = join(process.cwd(), ".data");
const STORE_PATH = join(DATA_DIR, "saved-folders.json");

interface StoredFolderRecord extends SavedFolder {
  userEmail: string;
}

@Injectable()
export class DatabaseService implements OnModuleInit {
  private readonly logger = new Logger(DatabaseService.name);

  onModuleInit(): void {
    if (!existsSync(DATA_DIR)) {
      mkdirSync(DATA_DIR, { recursive: true });
    }

    if (!existsSync(STORE_PATH)) {
      this.writeStore([]);
    }

    this.logger.log(`Saved folder store ready at ${STORE_PATH}`);
  }

  listSavedFolders(userEmail: string): SavedFolder[] {
    return this.readStore()
      .filter((record) => record.userEmail === userEmail)
      .sort((a, b) => b.savedAt.localeCompare(a.savedAt))
      .map(({ userEmail: _userEmail, ...folder }) => folder);
  }

  saveSavedFolder(userEmail: string, folder: SavedFolder): SavedFolder {
    const records = this.readStore();
    const index = records.findIndex(
      (record) => record.userEmail === userEmail && record.folderId === folder.folderId,
    );

    const nextRecord: StoredFolderRecord = { userEmail, ...folder };

    if (index >= 0) {
      records[index] = nextRecord;
    } else {
      records.push(nextRecord);
    }

    this.writeStore(records);
    return folder;
  }

  deleteSavedFolder(userEmail: string, id: string): boolean {
    const records = this.readStore();
    const nextRecords = records.filter(
      (record) => !(record.userEmail === userEmail && record.id === id),
    );

    if (nextRecords.length === records.length) {
      return false;
    }

    this.writeStore(nextRecords);
    return true;
  }

  private readStore(): StoredFolderRecord[] {
    if (!existsSync(STORE_PATH)) {
      return [];
    }

    const raw = readFileSync(STORE_PATH, "utf8").trim();
    if (!raw) {
      return [];
    }

    try {
      const parsed = JSON.parse(raw) as unknown;
      return Array.isArray(parsed) ? (parsed as StoredFolderRecord[]) : [];
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to read saved folder store at ${STORE_PATH}: ${message}`);
      return [];
    }
  }

  private writeStore(records: StoredFolderRecord[]): void {
    writeFileSync(STORE_PATH, JSON.stringify(records, null, 2));
  }
}

