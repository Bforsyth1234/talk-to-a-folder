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

