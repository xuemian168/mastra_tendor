import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { riskAgent } from "../agents/risk.agent.js";
import { riskOutputSchema } from "../schemas/risk.schema.js";
import { buildTenderPrompt, buildRagPrompt } from "../utils/prompt.js";
import { tokenTracker } from "../utils/token-tracker.js";
import { vectorStore } from "../rag/in-memory-vector-store.js";
import { retrieveForAgent, RISK_RETRIEVAL_CONFIG } from "../rag/retriever.js";
import { embedQuery } from "../rag/embedder.js";

export const assessRiskTool = createTool({
  id: "assess-risk",
  description:
    "Assess risks in a document: overall risk level, technical complexity, " +
    "resource requirements, timeline feasibility, penalty clauses, and delivery risks. " +
    "Requires a prior ingest-document call.",
  inputSchema: z.object({
    indexName: z.string().describe("The indexName returned by ingest-document"),
    documentTitle: z.string().optional(),
    fullText: z.string().optional().describe("Full text if document was below RAG threshold"),
  }),
  execute: async (inputData) => {
    let prompt: string;

    if (inputData.fullText) {
      prompt = buildTenderPrompt(
        "Analyze the following document for risks.",
        inputData.fullText,
        inputData.documentTitle,
      );
    } else {
      const chunks = await retrieveForAgent(
        vectorStore,
        inputData.indexName,
        RISK_RETRIEVAL_CONFIG,
        embedQuery,
      );
      prompt = buildRagPrompt(
        "Analyze the following document for risks.",
        chunks,
        inputData.documentTitle,
      );
    }

    const result = await riskAgent.generate(prompt, {
      structuredOutput: { schema: riskOutputSchema },
    });

    if (result.usage) {
      tokenTracker.record("risk-tool", result.usage.promptTokens, result.usage.completionTokens);
    }

    return result.object;
  },
});
