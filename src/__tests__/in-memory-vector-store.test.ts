import { describe, it, expect } from "vitest";
import { InMemoryVectorStore } from "../rag/in-memory-vector-store.js";

describe("InMemoryVectorStore", () => {
  it("should create and list indexes", () => {
    const store = new InMemoryVectorStore();
    store.createIndex({ indexName: "test", dimension: 3 });
    expect(store.listIndexes()).toEqual(["test"]);
  });

  it("should describe an index", () => {
    const store = new InMemoryVectorStore();
    store.createIndex({ indexName: "test", dimension: 3 });
    store.upsert({
      indexName: "test",
      vectors: [[1, 0, 0]],
      metadata: [{ label: "a" }],
      ids: ["1"],
    });
    const desc = store.describeIndex("test");
    expect(desc).toEqual({ dimension: 3, metric: "cosine", count: 1 });
  });

  it("should return undefined for non-existent index", () => {
    const store = new InMemoryVectorStore();
    expect(store.describeIndex("nope")).toBeUndefined();
  });

  it("should upsert and query vectors with cosine similarity", () => {
    const store = new InMemoryVectorStore();
    store.createIndex({ indexName: "test", dimension: 3 });
    store.upsert({
      indexName: "test",
      vectors: [
        [1, 0, 0],
        [0, 1, 0],
        [1, 1, 0],
      ],
      metadata: [{ label: "x" }, { label: "y" }, { label: "xy" }],
      ids: ["1", "2", "3"],
    });

    // Query with [1, 0, 0] should rank "1" highest, then "3"
    const results = store.query({
      indexName: "test",
      queryVector: [1, 0, 0],
      topK: 3,
    });
    expect(results[0].id).toBe("1");
    expect(results[0].score).toBeCloseTo(1.0);
    expect(results[1].id).toBe("3");
  });

  it("should respect topK limit", () => {
    const store = new InMemoryVectorStore();
    store.createIndex({ indexName: "test", dimension: 2 });
    store.upsert({
      indexName: "test",
      vectors: [[1, 0], [0, 1], [1, 1]],
      metadata: [{}, {}, {}],
      ids: ["1", "2", "3"],
    });
    const results = store.query({
      indexName: "test",
      queryVector: [1, 0],
      topK: 1,
    });
    expect(results).toHaveLength(1);
  });

  it("should filter by metadata", () => {
    const store = new InMemoryVectorStore();
    store.createIndex({ indexName: "test", dimension: 2 });
    store.upsert({
      indexName: "test",
      vectors: [[1, 0], [0, 1]],
      metadata: [{ type: "a" }, { type: "b" }],
      ids: ["1", "2"],
    });
    const results = store.query({
      indexName: "test",
      queryVector: [1, 1],
      topK: 10,
      filter: { type: "b" },
    });
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe("2");
  });

  it("should filter by metadata array (OR matching)", () => {
    const store = new InMemoryVectorStore();
    store.createIndex({ indexName: "test", dimension: 2 });
    store.upsert({
      indexName: "test",
      vectors: [[1, 0], [0, 1], [1, 1]],
      metadata: [{ type: "a" }, { type: "b" }, { type: "c" }],
      ids: ["1", "2", "3"],
    });
    const results = store.query({
      indexName: "test",
      queryVector: [1, 1],
      topK: 10,
      filter: { type: ["a", "b"] },
    });
    expect(results).toHaveLength(2);
  });

  it("should delete an index", () => {
    const store = new InMemoryVectorStore();
    store.createIndex({ indexName: "test", dimension: 3 });
    store.deleteIndex("test");
    expect(store.listIndexes()).toEqual([]);
  });

  it("should throw when upserting to non-existent index", () => {
    const store = new InMemoryVectorStore();
    expect(() =>
      store.upsert({ indexName: "nope", vectors: [[1]], metadata: [{}], ids: ["1"] })
    ).toThrow('Index "nope" not found');
  });

  it("should throw on dimension mismatch", () => {
    const store = new InMemoryVectorStore();
    store.createIndex({ indexName: "test", dimension: 3 });
    expect(() =>
      store.upsert({ indexName: "test", vectors: [[1, 0]], metadata: [{}], ids: ["1"] })
    ).toThrow("dimension mismatch");
  });

  it("should update existing entries on upsert", () => {
    const store = new InMemoryVectorStore();
    store.createIndex({ indexName: "test", dimension: 2 });
    store.upsert({
      indexName: "test",
      vectors: [[1, 0]],
      metadata: [{ label: "old" }],
      ids: ["1"],
    });
    store.upsert({
      indexName: "test",
      vectors: [[0, 1]],
      metadata: [{ label: "new" }],
      ids: ["1"],
    });
    const desc = store.describeIndex("test");
    expect(desc?.count).toBe(1);
    const results = store.query({
      indexName: "test",
      queryVector: [0, 1],
      topK: 1,
    });
    expect(results[0].metadata.label).toBe("new");
  });

  it("should handle zero vectors gracefully", () => {
    const store = new InMemoryVectorStore();
    store.createIndex({ indexName: "test", dimension: 2 });
    store.upsert({
      indexName: "test",
      vectors: [[0, 0]],
      metadata: [{}],
      ids: ["1"],
    });
    const results = store.query({
      indexName: "test",
      queryVector: [1, 0],
      topK: 1,
    });
    expect(results[0].score).toBe(0);
  });
});
