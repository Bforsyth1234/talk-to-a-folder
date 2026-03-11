import { z } from "zod";
import { CitationSchema } from "./citation.js";

// ---------------------------------------------------------------------------
// Chat message roles
// ---------------------------------------------------------------------------
export const MessageRoleSchema = z.enum(["user", "assistant"]);
export type MessageRole = z.infer<typeof MessageRoleSchema>;

// ---------------------------------------------------------------------------
// File actions – the AI can request these during a conversation
// ---------------------------------------------------------------------------
export const FileActionSchema = z.object({
  /** The type of file operation */
  action: z.enum([
    "create_file",
    "create_folder",
    "edit_file",
    "copy_file",
    "move_file",
    "rename_file",
  ]),
  /** Target file name (for create/edit/rename) */
  fileName: z.string().optional(),
  /** File content (for create/edit) */
  content: z.string().optional(),
  /** Edit instruction describing what to change (for edit_file) */
  editInstruction: z.string().optional(),
  /** MIME type (for create) */
  mimeType: z.string().optional(),
  /** Source file name (for copy/move/edit/rename) */
  sourceFileName: z.string().optional(),
  /** Destination folder name (for move) */
  destinationFolderName: z.string().optional(),
  /** New name (for rename/copy) */
  newName: z.string().optional(),
});

export type FileAction = z.infer<typeof FileActionSchema>;

export const FileActionResultSchema = z.object({
  action: z.string(),
  fileName: z.string(),
  success: z.boolean(),
  fileId: z.string().optional(),
  error: z.string().optional(),
  googleDriveLink: z.string().optional(),
  mimeType: z.string().optional(),
});

export type FileActionResult = z.infer<typeof FileActionResultSchema>;

// ---------------------------------------------------------------------------
// A single chat message (used in history and responses)
// ---------------------------------------------------------------------------
export const ChatMessageSchema = z.object({
  role: MessageRoleSchema,
  content: z.string(),
  citations: z.array(CitationSchema).optional(),
  fileActions: z.array(FileActionResultSchema).optional(),
  createdAt: z.string().datetime().optional(),
});

export type ChatMessage = z.infer<typeof ChatMessageSchema>;

// ---------------------------------------------------------------------------
// Chat request – send a question scoped to a folder
// ---------------------------------------------------------------------------
export const ChatRequestSchema = z.object({
  /** The question to ask */
  message: z.string().min(1),
  /** Google Drive folder ID to scope retrieval to */
  folderId: z.string().min(1),
  /** Optional prior conversation for multi-turn context */
  history: z.array(ChatMessageSchema).optional(),
});

export type ChatRequest = z.infer<typeof ChatRequestSchema>;

// ---------------------------------------------------------------------------
// Chat response – full (non-streaming) answer
// ---------------------------------------------------------------------------
export const ChatResponseSchema = z.object({
  answer: z.string(),
  citations: z.array(CitationSchema),
  folderId: z.string(),
});

export type ChatResponse = z.infer<typeof ChatResponseSchema>;

// ---------------------------------------------------------------------------
// Streaming chat event – sent as SSE / newline-delimited JSON
// ---------------------------------------------------------------------------
export const ChatStreamEventSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("token"),
    token: z.string(),
  }),
  z.object({
    type: z.literal("citations"),
    citations: z.array(CitationSchema),
  }),
  z.object({
    type: z.literal("file_action"),
    fileAction: FileActionResultSchema,
  }),
  z.object({
    type: z.literal("done"),
    answer: z.string(),
    citations: z.array(CitationSchema),
    fileActions: z.array(FileActionResultSchema).optional(),
  }),
  z.object({
    type: z.literal("error"),
    error: z.string(),
  }),
]);

export type ChatStreamEvent = z.infer<typeof ChatStreamEventSchema>;

