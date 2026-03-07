import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { generalAnalystAgent } from "../agents/general-analyst.agent.js";
import { summaryOutputSchema } from "../schemas/summary.schema.js";
import { buildTenderPrompt, buildRagPrompt } from "../utils/prompt.js";
import { tokenTracker } from "../utils/token-tracker.js";
import { vectorStore } from "../rag/in-memory-vector-store.js";
import { retrieveForAgent } from "../rag/retriever.js";
import { embedQuery } from "../rag/embedder.js";
import { documentCache } from "../rag/document-cache.js";

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
  execute: async (inputData) => {
    try {
      const task = "Summarize the following document. Provide a clear title, overview, key points, and section-by-section breakdown.";
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
          { queries: ["document overview and key points"], topK: 10 },
          embedQuery,
        );
        prompt = buildRagPrompt(task, chunks, docTitle);
      }

      const result = await generalAnalystAgent.generate(prompt, {
        structuredOutput: { schema: summaryOutputSchema },
      });

      if (result.usage) {
        tokenTracker.record("summarize-document-tool", result.usage.promptTokens, result.usage.completionTokens);
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
