import { MastraVector } from "@mastra/core/vector";
import type {
  CreateIndexParams,
  UpsertVectorParams,
  QueryVectorParams,
  QueryResult,
  IndexStats,
  DescribeIndexParams,
  DeleteIndexParams,
  UpdateVectorParams,
  DeleteVectorParams,
  DeleteVectorsParams,
} from "@mastra/core/vector";
import type { VectorFilter } from "@mastra/core/vector";

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

/**
 * In-memory vector store extending Mastra's MastraVector abstraction.
 * Provides cosine similarity search with metadata filtering.
 */
export class InMemoryVectorStore extends MastraVector {
  private indexes = new Map<string, IndexInfo>();

  constructor() {
    super({ id: "in-memory-vector" });
  }

  async createIndex({ indexName, dimension, metric = "cosine" }: CreateIndexParams): Promise<void> {
    if (!this.indexes.has(indexName)) {
      this.indexes.set(indexName, { dimension, metric, entries: new Map() });
    }
  }

  async upsert({ indexName, vectors, metadata, ids }: UpsertVectorParams): Promise<string[]> {
    const index = this.indexes.get(indexName);
    if (!index) throw new Error(`Index "${indexName}" not found`);

    const resolvedIds = ids ?? vectors.map((_, i) => `vec-${Date.now()}-${i}`);

    for (let i = 0; i < resolvedIds.length; i++) {
      const vector = vectors[i];
      if (vector.length !== index.dimension) {
        throw new Error(`Vector dimension mismatch: expected ${index.dimension}, got ${vector.length}`);
      }
      index.entries.set(resolvedIds[i], {
        id: resolvedIds[i],
        vector,
        norm: l2Norm(vector),
        metadata: metadata?.[i] ?? {},
      });
    }

    return resolvedIds;
  }

  async query({ indexName, queryVector, topK = 5, filter }: QueryVectorParams): Promise<QueryResult[]> {
    const index = this.indexes.get(indexName);
    if (!index) throw new Error(`Index "${indexName}" not found`);

    if (!queryVector) {
      // Metadata-only query
      const results: QueryResult[] = [];
      for (const entry of index.entries.values()) {
        if (filter && !matchesFilter(entry.metadata, filter)) continue;
        results.push({ id: entry.id, score: 1, metadata: entry.metadata });
      }
      return results.slice(0, topK);
    }

    const queryNorm = l2Norm(queryVector);
    const results: QueryResult[] = [];

    for (const entry of index.entries.values()) {
      if (filter && !matchesFilter(entry.metadata, filter)) continue;
      const score = cosineSimilarity(queryVector, queryNorm, entry.vector, entry.norm);
      results.push({ id: entry.id, score, metadata: entry.metadata });
    }

    results.sort((a, b) => b.score - a.score);
    return results.slice(0, topK);
  }

  async deleteIndex({ indexName }: DeleteIndexParams): Promise<void> {
    this.indexes.delete(indexName);
  }

  async listIndexes(): Promise<string[]> {
    return Array.from(this.indexes.keys());
  }

  async describeIndex({ indexName }: DescribeIndexParams): Promise<IndexStats> {
    const index = this.indexes.get(indexName);
    if (!index) {
      return { dimension: 0, count: 0, metric: "cosine" };
    }
    return {
      dimension: index.dimension,
      count: index.entries.size,
      metric: index.metric as IndexStats["metric"],
    };
  }

  async updateVector(params: UpdateVectorParams): Promise<void> {
    const index = this.indexes.get(params.indexName);
    if (!index) throw new Error(`Index "${params.indexName}" not found`);

    if ("id" in params && params.id) {
      const entry = index.entries.get(params.id);
      if (!entry) return;
      if (params.update.vector) {
        entry.vector = params.update.vector;
        entry.norm = l2Norm(params.update.vector);
      }
      if (params.update.metadata) {
        entry.metadata = { ...entry.metadata, ...params.update.metadata };
      }
    }
  }

  async deleteVector({ indexName, id }: DeleteVectorParams): Promise<void> {
    const index = this.indexes.get(indexName);
    if (index) index.entries.delete(id);
  }

  async deleteVectors({ indexName, ids, filter }: DeleteVectorsParams): Promise<void> {
    const index = this.indexes.get(indexName);
    if (!index) return;

    if (ids) {
      for (const id of ids) index.entries.delete(id);
    } else if (filter) {
      for (const [id, entry] of index.entries) {
        if (matchesFilter(entry.metadata, filter)) {
          index.entries.delete(id);
        }
      }
    }
  }
}

function matchesFilter(metadata: Record<string, unknown>, filter: VectorFilter): boolean {
  if (!filter) return true;

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
