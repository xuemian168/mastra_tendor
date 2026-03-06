import { describe, it, expect, bench } from "vitest";
import { chunkTenderDocument } from "../rag/chunker.js";
import { InMemoryVectorStore } from "../rag/in-memory-vector-store.js";

// --- Test data generators ---

function generateTenderDocument(pages: number): string {
  const sections = [
    { title: "# 1. Overview and Background", type: "overview", paragraphs: 3 },
    { title: "# 2. Scope of Work", type: "scope", paragraphs: 5 },
    { title: "# 3. Technical Requirements", type: "technical", paragraphs: 8 },
    { title: "# 4. Mandatory Qualifications", type: "qualifications", paragraphs: 4 },
    { title: "# 5. Timeline and Milestones", type: "timeline", paragraphs: 3 },
    { title: "# 6. Pricing and Financial", type: "pricing", paragraphs: 4 },
    { title: "# 7. Legal Terms", type: "legal", paragraphs: 6 },
    { title: "# 8. Penalty Clauses", type: "penalties", paragraphs: 3 },
    { title: "# 9. SLA Requirements", type: "sla", paragraphs: 4 },
    { title: "# 10. Evaluation Criteria", type: "evaluation", paragraphs: 3 },
    { title: "# 11. Submission Requirements", type: "submission", paragraphs: 5 },
  ];

  const charsPerPage = 2500;
  const targetChars = pages * charsPerPage;
  let doc = "";
  let charCount = 0;

  while (charCount < targetChars) {
    for (const section of sections) {
      if (charCount >= targetChars) break;
      doc += `\n${section.title}\n\n`;
      for (let p = 0; p < section.paragraphs; p++) {
        if (charCount >= targetChars) break;
        const paragraph = `The ${section.type} section requires careful attention to detail. All tenderers must comply with the specified requirements including but not limited to performance benchmarks, quality assurance standards, and regulatory frameworks as outlined in the Commonwealth Procurement Rules 2024. Additional conditions may apply based on the risk assessment and security classification of the project deliverables.\n\n`;
        doc += paragraph;
        charCount += paragraph.length;
      }
    }
  }

  return doc;
}

function randomVector(dim: number): number[] {
  return Array.from({ length: dim }, () => Math.random() * 2 - 1);
}

// --- Benchmarks ---

describe("Chunker Benchmarks", () => {
  const doc10 = generateTenderDocument(10);
  const doc50 = generateTenderDocument(50);
  const doc100 = generateTenderDocument(100);
  const doc200 = generateTenderDocument(200);

  it("document sizes", () => {
    console.log(`  10-page doc: ${(doc10.length / 1024).toFixed(1)} KB (~${Math.ceil(doc10.length / 4)} tokens)`);
    console.log(`  50-page doc: ${(doc50.length / 1024).toFixed(1)} KB (~${Math.ceil(doc50.length / 4)} tokens)`);
    console.log(`  100-page doc: ${(doc100.length / 1024).toFixed(1)} KB (~${Math.ceil(doc100.length / 4)} tokens)`);
    console.log(`  200-page doc: ${(doc200.length / 1024).toFixed(1)} KB (~${Math.ceil(doc200.length / 4)} tokens)`);
    expect(true).toBe(true);
  });

  bench("chunk 10-page tender", () => {
    chunkTenderDocument(doc10, "bench-10");
  });

  bench("chunk 50-page tender", () => {
    chunkTenderDocument(doc50, "bench-50");
  });

  bench("chunk 100-page tender", () => {
    chunkTenderDocument(doc100, "bench-100");
  });

  bench("chunk 200-page tender", () => {
    chunkTenderDocument(doc200, "bench-200");
  });
});

describe("Vector Store Benchmarks", () => {
  const dim = 3072;

  bench("upsert 100 vectors (3072-dim)", () => {
    const store = new InMemoryVectorStore();
    store.createIndex({ indexName: "bench", dimension: dim });
    store.upsert({
      indexName: "bench",
      vectors: Array.from({ length: 100 }, () => randomVector(dim)),
      metadata: Array.from({ length: 100 }, (_, i) => ({ id: i, sectionType: "general" })),
      ids: Array.from({ length: 100 }, (_, i) => `v-${i}`),
    });
  });

  bench("query top-5 from 100 vectors", () => {
    const store = new InMemoryVectorStore();
    store.createIndex({ indexName: "bench", dimension: dim });
    store.upsert({
      indexName: "bench",
      vectors: Array.from({ length: 100 }, () => randomVector(dim)),
      metadata: Array.from({ length: 100 }, (_, i) => ({ id: i, sectionType: "general" })),
      ids: Array.from({ length: 100 }, (_, i) => `v-${i}`),
    });
    store.query({ indexName: "bench", queryVector: randomVector(dim), topK: 5 });
  });

  bench("query top-5 from 500 vectors", () => {
    const store = new InMemoryVectorStore();
    store.createIndex({ indexName: "bench", dimension: dim });
    store.upsert({
      indexName: "bench",
      vectors: Array.from({ length: 500 }, () => randomVector(dim)),
      metadata: Array.from({ length: 500 }, (_, i) => ({ id: i, sectionType: "general" })),
      ids: Array.from({ length: 500 }, (_, i) => `v-${i}`),
    });
    store.query({ indexName: "bench", queryVector: randomVector(dim), topK: 5 });
  });

  bench("query with metadata filter from 500 vectors", () => {
    const store = new InMemoryVectorStore();
    store.createIndex({ indexName: "bench", dimension: dim });
    const types = ["technical_requirements", "penalties", "sla", "timeline", "general"];
    store.upsert({
      indexName: "bench",
      vectors: Array.from({ length: 500 }, () => randomVector(dim)),
      metadata: Array.from({ length: 500 }, (_, i) => ({ id: i, sectionType: types[i % types.length] })),
      ids: Array.from({ length: 500 }, (_, i) => `v-${i}`),
    });
    store.query({
      indexName: "bench",
      queryVector: randomVector(dim),
      topK: 5,
      filter: { sectionType: ["penalties", "sla", "timeline"] },
    });
  });
});

describe("Chunk Count Analysis", () => {
  it("should report chunk counts for different document sizes", () => {
    const sizes = [10, 50, 100, 200];
    console.log("\n  Document Size → Chunk Count (Token Savings vs Full-Text):");
    console.log("  ─────────────────────────────────────────────────────────");

    for (const pages of sizes) {
      const doc = generateTenderDocument(pages);
      const chunks = chunkTenderDocument(doc, `analysis-${pages}`);
      const fullTextTokens = Math.ceil(doc.length / 4);
      // Each agent retrieves ~20 chunks max (4 queries × 5 topK), each ~800 tokens
      const ragTokensPerAgent = Math.min(chunks.length, 20) * 800;
      const twoAgentsFullText = fullTextTokens * 2;
      const twoAgentsRag = ragTokensPerAgent * 2;
      const savings = ((1 - twoAgentsRag / twoAgentsFullText) * 100).toFixed(0);

      console.log(
        `  ${String(pages).padStart(3)} pages | ${doc.length.toLocaleString().padStart(9)} chars | ${String(chunks.length).padStart(4)} chunks | ` +
        `Full-text: ~${twoAgentsFullText.toLocaleString()} tokens → RAG: ~${twoAgentsRag.toLocaleString()} tokens (${savings}% savings)`
      );
    }

    expect(true).toBe(true);
  });
});
