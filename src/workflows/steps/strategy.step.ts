import { z } from "zod";
import { createStep } from "@mastra/core/workflows";
import {
  complianceOutputSchema,
  riskOutputSchema,
  strategyOutputSchema,
} from "../../schemas/index.js";
import { strategyAgent } from "../../agents/index.js";
import { tokenTracker } from "../../utils/token-tracker.js";
import { historyStore } from "../../rag/history-store.js";
import { embedQuery } from "../../rag/embedder.js";

export const strategyInputSchema = z.object({
  "compliance-step": complianceOutputSchema,
  "risk-step": riskOutputSchema,
});

export const strategyStep = createStep({
  id: "strategy-step",
  inputSchema: strategyInputSchema,
  outputSchema: strategyOutputSchema,
  execute: async ({ inputData, getInitData }) => {
    const compliance = inputData["compliance-step"];
    const risk = inputData["risk-step"];
    const initData = getInitData() as { companyProfile?: string } | undefined;

    let prompt = `Based on the following analyses, provide a Bid/No-Bid recommendation.

## Compliance Analysis
- Technical Specs: ${compliance.technicalSpecs.join("; ") || "None"}
- Deadlines: ${compliance.deadlines.join("; ") || "None"}
- Mandatory Requirements: ${compliance.mandatoryRequirements.join("; ") || "None"}
- Qualifications: ${compliance.qualifications.join("; ") || "None"}
- Summary: ${compliance.summary}

## Risk Analysis
- Overall Risk Level: ${risk.overallRiskLevel}
- Technical Complexity: ${risk.difficultyAssessment.technicalComplexity}
- Resource Requirements: ${risk.difficultyAssessment.resourceRequirements}
- Timeline Feasibility: ${risk.difficultyAssessment.timelineFeasibility}
- Penalty Clauses: ${risk.penaltyClauses.join("; ") || "None"}
- Delivery Risks: ${risk.deliveryRisks.join("; ") || "None"}
- Summary: ${risk.summary}`;

    if (initData?.companyProfile) {
      prompt += `\n\n## Company Profile\n${initData.companyProfile}`;
    }

    try {
      const historicalCases = await historyStore.findSimilar(
        `${compliance.summary} ${risk.summary}`,
        embedQuery,
      );

      if (historicalCases.length > 0) {
        prompt += "\n\n## Historical Reference";
        for (const h of historicalCases) {
          prompt += `\n- [${h.decision}] ${h.tenderTitle} (confidence: ${h.confidenceScore}%): ${h.summary}`;
        }
      }
    } catch {
      // History retrieval is best-effort; skip if it fails
    }

    const result = await strategyAgent.generate(prompt, {
      structuredOutput: { schema: strategyOutputSchema },
    });

    if (result.usage) {
      tokenTracker.record("strategy-step", result.usage.promptTokens, result.usage.completionTokens);
    }

    return result.object;
  },
});
