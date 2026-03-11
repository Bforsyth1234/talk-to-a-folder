import { z } from "zod";

// ---------------------------------------------------------------------------
// Drive file info returned from listing / operations
// ---------------------------------------------------------------------------
export const DriveFileInfoSchema = z.object({
  id: z.string(),
  name: z.string(),
  mimeType: z.string(),
  parentId: z.string().optional(),
});

export type DriveFileInfo = z.infer<typeof DriveFileInfoSchema>;

// ---------------------------------------------------------------------------
// Create file
// ---------------------------------------------------------------------------
export const CreateFileRequestSchema = z.object({
  /** Parent folder ID in Google Drive */
  parentFolderId: z.string().min(1),
  /** File name */
  name: z.string().min(1),
  /** MIME type (e.g. "text/plain", "application/vnd.google-apps.document") */
  mimeType: z.string().min(1),
  /** Text content (for text-based files) */
  content: z.string().optional(),
});

export type CreateFileRequest = z.infer<typeof CreateFileRequestSchema>;

// ---------------------------------------------------------------------------
// Create folder
// ---------------------------------------------------------------------------
export const CreateFolderRequestSchema = z.object({
  /** Parent folder ID in Google Drive */
  parentFolderId: z.string().min(1),
  /** Folder name */
  name: z.string().min(1),
});

export type CreateFolderRequest = z.infer<typeof CreateFolderRequestSchema>;

// ---------------------------------------------------------------------------
// Update file (rename and/or update content)
// ---------------------------------------------------------------------------
export const UpdateFileRequestSchema = z.object({
  /** New file name (optional) */
  name: z.string().min(1).optional(),
  /** New text content (optional, for text-based files) */
  content: z.string().optional(),
});

export type UpdateFileRequest = z.infer<typeof UpdateFileRequestSchema>;

// ---------------------------------------------------------------------------
// Copy file
// ---------------------------------------------------------------------------
export const CopyFileRequestSchema = z.object({
  /** Optional new name for the copy */
  name: z.string().min(1).optional(),
  /** Optional destination folder ID */
  destinationFolderId: z.string().min(1).optional(),
});

export type CopyFileRequest = z.infer<typeof CopyFileRequestSchema>;

// ---------------------------------------------------------------------------
// Move file / folder
// ---------------------------------------------------------------------------
export const MoveFileRequestSchema = z.object({
  /** Destination folder ID */
  destinationFolderId: z.string().min(1),
});

export type MoveFileRequest = z.infer<typeof MoveFileRequestSchema>;

// ---------------------------------------------------------------------------
// List files in a folder (richer than ingest listing)
// ---------------------------------------------------------------------------
export const ListFolderContentsResponseSchema = z.object({
  files: z.array(DriveFileInfoSchema),
  folderId: z.string(),
});

export type ListFolderContentsResponse = z.infer<typeof ListFolderContentsResponseSchema>;

// ---------------------------------------------------------------------------
// Get file content response
// ---------------------------------------------------------------------------
export const FileContentResponseSchema = z.object({
  fileId: z.string(),
  name: z.string(),
  mimeType: z.string(),
  content: z.string(),
});

export type FileContentResponse = z.infer<typeof FileContentResponseSchema>;

