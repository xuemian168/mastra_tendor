import { z } from "zod";

export const evalCaseSchema = z.object({
  id: z.string(),
  category: z.enum(["tender-bid-nobid", "general-analysis", "document-summary"]),
  input: z.object({
    documentText: z.string(),
    documentTitle: z.string().optional(),
    analysisGoal: z.string(),
    companyProfile: z.string().optional(),
  }),
  expected: z.object({
    // tender-bid-nobid
    decision: z.enum(["bid", "no_bid", "conditional_bid"]).optional(),
    confidenceRange: z.object({ min: z.number(), max: z.number() }).optional(),
    mustMentionStrengths: z.array(z.string()).optional(),
    mustMentionWeaknesses: z.array(z.string()).optional(),
    expectedRiskLevel: z.enum(["low", "medium", "high", "critical"]).optional(),
    expectedDeadlineCount: z.object({ min: z.number() }).optional(),
    expectedMandatoryRequirements: z.array(z.string()).optional(),
    // general-analysis / summary
    mustCoverTopics: z.array(z.string()).optional(),
    minKeyFindings: z.number().optional(),
    minKeyPoints: z.number().optional(),
  }),
  tags: z.array(z.string()).optional(),
});

export const evalDatasetSchema = z.object({
  version: z.string(),
  createdAt: z.string(),
  description: z.string(),
  cases: z.array(evalCaseSchema),
});

export type EvalCase = z.infer<typeof evalCaseSchema>;
export type EvalDataset = z.infer<typeof evalDatasetSchema>;
