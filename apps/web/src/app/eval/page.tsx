"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { getSavedFolders, getEvalTests, runEvalStream } from "@/lib/api-client";
import type { SavedFolder, EvalTestCase, EvalTestResult } from "@talk-to-a-folder/shared";

type RunState =
  | { status: "idle" }
  | { status: "running"; results: EvalTestResult[] }
  | { status: "done"; results: EvalTestResult[] }
  | { status: "error"; message: string };

export default function EvalPage() {
  const { session, signOut, accessToken, isLoading } = useAuth();
  const router = useRouter();
  const [folders, setFolders] = useState<SavedFolder[]>([]);
  const [tests, setTests] = useState<EvalTestCase[]>([]);
  const [selectedFolder, setSelectedFolder] = useState("");
  const [selectedTests, setSelectedTests] = useState<Set<string>>(new Set());
  const [runState, setRunState] = useState<RunState>({ status: "idle" });
  const [expandedTest, setExpandedTest] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !session) router.replace("/");
  }, [session, isLoading, router]);

  const load = useCallback(async () => {
    if (!accessToken) return;
    const [f, t] = await Promise.all([
      getSavedFolders(accessToken),
      getEvalTests(accessToken),
    ]);
    setFolders(f);
    setTests(t);
    if (f.length > 0 && !selectedFolder) setSelectedFolder(f[0]!.folderId);
    setSelectedTests(new Set(t.map((tc) => tc.id)));
  }, [accessToken, selectedFolder]);

  useEffect(() => { void load(); }, [load]);

  if (!session || !accessToken) return null;

  const handleRun = async () => {
    if (!selectedFolder) return;
    setRunState({ status: "running", results: [] });
    try {
      const ids = selectedTests.size === tests.length ? undefined : [...selectedTests];
      const collected: EvalTestResult[] = [];
      await runEvalStream(selectedFolder, accessToken, ids, (result) => {
        collected.push(result);
        setRunState({ status: "running", results: [...collected] });
      });
      setRunState({ status: "done", results: collected });
    } catch (err) {
      setRunState({ status: "error", message: err instanceof Error ? err.message : "Unknown error" });
    }
  };

  const toggleTest = (id: string) => {
    setSelectedTests((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedTests.size === tests.length) setSelectedTests(new Set());
    else setSelectedTests(new Set(tests.map((t) => t.id)));
  };

  const categories = [...new Set(tests.map((t) => t.category))];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white px-6 py-3">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-semibold text-gray-900">🧪 Eval Dashboard</h1>
            <a href="/dashboard" className="text-sm text-blue-600 hover:underline">← Back to app</a>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600">{session.name ?? session.email}</span>
            <button onClick={signOut} className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50">Sign out</button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-6">
        {/* Controls */}
        <div className="mb-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="mb-1 block text-sm font-medium text-gray-700">Folder</label>
              <select value={selectedFolder} onChange={(e) => setSelectedFolder(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
                {folders.map((f) => (
                  <option key={f.folderId} value={f.folderId}>{f.name} ({f.fileCount} files)</option>
                ))}
              </select>
            </div>
            <button onClick={handleRun} disabled={runState.status === "running" || !selectedFolder || selectedTests.size === 0}
              className={`rounded-lg px-6 py-2 text-sm font-medium text-white transition-colors ${
                runState.status === "running" ? "bg-amber-500 cursor-wait" :
                !selectedFolder || selectedTests.size === 0 ? "bg-gray-400 cursor-not-allowed" :
                "bg-blue-600 hover:bg-blue-700"
              }`}>
              {runState.status === "running" ? "⏳ Running…" : `▶ Run ${selectedTests.size} test${selectedTests.size !== 1 ? "s" : ""}`}
            </button>
          </div>
        </div>

        {/* Test selection */}
        <div className="mb-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-900">Test Cases</h2>
            <button onClick={toggleAll} className="text-xs text-blue-600 hover:underline">
              {selectedTests.size === tests.length ? "Deselect all" : "Select all"}
            </button>
          </div>
          {categories.map((cat) => (
            <div key={cat} className="mb-4">
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">{cat.replace("_", " ")}</h3>
              <div className="space-y-1">
                {tests.filter((t) => t.category === cat).map((t) => (
                  <label key={t.id} className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm hover:bg-gray-50 cursor-pointer">
                    <input type="checkbox" checked={selectedTests.has(t.id)} onChange={() => toggleTest(t.id)} className="rounded" />
                    <span className="font-medium text-gray-800">{t.name}</span>
                    <span className="text-gray-400">— {t.description}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Results */}
        {runState.status === "error" && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{runState.message}</div>
        )}
        {(runState.status === "running" || runState.status === "done") && (
          <EvalResults
            results={runState.results}
            totalExpected={selectedTests.size}
            isStreaming={runState.status === "running"}
            expandedTest={expandedTest}
            setExpandedTest={setExpandedTest}
          />
        )}
      </main>
    </div>
  );
}

function EvalResults({ results, totalExpected, isStreaming, expandedTest, setExpandedTest }: {
  results: EvalTestResult[];
  totalExpected: number;
  isStreaming: boolean;
  expandedTest: string | null;
  setExpandedTest: (id: string | null) => void;
}) {
  const passedTests = results.filter((r) => r.passed).length;
  const failedTests = results.filter((r) => !r.passed).length;
  const pct = results.length > 0 ? Math.round((passedTests / results.length) * 100) : 0;

  // Compute categories from results
  const categories: Record<string, { total: number; passed: number }> = {};
  for (const r of results) {
    if (!categories[r.category]) categories[r.category] = { total: 0, passed: 0 };
    categories[r.category]!.total++;
    if (r.passed) categories[r.category]!.passed++;
  }

  // Compute average judge scores
  const judgedResults = results.filter((r) => r.judgeScores);
  const avgJudge = judgedResults.length > 0
    ? {
        correctness: judgedResults.reduce((s, r) => s + r.judgeScores!.correctness, 0) / judgedResults.length,
        faithfulness: judgedResults.reduce((s, r) => s + r.judgeScores!.faithfulness, 0) / judgedResults.length,
        completeness: judgedResults.reduce((s, r) => s + r.judgeScores!.completeness, 0) / judgedResults.length,
        count: judgedResults.length,
      }
    : null;

  return (
    <div className="space-y-4">
      {/* Summary bar */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-6">
          <div className={`text-3xl font-bold ${pct === 100 ? "text-green-600" : pct >= 70 ? "text-amber-600" : "text-red-600"}`}>
            {isStreaming ? `${results.length}/${totalExpected}` : `${pct}%`}
          </div>
          <div className="flex-1">
            <div className="mb-2 flex gap-4 text-sm">
              <span className="text-green-700">✅ {passedTests} passed</span>
              <span className="text-red-700">❌ {failedTests} failed</span>
              <span className="text-gray-500">{results.length}{isStreaming ? ` / ${totalExpected}` : ""} total</span>
              {isStreaming && <span className="animate-pulse text-amber-600">⏳ Running…</span>}
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
              <div className="h-full rounded-full bg-green-500 transition-all" style={{ width: `${isStreaming ? (results.length / totalExpected) * 100 : pct}%` }} />
            </div>
          </div>
          <div className="text-xs text-gray-400">
            {Object.entries(categories).map(([cat, s]) => (
              <div key={cat}>{cat.replace("_", " ")}: {s.passed}/{s.total}</div>
            ))}
          </div>
        </div>
        {/* Average LLM Judge Scores */}
        {avgJudge && (
          <div className="mt-4 flex gap-6 border-t border-gray-100 pt-4">
            <div className="text-xs font-semibold uppercase text-gray-500">LLM Judge Avg ({avgJudge.count} tests)</div>
            <ScoreBadge label="Correctness" score={avgJudge.correctness} />
            <ScoreBadge label="Faithfulness" score={avgJudge.faithfulness} />
            <ScoreBadge label="Completeness" score={avgJudge.completeness} />
          </div>
        )}
      </div>

      {/* Individual results */}
      {results.map((r) => (
        <ResultCard key={r.testId} result={r} expanded={expandedTest === r.testId}
          onToggle={() => setExpandedTest(expandedTest === r.testId ? null : r.testId)} />
      ))}
    </div>
  );
}

function ResultCard({ result: r, expanded, onToggle }: {
  result: EvalTestResult;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <div className={`rounded-xl border bg-white shadow-sm overflow-hidden ${r.passed ? "border-green-200" : "border-red-200"}`}>
      <button onClick={onToggle} className="flex w-full items-center gap-3 px-5 py-3 text-left hover:bg-gray-50">
        <span className="text-lg">{r.passed ? "✅" : "❌"}</span>
        <div className="flex-1">
          <span className="font-medium text-gray-900">{r.testName}</span>
          <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">{r.category}</span>
        </div>
        {r.judgeScores && (
          <div className="flex gap-2">
            <ScorePill label="C" score={r.judgeScores.correctness} />
            <ScorePill label="F" score={r.judgeScores.faithfulness} />
            <ScorePill label="Co" score={r.judgeScores.completeness} />
          </div>
        )}
        <span className="text-xs text-gray-400">{r.durationMs}ms</span>
        <span className="text-gray-400">{expanded ? "▲" : "▼"}</span>
      </button>
      {expanded && (
        <div className="border-t border-gray-100 px-5 py-4 space-y-3">
          {/* Assertions */}
          <div>
            <h4 className="mb-1 text-xs font-semibold uppercase text-gray-500">Assertions</h4>
            <div className="space-y-1">
              {r.assertions.map((a, i) => (
                <div key={i} className={`flex items-start gap-2 rounded-lg px-3 py-1.5 text-sm ${a.passed ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}>
                  <span>{a.passed ? "✓" : "✗"}</span>
                  <span className="font-mono text-xs">{a.name}</span>
                  <span className="text-gray-600">— {a.detail}</span>
                </div>
              ))}
            </div>
          </div>
          {/* LLM Judge Scores */}
          {r.judgeScores && (
            <div>
              <h4 className="mb-1 text-xs font-semibold uppercase text-gray-500">LLM Judge Scores</h4>
              <div className="flex gap-4">
                <ScoreBadge label="Correctness" score={r.judgeScores.correctness} />
                <ScoreBadge label="Faithfulness" score={r.judgeScores.faithfulness} />
                <ScoreBadge label="Completeness" score={r.judgeScores.completeness} />
              </div>
              {r.judgeScores.reason && (
                <p className="mt-2 rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-600 italic">{r.judgeScores.reason}</p>
              )}
            </div>
          )}
          {/* Answer preview */}
          {r.answer && (
            <div>
              <h4 className="mb-1 text-xs font-semibold uppercase text-gray-500">Answer</h4>
              <pre className="max-h-40 overflow-auto rounded-lg bg-gray-50 p-3 text-xs text-gray-700 whitespace-pre-wrap">{r.answer}</pre>
            </div>
          )}
          {/* Citations */}
          {r.citationFiles.length > 0 && (
            <div>
              <h4 className="mb-1 text-xs font-semibold uppercase text-gray-500">Citations ({r.citationCount})</h4>
              <div className="flex flex-wrap gap-1">
                {r.citationFiles.map((f, i) => (
                  <span key={i} className="rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-700">{f}</span>
                ))}
              </div>
            </div>
          )}
          {/* File actions */}
          {r.fileActions && r.fileActions.length > 0 && (
            <div>
              <h4 className="mb-1 text-xs font-semibold uppercase text-gray-500">File Actions</h4>
              <div className="space-y-1">
                {r.fileActions.map((fa, i) => (
                  <div key={i} className={`rounded-lg px-3 py-1.5 text-sm ${fa.success ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}>
                    {fa.success ? "✅" : "❌"} {fa.action} — {fa.fileName}
                  </div>
                ))}
              </div>
            </div>
          )}
          {/* Error */}
          {r.error && (
            <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">
              <strong>Error:</strong> {r.error}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function scoreColor(score: number): string {
  if (score >= 4.5) return "text-green-700 bg-green-50";
  if (score >= 3.5) return "text-blue-700 bg-blue-50";
  if (score >= 2.5) return "text-amber-700 bg-amber-50";
  return "text-red-700 bg-red-50";
}

function ScoreBadge({ label, score }: { label: string; score: number }) {
  return (
    <div className={`rounded-lg px-3 py-1.5 text-sm font-medium ${scoreColor(score)}`}>
      {label}: <span className="font-bold">{score.toFixed(1)}</span>/5
    </div>
  );
}

function ScorePill({ label, score }: { label: string; score: number }) {
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${scoreColor(score)}`}>
      {label}:{score.toFixed(1)}
    </span>
  );
}
