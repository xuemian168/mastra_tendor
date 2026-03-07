import { z } from "zod";

export const generalAnalysisOutputSchema = z.object({
  analysisType: z.string(),
  keyFindings: z.array(
    z.object({
      category: z.string(),
      finding: z.string(),
      importance: z.enum(["low", "medium", "high", "critical"]),
    }),
  ),
  summary: z.string(),
  recommendations: z.array(z.string()),
});

export type GeneralAnalysisOutput = z.infer<typeof generalAnalysisOutputSchema>;
