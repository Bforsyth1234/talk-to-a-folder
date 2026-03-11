import { z } from "zod";

// ---------------------------------------------------------------------------
// Ingest request – kick off ingestion of a Google Drive folder
// ---------------------------------------------------------------------------
export const IngestRequestSchema = z.object({
  /** Google Drive folder ID (or full URL – backend normalises) */
  folderId: z.string().min(1),
});

export type IngestRequest = z.infer<typeof IngestRequestSchema>;

// ---------------------------------------------------------------------------
// Per-file status reported during / after ingestion
// ---------------------------------------------------------------------------
export const IngestedFileSchema = z.object({
  fileId: z.string(),
  fileName: z.string(),
  mimeType: z.string(),
  chunkCount: z.number().int().nonnegative(),
  status: z.enum(["success", "skipped", "error"]),
  error: z.string().optional(),
});

export type IngestedFile = z.infer<typeof IngestedFileSchema>;

// ---------------------------------------------------------------------------
// Ingest response – summary returned when ingestion completes
// ---------------------------------------------------------------------------
export const IngestResponseSchema = z.object({
  folderId: z.string(),
  totalFiles: z.number().int().nonnegative(),
  processedFiles: z.number().int().nonnegative(),
  skippedFiles: z.number().int().nonnegative(),
  errorFiles: z.number().int().nonnegative(),
  files: z.array(IngestedFileSchema),
});

export type IngestResponse = z.infer<typeof IngestResponseSchema>;

// ---------------------------------------------------------------------------
// Ingest status – for polling / progress queries
// ---------------------------------------------------------------------------
export const IngestStatusSchema = z.object({
  folderId: z.string(),
  status: z.enum(["pending", "in_progress", "completed", "failed"]),
  progress: z.number().min(0).max(100).optional(),
  result: IngestResponseSchema.optional(),
  error: z.string().optional(),
});

export type IngestStatus = z.infer<typeof IngestStatusSchema>;

