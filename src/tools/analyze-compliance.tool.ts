import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { complianceAgent } from "../agents/compliance.agent.js";
import { complianceOutputSchema } from "../schemas/compliance.schema.js";
import { COMPLIANCE_RETRIEVAL_CONFIG } from "../rag/retriever.js";
import {
  createEmit,
  withTokenTracking,
  recordUsage,
  resolveDocumentPrompt,
} from "./tool-helpers.js";

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
    const emit = createEmit(context, "analyze-compliance");

    return withTokenTracking("compliance-tool", async () => {
      const prompt = await resolveDocumentPrompt(
        "Analyze the following document for compliance requirements.",
        inputData.indexName,
        COMPLIANCE_RETRIEVAL_CONFIG,
        inputData,
      );

      await emit("Analyzing compliance requirements");
      const result = await complianceAgent.generate(prompt, {
        structuredOutput: { schema: complianceOutputSchema },
      });
      recordUsage("compliance-tool", result.usage);

      await emit("Generated structured compliance report");
      return result.object as Record<string, unknown>;
    });
  },
});
