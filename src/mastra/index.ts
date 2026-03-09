import { Mastra } from "@mastra/core";
import { chatRoute } from "@mastra/ai-sdk";
import { complianceAgent, riskAgent, strategyAgent, orchestratorAgent, generalAnalystAgent } from "../agents/index.js";
import { tenderAnalysisWorkflow } from "../workflows/index.js";
import { vectorStore } from "../rag/in-memory-vector-store.js";

export const mastra = new Mastra({
  agents: { complianceAgent, riskAgent, strategyAgent, orchestratorAgent, generalAnalystAgent },
  workflows: { tenderAnalysisWorkflow },
  vectors: { default: vectorStore },
  server: {
    cors: {
      origin: [process.env.FRONTEND_URL || "http://localhost:3000"],
      credentials: true,
    },
    apiRoutes: [chatRoute({ path: "/chat/:agentId" })],
  },
});
