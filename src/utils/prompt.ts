import type { TenderChunk } from "../rag/types.js";

export function buildTenderPrompt(task: string, text: string, title?: string): string {
  return `${task}${title ? `\nTitle: ${title}` : ""}\n\n${text}`;
}

export function buildRagPrompt(task: string, chunks: TenderChunk[], title?: string): string {
  const context = chunks
    .map((c) => `[${c.metadata.sectionType}] ${c.content}`)
    .join("\n\n---\n\n");
  return `${task}${title ? `\nTitle: ${title}` : ""}\n\nRelevant sections:\n${context}`;
}

/**
 * Builds a strategy prompt from compliance + risk analysis results.
 * Shared between recommend-strategy tool (flat input) and strategy step (nested input).
 */
export interface StrategyPromptInput {
  complianceSummary: string;
  technicalSpecs: string[];
  deadlines: string[];
  mandatoryRequirements: string[];
  qualifications: string[];
  overallRiskLevel: string;
  technicalComplexity: string;
  resourceRequirements: string;
  timelineFeasibility: string;
  penaltyClauses: string[];
  deliveryRisks: string[];
  riskSummary: string;
  companyProfile?: string;
}

export function buildStrategyPrompt(input: StrategyPromptInput): string {
  let prompt = `Based on the following analyses, provide a Bid/No-Bid recommendation.

## Compliance Analysis
- Technical Specs: ${input.technicalSpecs.join("; ") || "None"}
- Deadlines: ${input.deadlines.join("; ") || "None"}
- Mandatory Requirements: ${input.mandatoryRequirements.join("; ") || "None"}
- Qualifications: ${input.qualifications.join("; ") || "None"}
- Summary: ${input.complianceSummary}

## Risk Analysis
- Overall Risk Level: ${input.overallRiskLevel}
- Technical Complexity: ${input.technicalComplexity}
- Resource Requirements: ${input.resourceRequirements}
- Timeline Feasibility: ${input.timelineFeasibility}
- Penalty Clauses: ${input.penaltyClauses.join("; ") || "None"}
- Delivery Risks: ${input.deliveryRisks.join("; ") || "None"}
- Summary: ${input.riskSummary}`;

  if (input.companyProfile) {
    prompt += `\n\n## Company Profile\n${input.companyProfile}`;
  }

  return prompt;
}
