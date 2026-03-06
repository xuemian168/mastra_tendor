import { describe, it, expect, vi, beforeEach } from "vitest";
import { complianceAgent } from "../agents/compliance.agent.js";
import { riskAgent } from "../agents/risk.agent.js";
import { strategyAgent } from "../agents/strategy.agent.js";
import { tenderAnalysisWorkflow } from "../workflows/tender-analysis.workflow.js";
import type {
  ComplianceOutput,
  RiskOutput,
  StrategyOutput,
} from "../schemas/index.js";

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
  technicalSpecs: ["Kubernetes orchestration", "Multi-region deployment"],
  deadlines: ["RFP response due 2026-06-01"],
  mandatoryRequirements: ["SOC 2 Type II"],
  qualifications: ["3+ years Kubernetes experience"],
  summary: "Cloud-native infrastructure tender with security focus.",
};

const mockRiskOutput: RiskOutput = {
  overallRiskLevel: "low",
  difficultyAssessment: {
    technicalComplexity: "medium",
    resourceRequirements: "low",
    timelineFeasibility: "feasible",
  },
  penaltyClauses: [],
  deliveryRisks: ["Minor scope ambiguity in monitoring requirements"],
  summary: "Low overall risk. Well-defined requirements with achievable timeline.",
};

const mockStrategyOutput: StrategyOutput = {
  decision: "bid",
  confidenceScore: 85,
  rationale: "Strong fit with low risk and clear requirements.",
  strengths: ["Direct Kubernetes expertise", "SOC 2 compliant"],
  weaknesses: ["Minor monitoring scope ambiguity"],
  keyConditions: [],
  recommendedActions: ["Submit full bid", "Clarify monitoring scope in Q&A"],
  executiveSummary:
    "Strong bid opportunity with 85% confidence. Low risk, good technical alignment.",
};

describe("tenderAnalysisWorkflow", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("should execute ingest → parallel compliance + risk → strategy", async () => {
    vi.spyOn(complianceAgent, "generate").mockResolvedValue({
      object: mockComplianceOutput,
    } as any);
    vi.spyOn(riskAgent, "generate").mockResolvedValue({
      object: mockRiskOutput,
    } as any);
    vi.spyOn(strategyAgent, "generate").mockResolvedValue({
      object: mockStrategyOutput,
    } as any);

    const run = await tenderAnalysisWorkflow.createRun({
      inputData: {
        tenderText: "Deploy a Kubernetes-based cloud infrastructure...",
        tenderTitle: "Cloud Infrastructure RFP",
      },
    });
    const result = await run.start({
      inputData: {
        tenderText: "Deploy a Kubernetes-based cloud infrastructure...",
        tenderTitle: "Cloud Infrastructure RFP",
      },
    });

    expect(complianceAgent.generate).toHaveBeenCalledOnce();
    expect(riskAgent.generate).toHaveBeenCalledOnce();
    expect(strategyAgent.generate).toHaveBeenCalledOnce();

    // Strategy agent should receive compliance and risk data
    const strategyPrompt = vi.mocked(strategyAgent.generate).mock.calls[0][0];
    expect(strategyPrompt).toContain("Kubernetes orchestration");
    expect(strategyPrompt).toContain("low"); // risk level

    // Verify final output
    const finalResult = result?.results?.["strategy-step"];
    if (finalResult?.status === "success") {
      expect(finalResult.output.decision).toBe("bid");
      expect(finalResult.output.confidenceScore).toBe(85);
    }
  });
});
