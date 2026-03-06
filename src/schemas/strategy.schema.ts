import { z } from "zod";

export const strategyOutputSchema = z.object({
  decision: z.enum(["bid", "no_bid", "conditional_bid"]),
  confidenceScore: z.number().min(0).max(100),
  rationale: z.string(),
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
  keyConditions: z.array(z.string()),
  recommendedActions: z.array(z.string()),
  executiveSummary: z.string(),
});

export type StrategyOutput = z.infer<typeof strategyOutputSchema>;
