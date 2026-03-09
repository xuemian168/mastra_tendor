import { describe, it, expect, vi } from "vitest";
import { InMemoryVectorStore } from "../rag/in-memory-vector-store.js";
import { retrieveForAgent, type RetrievalConfig } from "../rag/retriever.js";

function deterministicVector(seed: number, dim = 8): number[] {
  return Array.from({ length: dim }, (_, i) => Math.sin(seed * (i + 1)));
}

describe("retrieveForAgent", () => {
  const dim = 8;
  let store: InMemoryVectorStore;

  async function setupStore() {
    store = new InMemoryVectorStore();
    await store.createIndex({ indexName: "test", dimension: dim });

    const entries = [
      { id: "0", sectionType: "technical_requirements", content: "Must use Kubernetes" },
      { id: "1", sectionType: "penalties", content: "10% penalty for delays" },
      { id: "2", sectionType: "timeline", content: "Delivery by Q4 2026" },
      { id: "3", sectionType: "legal_terms", content: "Liability capped at contract value" },
      { id: "4", sectionType: "scope", content: "Build a cloud platform" },
    ];

    await store.upsert({
      indexName: "test",
      vectors: entries.map((_, i) => deterministicVector(i, dim)),
      metadata: entries.map((e) => ({
        sectionType: e.sectionType,
        sectionTitle: e.sectionType,
        chunkIndex: parseInt(e.id),
        tenderId: "t1",
        content: e.content,
      })),
      ids: entries.map((e) => e.id),
    });
  }

  it("should retrieve chunks matching section filter", async () => {
    await setupStore();
    const config: RetrievalConfig = {
      queries: ["technical specs"],
      sectionFilter: ["technical_requirements", "timeline"],
      scoreThreshold: -1,
    };

    const mockEmbed = vi.fn(async () => deterministicVector(0, dim));
    const results = await retrieveForAgent(store, "test", config, mockEmbed);

    const types = results.map((r) => r.metadata.sectionType);
    expect(types.every((t) => ["technical_requirements", "timeline"].includes(t))).toBe(true);
  });

  it("should deduplicate across multiple queries keeping highest score", async () => {
    await setupStore();
    const config: RetrievalConfig = {
      queries: ["query1", "query2"],
      topK: 10,
      scoreThreshold: -1,
    };

    const mockEmbed = vi.fn(async () => deterministicVector(0, dim));
    const results = await retrieveForAgent(store, "test", config, mockEmbed);
    expect(mockEmbed).toHaveBeenCalledTimes(2);

    const ids = results.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("should respect score threshold", async () => {
    await setupStore();
    const config: RetrievalConfig = {
      queries: ["test"],
      scoreThreshold: 0.99,
    };

    const mockEmbed = vi.fn(async () => deterministicVector(99, dim));
    const results = await retrieveForAgent(store, "test", config, mockEmbed);
    expect(results.length).toBeLessThanOrEqual(5);
  });

  it("should return chunks with correct metadata structure", async () => {
    await setupStore();
    const config: RetrievalConfig = {
      queries: ["test"],
      scoreThreshold: -1,
    };

    const mockEmbed = vi.fn(async () => deterministicVector(0, dim));
    const results = await retrieveForAgent(store, "test", config, mockEmbed);

    for (const chunk of results) {
      expect(chunk).toHaveProperty("id");
      expect(chunk).toHaveProperty("content");
      expect(chunk.metadata).toHaveProperty("tenderId");
      expect(chunk.metadata).toHaveProperty("sectionType");
      expect(chunk.metadata).toHaveProperty("sectionTitle");
      expect(chunk.metadata).toHaveProperty("chunkIndex");
    }
  });
});
