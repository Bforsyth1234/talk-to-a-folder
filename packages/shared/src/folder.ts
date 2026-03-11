import { z } from "zod";

// ---------------------------------------------------------------------------
// Saved folder – a folder that has been synced and persisted for reuse
// ---------------------------------------------------------------------------
export const SavedFolderSchema = z.object({
  /** Unique identifier for this saved folder record */
  id: z.string(),
  /** Google Drive folder ID */
  folderId: z.string(),
  /** Display name (folder URL or user-provided name) */
  name: z.string(),
  /** Number of files processed during last sync */
  fileCount: z.number().int().nonnegative(),
  /** ISO timestamp of when the folder was saved */
  savedAt: z.string(),
});

export type SavedFolder = z.infer<typeof SavedFolderSchema>;

