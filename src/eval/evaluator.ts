import type { EvalCase } from "./schemas/eval-dataset.schema.js";

type Scores = Record<string, number>;

const RISK_LEVELS = ["low", "medium", "high", "critical"] as const;

function textContains(haystack: string, needle: string): boolean {
  return haystack.toLowerCase().includes(needle.toLowerCase());
}

function fuzzyKeywordMatch(haystack: string, needle: string): boolean {
  if (textContains(haystack, needle)) return true;
  const needleWords = needle.toLowerCase().split(/\s+/).filter((w) => w.length > 2);
  if (needleWords.length === 0) return textContains(haystack, needle);
  const haystackLower = haystack.toLowerCase();
  const matched = needleWords.filter((w) => haystackLower.includes(w));
  return matched.length / needleWords.length >= 0.6;
}

function coverageScore(expected: string[], actual: string[], fuzzy = false): number {
  if (expected.length === 0) return 1.0;
  const joined = actual.join(" ");
  const matchFn = fuzzy ? fuzzyKeywordMatch : textContains;
  const matched = expected.filter((kw) => matchFn(joined, kw));
  return matched.length / expected.length;
}

function riskDistance(a: string, b: string): number {
  const ia = RISK_LEVELS.indexOf(a as (typeof RISK_LEVELS)[number]);
  const ib = RISK_LEVELS.indexOf(b as (typeof RISK_LEVELS)[number]);
  if (ia === -1 || ib === -1) return 2;
  return Math.abs(ia - ib);
}

export function evaluateTenderBidNoBid(
  evalCase: EvalCase,
  result: Record<string, unknown>,
): Scores {
  const scores: Scores = {};
  const expected = evalCase.expected;

  // decisionMatch
  if (expected.decision) {
    scores.decisionMatch = result.decision === expected.decision ? 1.0 : 0.0;
  }

  // confidenceInRange
  if (expected.confidenceRange && typeof result.confidenceScore === "number") {
    const { min, max } = expected.confidenceRange;
    scores.confidenceInRange =
      result.confidenceScore >= min && result.confidenceScore <= max ? 1.0 : 0.0;
  }

  // strengthCoverage
  if (expected.mustMentionStrengths && Array.isArray(result.strengths)) {
    scores.strengthCoverage = coverageScore(
      expected.mustMentionStrengths,
      result.strengths as string[],
    );
  }

  // weaknessCoverage
  if (expected.mustMentionWeaknesses && Array.isArray(result.weaknesses)) {
    scores.weaknessCoverage = coverageScore(
      expected.mustMentionWeaknesses,
      result.weaknesses as string[],
    );
  }

  // riskLevelMatch
  if (expected.expectedRiskLevel && typeof result.overallRiskLevel === "string") {
    const dist = riskDistance(expected.expectedRiskLevel, result.overallRiskLevel);
    scores.riskLevelMatch = dist === 0 ? 1.0 : dist === 1 ? 0.5 : 0.0;
  }

  // complianceCompleteness
  if (expected.expectedDeadlineCount && Array.isArray(result.deadlines)) {
    scores.deadlineCount =
      (result.deadlines as string[]).length >= expected.expectedDeadlineCount.min
        ? 1.0
        : 0.0;
  }

  if (expected.expectedMandatoryRequirements && Array.isArray(result.mandatoryRequirements)) {
    scores.mandatoryRequirementsCoverage = coverageScore(
      expected.expectedMandatoryRequirements,
      result.mandatoryRequirements as string[],
      true,
    );
  }

  return scores;
}

export function evaluateGeneralAnalysis(
  evalCase: EvalCase,
  result: Record<string, unknown>,
): Scores {
  const scores: Scores = {};
  const expected = evalCase.expected;

  if (expected.mustCoverTopics) {
    const findings = Array.isArray(result.keyFindings)
      ? (result.keyFindings as Array<{ finding: string; category: string }>).map(
          (f) => `${f.category} ${f.finding}`,
        )
      : [];
    const summary = typeof result.summary === "string" ? result.summary : "";
    scores.topicCoverage = coverageScore(expected.mustCoverTopics, [...findings, summary]);
  }

  if (expected.minKeyFindings != null && Array.isArray(result.keyFindings)) {
    scores.findingsCount =
      (result.keyFindings as unknown[]).length >= expected.minKeyFindings ? 1.0 : 0.0;
  }

  return scores;
}

export function evaluateDocumentSummary(
  evalCase: EvalCase,
  result: Record<string, unknown>,
): Scores {
  const scores: Scores = {};
  const expected = evalCase.expected;

  if (expected.minKeyPoints != null && Array.isArray(result.keyPoints)) {
    scores.keyPointsCount =
      (result.keyPoints as unknown[]).length >= expected.minKeyPoints ? 1.0 : 0.0;
  }

  if (expected.mustCoverTopics) {
    const keyPoints = Array.isArray(result.keyPoints) ? (result.keyPoints as string[]) : [];
    const sections = Array.isArray(result.sections)
      ? (result.sections as Array<{ heading: string; content: string }>).map(
          (s) => `${s.heading} ${s.content}`,
        )
      : [];
    const overview = typeof result.overview === "string" ? result.overview : "";
    scores.topicCoverage = coverageScore(expected.mustCoverTopics, [
      ...keyPoints,
      ...sections,
      overview,
    ]);
  }

  return scores;
}

export function evaluate(evalCase: EvalCase, result: Record<string, unknown>): Scores {
  switch (evalCase.category) {
    case "tender-bid-nobid":
      return evaluateTenderBidNoBid(evalCase, result);
    case "general-analysis":
      return evaluateGeneralAnalysis(evalCase, result);
    case "document-summary":
      return evaluateDocumentSummary(evalCase, result);
  }
}

export function isPassed(scores: Scores): boolean {
  const values = Object.values(scores);
  if (values.length === 0) return false;
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  return avg >= 0.6;
}
