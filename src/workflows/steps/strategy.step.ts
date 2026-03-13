import { z } from "zod";
import { createStep } from "@mastra/core/workflows";
import {
  complianceOutputSchema,
  riskOutputSchema,
  strategyOutputSchema,
} from "../../schemas/index.js";
import { strategyAgent } from "../../agents/index.js";
import { tokenTracker } from "../../utils/token-tracker.js";
import { buildStrategyPrompt } from "../../utils/prompt.js";
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
    tokenTracker.startStep("strategy-step");
    const compliance = inputData["compliance-step"];
    const risk = inputData["risk-step"];
    const initData = getInitData() as { companyProfile?: string } | undefined;

    let prompt = buildStrategyPrompt({
      complianceSummary: compliance.summary,
      technicalSpecs: compliance.technicalSpecs,
      deadlines: compliance.deadlines,
      mandatoryRequirements: compliance.mandatoryRequirements,
      qualifications: compliance.qualifications,
      overallRiskLevel: risk.overallRiskLevel,
      technicalComplexity: risk.difficultyAssessment.technicalComplexity,
      resourceRequirements: risk.difficultyAssessment.resourceRequirements,
      timelineFeasibility: risk.difficultyAssessment.timelineFeasibility,
      penaltyClauses: risk.penaltyClauses,
      deliveryRisks: risk.deliveryRisks,
      riskSummary: risk.summary,
      companyProfile: initData?.companyProfile,
    });

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
      tokenTracker.record("strategy-step", result.usage.inputTokens ?? 0, result.usage.outputTokens ?? 0);
    }

    tokenTracker.completeStep("strategy-step");
    return result.object;
  },
});
