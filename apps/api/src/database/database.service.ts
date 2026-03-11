import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import Database from "better-sqlite3";
import { join } from "node:path";
import { mkdirSync, existsSync } from "node:fs";

const DATA_DIR = join(process.cwd(), ".data");
const DB_PATH = join(DATA_DIR, "app.db");

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DatabaseService.name);
  private db!: Database.Database;

  onModuleInit(): void {
    if (!existsSync(DATA_DIR)) {
      mkdirSync(DATA_DIR, { recursive: true });
    }

    this.db = new Database(DB_PATH);
    this.db.pragma("journal_mode = WAL");
    this.db.pragma("foreign_keys = ON");

    this.migrate();
    this.logger.log(`SQLite database ready at ${DB_PATH}`);
  }

  onModuleDestroy(): void {
    this.db.close();
    this.logger.log("SQLite database closed");
  }

  /** Run schema migrations. */
  private migrate(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS saved_folders (
        id            TEXT PRIMARY KEY,
        user_email    TEXT NOT NULL,
        folder_id     TEXT NOT NULL,
        name          TEXT NOT NULL,
        file_count    INTEGER NOT NULL DEFAULT 0,
        saved_at      TEXT NOT NULL,
        UNIQUE(user_email, folder_id)
      );
    `);
  }

  /** Get the raw database instance for direct queries. */
  getDb(): Database.Database {
    return this.db;
  }
}

