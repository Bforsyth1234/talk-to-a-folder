import { z } from "zod";

// ---------------------------------------------------------------------------
// Citation – links a chat answer span back to a Google Drive source
// ---------------------------------------------------------------------------
export const CitationSchema = z.object({
  /** Name of the source file in Google Drive */
  fileName: z.string(),
  /** Google Drive file ID */
  fileId: z.string(),
  /** Direct link to the file in Google Drive */
  googleDriveLink: z.string().url(),
  /** Relevant text snippet from the source document */
  snippet: z.string().optional(),
  /** Relevance / similarity score (0-1) */
  score: z.number().min(0).max(1).optional(),
});

export type Citation = z.infer<typeof CitationSchema>;

