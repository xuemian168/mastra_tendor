import { describe, it, expect } from "vitest";
import { evaluate } from "../eval/evaluator.js";
import type { EvalCase } from "../eval/schemas/eval-dataset.schema.js";

function makeTenderCase(overrides: Partial<EvalCase> = {}): EvalCase {
  return {
    id: "test",
    category: "tender-bid-nobid",
    input: { documentText: "", analysisGoal: "" },
    expected: {},
    ...overrides,
  };
}

describe("evaluator fuzzy matching", () => {
  it("matches keyword when 60%+ words present", () => {
    const evalCase = makeTenderCase({
      expected: {
        expectedMandatoryRequirements: ["security clearance NV1"],
      },
    });
    const result = {
      mandatoryRequirements: ["NV1 clearance required for key personnel"],
    };
    const scores = evaluate(evalCase, result);
    expect(scores.mandatoryRequirementsCoverage).toBeGreaterThanOrEqual(0.5);
  });

  it("does not match when less than 60% words present", () => {
    const evalCase = makeTenderCase({
      expected: {
        expectedMandatoryRequirements: ["ISO 27001 certification required"],
      },
    });
    const result = {
      mandatoryRequirements: ["Experience required in cloud platforms"],
    };
    const scores = evaluate(evalCase, result);
    expect(scores.mandatoryRequirementsCoverage).toBeLessThan(1.0);
  });

  it("exact substring still matches", () => {
    const evalCase = makeTenderCase({
      expected: {
        expectedMandatoryRequirements: ["IRAP"],
      },
    });
    const result = {
      mandatoryRequirements: ["IRAP assessment at PROTECTED level"],
    };
    const scores = evaluate(evalCase, result);
    expect(scores.mandatoryRequirementsCoverage).toBe(1.0);
  });
});
