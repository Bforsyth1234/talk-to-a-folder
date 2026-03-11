/**
 * @talk-to-a-folder/shared
 *
 * Shared zod schemas and inferred TypeScript types used across
 * the frontend (apps/web) and backend (apps/api).
 */

export {
  GoogleTokenSchema,
  type GoogleToken,
  SessionSchema,
  type Session,
  AuthCallbackRequestSchema,
  type AuthCallbackRequest,
  AuthCallbackResponseSchema,
  type AuthCallbackResponse,
} from "./auth.js";

export {
  CitationSchema,
  type Citation,
} from "./citation.js";

export {
  IngestRequestSchema,
  type IngestRequest,
  IngestedFileSchema,
  type IngestedFile,
  IngestResponseSchema,
  type IngestResponse,
  IngestStatusSchema,
  type IngestStatus,
} from "./ingest.js";

export {
  MessageRoleSchema,
  type MessageRole,
  FileActionSchema,
  type FileAction,
  FileActionResultSchema,
  type FileActionResult,
  ChatMessageSchema,
  type ChatMessage,
  ChatRequestSchema,
  type ChatRequest,
  ChatResponseSchema,
  type ChatResponse,
  ChatStreamEventSchema,
  type ChatStreamEvent,
} from "./chat.js";

export {
  SavedFolderSchema,
  type SavedFolder,
} from "./folder.js";

export {
  DriveFileInfoSchema,
  type DriveFileInfo,
  CreateFileRequestSchema,
  type CreateFileRequest,
  CreateFolderRequestSchema,
  type CreateFolderRequest,
  UpdateFileRequestSchema,
  type UpdateFileRequest,
  CopyFileRequestSchema,
  type CopyFileRequest,
  MoveFileRequestSchema,
  type MoveFileRequest,
  ListFolderContentsResponseSchema,
  type ListFolderContentsResponse,
  FileContentResponseSchema,
  type FileContentResponse,
} from "./file-operations.js";

