import { z } from "zod";

// ---------------------------------------------------------------------------
// Eval test case – defines a single test to run against the chat system
// ---------------------------------------------------------------------------

export const EvalTestCaseSchema = z.object({
  /** Unique test ID */
  id: z.string(),
  /** Human-readable test name */
  name: z.string(),
  /** Category: "rag", "file_action", "intent_detection", "edge_case" */
  category: z.enum(["rag", "file_action", "intent_detection", "edge_case"]),
  /** The user message to send */
  message: z.string(),
  /** What the test checks */
  description: z.string(),
  /** Ideal answer for LLM judge comparison (optional — judge is skipped if absent) */
  idealAnswer: z.string().optional(),
  /** Expected behaviour assertions */
  assertions: z.object({
    /** Should the response contain file actions? */
    expectsFileAction: z.boolean().optional(),
    /** Expected action type(s) if file action */
    expectedActionTypes: z.array(z.string()).optional(),
    /** Keywords that SHOULD appear in the answer */
    expectedKeywords: z.array(z.string()).optional(),
    /** Keywords that should NOT appear (hallucination check) */
    forbiddenKeywords: z.array(z.string()).optional(),
    /** Should citations be present? */
    expectsCitations: z.boolean().optional(),
    /** Expected source file names in citations */
    expectedSourceFiles: z.array(z.string()).optional(),
    /** Minimum number of citations expected */
    minCitations: z.number().optional(),
    /** Should the response indicate "no information found"? */
    expectsNoContext: z.boolean().optional(),
  }),
});

export type EvalTestCase = z.infer<typeof EvalTestCaseSchema>;

// ---------------------------------------------------------------------------
// Eval result – the outcome of running a single test case
// ---------------------------------------------------------------------------

export const EvalAssertionResultSchema = z.object({
  /** Name of the assertion check */
  name: z.string(),
  /** Did it pass? */
  passed: z.boolean(),
  /** Human-readable detail */
  detail: z.string(),
});

export type EvalAssertionResult = z.infer<typeof EvalAssertionResultSchema>;

export const EvalTestResultSchema = z.object({
  /** The test case that was run */
  testId: z.string(),
  testName: z.string(),
  category: z.string(),
  /** Overall pass/fail */
  passed: z.boolean(),
  /** The answer returned by the system */
  answer: z.string(),
  /** Citations returned */
  citationCount: z.number(),
  citationFiles: z.array(z.string()),
  /** File actions returned */
  fileActions: z.array(z.object({
    action: z.string(),
    fileName: z.string(),
    success: z.boolean(),
  })).optional(),
  /** Individual assertion results */
  assertions: z.array(EvalAssertionResultSchema),
  /** LLM judge scores (present when idealAnswer is provided) */
  judgeScores: z.object({
    correctness: z.number().min(1).max(5),
    faithfulness: z.number().min(1).max(5),
    completeness: z.number().min(1).max(5),
    reason: z.string(),
  }).optional(),
  /** How long the request took (ms) */
  durationMs: z.number(),
  /** Error message if the test errored */
  error: z.string().optional(),
});

export type EvalTestResult = z.infer<typeof EvalTestResultSchema>;



