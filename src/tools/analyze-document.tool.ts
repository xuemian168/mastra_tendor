import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { generalAnalystAgent } from "../agents/general-analyst.agent.js";
import { generalAnalysisOutputSchema } from "../schemas/general-analysis.schema.js";
import { buildTenderPrompt, buildRagPrompt } from "../utils/prompt.js";
import { tokenTracker } from "../utils/token-tracker.js";
import { vectorStore } from "../rag/in-memory-vector-store.js";
import { retrieveForAgent } from "../rag/retriever.js";
import { embedQuery } from "../rag/embedder.js";

export const analyzeDocumentTool = createTool({
  id: "analyze-document",
  description:
    "Perform a general-purpose analysis on any document based on the user's analysis goal. " +
    "Requires a prior ingest-document call.",
  inputSchema: z.object({
    indexName: z.string().describe("The indexName returned by ingest-document"),
    analysisGoal: z.string().describe("What the user wants to analyze (e.g. 'key clauses', 'obligations', 'financial terms')"),
    documentTitle: z.string().optional(),
    fullText: z.string().optional().describe("Full text if document was below RAG threshold"),
  }),
  execute: async (inputData) => {
    const task = `Analyze the following document. Analysis goal: ${inputData.analysisGoal}`;
    let prompt: string;

    if (inputData.fullText) {
      prompt = buildTenderPrompt(task, inputData.fullText, inputData.documentTitle);
    } else {
      const chunks = await retrieveForAgent(
        vectorStore,
        inputData.indexName,
        { queries: [inputData.analysisGoal], topK: 8 },
        embedQuery,
      );
      prompt = buildRagPrompt(task, chunks, inputData.documentTitle);
    }

    const result = await generalAnalystAgent.generate(prompt, {
      structuredOutput: { schema: generalAnalysisOutputSchema },
    });

    if (result.usage) {
      tokenTracker.record("analyze-document-tool", result.usage.promptTokens, result.usage.completionTokens);
    }

    return result.object;
  },
});
