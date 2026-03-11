import type {
  IngestRequest,
  IngestResponse,
  ChatRequest,
  ChatStreamEvent,
  SavedFolder,
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

