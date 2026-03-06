import { z } from "zod";

export const complianceOutputSchema = z.object({
  technicalSpecs: z.array(z.string()),
  deadlines: z.array(z.string()),
  mandatoryRequirements: z.array(z.string()),
  qualifications: z.array(z.string()),
  summary: z.string(),
});

export type ComplianceOutput = z.infer<typeof complianceOutputSchema>;
