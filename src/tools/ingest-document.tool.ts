import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { chunkTenderDocument } from "../rag/chunker.js";
import { embedTexts } from "../rag/embedder.js";
import { vectorStore } from "../rag/in-memory-vector-store.js";
import { documentCache } from "../rag/document-cache.js";
import { EMBEDDING_DIMENSION, TOOL_RAG_THRESHOLD } from "../rag/constants.js";
import { createEmit, withTokenTracking, recordUsage } from "./tool-helpers.js";

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
  execute: async (inputData, context) => {
    const emit = createEmit(context, "ingest-document");

    return withTokenTracking("ingest-tool", async () => {
      const docId = `doc-${Date.now()}`;
      const indexName = `index-${docId}`;

      await emit(`Received document (${inputData.documentText.length} chars)`);

      if (inputData.documentText.length < TOOL_RAG_THRESHOLD) {
        documentCache.set(indexName, inputData.documentText, inputData.documentTitle);
        await emit(`Below RAG threshold (${TOOL_RAG_THRESHOLD}) — cached as full text`);
        return {
          documentId: docId,
          chunkCount: 0,
          indexName,
          documentTitle: inputData.documentTitle,
          message: `Document ingested as full text (${inputData.documentText.length} chars, below RAG threshold).`,
        };
      }

      const chunks = chunkTenderDocument(inputData.documentText, docId);
      await emit(`Chunked into ${chunks.length} segments`);

      const vectors = await embedTexts(chunks.map((c) => c.content));
      await emit(`Embedded ${chunks.length} chunks (${EMBEDDING_DIMENSION}d vectors)`);

      await vectorStore.createIndex({ indexName, dimension: EMBEDDING_DIMENSION });
      await vectorStore.upsert({
        indexName,
        vectors,
        metadata: chunks.map((c) => ({ ...c.metadata, content: c.content })),
        ids: chunks.map((c) => c.id),
      });
      await emit(`Stored in vector index "${indexName}"`);

      recordUsage("ingest-tool-embedding", {
        inputTokens: Math.ceil(inputData.documentText.length / 4),
        outputTokens: 0,
      });

      return {
        documentId: docId,
        chunkCount: chunks.length,
        indexName,
        documentTitle: inputData.documentTitle,
        message: `Document chunked into ${chunks.length} segments and indexed.`,
      };
    });
  },
});
