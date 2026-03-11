import { Injectable, Logger } from "@nestjs/common";
import type { SavedFolder } from "@talk-to-a-folder/shared";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { randomUUID } from "node:crypto";

/** Simple JSON-file-backed store for saved folders, keyed by user email. */
const DATA_DIR = join(process.cwd(), ".data");
const DATA_FILE = join(DATA_DIR, "saved-folders.json");

type Store = Record<string, SavedFolder[]>;

@Injectable()
export class FoldersService {
  private readonly logger = new Logger(FoldersService.name);
  private store: Store;

  constructor() {
    this.store = this.load();
  }

  private load(): Store {
    try {
      if (existsSync(DATA_FILE)) {
        return JSON.parse(readFileSync(DATA_FILE, "utf-8")) as Store;
      }
    } catch (err) {
      this.logger.warn(`Failed to load saved folders: ${err}`);
    }
    return {};
  }

  private persist(): void {
    try {
      if (!existsSync(dirname(DATA_FILE))) {
        mkdirSync(dirname(DATA_FILE), { recursive: true });
      }
      writeFileSync(DATA_FILE, JSON.stringify(this.store, null, 2), "utf-8");
    } catch (err) {
      this.logger.error(`Failed to persist saved folders: ${err}`);
    }
  }

  /** List all saved folders for a user. */
  list(userEmail: string): SavedFolder[] {
    return this.store[userEmail] ?? [];
  }

  /** Save a folder for a user. Deduplicates by folderId. */
  save(
    userEmail: string,
    folderId: string,
    name: string,
    fileCount: number,
  ): SavedFolder {
    if (!this.store[userEmail]) {
      this.store[userEmail] = [];
    }

    // Update existing entry if same folderId
    const existing = this.store[userEmail]!.find(
      (f) => f.folderId === folderId,
    );
    if (existing) {
      existing.name = name;
      existing.fileCount = fileCount;
      existing.savedAt = new Date().toISOString();
      this.persist();
      return existing;
    }

    const folder: SavedFolder = {
      id: randomUUID(),
      folderId,
      name,
      fileCount,
      savedAt: new Date().toISOString(),
    };

    this.store[userEmail]!.push(folder);
    this.persist();
    this.logger.log(`Saved folder ${folderId} for ${userEmail}`);
    return folder;
  }

  /** Delete a saved folder by its record id. Returns true if found and deleted. */
  delete(userEmail: string, id: string): boolean {
    const folders = this.store[userEmail];
    if (!folders) return false;

    const idx = folders.findIndex((f) => f.id === id);
    if (idx === -1) return false;

    folders.splice(idx, 1);
    this.persist();
    this.logger.log(`Deleted saved folder ${id} for ${userEmail}`);
    return true;
  }
}

