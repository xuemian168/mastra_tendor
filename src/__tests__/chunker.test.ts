import { describe, it, expect } from "vitest";
import { chunkTenderDocument } from "../rag/chunker.js";

describe("chunkTenderDocument", () => {
  it("should return single chunk for short documents", () => {
    const text = "This is a short tender document.";
    const chunks = chunkTenderDocument(text, "tender-1");
    expect(chunks).toHaveLength(1);
    expect(chunks[0].id).toBe("tender-1-0");
    expect(chunks[0].content).toBe(text);
    expect(chunks[0].metadata.sectionType).toBe("general");
    expect(chunks[0].metadata.sectionTitle).toBe("Full Document");
  });

  it("should detect markdown heading sections", () => {
    const text = "A".repeat(5000) + "\n# Technical Requirements\nMust have ISO 27001.\n# Timeline\nDeadline: 2026-05-01.";
    const chunks = chunkTenderDocument(text, "tender-2", { shortDocThreshold: 100 });
    const sectionTypes = chunks.map((c) => c.metadata.sectionType);
    expect(sectionTypes).toContain("technical_requirements");
    expect(sectionTypes).toContain("timeline");
  });

  it("should detect numbered sections", () => {
    const text = "A".repeat(5000) + "\n1. Scope of Work\nBuild a platform.\n2. Penalty Clauses\n10% deduction for delays.";
    const chunks = chunkTenderDocument(text, "tender-3", { shortDocThreshold: 100 });
    const sectionTypes = chunks.map((c) => c.metadata.sectionType);
    expect(sectionTypes).toContain("scope");
    expect(sectionTypes).toContain("penalties");
  });

  it("should split large sections into overlapping chunks", () => {
    const longSection = "# Technical Requirements\n" + "A".repeat(7000);
    const text = "Intro\n" + longSection;
    const chunks = chunkTenderDocument(text, "tender-4", {
      chunkSize: 3200,
      chunkOverlap: 200,
      shortDocThreshold: 100,
    });
    expect(chunks.length).toBeGreaterThan(2);
    // All chunks from technical section should have same sectionType
    const techChunks = chunks.filter((c) => c.metadata.sectionType === "technical_requirements");
    expect(techChunks.length).toBeGreaterThan(1);
  });

  it("should assign sequential chunk indexes", () => {
    const text = "Intro text\n# Scope\nScope details\n# Timeline\nDeadline info";
    const chunks = chunkTenderDocument(text, "tender-5", { shortDocThreshold: 10 });
    const indexes = chunks.map((c) => c.metadata.chunkIndex);
    expect(indexes).toEqual(indexes.map((_, i) => i));
  });

  it("should infer section types from keywords", () => {
    const text = "X".repeat(6000) + "\n# Evaluation Criteria\nScoring method.\n# Service Level Agreement\n99.9% uptime.";
    const chunks = chunkTenderDocument(text, "tender-6", { shortDocThreshold: 100 });
    const types = chunks.map((c) => c.metadata.sectionType);
    expect(types).toContain("evaluation_criteria");
    expect(types).toContain("sla");
  });

  it("should use custom chunk size", () => {
    // Create a document with a clear section header followed by long content
    const text = "Intro paragraph.\n# Overview\n" + "B".repeat(10000);
    const chunks = chunkTenderDocument(text, "tender-7", {
      chunkSize: 1000,
      chunkOverlap: 100,
      shortDocThreshold: 100,
    });
    // "# Overview" splits into a separate section with ~10000 chars, divided by 1000-char chunks
    expect(chunks.length).toBeGreaterThan(5);
  });
});
