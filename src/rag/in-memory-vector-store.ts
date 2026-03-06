interface IndexEntry {
  id: string;
  vector: number[];
  norm: number;
  metadata: Record<string, unknown>;
}

interface IndexInfo {
  dimension: number;
  metric: string;
  entries: Map<string, IndexEntry>;
}

function l2Norm(v: number[]): number {
  let sum = 0;
  for (let i = 0; i < v.length; i++) sum += v[i] * v[i];
  return Math.sqrt(sum);
}

function cosineSimilarity(a: number[], aNorm: number, b: number[], bNorm: number): number {
  if (aNorm === 0 || bNorm === 0) return 0;
  let dot = 0;
  for (let i = 0; i < a.length; i++) dot += a[i] * b[i];
  return dot / (aNorm * bNorm);
}

export class InMemoryVectorStore {
  private indexes = new Map<string, IndexInfo>();

  createIndex({
    indexName,
    dimension,
    metric = "cosine",
  }: {
    indexName: string;
    dimension: number;
    metric?: string;
  }): void {
    if (!this.indexes.has(indexName)) {
      this.indexes.set(indexName, { dimension, metric, entries: new Map() });
    }
  }

  upsert({
    indexName,
    vectors,
    metadata,
    ids,
  }: {
    indexName: string;
    vectors: number[][];
    metadata: Record<string, unknown>[];
    ids: string[];
  }): void {
    const index = this.indexes.get(indexName);
    if (!index) throw new Error(`Index "${indexName}" not found`);

    for (let i = 0; i < ids.length; i++) {
      const vector = vectors[i];
      if (vector.length !== index.dimension) {
        throw new Error(`Vector dimension mismatch: expected ${index.dimension}, got ${vector.length}`);
      }
      index.entries.set(ids[i], {
        id: ids[i],
        vector,
        norm: l2Norm(vector),
        metadata: metadata[i],
      });
    }
  }

  query({
    indexName,
    queryVector,
    topK = 5,
    filter,
  }: {
    indexName: string;
    queryVector: number[];
    topK?: number;
    filter?: Record<string, unknown>;
  }): { id: string; score: number; metadata: Record<string, unknown> }[] {
    const index = this.indexes.get(indexName);
    if (!index) throw new Error(`Index "${indexName}" not found`);

    const queryNorm = l2Norm(queryVector);
    const results: { id: string; score: number; metadata: Record<string, unknown> }[] = [];

    for (const entry of index.entries.values()) {
      if (filter && !matchesFilter(entry.metadata, filter)) continue;
      const score = cosineSimilarity(queryVector, queryNorm, entry.vector, entry.norm);
      results.push({ id: entry.id, score, metadata: entry.metadata });
    }

    results.sort((a, b) => b.score - a.score);
    return results.slice(0, topK);
  }

  deleteIndex(indexName: string): void {
    this.indexes.delete(indexName);
  }

  listIndexes(): string[] {
    return Array.from(this.indexes.keys());
  }

  describeIndex(indexName: string): { dimension: number; metric: string; count: number } | undefined {
    const index = this.indexes.get(indexName);
    if (!index) return undefined;
    return { dimension: index.dimension, metric: index.metric, count: index.entries.size };
  }
}

function matchesFilter(metadata: Record<string, unknown>, filter: Record<string, unknown>): boolean {
  for (const [key, value] of Object.entries(filter)) {
    if (Array.isArray(value)) {
      if (!value.includes(metadata[key])) return false;
    } else if (metadata[key] !== value) {
      return false;
    }
  }
  return true;
}

export const vectorStore = new InMemoryVectorStore();
