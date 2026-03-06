import { describe, it, expect } from "vitest";
import {
  tenderInputSchema,
  complianceOutputSchema,
  riskOutputSchema,
  strategyOutputSchema,
  ingestOutputSchema,
} from "../schemas/index.js";

describe("tenderInputSchema", () => {
  it("should accept valid input with tenderText", () => {
    const result = tenderInputSchema.parse({ tenderText: "Some tender text" });
    expect(result.tenderText).toBe("Some tender text");
    expect(result.tenderTitle).toBeUndefined();
  });

  it("should accept valid input with tenderTitle", () => {
    const result = tenderInputSchema.parse({
      tenderText: "Some tender text",
      tenderTitle: "Project X",
    });
    expect(result.tenderTitle).toBe("Project X");
  });

  it("should reject empty tenderText", () => {
    expect(() => tenderInputSchema.parse({ tenderText: "" })).toThrow();
  });

  it("should reject missing tenderText", () => {
    expect(() => tenderInputSchema.parse({})).toThrow();
  });

  it("should accept optional companyProfile", () => {
    const result = tenderInputSchema.parse({
      tenderText: "Some tender text",
      companyProfile: "We specialize in cloud infrastructure",
    });
    expect(result.companyProfile).toBe("We specialize in cloud infrastructure");
  });

  it("should accept input without companyProfile", () => {
    const result = tenderInputSchema.parse({ tenderText: "Some tender text" });
    expect(result.companyProfile).toBeUndefined();
  });
});

describe("ingestOutputSchema", () => {
  it("should accept valid ingest output", () => {
    const result = ingestOutputSchema.parse({
      tenderId: "tender-123",
      chunkCount: 10,
      indexName: "index-tender-123",
    });
    expect(result.tenderId).toBe("tender-123");
    expect(result.chunkCount).toBe(10);
    expect(result.tenderTitle).toBeUndefined();
  });

  it("should accept ingest output with tenderTitle", () => {
    const result = ingestOutputSchema.parse({
      tenderId: "tender-123",
      chunkCount: 5,
      indexName: "index-tender-123",
      tenderTitle: "Cloud RFP",
    });
    expect(result.tenderTitle).toBe("Cloud RFP");
  });

  it("should reject missing required fields", () => {
    expect(() => ingestOutputSchema.parse({ tenderId: "tender-123" })).toThrow();
  });
});

describe("complianceOutputSchema", () => {
  const validCompliance = {
    technicalSpecs: ["ISO 27001 certification required"],
    deadlines: ["Submission by 2026-04-01"],
    mandatoryRequirements: ["5 years of experience"],
    qualifications: ["AWS certified team"],
    summary: "Standard compliance requirements",
  };

  it("should accept valid compliance output", () => {
    const result = complianceOutputSchema.parse(validCompliance);
    expect(result.technicalSpecs).toHaveLength(1);
    expect(result.summary).toBe("Standard compliance requirements");
  });

  it("should reject missing fields", () => {
    expect(() =>
      complianceOutputSchema.parse({ technicalSpecs: [] })
    ).toThrow();
  });
});

describe("riskOutputSchema", () => {
  const validRisk = {
    overallRiskLevel: "medium",
    difficultyAssessment: {
      technicalComplexity: "high",
      resourceRequirements: "medium",
      timelineFeasibility: "tight",
    },
    penaltyClauses: ["10% penalty for late delivery"],
    deliveryRisks: ["Dependency on third-party API"],
    summary: "Moderate risk with high technical complexity",
  };

  it("should accept valid risk output", () => {
    const result = riskOutputSchema.parse(validRisk);
    expect(result.overallRiskLevel).toBe("medium");
    expect(result.difficultyAssessment.technicalComplexity).toBe("high");
  });

  it("should reject invalid risk level", () => {
    expect(() =>
      riskOutputSchema.parse({ ...validRisk, overallRiskLevel: "unknown" })
    ).toThrow();
  });

  it("should reject invalid feasibility value", () => {
    expect(() =>
      riskOutputSchema.parse({
        ...validRisk,
        difficultyAssessment: {
          ...validRisk.difficultyAssessment,
          timelineFeasibility: "maybe",
        },
      })
    ).toThrow();
  });
});

describe("strategyOutputSchema", () => {
  const validStrategy = {
    decision: "conditional_bid",
    confidenceScore: 72,
    rationale: "Risk is manageable with conditions",
    strengths: ["Strong team experience"],
    weaknesses: ["Tight timeline"],
    keyConditions: ["Extend deadline by 2 weeks"],
    recommendedActions: ["Negotiate timeline", "Assign senior lead"],
    executiveSummary: "Recommend conditional bid with timeline negotiation.",
  };

  it("should accept valid strategy output", () => {
    const result = strategyOutputSchema.parse(validStrategy);
    expect(result.decision).toBe("conditional_bid");
    expect(result.confidenceScore).toBe(72);
  });

  it("should reject invalid decision", () => {
    expect(() =>
      strategyOutputSchema.parse({ ...validStrategy, decision: "maybe" })
    ).toThrow();
  });

  it("should reject confidence score out of range", () => {
    expect(() =>
      strategyOutputSchema.parse({ ...validStrategy, confidenceScore: 150 })
    ).toThrow();
    expect(() =>
      strategyOutputSchema.parse({ ...validStrategy, confidenceScore: -1 })
    ).toThrow();
  });
});
