import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { riskAgent } from "../agents/risk.agent.js";
import { riskOutputSchema } from "../schemas/risk.schema.js";
import { buildTenderPrompt, buildRagPrompt } from "../utils/prompt.js";
import { tokenTracker } from "../utils/token-tracker.js";
import { vectorStore } from "../rag/in-memory-vector-store.js";
import { retrieveForAgent, RISK_RETRIEVAL_CONFIG } from "../rag/retriever.js";
import { embedQuery } from "../rag/embedder.js";
import { documentCache } from "../rag/document-cache.js";

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
    const emit = async (stage: string) => {
      await context?.writer?.custom({
        type: "data-tool-stage" as const,
        data: { toolName: "assess-risk", stage },
      });
    };

    tokenTracker.startStep("risk-tool");
    try {
      let prompt: string;

      const cached = documentCache.get(inputData.indexName);
      const fullText = inputData.fullText ?? cached?.fullText;
      const docTitle = inputData.documentTitle ?? cached?.documentTitle;

      if (fullText) {
        await emit("Using cached full text");
        prompt = buildTenderPrompt(
          "Analyze the following document for risks.",
          fullText,
          docTitle,
        );
      } else {
        await emit(`Retrieved relevant chunks from "${inputData.indexName}"`);
        const chunks = await retrieveForAgent(
          vectorStore,
          inputData.indexName,
          RISK_RETRIEVAL_CONFIG,
          embedQuery,
        );
        prompt = buildRagPrompt(
          "Analyze the following document for risks.",
          chunks,
          docTitle,
        );
      }

      await emit("Evaluating risk factors");
      const result = await riskAgent.generate(prompt, {
        structuredOutput: { schema: riskOutputSchema },
      });

      if (result.usage) {
        tokenTracker.record("risk-tool", result.usage.inputTokens ?? 0, result.usage.outputTokens ?? 0);
      }

      const output = result.object as Record<string, unknown>;
      await emit("Generated structured risk report");
      tokenTracker.completeStep("risk-tool");

      return output;
    } catch (error) {
      tokenTracker.completeStep("risk-tool");
      return {
        error: true,
        message: `Tool execution failed: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  },
});
