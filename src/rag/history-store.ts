import type { HistoricalAnalysis } from "./types.js";
import { InMemoryVectorStore } from "./in-memory-vector-store.js";

const HISTORY_INDEX = "historical-analyses";
const DIMENSION = 3072;

export class HistoryStore {
  private store = new InMemoryVectorStore();
  private analyses = new Map<string, HistoricalAnalysis>();
  private initialized = false;

  private async ensureIndex(): Promise<void> {
    if (!this.initialized) {
      await this.store.createIndex({ indexName: HISTORY_INDEX, dimension: DIMENSION });
      this.initialized = true;
    }
  }

  async addAnalysis(
    analysis: HistoricalAnalysis,
    embedFn: (texts: string[]) => Promise<number[][]>,
  ): Promise<void> {
    await this.ensureIndex();
    const textToEmbed = `${analysis.tenderTitle} ${analysis.summary}`;
    const [vector] = await embedFn([textToEmbed]);

    this.analyses.set(analysis.tenderId, analysis);
    await this.store.upsert({
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
    await this.ensureIndex();
    const desc = await this.store.describeIndex({ indexName: HISTORY_INDEX });
    if (desc.count === 0) return [];

    const queryVector = await embedFn(summary);
    const results = await this.store.query({
      indexName: HISTORY_INDEX,
      queryVector,
      topK,
    });

    return results
      .map((r) => this.analyses.get(r.metadata?.tenderId as string))
      .filter((a): a is HistoricalAnalysis => a !== undefined);
  }
}

export const historyStore = new HistoryStore();
