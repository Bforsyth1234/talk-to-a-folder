/**
 * Evaluation pipeline for the Talk-to-a-Folder RAG prototype.
 *
 * Reads a golden dataset, queries the local RAG API, and uses OpenAI gpt-4o
 * as an LLM judge to score Context Precision and Faithfulness on a 1–5 scale.
 *
 * Usage:
 *   OPENAI_API_KEY=sk-... API_BASE_URL=http://localhost:3001 FOLDER_ID=<id> \
 *     pnpm exec tsx scripts/evaluate.ts [path/to/dataset.json]
 *
 * Environment variables:
 *   OPENAI_API_KEY  – Required. Used for the LLM judge (gpt-4o).
 *   API_BASE_URL    – Base URL of the running API server (default: http://localhost:3001).
 *   FOLDER_ID       – Google Drive folder ID to scope retrieval to (required).
 *   AUTH_TOKEN       – Bearer token for the API if auth is enabled (optional).
 *   DATASET_PATH    – Alternative to the positional arg (default: scripts/golden_dataset.json).
 */

import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import type { ChatStreamEvent, Citation } from "@talk-to-a-folder/shared";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface GoldenEntry {
  question: string;
  ideal_answer: string;
  expected_context: string[];
}

interface RagResponse {
  answer: string;
  citations: Citation[];
}

interface JudgeScores {
  contextPrecision: number;
  faithfulness: number;
}

interface EvalResult {
  question: string;
  answer: string;
  citations: Citation[];
  contextPrecision: number;
  faithfulness: number;
}

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const __dirname = dirname(fileURLToPath(import.meta.url));

const API_BASE_URL = process.env["API_BASE_URL"] ?? "http://localhost:3001";
const FOLDER_ID = process.env["FOLDER_ID"] ?? "";
const AUTH_TOKEN = process.env["AUTH_TOKEN"] ?? "";
const DATASET_PATH =
  process.argv[2] ??
  process.env["DATASET_PATH"] ??
  resolve(__dirname, "golden_dataset.json");
const OPENAI_API_KEY = process.env["OPENAI_API_KEY"] ?? "";
const JUDGE_MODEL = "gpt-4o";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function loadDataset(path: string): GoldenEntry[] {
  const raw = readFileSync(resolve(path), "utf-8");
  const data: unknown = JSON.parse(raw);
  if (!Array.isArray(data)) throw new Error("Dataset must be a JSON array");
  return data as GoldenEntry[];
}

/** Query the local RAG chat endpoint and parse the NDJSON stream. */
async function queryRag(question: string): Promise<RagResponse> {
  const url = `${API_BASE_URL}/chat`;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (AUTH_TOKEN) headers["Authorization"] = `Bearer ${AUTH_TOKEN}`;

  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({ message: question, folderId: FOLDER_ID }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`RAG API error ${res.status}: ${text}`);
  }

  const body = await res.text();
  const lines = body.split("\n").filter(Boolean);

  let answer = "";
  let citations: Citation[] = [];

  for (const line of lines) {
    const event = JSON.parse(line) as ChatStreamEvent;
    if (event.type === "token") answer += event.token;
    if (event.type === "citations") citations = event.citations;
    if (event.type === "done") {
      answer = event.answer;
      citations = event.citations;
    }
  }

  return { answer, citations };
}

/** Use gpt-4o as an LLM judge to score context precision and faithfulness. */
async function judge(
  entry: GoldenEntry,
  ragResponse: RagResponse,
): Promise<JudgeScores> {
  const citationText = ragResponse.citations
    .map((c) => `- ${c.fileName}: ${c.snippet ?? "(no snippet)"}`)
    .join("\n");

  const prompt = `You are an evaluation judge for a RAG system. Score the following on a 1-5 scale.

QUESTION: ${entry.question}

IDEAL ANSWER: ${entry.ideal_answer}

EXPECTED CONTEXT KEYWORDS: ${entry.expected_context.join(", ")}

ACTUAL ANSWER: ${ragResponse.answer}

RETRIEVED CITATIONS:
${citationText || "(none)"}

Score these two dimensions (1 = worst, 5 = best):

1. **Context Precision**: How well do the retrieved citations match the expected context?
   - 5: All expected context keywords are covered by citations
   - 3: Some expected keywords are covered
   - 1: Citations are irrelevant or missing

2. **Faithfulness**: How faithful is the actual answer to the retrieved context?
   - 5: Answer is fully grounded in citations, no hallucination
   - 3: Partially grounded, some unsupported claims
   - 1: Answer contradicts or ignores retrieved context

Respond with ONLY a JSON object: {"contextPrecision": <1-5>, "faithfulness": <1-5>}`;

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: JUDGE_MODEL,
      messages: [{ role: "user", content: prompt }],
      temperature: 0,
      response_format: { type: "json_object" },
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OpenAI judge error ${res.status}: ${text}`);
  }

  const json = (await res.json()) as {
    choices: { message: { content: string } }[];
  };
  const content = json.choices[0]?.message?.content ?? "{}";
  const scores = JSON.parse(content) as JudgeScores;

  return {
    contextPrecision: Math.max(1, Math.min(5, scores.contextPrecision ?? 1)),
    faithfulness: Math.max(1, Math.min(5, scores.faithfulness ?? 1)),
  };
}

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------

function printReport(results: EvalResult[]): void {
  const divider = "═".repeat(72);
  const thinDivider = "─".repeat(72);

  console.log(`\n${divider}`);
  console.log("  RAG Evaluation Report");
  console.log(`${divider}\n`);

  for (const [i, r] of results.entries()) {
    console.log(`  ${i + 1}. ${r.question}`);
    console.log(`     Answer:  ${r.answer.slice(0, 120)}${r.answer.length > 120 ? "…" : ""}`);
    console.log(`     Sources: ${r.citations.map((c) => c.fileName).join(", ") || "(none)"}`);
    console.log(`     Context Precision: ${r.contextPrecision}/5`);
    console.log(`     Faithfulness:      ${r.faithfulness}/5`);
    console.log(`  ${thinDivider}`);
  }

  const avgCP =
    results.reduce((s, r) => s + r.contextPrecision, 0) / results.length;
  const avgF =
    results.reduce((s, r) => s + r.faithfulness, 0) / results.length;

  console.log(`\n  AVERAGES (${results.length} questions)`);
  console.log(`    Context Precision : ${avgCP.toFixed(2)} / 5`);
  console.log(`    Faithfulness      : ${avgF.toFixed(2)} / 5`);
  console.log(`\n${divider}\n`);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  // Validate required config
  if (!OPENAI_API_KEY) {
    console.error("Error: OPENAI_API_KEY environment variable is required.");
    process.exit(1);
  }
  if (!FOLDER_ID) {
    console.error("Error: FOLDER_ID environment variable is required.");
    console.error("  Set it to the Google Drive folder ID you ingested.");
    process.exit(1);
  }

  console.log(`Loading dataset from: ${DATASET_PATH}`);
  console.log(`API base URL: ${API_BASE_URL}`);
  console.log(`Folder ID: ${FOLDER_ID}`);
  console.log(`Judge model: ${JUDGE_MODEL}\n`);

  const dataset = loadDataset(DATASET_PATH);
  console.log(`Loaded ${dataset.length} evaluation entries.\n`);

  const results: EvalResult[] = [];

  for (const [i, entry] of dataset.entries()) {
    console.log(`[${i + 1}/${dataset.length}] Evaluating: "${entry.question}"`);

    try {
      const ragResponse = await queryRag(entry.question);
      console.log(`  → Got answer (${ragResponse.answer.length} chars, ${ragResponse.citations.length} citations)`);

      const scores = await judge(entry, ragResponse);
      console.log(`  → Scores: CP=${scores.contextPrecision}, F=${scores.faithfulness}`);

      results.push({
        question: entry.question,
        answer: ragResponse.answer,
        citations: ragResponse.citations,
        contextPrecision: scores.contextPrecision,
        faithfulness: scores.faithfulness,
      });
    } catch (err) {
      console.error(`  ✗ Error: ${err instanceof Error ? err.message : String(err)}`);
      results.push({
        question: entry.question,
        answer: "(error)",
        citations: [],
        contextPrecision: 1,
        faithfulness: 1,
      });
    }
  }

  printReport(results);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});

