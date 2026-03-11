"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { ingestFolder, streamChat, getSavedFolders, deleteSavedFolder } from "@/lib/api-client";
import type { IngestResponse, ChatMessage, Citation, SavedFolder } from "@talk-to-a-folder/shared";

type SyncState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; result: IngestResponse }
  | { status: "error"; message: string };

export default function DashboardPage() {
  const { session, signOut, accessToken } = useAuth();
  const router = useRouter();
  const [folderInput, setFolderInput] = useState("");
  const [syncState, setSyncState] = useState<SyncState>({ status: "idle" });
  const [savedFolders, setSavedFolders] = useState<SavedFolder[]>([]);
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);

  const loadFolders = useCallback(async () => {
    if (!accessToken) return;
    try {
      const folders = await getSavedFolders(accessToken);
      setSavedFolders(folders);
    } catch {
      // silently fail – folders list is non-critical
    }
  }, [accessToken]);

  useEffect(() => {
    if (!session) {
      router.replace("/");
    }
  }, [session, router]);

  useEffect(() => {
    void loadFolders();
  }, [loadFolders]);

  if (!session || !accessToken) return null;

  const handleSync = async () => {
    const trimmed = folderInput.trim();
    if (!trimmed) return;

    setSyncState({ status: "loading" });
    try {
      const result = await ingestFolder({ folderId: trimmed }, accessToken);
      setSyncState({ status: "success", result });
      setActiveFolderId(result.folderId);
      // Refresh saved folders list (the backend auto-saves on ingest)
      void loadFolders();
    } catch (err) {
      setSyncState({
        status: "error",
        message: err instanceof Error ? err.message : "Unknown error",
      });
    }
  };

  const handleSelectFolder = (folder: SavedFolder) => {
    setActiveFolderId(folder.folderId);
    setSyncState({ status: "idle" });
  };

  const handleDeleteFolder = async (folder: SavedFolder) => {
    try {
      await deleteSavedFolder(folder.id, accessToken);
      setSavedFolders((prev) => prev.filter((f) => f.id !== folder.id));
      if (activeFolderId === folder.folderId) {
        setActiveFolderId(null);
      }
    } catch {
      // silently fail
    }
  };

  const folderId = activeFolderId;

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white px-6 py-3">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <h1 className="text-lg font-semibold text-gray-900">
            📁 Talk to a Folder
          </h1>
          <div className="flex items-center gap-3">
            {session.picture && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={session.picture}
                alt=""
                width={32}
                height={32}
                className="rounded-full"
              />
            )}
            <span className="text-sm text-gray-600">
              {session.name ?? session.email}
            </span>
            <button
              onClick={signOut}
              className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-600 transition-colors hover:bg-gray-50"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-8">
        {/* Folder sync section */}
        <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-1 text-base font-semibold text-gray-900">
            Sync a Google Drive Folder
          </h2>
          <p className="mb-4 text-sm text-gray-500">
            Paste a Google Drive folder link or ID to index its contents for
            chat.
          </p>

          <div className="flex gap-3">
            <input
              type="text"
              value={folderInput}
              onChange={(e) => setFolderInput(e.target.value)}
              placeholder="https://drive.google.com/drive/folders/... or folder ID"
              className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
              disabled={syncState.status === "loading"}
            />
            <button
              onClick={() => void handleSync()}
              disabled={
                syncState.status === "loading" || !folderInput.trim()
              }
              className={`inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium text-white transition-colors ${
                syncState.status === "loading" || !folderInput.trim()
                  ? "cursor-not-allowed bg-blue-400"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {syncState.status === "loading" && (
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              )}
              {syncState.status === "loading"
                ? "Syncing…"
                : "Sync Folder"}
            </button>
          </div>

          {/* Status messages */}
          {syncState.status === "success" && (
            <div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-4">
              <p className="text-sm font-medium text-green-800">
                ✅ Folder synced successfully
              </p>
              <p className="mt-1 text-xs text-green-700">
                {syncState.result.processedFiles} files processed
                {syncState.result.skippedFiles > 0 &&
                  `, ${syncState.result.skippedFiles} skipped`}
                {syncState.result.errorFiles > 0 &&
                  `, ${syncState.result.errorFiles} errors`}
              </p>
            </div>
          )}

          {syncState.status === "error" && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4">
              <p className="text-sm font-medium text-red-800">
                ❌ Sync failed
              </p>
              <p className="mt-1 text-xs text-red-700">
                {syncState.message}
              </p>
            </div>
          )}
        </section>

        {/* Saved folders */}
        {savedFolders.length > 0 && (
          <section className="mt-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-3 text-base font-semibold text-gray-900">
              📂 Your Folders
            </h2>
            <div className="space-y-2">
              {savedFolders.map((folder) => (
                <div
                  key={folder.id}
                  className={`flex items-center justify-between rounded-lg border px-4 py-3 transition-colors ${
                    activeFolderId === folder.folderId
                      ? "border-blue-300 bg-blue-50"
                      : "border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => handleSelectFolder(folder)}
                    className="flex flex-1 flex-col items-start text-left"
                  >
                    <span className="text-sm font-medium text-gray-900 truncate max-w-md">
                      {folder.name}
                    </span>
                    <span className="text-xs text-gray-500">
                      {folder.fileCount} files · synced{" "}
                      {new Date(folder.savedAt).toLocaleDateString()}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleDeleteFolder(folder)}
                    className="ml-3 rounded-md p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
                    title="Remove folder"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Chat section – only visible when a folder is selected */}
        {folderId && (
          <section className="mt-6">
            <ChatSection folderId={folderId} accessToken={accessToken} />
          </section>
        )}
      </main>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Chat Section (inline to keep in same route file)
// ---------------------------------------------------------------------------

function ChatSection({
  folderId,
  accessToken,
}: {
  folderId: string;
  accessToken: string;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || isStreaming) return;

    const userMsg: ChatMessage = { role: "user", content: trimmed };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsStreaming(true);

    let assistantText = "";
    let citations: Citation[] = [];

    // Add placeholder assistant message
    setMessages((prev) => [
      ...prev,
      { role: "assistant", content: "", citations: [] },
    ]);

    try {
      const history = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      for await (const event of streamChat(
        { message: trimmed, folderId, history },
        accessToken,
      )) {
        switch (event.type) {
          case "citations":
            citations = event.citations;
            setMessages((prev) => {
              const updated = [...prev];
              const last = updated[updated.length - 1];
              if (last?.role === "assistant") {
                updated[updated.length - 1] = { ...last, citations };
              }
              return updated;
            });
            break;
          case "token":
            assistantText += event.token;
            setMessages((prev) => {
              const updated = [...prev];
              const last = updated[updated.length - 1];
              if (last?.role === "assistant") {
                updated[updated.length - 1] = {
                  ...last,
                  content: assistantText,
                  citations,
                };
              }
              return updated;
            });
            break;
          case "done":
            setMessages((prev) => {
              const updated = [...prev];
              const last = updated[updated.length - 1];
              if (last?.role === "assistant") {
                updated[updated.length - 1] = {
                  ...last,
                  content: event.answer,
                  citations: event.citations,
                };
              }
              return updated;
            });
            break;
          case "error":
            setMessages((prev) => {
              const updated = [...prev];
              const last = updated[updated.length - 1];
              if (last?.role === "assistant") {
                updated[updated.length - 1] = {
                  ...last,
                  content: `Error: ${event.error}`,
                };
              }
              return updated;
            });
            break;
        }
      }
    } catch (err) {
      setMessages((prev) => {
        const updated = [...prev];
        const last = updated[updated.length - 1];
        if (last?.role === "assistant") {
          updated[updated.length - 1] = {
            ...last,
            content: `Error: ${err instanceof Error ? err.message : "Unknown error"}`,
          };
        }
        return updated;
      });
    } finally {
      setIsStreaming(false);
    }
  };

  useEffect(() => {
    scrollToBottom();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages]);

  return (
    <div className="flex h-[600px] flex-col rounded-xl border border-gray-200 bg-white shadow-sm">
      {/* Chat header */}
      <div className="border-b border-gray-200 px-6 py-3">
        <h2 className="text-base font-semibold text-gray-900">
          💬 Chat with your folder
        </h2>
        <p className="text-xs text-gray-500">
          Ask questions about the synced documents
        </p>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {messages.length === 0 && (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-gray-400">
              Ask a question about your folder contents…
            </p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`mb-4 ${msg.role === "user" ? "flex justify-end" : ""}`}
          >
            <div
              className={`max-w-[80%] rounded-xl px-4 py-3 ${
                msg.role === "user"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-900"
              }`}
            >
              <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
              {msg.role === "assistant" &&
                msg.citations &&
                msg.citations.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {msg.citations.map((c, ci) => (
                      <CitationPill key={ci} citation={c} />
                    ))}
                  </div>
                )}
              {msg.role === "assistant" &&
                !msg.content &&
                isStreaming && (
                  <span className="inline-block h-4 w-1 animate-pulse bg-gray-400" />
                )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="border-t border-gray-200 px-6 py-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void handleSend();
          }}
          className="flex gap-3"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question…"
            disabled={isStreaming}
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none disabled:bg-gray-50"
          />
          <button
            type="submit"
            disabled={isStreaming || !input.trim()}
            className={`rounded-lg px-5 py-2.5 text-sm font-medium text-white transition-colors ${
              isStreaming || !input.trim()
                ? "cursor-not-allowed bg-blue-400"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Citation Pill
// ---------------------------------------------------------------------------

function CitationPill({ citation }: { citation: Citation }) {
  return (
    <a
      href={citation.googleDriveLink}
      target="_blank"
      rel="noopener noreferrer"
      title={citation.snippet ?? citation.fileName}
      className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-100"
    >
      <svg
        className="h-3 w-3"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={2}
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m9.86-2.06a4.5 4.5 0 0 0-1.242-7.244l-4.5-4.5a4.5 4.5 0 0 0-6.364 6.364L4.757 8.25"
        />
      </svg>
      {citation.fileName}
    </a>
  );
}

