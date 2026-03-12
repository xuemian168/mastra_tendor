import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { complianceAgent } from "../agents/compliance.agent.js";
import { complianceOutputSchema } from "../schemas/compliance.schema.js";
import { buildTenderPrompt, buildRagPrompt } from "../utils/prompt.js";
import { tokenTracker } from "../utils/token-tracker.js";
import { vectorStore } from "../rag/in-memory-vector-store.js";
import { retrieveForAgent, COMPLIANCE_RETRIEVAL_CONFIG } from "../rag/retriever.js";
import { embedQuery } from "../rag/embedder.js";
import { documentCache } from "../rag/document-cache.js";

export const analyzeComplianceTool = createTool({
  id: "analyze-compliance",
  description:
    "Analyze a document for compliance requirements: technical specs, deadlines, " +
    "mandatory requirements, and qualifications. Requires a prior ingest-document call.",
  inputSchema: z.object({
    indexName: z.string().describe("The indexName returned by ingest-document"),
    documentTitle: z.string().optional(),
    fullText: z.string().optional().describe("DEPRECATED: Do not pass. The system retrieves document text automatically by indexName."),
  }),
  execute: async (inputData, context) => {
    const emit = async (stage: string) => {
      await context?.writer?.custom({
        type: "data-tool-stage" as const,
        data: { toolName: "analyze-compliance", stage },
      });
    };

    tokenTracker.startStep("compliance-tool");
    try {
      let prompt: string;

      const cached = documentCache.get(inputData.indexName);
      const fullText = inputData.fullText ?? cached?.fullText;
      const docTitle = inputData.documentTitle ?? cached?.documentTitle;

      if (fullText) {
        await emit("Using cached full text");
        prompt = buildTenderPrompt(
          "Analyze the following document for compliance requirements.",
          fullText,
          docTitle,
        );
      } else {
        await emit(`Retrieved relevant chunks from "${inputData.indexName}"`);
        const chunks = await retrieveForAgent(
          vectorStore,
          inputData.indexName,
          COMPLIANCE_RETRIEVAL_CONFIG,
          embedQuery,
        );
        prompt = buildRagPrompt(
          "Analyze the following document for compliance requirements.",
          chunks,
          docTitle,
        );
      }

      await emit("Analyzing compliance requirements");
      const result = await complianceAgent.generate(prompt, {
        structuredOutput: { schema: complianceOutputSchema },
      });

      if (result.usage) {
        tokenTracker.record("compliance-tool", result.usage.inputTokens ?? 0, result.usage.outputTokens ?? 0);
      }

      const output = result.object as Record<string, unknown>;
      await emit("Generated structured compliance report");
      tokenTracker.completeStep("compliance-tool");

      return output;
    } catch (error) {
      tokenTracker.completeStep("compliance-tool");
      return {
        error: true,
        message: `Tool execution failed: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  },
});
