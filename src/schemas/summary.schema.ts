import { z } from "zod";

export const summaryOutputSchema = z.object({
  title: z.string(),
  overview: z.string(),
  keyPoints: z.array(z.string()),
  sections: z.array(
    z.object({
      heading: z.string(),
      content: z.string(),
    }),
  ),
});

export type SummaryOutput = z.infer<typeof summaryOutputSchema>;
