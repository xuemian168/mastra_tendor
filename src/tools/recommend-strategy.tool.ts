import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { strategyAgent } from "../agents/strategy.agent.js";
import { strategyOutputSchema } from "../schemas/strategy.schema.js";
import { tokenTracker } from "../utils/token-tracker.js";
import { historyStore } from "../rag/history-store.js";
import { embedQuery } from "../rag/embedder.js";

export const recommendStrategyTool = createTool({
  id: "recommend-strategy",
  description:
    "Synthesize compliance and risk analyses into a Bid/No-Bid recommendation. " +
    "Call this AFTER analyze-compliance and assess-risk have completed.",
  inputSchema: z.object({
    complianceSummary: z.string().describe("Summary from compliance analysis"),
    technicalSpecs: z.array(z.string()).describe("Technical specifications found"),
    deadlines: z.array(z.string()).describe("Deadlines found"),
    mandatoryRequirements: z.array(z.string()).describe("Mandatory requirements"),
    qualifications: z.array(z.string()).describe("Required qualifications"),
    overallRiskLevel: z.string().describe("Overall risk level (low/medium/high/critical)"),
    technicalComplexity: z.string().describe("Technical complexity level"),
    resourceRequirements: z.string().describe("Resource requirements level"),
    timelineFeasibility: z.string().describe("Timeline feasibility assessment"),
    penaltyClauses: z.array(z.string()).describe("Penalty clauses found"),
    deliveryRisks: z.array(z.string()).describe("Delivery risks identified"),
    riskSummary: z.string().describe("Summary from risk assessment"),
    companyProfile: z.string().optional().describe("Optional company profile for context"),
  }),
  execute: async (inputData) => {
    let prompt = `Based on the following analyses, provide a Bid/No-Bid recommendation.

## Compliance Analysis
- Technical Specs: ${inputData.technicalSpecs.join("; ") || "None"}
- Deadlines: ${inputData.deadlines.join("; ") || "None"}
- Mandatory Requirements: ${inputData.mandatoryRequirements.join("; ") || "None"}
- Qualifications: ${inputData.qualifications.join("; ") || "None"}
- Summary: ${inputData.complianceSummary}

## Risk Analysis
- Overall Risk Level: ${inputData.overallRiskLevel}
- Technical Complexity: ${inputData.technicalComplexity}
- Resource Requirements: ${inputData.resourceRequirements}
- Timeline Feasibility: ${inputData.timelineFeasibility}
- Penalty Clauses: ${inputData.penaltyClauses.join("; ") || "None"}
- Delivery Risks: ${inputData.deliveryRisks.join("; ") || "None"}
- Summary: ${inputData.riskSummary}`;

    if (inputData.companyProfile) {
      prompt += `\n\n## Company Profile\n${inputData.companyProfile}`;
    }

    try {
      const historicalCases = await historyStore.findSimilar(
        `${inputData.complianceSummary} ${inputData.riskSummary}`,
        embedQuery,
      );
      if (historicalCases.length > 0) {
        prompt += "\n\n## Historical Reference";
        for (const h of historicalCases) {
          prompt += `\n- [${h.decision}] ${h.tenderTitle} (confidence: ${h.confidenceScore}%): ${h.summary}`;
        }
      }
    } catch {
      // History retrieval is best-effort
    }

    try {
      const result = await strategyAgent.generate(prompt, {
        structuredOutput: { schema: strategyOutputSchema },
      });

      if (result.usage) {
        tokenTracker.record("strategy-tool", result.usage.promptTokens, result.usage.completionTokens);
      }

      return result.object;
    } catch (error) {
      return {
        error: true,
        message: `Tool execution failed: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  },
});
