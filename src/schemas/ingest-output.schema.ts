import { z } from "zod";

export const ingestOutputSchema = z.object({
  tenderId: z.string(),
  chunkCount: z.number(),
  indexName: z.string(),
  tenderTitle: z.string().optional(),
  fullText: z.string().optional(),
});

export type IngestOutput = z.infer<typeof ingestOutputSchema>;
