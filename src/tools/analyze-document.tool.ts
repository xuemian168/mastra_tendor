import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { generalAnalystAgent } from "../agents/general-analyst.agent.js";
import { generalAnalysisOutputSchema } from "../schemas/general-analysis.schema.js";
import { buildTenderPrompt, buildRagPrompt } from "../utils/prompt.js";
import { tokenTracker } from "../utils/token-tracker.js";
import { vectorStore } from "../rag/in-memory-vector-store.js";
import { retrieveForAgent } from "../rag/retriever.js";
import { embedQuery } from "../rag/embedder.js";
import { documentCache } from "../rag/document-cache.js";

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
  execute: async (inputData) => {
    try {
      const task = `Analyze the following document. Analysis goal: ${inputData.analysisGoal}`;
      let prompt: string;

      const cached = documentCache.get(inputData.indexName);
      const fullText = inputData.fullText ?? cached?.fullText;
      const docTitle = inputData.documentTitle ?? cached?.documentTitle;

      if (fullText) {
        prompt = buildTenderPrompt(task, fullText, docTitle);
      } else {
        const chunks = await retrieveForAgent(
          vectorStore,
          inputData.indexName,
          { queries: [inputData.analysisGoal], topK: 8 },
          embedQuery,
        );
        prompt = buildRagPrompt(task, chunks, docTitle);
      }

      const result = await generalAnalystAgent.generate(prompt, {
        structuredOutput: { schema: generalAnalysisOutputSchema },
      });

      if (result.usage) {
        tokenTracker.record("analyze-document-tool", result.usage.promptTokens, result.usage.completionTokens);
      }

      return result.object;
    } catch (error) {
      return {
        error: true,
        message: `Tool execution failed: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  },
});
