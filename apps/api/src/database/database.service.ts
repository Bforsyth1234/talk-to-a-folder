import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import type { SavedFolder, Todo, CreateTodoRequest, UpdateTodoRequest } from "@talk-to-a-folder/shared";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { randomUUID } from "node:crypto";

const DATA_DIR = join(process.cwd(), ".data");
const STORE_PATH = join(DATA_DIR, "saved-folders.json");
const TODOS_PATH = join(DATA_DIR, "todos.json");

interface StoredFolderRecord extends SavedFolder {
  userEmail: string;
}

interface StoredTodoRecord extends Todo {
  // userEmail is already included in Todo type
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

    if (!existsSync(TODOS_PATH)) {
      this.writeTodos([]);
    }

    this.logger.log(`Saved folder store ready at ${STORE_PATH}`);
    this.logger.log(`Todo store ready at ${TODOS_PATH}`);
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

  // ---------------------------------------------------------------------------
  // Todo methods
  // ---------------------------------------------------------------------------

  getTodos(userEmail: string): Todo[] {
    return this.readTodos()
      .filter((todo) => todo.userEmail === userEmail)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  createTodo(userEmail: string, request: CreateTodoRequest): Todo {
    const todos = this.readTodos();
    const now = new Date().toISOString();
    
    const newTodo: StoredTodoRecord = {
      id: randomUUID(),
      title: request.title,
      completed: false,
      createdAt: now,
      updatedAt: now,
      userEmail,
    };

    todos.push(newTodo);
    this.writeTodos(todos);
    return newTodo;
  }

  updateTodo(userEmail: string, id: string, request: UpdateTodoRequest): Todo | null {
    const todos = this.readTodos();
    const index = todos.findIndex((todo) => todo.id === id && todo.userEmail === userEmail);
    
    if (index === -1) {
      return null;
    }

    const updatedTodo: StoredTodoRecord = {
      ...todos[index]!,
      ...request,
      updatedAt: new Date().toISOString(),
    };

    todos[index] = updatedTodo;
    this.writeTodos(todos);
    return updatedTodo;
  }

  deleteTodo(userEmail: string, id: string): boolean {
    const todos = this.readTodos();
    const nextTodos = todos.filter((todo) => !(todo.id === id && todo.userEmail === userEmail));
    
    if (nextTodos.length === todos.length) {
      return false;
    }

    this.writeTodos(nextTodos);
    return true;
  }

  private readTodos(): StoredTodoRecord[] {
    if (!existsSync(TODOS_PATH)) {
      return [];
    }

    const raw = readFileSync(TODOS_PATH, "utf8").trim();
    if (!raw) {
      return [];
    }

    try {
      const parsed = JSON.parse(raw) as unknown;
      return Array.isArray(parsed) ? (parsed as StoredTodoRecord[]) : [];
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to read todo store at ${TODOS_PATH}: ${message}`);
      return [];
    }
  }

  private writeTodos(todos: StoredTodoRecord[]): void {
    writeFileSync(TODOS_PATH, JSON.stringify(todos, null, 2));
  }
}

