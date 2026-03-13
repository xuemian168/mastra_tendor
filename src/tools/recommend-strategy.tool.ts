import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { strategyAgent } from "../agents/strategy.agent.js";
import { strategyOutputSchema } from "../schemas/strategy.schema.js";
import { historyStore } from "../rag/history-store.js";
import { embedQuery } from "../rag/embedder.js";
import { buildStrategyPrompt } from "../utils/prompt.js";
import { createEmit, withTokenTracking, recordUsage } from "./tool-helpers.js";

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
  execute: async (inputData, context) => {
    const emit = createEmit(context, "recommend-strategy");

    return withTokenTracking("strategy-tool", async () => {
      await emit("Compiling compliance and risk data");
      let prompt = buildStrategyPrompt(inputData);

      try {
        const historicalCases = await historyStore.findSimilar(
          `${inputData.complianceSummary} ${inputData.riskSummary}`,
          embedQuery,
        );
        if (historicalCases.length > 0) {
          await emit(`Found ${historicalCases.length} historical references`);
          prompt += "\n\n## Historical Reference";
          for (const h of historicalCases) {
            prompt += `\n- [${h.decision}] ${h.tenderTitle} (confidence: ${h.confidenceScore}%): ${h.summary}`;
          }
        } else {
          await emit("No historical references found");
        }
      } catch {
        // History retrieval is best-effort
      }

      await emit("Synthesizing Bid/No-Bid recommendation");
      const result = await strategyAgent.generate(prompt, {
        structuredOutput: { schema: strategyOutputSchema },
      });
      recordUsage("strategy-tool", result.usage);

      return result.object;
    });
  },
});
