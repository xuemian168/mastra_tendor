import { createStep } from "@mastra/core/workflows";
import { tenderInputSchema } from "../../schemas/tender-input.schema.js";
import { ingestOutputSchema } from "../../schemas/ingest-output.schema.js";
import { chunkTenderDocument } from "../../rag/chunker.js";
import { embedTexts } from "../../rag/embedder.js";
import { vectorStore } from "../../rag/in-memory-vector-store.js";
import { tokenTracker } from "../../utils/token-tracker.js";

const DIMENSION = 3072;
const RAG_THRESHOLD = 40000; // ~10 pages, below this full-text is cheaper than RAG

export const ingestStep = createStep({
  id: "ingest-step",
  inputSchema: tenderInputSchema,
  outputSchema: ingestOutputSchema,
  execute: async ({ inputData }) => {
    tokenTracker.startStep("ingest-step");
    const tenderId = `tender-${Date.now()}`;
    const indexName = `index-${tenderId}`;

    if (inputData.tenderText.length < RAG_THRESHOLD) {
      tokenTracker.completeStep("ingest-step");
      return {
        tenderId,
        chunkCount: 0,
        indexName,
        tenderTitle: inputData.tenderTitle,
        fullText: inputData.tenderText,
      };
    }

    const chunks = chunkTenderDocument(inputData.tenderText, tenderId);

    const vectors = await embedTexts(chunks.map((c) => c.content));

    await vectorStore.createIndex({ indexName, dimension: DIMENSION });
    await vectorStore.upsert({
      indexName,
      vectors,
      metadata: chunks.map((c) => ({
        ...c.metadata,
        content: c.content,
      })),
      ids: chunks.map((c) => c.id),
    });

    const estimatedTokens = Math.ceil(inputData.tenderText.length / 4);
    tokenTracker.record("ingest-step-embedding", estimatedTokens, 0);

    tokenTracker.completeStep("ingest-step");
    return {
      tenderId,
      chunkCount: chunks.length,
      indexName,
      tenderTitle: inputData.tenderTitle,
    };
  },
});
