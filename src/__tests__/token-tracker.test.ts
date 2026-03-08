import { describe, it, expect, beforeEach } from "vitest";
import { TokenTracker } from "../utils/token-tracker.js";

describe("TokenTracker", () => {
  let tracker: TokenTracker;

  beforeEach(() => {
    tracker = new TokenTracker();
  });

  it("should start with empty usage", () => {
    const summary = tracker.getSummary();
    expect(summary.total).toBe(0);
    expect(summary.byStep).toHaveLength(0);
  });

  it("should record token usage for a step", () => {
    tracker.record("compliance-step", 100, 50);
    const summary = tracker.getSummary();
    expect(summary.totalPrompt).toBe(100);
    expect(summary.totalCompletion).toBe(50);
    expect(summary.total).toBe(150);
    expect(summary.byStep).toHaveLength(1);
    expect(summary.byStep[0]).toEqual({
      step: "compliance-step",
      promptTokens: 100,
      completionTokens: 50,
    });
  });

  it("should accumulate usage across multiple steps", () => {
    tracker.record("compliance-step", 100, 50);
    tracker.record("risk-step", 120, 60);
    tracker.record("strategy-step", 200, 80);
    const summary = tracker.getSummary();
    expect(summary.totalPrompt).toBe(420);
    expect(summary.totalCompletion).toBe(190);
    expect(summary.total).toBe(610);
    expect(summary.byStep).toHaveLength(3);
  });

  it("should reset usage", () => {
    tracker.record("compliance-step", 100, 50);
    tracker.reset();
    const summary = tracker.getSummary();
    expect(summary.total).toBe(0);
    expect(summary.byStep).toHaveLength(0);
  });

  it("should track step timings", async () => {
    tracker.startStep("test-step");
    await new Promise((r) => setTimeout(r, 50));
    tracker.completeStep("test-step");
    const timings = tracker.getTimings();
    expect(timings).toHaveLength(1);
    expect(timings[0].step).toBe("test-step");
    expect(timings[0].durationMs).toBeGreaterThanOrEqual(40);
  });

  it("should not include incomplete timings", () => {
    tracker.startStep("incomplete-step");
    const timings = tracker.getTimings();
    expect(timings).toHaveLength(0);
  });

  it("should reset timings", () => {
    tracker.startStep("step-a");
    tracker.completeStep("step-a");
    tracker.reset();
    expect(tracker.getTimings()).toHaveLength(0);
  });
});
