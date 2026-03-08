import { z } from "zod";

export const evalCaseResultSchema = z.object({
  caseId: z.string(),
  category: z.string(),
  passed: z.boolean(),
  durationMs: z.number(),
  tokenUsage: z.object({
    prompt: z.number(),
    completion: z.number(),
  }),
  scores: z.record(z.number()),
  rawOutput: z.unknown(),
});

export const evalResultSchema = z.object({
  runId: z.string(),
  datasetVersion: z.string(),
  timestamp: z.string(),
  summary: z.object({
    totalCases: z.number(),
    passedCases: z.number(),
    averageScores: z.record(z.number()),
    totalTokens: z.number(),
    totalDurationMs: z.number(),
  }),
  cases: z.array(evalCaseResultSchema),
});

export type EvalCaseResult = z.infer<typeof evalCaseResultSchema>;
export type EvalResult = z.infer<typeof evalResultSchema>;
