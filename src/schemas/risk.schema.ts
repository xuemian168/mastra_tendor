import { z } from "zod";

export const difficultyAssessmentSchema = z.object({
  technicalComplexity: z.enum(["low", "medium", "high"]),
  resourceRequirements: z.enum(["low", "medium", "high"]),
  timelineFeasibility: z.enum(["feasible", "tight", "unfeasible"]),
});

export const riskOutputSchema = z.object({
  overallRiskLevel: z.enum(["low", "medium", "high", "critical"]),
  difficultyAssessment: difficultyAssessmentSchema,
  penaltyClauses: z.array(z.string()),
  deliveryRisks: z.array(z.string()),
  summary: z.string(),
});

export type RiskOutput = z.infer<typeof riskOutputSchema>;
