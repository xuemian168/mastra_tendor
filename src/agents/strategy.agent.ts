import { Agent } from "@mastra/core/agent";
import { google } from "@ai-sdk/google";

export const strategyAgent = new Agent({
  id: "strategyAgent",
  name: "Strategy Advisor",
  model: google("gemini-2.5-pro"),
  defaultOptions: { modelSettings: { temperature: 0 } },
  instructions: `Synthesize compliance and risk analyses into a Bid/No-Bid recommendation. Be decisive—provide clear rationale, strengths, weaknesses, conditions, and actionable next steps.`,
});
