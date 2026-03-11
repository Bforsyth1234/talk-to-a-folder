import { Injectable, Logger } from "@nestjs/common";
import { ChatService } from "../chat/chat.service";
import type {
  EvalTestCase,
  EvalTestResult,
  EvalAssertionResult,
  EvalRun,
  ChatStreamEvent,
  FileActionResult,
  Citation,
} from "@talk-to-a-folder/shared";
import { EVAL_TESTS } from "./eval-tests";
import OpenAI from "openai";

const JUDGE_MODEL = "gpt-4o";

interface JudgeScores {
  correctness: number;
  faithfulness: number;
  completeness: number;
  reason: string;
}

@Injectable()
export class EvalService {
  private readonly logger = new Logger(EvalService.name);
  private readonly openai: OpenAI;

  constructor(private readonly chatService: ChatService) {
    this.openai = new OpenAI({
      apiKey: process.env["OPENAI_API_KEY"] ?? "",
    });
  }

  /** Get all built-in test cases. */
  getTests(): EvalTestCase[] {
    return EVAL_TESTS;
  }

  /** Stream test results one at a time as an async generator. */
  async *streamResults(
    folderId: string,
    accessToken: string,
    allFileNames: string[],
    userEmail: string,
    testIds?: string[],
  ): AsyncGenerator<EvalTestResult> {
    const tests = testIds
      ? EVAL_TESTS.filter((t) => testIds.includes(t.id))
      : EVAL_TESTS;

    for (const test of tests) {
      this.logger.log(`Running eval: ${test.id} – "${test.name}"`);
      const result = await this.runSingle(test, folderId, accessToken, allFileNames, userEmail);
      yield result;
    }
  }

  /** Run a single test case. */
  private async runSingle(
    test: EvalTestCase,
    folderId: string,
    accessToken: string,
    allFileNames: string[],
    userEmail: string,
  ): Promise<EvalTestResult> {
    const start = Date.now();
    try {
      const { answer, citations, fileActions } = await this.collectStreamResponse(
        test.message, folderId, accessToken, allFileNames, userEmail,
      );
      const durationMs = Date.now() - start;

      const assertionResults = this.checkAssertions(test, answer, citations, fileActions);
      const passed = assertionResults.every((a) => a.passed);

      // Run LLM judge if test has an idealAnswer
      let judgeScores: JudgeScores | undefined;
      if (test.idealAnswer) {
        try {
          judgeScores = await this.runJudge(test, answer, citations);
        } catch (err) {
          this.logger.warn(`LLM judge failed for ${test.id}: ${err instanceof Error ? err.message : String(err)}`);
        }
      }

      return {
        testId: test.id,
        testName: test.name,
        category: test.category,
        passed,
        answer,
        citationCount: citations.length,
        citationFiles: citations.map((c) => c.fileName),
        fileActions: fileActions.map((fa) => ({
          action: fa.action,
          fileName: fa.fileName,
          success: fa.success,
        })),
        assertions: assertionResults,
        judgeScores,
        durationMs,
      };
    } catch (err) {
      return {
        testId: test.id,
        testName: test.name,
        category: test.category,
        passed: false,
        answer: "",
        citationCount: 0,
        citationFiles: [],
        assertions: [{
          name: "no_error",
          passed: false,
          detail: `Error: ${err instanceof Error ? err.message : String(err)}`,
        }],
        durationMs: Date.now() - start,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }

  /** Use GPT-4o as an LLM judge to score correctness, faithfulness, and completeness. */
  private async runJudge(
    test: EvalTestCase,
    answer: string,
    citations: Citation[],
  ): Promise<JudgeScores> {
    const citationText = citations
      .map((c) => `- ${c.fileName}: ${c.snippet ?? "(no snippet)"}`)
      .join("\n");

    const prompt = `You are an evaluation judge for a RAG (Retrieval-Augmented Generation) system. Score the following response on three dimensions using a 1–5 scale.

QUESTION: ${test.message}

IDEAL ANSWER: ${test.idealAnswer}

ACTUAL ANSWER: ${answer}

RETRIEVED CITATIONS:
${citationText || "(none)"}

Score these three dimensions (1 = worst, 5 = best):

1. **Correctness**: How accurate is the actual answer compared to the ideal answer?
   - 5: Fully correct, all key facts match the ideal answer
   - 3: Partially correct, some facts are right but others are wrong or missing
   - 1: Completely incorrect or irrelevant

2. **Faithfulness**: Is the actual answer grounded in the retrieved citations (no hallucination)?
   - 5: Every claim in the answer is supported by the citations
   - 3: Some claims are supported, others are not
   - 1: The answer contradicts or ignores the citations entirely

3. **Completeness**: Does the actual answer cover all the key points from the ideal answer?
   - 5: All key points are addressed
   - 3: Some key points are covered but others are missing
   - 1: Almost nothing from the ideal answer is addressed

Respond with ONLY a JSON object: {"correctness": <1-5>, "faithfulness": <1-5>, "completeness": <1-5>, "reason": "<brief explanation of scores>"}`;

    const res = await this.openai.chat.completions.create({
      model: JUDGE_MODEL,
      messages: [{ role: "user", content: prompt }],
      temperature: 0,
      response_format: { type: "json_object" },
    });

    const content = res.choices[0]?.message?.content ?? "{}";
    const scores = JSON.parse(content) as JudgeScores;

    return {
      correctness: Math.max(1, Math.min(5, scores.correctness ?? 1)),
      faithfulness: Math.max(1, Math.min(5, scores.faithfulness ?? 1)),
      completeness: Math.max(1, Math.min(5, scores.completeness ?? 1)),
      reason: scores.reason ?? "",
    };
  }

  /** Consume the streaming chat response into a single collected result. */
  private async collectStreamResponse(
    message: string,
    folderId: string,
    accessToken: string,
    allFileNames: string[],
    userEmail: string,
  ): Promise<{ answer: string; citations: Citation[]; fileActions: FileActionResult[] }> {
    let answer = "";
    let citations: Citation[] = [];
    const fileActions: FileActionResult[] = [];

    const stream = this.chatService.streamChat(
      message, folderId, accessToken, undefined, allFileNames, userEmail,
    );

    for await (const event of stream) {
      switch (event.type) {
        case "token": answer += event.token; break;
        case "citations": citations = event.citations; break;
        case "file_action": fileActions.push(event.fileAction); break;
        case "done":
          answer = event.answer;
          citations = event.citations;
          break;
        case "error": throw new Error(event.error);
      }
    }

    return { answer, citations, fileActions };
  }

  /** Evaluate all assertions for a test case against the actual response. */
  private checkAssertions(
    test: EvalTestCase,
    answer: string,
    citations: Citation[],
    fileActions: FileActionResult[],
  ): EvalAssertionResult[] {
    const results: EvalAssertionResult[] = [];
    const a = test.assertions;
    const lowerAnswer = answer.toLowerCase();

    // File action expectation
    if (a.expectsFileAction === true) {
      results.push({
        name: "expects_file_action",
        passed: fileActions.length > 0,
        detail: fileActions.length > 0
          ? `Got ${fileActions.length} file action(s)`
          : "Expected file actions but got none",
      });
    }
    if (a.expectsFileAction === false) {
      results.push({
        name: "no_file_action",
        passed: fileActions.length === 0,
        detail: fileActions.length === 0
          ? "Correctly did not trigger file actions"
          : `Unexpected file actions: ${fileActions.map((f) => f.action).join(", ")}`,
      });
    }

    // Expected action types
    if (a.expectedActionTypes && a.expectedActionTypes.length > 0) {
      const actualTypes = fileActions.map((f) => f.action);
      for (const expected of a.expectedActionTypes) {
        const found = actualTypes.includes(expected);
        results.push({
          name: `action_type_${expected}`,
          passed: found,
          detail: found
            ? `Found expected action type: ${expected}`
            : `Missing expected action type: ${expected}. Got: ${actualTypes.join(", ") || "(none)"}`,
        });
      }
    }

    // Expected keywords in answer
    if (a.expectedKeywords) {
      for (const kw of a.expectedKeywords) {
        const found = lowerAnswer.includes(kw.toLowerCase());
        results.push({
          name: `keyword_${kw}`,
          passed: found,
          detail: found ? `Found keyword: "${kw}"` : `Missing keyword: "${kw}"`,
        });
      }
    }

    // Forbidden keywords (hallucination check)
    if (a.forbiddenKeywords) {
      for (const kw of a.forbiddenKeywords) {
        const found = lowerAnswer.includes(kw.toLowerCase());
        results.push({
          name: `no_forbidden_${kw}`,
          passed: !found,
          detail: found ? `Found forbidden keyword: "${kw}"` : `Correctly absent: "${kw}"`,
        });
      }
    }

    // Citations presence
    if (a.expectsCitations === true) {
      results.push({
        name: "expects_citations",
        passed: citations.length > 0,
        detail: citations.length > 0
          ? `Got ${citations.length} citation(s)`
          : "Expected citations but got none",
      });
    }

    // Minimum citations
    if (a.minCitations != null) {
      results.push({
        name: "min_citations",
        passed: citations.length >= a.minCitations,
        detail: `Got ${citations.length} citations (min: ${a.minCitations})`,
      });
    }

    // Expected source files
    if (a.expectedSourceFiles) {
      const citedFiles = citations.map((c) => c.fileName.toLowerCase());
      for (const file of a.expectedSourceFiles) {
        const found = citedFiles.some((cf) => cf.includes(file.toLowerCase()));
        results.push({
          name: `source_file_${file}`,
          passed: found,
          detail: found ? `Found source: "${file}"` : `Missing source: "${file}"`,
        });
      }
    }

    // No context expectation
    if (a.expectsNoContext === true) {
      const noCtx = lowerAnswer.includes("couldn't find") ||
        lowerAnswer.includes("no relevant") ||
        lowerAnswer.includes("not available");
      results.push({
        name: "expects_no_context",
        passed: noCtx,
        detail: noCtx ? "Correctly indicated no context" : "Expected no-context response",
      });
    }
    if (a.expectsNoContext === false) {
      const noCtx = lowerAnswer.includes("couldn't find any relevant");
      results.push({
        name: "has_context",
        passed: !noCtx,
        detail: noCtx ? "Got no-context response when context was expected" : "Response has content",
      });
    }

    return results;
  }
}

