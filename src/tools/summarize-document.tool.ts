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
  execute: async (inputData, context) => {
    const emit = async (stage: string) => {
      await context?.writer?.custom({
        type: "data-tool-stage" as const,
        data: { toolName: "summarize-document", stage },
      });
    };

    tokenTracker.startStep("summarize-document-tool");
    try {
      const task = "Summarize the following document. Provide a clear title, overview, key points, and section-by-section breakdown.";
      let prompt: string;

      const cached = documentCache.get(inputData.indexName);
      const fullText = inputData.fullText ?? cached?.fullText;
      const docTitle = inputData.documentTitle ?? cached?.documentTitle;

      if (fullText) {
        await emit("Using cached full text");
        prompt = buildTenderPrompt(task, fullText, docTitle);
      } else {
        await emit("Retrieved relevant chunks");
        const chunks = await retrieveForAgent(
          vectorStore,
          inputData.indexName,
          { queries: ["document overview and key points"], topK: 10 },
          embedQuery,
        );
        prompt = buildRagPrompt(task, chunks, docTitle);
      }

      await emit("Generating structured summary");
      const result = await generalAnalystAgent.generate(prompt, {
        structuredOutput: { schema: summaryOutputSchema },
      });

      if (result.usage) {
        tokenTracker.record("summarize-document-tool", result.usage.inputTokens ?? 0, result.usage.outputTokens ?? 0);
      }

      await emit("Summary complete");
      tokenTracker.completeStep("summarize-document-tool");
      return result.object;
    } catch (error) {
      tokenTracker.completeStep("summarize-document-tool");
      return {
        error: true,
        message: `Tool execution failed: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  },
});
