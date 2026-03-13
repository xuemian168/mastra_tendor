/** Embedding vector dimension (Google text-embedding-004 / gemini-embedding-001) */
export const EMBEDDING_DIMENSION = 3072;

/**
 * RAG threshold for interactive tool mode.
 * Documents shorter than this are cached as full text, skipping chunking + embedding.
 * Configurable via RAG_THRESHOLD env var.
 */
export const TOOL_RAG_THRESHOLD = parseInt(
  process.env.RAG_THRESHOLD ?? "5000",
  10,
);

/**
 * RAG threshold for workflow mode.
 * Workflows process larger tender documents, so the threshold is higher (~10 pages).
 * Below this, full-text is cheaper than RAG.
 */
export const WORKFLOW_RAG_THRESHOLD = 40_000;
