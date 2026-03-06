import { describe, it, expect, vi, beforeEach } from "vitest";
import { complianceAgent } from "../agents/compliance.agent.js";
import { riskAgent } from "../agents/risk.agent.js";
import { strategyAgent } from "../agents/strategy.agent.js";
import type { ComplianceOutput, RiskOutput, StrategyOutput } from "../schemas/index.js";

// Mock embedder to avoid real API calls
vi.mock("../rag/embedder.js", () => ({
  embedTexts: vi.fn(async (texts: string[]) =>
    texts.map((_, i) => Array.from({ length: 3072 }, (__, j) => Math.sin(i + j)))
  ),
  embedQuery: vi.fn(async () =>
    Array.from({ length: 3072 }, (_, j) => Math.sin(j))
  ),
}));

const mockComplianceOutput: ComplianceOutput = {
  technicalSpecs: ["REST API with 99.9% uptime SLA"],
  deadlines: ["Proposal due 2026-05-01", "Delivery by 2026-12-31"],
  mandatoryRequirements: ["ISO 27001 certified", "GDPR compliant"],
  qualifications: ["5+ years cloud infrastructure experience"],
  summary: "Standard enterprise tender with strict security requirements.",
};

const mockRiskOutput: RiskOutput = {
  overallRiskLevel: "medium",
  difficultyAssessment: {
    technicalComplexity: "high",
    resourceRequirements: "medium",
    timelineFeasibility: "tight",
  },
  penaltyClauses: ["5% penalty per week of delay"],
  deliveryRisks: ["Third-party integration dependency"],
  summary: "Moderate risk due to technical complexity and tight timeline.",
};

const mockStrategyOutput: StrategyOutput = {
  decision: "conditional_bid",
  confidenceScore: 68,
  rationale: "Strong technical fit but timeline risk requires negotiation.",
  strengths: ["Team has relevant ISO 27001 experience"],
  weaknesses: ["Tight 8-month delivery window"],
  keyConditions: ["Negotiate 2-month timeline extension"],
  recommendedActions: ["Submit conditional bid", "Propose phased delivery"],
  executiveSummary:
    "Recommend conditional bid pending timeline negotiation. Strong compliance fit with manageable risks.",
};

describe("complianceStep", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("should call complianceAgent.generate with RAG-retrieved chunks", async () => {
    const generateSpy = vi
      .spyOn(complianceAgent, "generate")
      .mockResolvedValue({ object: mockComplianceOutput } as any);

    // Set up vector store with test data
    const { vectorStore } = await import("../rag/in-memory-vector-store.js");
    const { embedTexts } = await import("../rag/embedder.js");

    const indexName = "test-compliance-index";
    vectorStore.createIndex({ indexName, dimension: 3072 });

    const testChunks = [
      { id: "c-0", content: "Technical specifications require ISO 27001", sectionType: "technical_requirements", sectionTitle: "Technical Requirements", chunkIndex: 0, tenderId: "test" },
      { id: "c-1", content: "Submission deadline is 2026-05-01", sectionType: "timeline", sectionTitle: "Timeline", chunkIndex: 1, tenderId: "test" },
    ];

    const vectors = await embedTexts(testChunks.map(c => c.content));
    vectorStore.upsert({
      indexName,
      vectors,
      metadata: testChunks.map(c => ({ ...c, content: c.content })),
      ids: testChunks.map(c => c.id),
    });

    const { complianceStep } = await import(
      "../workflows/steps/compliance.step.js"
    );

    const result = await complianceStep.execute!({
      inputData: {
        tenderId: "test",
        chunkCount: 2,
        indexName,
        tenderTitle: "Cloud RFP",
      },
      mapiStep: {} as any,
      getInitData: (() => ({})) as any,
      getStepResult: (() => ({})) as any,
      runtimeContext: {} as any,
    });

    expect(generateSpy).toHaveBeenCalledOnce();
    const [prompt, options] = generateSpy.mock.calls[0];
    expect(prompt).toContain("Cloud RFP");
    expect(prompt).toContain("Relevant sections:");
    expect(options).toHaveProperty("structuredOutput");
    expect(result).toEqual(mockComplianceOutput);

    // Cleanup
    vectorStore.deleteIndex(indexName);
  });
});

describe("complianceStep (short doc fast path)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("should use full text directly for short documents without RAG", async () => {
    const generateSpy = vi
      .spyOn(complianceAgent, "generate")
      .mockResolvedValue({ object: mockComplianceOutput } as any);

    const { complianceStep } = await import(
      "../workflows/steps/compliance.step.js"
    );

    const result = await complianceStep.execute!({
      inputData: {
        tenderId: "test-short",
        chunkCount: 0,
        indexName: "unused",
        tenderTitle: "Short RFP",
        fullText: "Build a simple website with ISO 27001 compliance.",
      },
      mapiStep: {} as any,
      getInitData: (() => ({})) as any,
      getStepResult: (() => ({})) as any,
      runtimeContext: {} as any,
    });

    expect(generateSpy).toHaveBeenCalledOnce();
    const [prompt] = generateSpy.mock.calls[0];
    expect(prompt).toContain("Build a simple website");
    expect(prompt).toContain("Short RFP");
    expect(prompt).not.toContain("Relevant sections:");
    expect(result).toEqual(mockComplianceOutput);
  });
});

describe("riskStep", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("should call riskAgent.generate with RAG-retrieved chunks", async () => {
    const generateSpy = vi
      .spyOn(riskAgent, "generate")
      .mockResolvedValue({ object: mockRiskOutput } as any);

    const { vectorStore } = await import("../rag/in-memory-vector-store.js");
    const { embedTexts } = await import("../rag/embedder.js");

    const indexName = "test-risk-index";
    vectorStore.createIndex({ indexName, dimension: 3072 });

    const testChunks = [
      { id: "r-0", content: "Penalty of 5% per week for late delivery", sectionType: "penalties", sectionTitle: "Penalties", chunkIndex: 0, tenderId: "test" },
    ];

    const vectors = await embedTexts(testChunks.map(c => c.content));
    vectorStore.upsert({
      indexName,
      vectors,
      metadata: testChunks.map(c => ({ ...c, content: c.content })),
      ids: testChunks.map(c => c.id),
    });

    const { riskStep } = await import("../workflows/steps/risk.step.js");

    const result = await riskStep.execute!({
      inputData: {
        tenderId: "test",
        chunkCount: 1,
        indexName,
        tenderTitle: undefined,
      },
      mapiStep: {} as any,
      getInitData: (() => ({})) as any,
      getStepResult: (() => ({})) as any,
      runtimeContext: {} as any,
    });

    expect(generateSpy).toHaveBeenCalledOnce();
    const [prompt] = generateSpy.mock.calls[0];
    expect(prompt).toContain("Relevant sections:");
    expect(result).toEqual(mockRiskOutput);

    vectorStore.deleteIndex(indexName);
  });
});

describe("riskStep (short doc fast path)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("should use full text directly for short documents without RAG", async () => {
    const generateSpy = vi
      .spyOn(riskAgent, "generate")
      .mockResolvedValue({ object: mockRiskOutput } as any);

    const { riskStep } = await import("../workflows/steps/risk.step.js");

    const result = await riskStep.execute!({
      inputData: {
        tenderId: "test-short",
        chunkCount: 0,
        indexName: "unused",
        fullText: "10% penalty for late delivery. SLA: 99.9% uptime.",
      },
      mapiStep: {} as any,
      getInitData: (() => ({})) as any,
      getStepResult: (() => ({})) as any,
      runtimeContext: {} as any,
    });

    expect(generateSpy).toHaveBeenCalledOnce();
    const [prompt] = generateSpy.mock.calls[0];
    expect(prompt).toContain("10% penalty");
    expect(prompt).not.toContain("Relevant sections:");
    expect(result).toEqual(mockRiskOutput);
  });
});

describe("strategyStep", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("should call strategyAgent.generate with compliance and risk data", async () => {
    const generateSpy = vi
      .spyOn(strategyAgent, "generate")
      .mockResolvedValue({ object: mockStrategyOutput } as any);

    const { strategyStep } = await import(
      "../workflows/steps/strategy.step.js"
    );

    const result = await strategyStep.execute!({
      inputData: {
        "compliance-step": mockComplianceOutput,
        "risk-step": mockRiskOutput,
      },
      mapiStep: {} as any,
      getInitData: (() => ({})) as any,
      getStepResult: (() => ({})) as any,
      runtimeContext: {} as any,
    });

    expect(generateSpy).toHaveBeenCalledOnce();
    const [prompt] = generateSpy.mock.calls[0];
    expect(prompt).toContain("medium"); // overallRiskLevel
    expect(prompt).toContain("ISO 27001 certified"); // from compliance
    expect(prompt).toContain("5% penalty per week"); // from risk
    expect(result).toEqual(mockStrategyOutput);
  });
});
