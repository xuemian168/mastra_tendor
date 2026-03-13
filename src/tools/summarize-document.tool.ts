import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { generalAnalystAgent } from "../agents/general-analyst.agent.js";
import { summaryOutputSchema } from "../schemas/summary.schema.js";
import {
  createEmit,
  withTokenTracking,
  recordUsage,
  resolveDocumentPrompt,
} from "./tool-helpers.js";

export const summarizeDocumentTool = createTool({
  id: "summarize-document",
  description:
    "Generate a structured summary of any document: title, overview, key points, and section breakdown. " +
    "Requires a prior ingest-document call.",
  inputSchema: z.object({
    indexName: z.string().describe("The indexName returned by ingest-document"),
    documentTitle: z.string().optional(),
    fullText: z.string().optional().describe("DEPRECATED: Do not pass. The system retrieves document text automatically by indexName."),
  }),
  execute: async (inputData, context) => {
    const emit = createEmit(context, "summarize-document");

    return withTokenTracking("summarize-document-tool", async () => {
      const task = "Summarize the following document. Provide a clear title, overview, key points, and section-by-section breakdown.";
      const prompt = await resolveDocumentPrompt(
        task,
        inputData.indexName,
        { queries: ["document overview and key points"], topK: 10 },
        inputData,
      );

      await emit("Generating structured summary");
      const result = await generalAnalystAgent.generate(prompt, {
        structuredOutput: { schema: summaryOutputSchema },
      });
      recordUsage("summarize-document-tool", result.usage);

      await emit("Summary complete");
      return result.object;
    });
  },
});
