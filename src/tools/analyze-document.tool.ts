import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { generalAnalystAgent } from "../agents/general-analyst.agent.js";
import { generalAnalysisOutputSchema } from "../schemas/general-analysis.schema.js";
import {
  createEmit,
  withTokenTracking,
  recordUsage,
  resolveDocumentPrompt,
} from "./tool-helpers.js";

export const analyzeDocumentTool = createTool({
  id: "analyze-document",
  description:
    "Perform a general-purpose analysis on any document based on the user's analysis goal. " +
    "Requires a prior ingest-document call.",
  inputSchema: z.object({
    indexName: z.string().describe("The indexName returned by ingest-document"),
    analysisGoal: z.string().describe("What the user wants to analyze (e.g. 'key clauses', 'obligations', 'financial terms')"),
    documentTitle: z.string().optional(),
    fullText: z.string().optional().describe("DEPRECATED: Do not pass. The system retrieves document text automatically by indexName."),
  }),
  execute: async (inputData, context) => {
    const emit = createEmit(context, "analyze-document");

    return withTokenTracking("analyze-document-tool", async () => {
      const task = `Analyze the following document. Analysis goal: ${inputData.analysisGoal}`;
      const prompt = await resolveDocumentPrompt(
        task,
        inputData.indexName,
        { queries: [inputData.analysisGoal], topK: 8 },
        inputData,
      );

      await emit(`Analyzing document: ${inputData.analysisGoal}`);
      const result = await generalAnalystAgent.generate(prompt, {
        structuredOutput: { schema: generalAnalysisOutputSchema },
      });
      recordUsage("analyze-document-tool", result.usage);

      await emit("Generated analysis report");
      return result.object;
    });
  },
});
