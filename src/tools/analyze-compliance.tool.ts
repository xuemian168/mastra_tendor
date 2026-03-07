import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { complianceAgent } from "../agents/compliance.agent.js";
import { complianceOutputSchema } from "../schemas/compliance.schema.js";
import { buildTenderPrompt, buildRagPrompt } from "../utils/prompt.js";
import { tokenTracker } from "../utils/token-tracker.js";
import { vectorStore } from "../rag/in-memory-vector-store.js";
import { retrieveForAgent, COMPLIANCE_RETRIEVAL_CONFIG } from "../rag/retriever.js";
import { embedQuery } from "../rag/embedder.js";

export const analyzeComplianceTool = createTool({
  id: "analyze-compliance",
  description:
    "Analyze a document for compliance requirements: technical specs, deadlines, " +
    "mandatory requirements, and qualifications. Requires a prior ingest-document call.",
  inputSchema: z.object({
    indexName: z.string().describe("The indexName returned by ingest-document"),
    documentTitle: z.string().optional(),
    fullText: z.string().optional().describe("Full text if document was below RAG threshold"),
  }),
  execute: async (inputData) => {
    let prompt: string;

    if (inputData.fullText) {
      prompt = buildTenderPrompt(
        "Analyze the following document for compliance requirements.",
        inputData.fullText,
        inputData.documentTitle,
      );
    } else {
      const chunks = await retrieveForAgent(
        vectorStore,
        inputData.indexName,
        COMPLIANCE_RETRIEVAL_CONFIG,
        embedQuery,
      );
      prompt = buildRagPrompt(
        "Analyze the following document for compliance requirements.",
        chunks,
        inputData.documentTitle,
      );
    }

    const result = await complianceAgent.generate(prompt, {
      structuredOutput: { schema: complianceOutputSchema },
    });

    if (result.usage) {
      tokenTracker.record("compliance-tool", result.usage.promptTokens, result.usage.completionTokens);
    }

    return result.object;
  },
});
