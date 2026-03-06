import type { HistoricalAnalysis } from "./types.js";
import { InMemoryVectorStore } from "./in-memory-vector-store.js";

const HISTORY_INDEX = "historical-analyses";
const DIMENSION = 3072;

export class HistoryStore {
  private store = new InMemoryVectorStore();
  private analyses = new Map<string, HistoricalAnalysis>();

  constructor() {
    this.store.createIndex({ indexName: HISTORY_INDEX, dimension: DIMENSION });
  }

  async addAnalysis(
    analysis: HistoricalAnalysis,
    embedFn: (texts: string[]) => Promise<number[][]>,
  ): Promise<void> {
    const textToEmbed = `${analysis.tenderTitle} ${analysis.summary}`;
    const [vector] = await embedFn([textToEmbed]);

    this.analyses.set(analysis.tenderId, analysis);
    this.store.upsert({
      indexName: HISTORY_INDEX,
      vectors: [vector],
      metadata: [{ tenderId: analysis.tenderId }],
      ids: [analysis.tenderId],
    });
  }

  async findSimilar(
    summary: string,
    embedFn: (query: string) => Promise<number[]>,
    topK = 3,
  ): Promise<HistoricalAnalysis[]> {
    const desc = this.store.describeIndex(HISTORY_INDEX);
    if (!desc || desc.count === 0) return [];

    const queryVector = await embedFn(summary);
    const results = this.store.query({
      indexName: HISTORY_INDEX,
      queryVector,
      topK,
    });

    return results
      .map((r) => this.analyses.get(r.metadata.tenderId as string))
      .filter((a): a is HistoricalAnalysis => a !== undefined);
  }
}

export const historyStore = new HistoryStore();
