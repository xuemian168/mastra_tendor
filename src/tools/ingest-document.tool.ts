import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { chunkTenderDocument } from "../rag/chunker.js";
import { embedTexts } from "../rag/embedder.js";
import { vectorStore } from "../rag/in-memory-vector-store.js";
import { tokenTracker } from "../utils/token-tracker.js";
import { documentCache } from "../rag/document-cache.js";

const DIMENSION = 3072;
const RAG_THRESHOLD = parseInt(process.env.RAG_THRESHOLD ?? "5000", 10);

export const ingestDocumentTool = createTool({
  id: "ingest-document",
  description:
    "Ingest a document into the vector store for subsequent analysis. " +
    "Call this FIRST before running any analysis tool. " +
    "Returns a documentId and indexName needed by other tools.",
  inputSchema: z.object({
    documentText: z.string().describe("The full text of the document to ingest"),
    documentTitle: z.string().optional().describe("Optional title of the document"),
  }),
  execute: async (inputData) => {
    tokenTracker.startStep("ingest-tool");
    const docId = `doc-${Date.now()}`;
    const indexName = `index-${docId}`;

    if (inputData.documentText.length < RAG_THRESHOLD) {
      documentCache.set(indexName, inputData.documentText, inputData.documentTitle);
      tokenTracker.completeStep("ingest-tool");
      return {
        documentId: docId,
        chunkCount: 0,
        indexName,
        documentTitle: inputData.documentTitle,
        message: `Document ingested as full text (${inputData.documentText.length} chars, below RAG threshold).`,
      };
    }

    const chunks = chunkTenderDocument(inputData.documentText, docId);
    const vectors = await embedTexts(chunks.map((c) => c.content));

    await vectorStore.createIndex({ indexName, dimension: DIMENSION });
    await vectorStore.upsert({
      indexName,
      vectors,
      metadata: chunks.map((c) => ({ ...c.metadata, content: c.content })),
      ids: chunks.map((c) => c.id),
    });

    const estimatedTokens = Math.ceil(inputData.documentText.length / 4);
    tokenTracker.record("ingest-tool-embedding", estimatedTokens, 0);
    tokenTracker.completeStep("ingest-tool");

    return {
      documentId: docId,
      chunkCount: chunks.length,
      indexName,
      documentTitle: inputData.documentTitle,
      message: `Document chunked into ${chunks.length} segments and indexed.`,
    };
  },
});
