import { z } from "zod";
import { CitationSchema } from "./citation.js";

// ---------------------------------------------------------------------------
// Chat message roles
// ---------------------------------------------------------------------------
export const MessageRoleSchema = z.enum(["user", "assistant"]);
export type MessageRole = z.infer<typeof MessageRoleSchema>;

// ---------------------------------------------------------------------------
// A single chat message (used in history and responses)
// ---------------------------------------------------------------------------
export const ChatMessageSchema = z.object({
  role: MessageRoleSchema,
  content: z.string(),
  citations: z.array(CitationSchema).optional(),
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
    type: z.literal("done"),
    answer: z.string(),
    citations: z.array(CitationSchema),
  }),
  z.object({
    type: z.literal("error"),
    error: z.string(),
  }),
]);

export type ChatStreamEvent = z.infer<typeof ChatStreamEventSchema>;

