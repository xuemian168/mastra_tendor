import { describe, it, expect } from "vitest";
import { InMemoryVectorStore } from "../rag/in-memory-vector-store.js";

describe("InMemoryVectorStore", () => {
  it("should create and list indexes", async () => {
    const store = new InMemoryVectorStore();
    await store.createIndex({ indexName: "test", dimension: 3 });
    expect(await store.listIndexes()).toEqual(["test"]);
  });

  it("should describe an index", async () => {
    const store = new InMemoryVectorStore();
    await store.createIndex({ indexName: "test", dimension: 3 });
    await store.upsert({
      indexName: "test",
      vectors: [[1, 0, 0]],
      metadata: [{ label: "a" }],
      ids: ["1"],
    });
    const desc = await store.describeIndex({ indexName: "test" });
    expect(desc).toEqual({ dimension: 3, metric: "cosine", count: 1 });
  });

  it("should return zero stats for non-existent index", async () => {
    const store = new InMemoryVectorStore();
    const desc = await store.describeIndex({ indexName: "nope" });
    expect(desc).toEqual({ dimension: 0, count: 0, metric: "cosine" });
  });

  it("should upsert and query vectors with cosine similarity", async () => {
    const store = new InMemoryVectorStore();
    await store.createIndex({ indexName: "test", dimension: 3 });
    await store.upsert({
      indexName: "test",
      vectors: [
        [1, 0, 0],
        [0, 1, 0],
        [1, 1, 0],
      ],
      metadata: [{ label: "x" }, { label: "y" }, { label: "xy" }],
      ids: ["1", "2", "3"],
    });

    const results = await store.query({
      indexName: "test",
      queryVector: [1, 0, 0],
      topK: 3,
    });
    expect(results[0].id).toBe("1");
    expect(results[0].score).toBeCloseTo(1.0);
    expect(results[1].id).toBe("3");
  });

  it("should respect topK limit", async () => {
    const store = new InMemoryVectorStore();
    await store.createIndex({ indexName: "test", dimension: 2 });
    await store.upsert({
      indexName: "test",
      vectors: [[1, 0], [0, 1], [1, 1]],
      metadata: [{}, {}, {}],
      ids: ["1", "2", "3"],
    });
    const results = await store.query({
      indexName: "test",
      queryVector: [1, 0],
      topK: 1,
    });
    expect(results).toHaveLength(1);
  });

  it("should filter by metadata", async () => {
    const store = new InMemoryVectorStore();
    await store.createIndex({ indexName: "test", dimension: 2 });
    await store.upsert({
      indexName: "test",
      vectors: [[1, 0], [0, 1]],
      metadata: [{ type: "a" }, { type: "b" }],
      ids: ["1", "2"],
    });
    const results = await store.query({
      indexName: "test",
      queryVector: [1, 1],
      topK: 10,
      filter: { type: "b" },
    });
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe("2");
  });

  it("should filter by metadata array (OR matching)", async () => {
    const store = new InMemoryVectorStore();
    await store.createIndex({ indexName: "test", dimension: 2 });
    await store.upsert({
      indexName: "test",
      vectors: [[1, 0], [0, 1], [1, 1]],
      metadata: [{ type: "a" }, { type: "b" }, { type: "c" }],
      ids: ["1", "2", "3"],
    });
    const results = await store.query({
      indexName: "test",
      queryVector: [1, 1],
      topK: 10,
      filter: { type: ["a", "b"] },
    });
    expect(results).toHaveLength(2);
  });

  it("should delete an index", async () => {
    const store = new InMemoryVectorStore();
    await store.createIndex({ indexName: "test", dimension: 3 });
    await store.deleteIndex({ indexName: "test" });
    expect(await store.listIndexes()).toEqual([]);
  });

  it("should throw when upserting to non-existent index", async () => {
    const store = new InMemoryVectorStore();
    await expect(
      store.upsert({ indexName: "nope", vectors: [[1]], metadata: [{}], ids: ["1"] })
    ).rejects.toThrow('Index "nope" not found');
  });

  it("should throw on dimension mismatch", async () => {
    const store = new InMemoryVectorStore();
    await store.createIndex({ indexName: "test", dimension: 3 });
    await expect(
      store.upsert({ indexName: "test", vectors: [[1, 0]], metadata: [{}], ids: ["1"] })
    ).rejects.toThrow("dimension mismatch");
  });

  it("should update existing entries on upsert", async () => {
    const store = new InMemoryVectorStore();
    await store.createIndex({ indexName: "test", dimension: 2 });
    await store.upsert({
      indexName: "test",
      vectors: [[1, 0]],
      metadata: [{ label: "old" }],
      ids: ["1"],
    });
    await store.upsert({
      indexName: "test",
      vectors: [[0, 1]],
      metadata: [{ label: "new" }],
      ids: ["1"],
    });
    const desc = await store.describeIndex({ indexName: "test" });
    expect(desc.count).toBe(1);
    const results = await store.query({
      indexName: "test",
      queryVector: [0, 1],
      topK: 1,
    });
    expect(results[0].metadata?.label).toBe("new");
  });

  it("should handle zero vectors gracefully", async () => {
    const store = new InMemoryVectorStore();
    await store.createIndex({ indexName: "test", dimension: 2 });
    await store.upsert({
      indexName: "test",
      vectors: [[0, 0]],
      metadata: [{}],
      ids: ["1"],
    });
    const results = await store.query({
      indexName: "test",
      queryVector: [1, 0],
      topK: 1,
    });
    expect(results[0].score).toBe(0);
  });

  it("should delete a single vector", async () => {
    const store = new InMemoryVectorStore();
    await store.createIndex({ indexName: "test", dimension: 2 });
    await store.upsert({
      indexName: "test",
      vectors: [[1, 0], [0, 1]],
      metadata: [{}, {}],
      ids: ["1", "2"],
    });
    await store.deleteVector({ indexName: "test", id: "1" });
    const desc = await store.describeIndex({ indexName: "test" });
    expect(desc.count).toBe(1);
  });

  it("should delete multiple vectors by ids", async () => {
    const store = new InMemoryVectorStore();
    await store.createIndex({ indexName: "test", dimension: 2 });
    await store.upsert({
      indexName: "test",
      vectors: [[1, 0], [0, 1], [1, 1]],
      metadata: [{}, {}, {}],
      ids: ["1", "2", "3"],
    });
    await store.deleteVectors({ indexName: "test", ids: ["1", "3"] });
    const desc = await store.describeIndex({ indexName: "test" });
    expect(desc.count).toBe(1);
  });

  it("should update vector metadata", async () => {
    const store = new InMemoryVectorStore();
    await store.createIndex({ indexName: "test", dimension: 2 });
    await store.upsert({
      indexName: "test",
      vectors: [[1, 0]],
      metadata: [{ label: "old" }],
      ids: ["1"],
    });
    await store.updateVector({
      indexName: "test",
      id: "1",
      update: { metadata: { label: "updated" } },
    });
    const results = await store.query({
      indexName: "test",
      queryVector: [1, 0],
      topK: 1,
    });
    expect(results[0].metadata?.label).toBe("updated");
  });
});
