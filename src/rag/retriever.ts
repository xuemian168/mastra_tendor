import type { SectionType, TenderChunk } from "./types.js";
import type { MastraVector } from "@mastra/core/vector";

export interface RetrievalConfig {
  queries: string[];
  topK?: number;
  sectionFilter?: SectionType[];
  scoreThreshold?: number;
}

export const COMPLIANCE_RETRIEVAL_CONFIG: RetrievalConfig = {
  queries: [
    "technical specifications and requirements",
    "submission deadlines and milestone dates",
    "mandatory qualifications and certifications",
    "required documentation and compliance standards",
  ],
  sectionFilter: [
    "technical_requirements",
    "qualifications",
    "timeline",
    "submission_requirements",
    "evaluation_criteria",
  ],
};

export const RISK_RETRIEVAL_CONFIG: RetrievalConfig = {
  queries: [
    "penalty clauses and liquidated damages",
    "service level agreements and SLA terms",
    "liability limitations and indemnification",
    "delivery risks and timeline constraints",
  ],
  sectionFilter: ["penalties", "sla", "legal_terms", "timeline", "scope"],
};

export async function retrieveForAgent(
  store: MastraVector,
  indexName: string,
  config: RetrievalConfig,
  embedFn: (query: string) => Promise<number[]>,
): Promise<TenderChunk[]> {
  const topK = config.topK ?? 5;
  const threshold = config.scoreThreshold ?? 0.3;

  const filter = config.sectionFilter
    ? { sectionType: config.sectionFilter }
    : undefined;

  const bestByChunkId = new Map<string, { score: number; metadata: Record<string, unknown> }>();

  for (const query of config.queries) {
    const queryVector = await embedFn(query);
    const results = await store.query({ indexName, queryVector, topK, filter });

    for (const result of results) {
      if (result.score < threshold) continue;
      const existing = bestByChunkId.get(result.id);
      if (!existing || result.score > existing.score) {
        bestByChunkId.set(result.id, { score: result.score, metadata: result.metadata ?? {} });
      }
    }
  }

  const sorted = Array.from(bestByChunkId.entries())
    .sort((a, b) => b[1].score - a[1].score);

  return sorted.map(([id, { metadata }]) => ({
    id,
    content: (metadata as any).content as string,
    metadata: {
      tenderId: metadata.tenderId as string,
      sectionType: metadata.sectionType as SectionType,
      sectionTitle: metadata.sectionTitle as string,
      chunkIndex: metadata.chunkIndex as number,
    },
  }));
}
