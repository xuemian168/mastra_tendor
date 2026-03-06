import { describe, it, expect } from "vitest";
import { buildTenderPrompt, buildRagPrompt } from "../utils/prompt.js";
import type { TenderChunk } from "../rag/types.js";

describe("buildTenderPrompt", () => {
  it("should build prompt with title", () => {
    const result = buildTenderPrompt("Analyze this.", "Tender content", "My Title");
    expect(result).toContain("Analyze this.");
    expect(result).toContain("Title: My Title");
    expect(result).toContain("Tender content");
  });

  it("should build prompt without title", () => {
    const result = buildTenderPrompt("Analyze this.", "Tender content");
    expect(result).not.toContain("Title:");
    expect(result).toContain("Analyze this.");
    expect(result).toContain("Tender content");
  });
});

describe("buildRagPrompt", () => {
  const mockChunks: TenderChunk[] = [
    {
      id: "t-0",
      content: "ISO 27001 certification required",
      metadata: { tenderId: "t1", sectionType: "technical_requirements", sectionTitle: "Tech", chunkIndex: 0 },
    },
    {
      id: "t-1",
      content: "Deadline is 2026-05-01",
      metadata: { tenderId: "t1", sectionType: "timeline", sectionTitle: "Timeline", chunkIndex: 1 },
    },
  ];

  it("should build RAG prompt with chunks and title", () => {
    const result = buildRagPrompt("Analyze compliance.", mockChunks, "Cloud RFP");
    expect(result).toContain("Analyze compliance.");
    expect(result).toContain("Title: Cloud RFP");
    expect(result).toContain("Relevant sections:");
    expect(result).toContain("[technical_requirements] ISO 27001 certification required");
    expect(result).toContain("[timeline] Deadline is 2026-05-01");
    expect(result).toContain("---");
  });

  it("should build RAG prompt without title", () => {
    const result = buildRagPrompt("Analyze.", mockChunks);
    expect(result).not.toContain("Title:");
    expect(result).toContain("Relevant sections:");
  });

  it("should handle empty chunks", () => {
    const result = buildRagPrompt("Analyze.", []);
    expect(result).toContain("Relevant sections:");
  });
});
