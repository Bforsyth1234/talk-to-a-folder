import type {
  IngestRequest,
  IngestResponse,
  ChatRequest,
  ChatStreamEvent,
  SavedFolder,
  DriveFileInfo,
  CreateFileRequest,
  CreateFolderRequest,
  UpdateFileRequest,
  CopyFileRequest,
  MoveFileRequest,
  ListFolderContentsResponse,
  FileContentResponse,
} from "@talk-to-a-folder/shared";

const API_BASE = process.env["NEXT_PUBLIC_API_URL"] ?? "http://localhost:3001";

function authHeaders(accessToken: string): HeadersInit {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${accessToken}`,
  };
}

// ---------------------------------------------------------------------------
// Ingest
// ---------------------------------------------------------------------------

export async function ingestFolder(
  req: IngestRequest,
  accessToken: string,
): Promise<IngestResponse> {
  const res = await fetch(`${API_BASE}/ingest`, {
    method: "POST",
    headers: authHeaders(accessToken),
    body: JSON.stringify(req),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Ingest failed (${res.status}): ${text}`);
  }
  return res.json() as Promise<IngestResponse>;
}

// ---------------------------------------------------------------------------
// Saved Folders
// ---------------------------------------------------------------------------

export async function getSavedFolders(
  accessToken: string,
): Promise<SavedFolder[]> {
  const res = await fetch(`${API_BASE}/folders`, {
    headers: authHeaders(accessToken),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Failed to load folders (${res.status}): ${text}`);
  }
  return res.json() as Promise<SavedFolder[]>;
}

export async function deleteSavedFolder(
  id: string,
  accessToken: string,
): Promise<void> {
  const res = await fetch(`${API_BASE}/folders/${id}`, {
    method: "DELETE",
    headers: authHeaders(accessToken),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Failed to delete folder (${res.status}): ${text}`);
  }
}

// ---------------------------------------------------------------------------
// File Operations
// ---------------------------------------------------------------------------

export async function listFolderFiles(
  folderId: string,
  accessToken: string,
): Promise<ListFolderContentsResponse> {
  const res = await fetch(`${API_BASE}/files?folderId=${encodeURIComponent(folderId)}`, {
    headers: authHeaders(accessToken),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Failed to list files (${res.status}): ${text}`);
  }
  return res.json() as Promise<ListFolderContentsResponse>;
}

export async function getFileContent(
  fileId: string,
  accessToken: string,
): Promise<FileContentResponse> {
  const res = await fetch(`${API_BASE}/files/${fileId}/content`, {
    headers: authHeaders(accessToken),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Failed to get file content (${res.status}): ${text}`);
  }
  return res.json() as Promise<FileContentResponse>;
}

export async function createFile(
  req: CreateFileRequest,
  accessToken: string,
): Promise<DriveFileInfo> {
  const res = await fetch(`${API_BASE}/files`, {
    method: "POST",
    headers: authHeaders(accessToken),
    body: JSON.stringify(req),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Failed to create file (${res.status}): ${text}`);
  }
  return res.json() as Promise<DriveFileInfo>;
}

export async function createFolder(
  req: CreateFolderRequest,
  accessToken: string,
): Promise<DriveFileInfo> {
  const res = await fetch(`${API_BASE}/files/folder`, {
    method: "POST",
    headers: authHeaders(accessToken),
    body: JSON.stringify(req),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Failed to create folder (${res.status}): ${text}`);
  }
  return res.json() as Promise<DriveFileInfo>;
}

export async function updateFile(
  fileId: string,
  req: UpdateFileRequest,
  accessToken: string,
  folderId?: string,
): Promise<DriveFileInfo> {
  const params = folderId ? `?folderId=${encodeURIComponent(folderId)}` : "";
  const res = await fetch(`${API_BASE}/files/${fileId}${params}`, {
    method: "PATCH",
    headers: authHeaders(accessToken),
    body: JSON.stringify(req),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Failed to update file (${res.status}): ${text}`);
  }
  return res.json() as Promise<DriveFileInfo>;
}

export async function copyFile(
  fileId: string,
  req: CopyFileRequest,
  accessToken: string,
): Promise<DriveFileInfo> {
  const res = await fetch(`${API_BASE}/files/${fileId}/copy`, {
    method: "POST",
    headers: authHeaders(accessToken),
    body: JSON.stringify(req),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Failed to copy file (${res.status}): ${text}`);
  }
  return res.json() as Promise<DriveFileInfo>;
}

export async function moveFile(
  fileId: string,
  req: MoveFileRequest,
  accessToken: string,
): Promise<DriveFileInfo> {
  const res = await fetch(`${API_BASE}/files/${fileId}/move`, {
    method: "POST",
    headers: authHeaders(accessToken),
    body: JSON.stringify(req),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Failed to move file (${res.status}): ${text}`);
  }
  return res.json() as Promise<DriveFileInfo>;
}

// ---------------------------------------------------------------------------
// Eval
// ---------------------------------------------------------------------------

export async function getEvalTests(
  accessToken: string,
): Promise<import("@talk-to-a-folder/shared").EvalTestCase[]> {
  const res = await fetch(`${API_BASE}/eval/tests`, {
    headers: authHeaders(accessToken),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Failed to get eval tests (${res.status}): ${text}`);
  }
  return res.json();
}

export async function runEvalStream(
  folderId: string,
  accessToken: string,
  testIds: string[] | undefined,
  onResult: (result: import("@talk-to-a-folder/shared").EvalTestResult) => void,
): Promise<void> {
  const res = await fetch(`${API_BASE}/eval/run`, {
    method: "POST",
    headers: authHeaders(accessToken),
    body: JSON.stringify({ folderId, testIds }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Eval run failed (${res.status}): ${text}`);
  }

  const reader = res.body?.getReader();
  if (!reader) throw new Error("No response body");

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      try {
        onResult(JSON.parse(trimmed));
      } catch {
        console.warn("[runEvalStream] Skipping malformed NDJSON line:", trimmed);
      }
    }
  }

  // Process any remaining buffer
  const remaining = buffer.trim();
  if (remaining) {
    try {
      onResult(JSON.parse(remaining));
    } catch {
      console.warn("[runEvalStream] Skipping malformed trailing NDJSON:", remaining);
    }
  }
}

// ---------------------------------------------------------------------------
// Chat – NDJSON streaming
// ---------------------------------------------------------------------------

export async function* streamChat(
  req: ChatRequest,
  accessToken: string,
): AsyncGenerator<ChatStreamEvent> {
  const res = await fetch(`${API_BASE}/chat`, {
    method: "POST",
    headers: authHeaders(accessToken),
    body: JSON.stringify(req),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Chat request failed (${res.status}): ${text}`);
  }

  const reader = res.body?.getReader();
  if (!reader) throw new Error("No response body");

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    // Keep the last (possibly incomplete) line in the buffer
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      try {
        yield JSON.parse(trimmed) as ChatStreamEvent;
      } catch {
        console.warn("Failed to parse NDJSON line:", trimmed);
      }
    }
  }

  // Process any remaining buffer
  if (buffer.trim()) {
    try {
      yield JSON.parse(buffer.trim()) as ChatStreamEvent;
    } catch {
      console.warn("Failed to parse final NDJSON line:", buffer.trim());
    }
  }
}

