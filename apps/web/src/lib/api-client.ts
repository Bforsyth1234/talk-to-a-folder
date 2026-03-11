import type {
  IngestRequest,
  IngestResponse,
  ChatRequest,
  ChatStreamEvent,
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

