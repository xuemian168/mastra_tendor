import { Mastra } from "@mastra/core";
import { complianceAgent, riskAgent, strategyAgent } from "../agents/index.js";
import { tenderAnalysisWorkflow } from "../workflows/index.js";

export const mastra = new Mastra({
  agents: { complianceAgent, riskAgent, strategyAgent },
  workflows: { tenderAnalysisWorkflow },
});
