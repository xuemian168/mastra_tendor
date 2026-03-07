/**
 * In-memory cache for documents below the RAG threshold.
 * ingest-document writes here; analysis tools read as fallback
 * when fullText is not provided in tool input.
 */
const MAX_ENTRIES = 50;

const cache = new Map<string, { fullText: string; documentTitle?: string }>();

export const documentCache = {
  set(indexName: string, fullText: string, documentTitle?: string) {
    if (cache.size >= MAX_ENTRIES) {
      const oldest = cache.keys().next().value;
      if (oldest) cache.delete(oldest);
    }
    cache.set(indexName, { fullText, documentTitle });
  },

  get(indexName: string) {
    return cache.get(indexName);
  },

  delete(indexName: string) {
    cache.delete(indexName);
  },

  clear() {
    cache.clear();
  },
};
