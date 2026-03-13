import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { riskAgent } from "../agents/risk.agent.js";
import { riskOutputSchema } from "../schemas/risk.schema.js";
import { RISK_RETRIEVAL_CONFIG } from "../rag/retriever.js";
import {
  createEmit,
  withTokenTracking,
  recordUsage,
  resolveDocumentPrompt,
} from "./tool-helpers.js";

export const assessRiskTool = createTool({
  id: "assess-risk",
  description:
    "Assess risks in a document: overall risk level, technical complexity, " +
    "resource requirements, timeline feasibility, penalty clauses, and delivery risks. " +
    "Requires a prior ingest-document call.",
  inputSchema: z.object({
    indexName: z.string().describe("The indexName returned by ingest-document"),
    documentTitle: z.string().optional(),
    fullText: z.string().optional().describe("DEPRECATED: Do not pass. The system retrieves document text automatically by indexName."),
  }),
  execute: async (inputData, context) => {
    const emit = createEmit(context, "assess-risk");

    return withTokenTracking("risk-tool", async () => {
      const prompt = await resolveDocumentPrompt(
        "Analyze the following document for risks.",
        inputData.indexName,
        RISK_RETRIEVAL_CONFIG,
        inputData,
      );

      await emit("Evaluating risk factors");
      const result = await riskAgent.generate(prompt, {
        structuredOutput: { schema: riskOutputSchema },
      });
      recordUsage("risk-tool", result.usage);

      await emit("Generated structured risk report");
      return result.object as Record<string, unknown>;
    });
  },
});
