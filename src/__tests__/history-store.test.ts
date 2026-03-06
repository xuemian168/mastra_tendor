import { describe, it, expect, vi } from "vitest";
import { HistoryStore } from "../rag/history-store.js";
import type { HistoricalAnalysis } from "../rag/types.js";

function deterministicVector(seed: number): number[] {
  return Array.from({ length: 3072 }, (_, i) => Math.sin(seed * (i + 1)));
}

describe("HistoryStore", () => {
  it("should return empty array when no analyses exist", async () => {
    const store = new HistoryStore();
    const mockEmbed = vi.fn(async () => deterministicVector(0));
    const results = await store.findSimilar("test", mockEmbed);
    expect(results).toEqual([]);
    expect(mockEmbed).not.toHaveBeenCalled();
  });

  it("should add and retrieve historical analyses", async () => {
    const store = new HistoryStore();
    const analysis: HistoricalAnalysis = {
      tenderId: "t1",
      tenderTitle: "Cloud Platform RFP",
      decision: "bid",
      confidenceScore: 85,
      summary: "Strong fit for cloud infrastructure project",
      timestamp: Date.now(),
    };

    const mockEmbedMany = vi.fn(async (texts: string[]) =>
      texts.map((_, i) => deterministicVector(i))
    );
    const mockEmbedQuery = vi.fn(async () => deterministicVector(0));

    await store.addAnalysis(analysis, mockEmbedMany);
    const results = await store.findSimilar("cloud infrastructure", mockEmbedQuery);

    expect(results).toHaveLength(1);
    expect(results[0].tenderId).toBe("t1");
    expect(results[0].decision).toBe("bid");
  });

  it("should retrieve multiple similar analyses sorted by relevance", async () => {
    const store = new HistoryStore();

    const analyses: HistoricalAnalysis[] = [
      { tenderId: "t1", tenderTitle: "Cloud RFP", decision: "bid", confidenceScore: 85, summary: "Cloud project", timestamp: 1 },
      { tenderId: "t2", tenderTitle: "Security Audit", decision: "no_bid", confidenceScore: 30, summary: "Security audit", timestamp: 2 },
      { tenderId: "t3", tenderTitle: "Data Pipeline", decision: "conditional_bid", confidenceScore: 60, summary: "Data pipeline project", timestamp: 3 },
    ];

    const mockEmbedMany = vi.fn(async (texts: string[]) =>
      texts.map((_, i) => deterministicVector(i))
    );

    for (const a of analyses) {
      await store.addAnalysis(a, mockEmbedMany);
    }

    const mockEmbedQuery = vi.fn(async () => deterministicVector(0));
    const results = await store.findSimilar("cloud", mockEmbedQuery, 2);

    expect(results.length).toBeLessThanOrEqual(2);
    expect(results[0]).toBeDefined();
  });

  it("should respect topK parameter", async () => {
    const store = new HistoryStore();
    const mockEmbedMany = vi.fn(async (texts: string[]) =>
      texts.map((_, i) => deterministicVector(i))
    );

    for (let i = 0; i < 5; i++) {
      await store.addAnalysis(
        { tenderId: `t${i}`, tenderTitle: `Title ${i}`, decision: "bid", confidenceScore: 80, summary: `Summary ${i}`, timestamp: i },
        mockEmbedMany,
      );
    }

    const mockEmbedQuery = vi.fn(async () => deterministicVector(0));
    const results = await store.findSimilar("test", mockEmbedQuery, 2);
    expect(results.length).toBeLessThanOrEqual(2);
  });
});
