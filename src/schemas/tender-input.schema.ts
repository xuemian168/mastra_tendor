import { z } from "zod";

export const tenderInputSchema = z.object({
  tenderText: z.string().min(1, "Tender text is required"),
  tenderTitle: z.string().optional(),
  companyProfile: z.string().optional(),
});

export type TenderInput = z.infer<typeof tenderInputSchema>;
