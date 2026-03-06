import { createWorkflow } from "@mastra/core/workflows";
import { tenderInputSchema, strategyOutputSchema } from "../schemas/index.js";
import { ingestStep } from "./steps/ingest.step.js";
import { complianceStep } from "./steps/compliance.step.js";
import { riskStep } from "./steps/risk.step.js";
import { strategyStep } from "./steps/strategy.step.js";

export const tenderAnalysisWorkflow = createWorkflow({
  id: "tender-analysis",
  inputSchema: tenderInputSchema,
  outputSchema: strategyOutputSchema,
})
  .then(ingestStep)
  .parallel([complianceStep, riskStep])
  .then(strategyStep)
  .commit();
