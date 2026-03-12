import { Agent } from "@mastra/core/agent";
import { google } from "@ai-sdk/google";

export const riskAgent = new Agent({
  id: "risk-analyst",
  name: "Risk Analyst",
  model: google("gemini-2.5-flash"),
  defaultOptions: { modelSettings: { temperature: 0 } },
  instructions: `Assess tender risks: overall risk level, technical complexity, resource needs, timeline feasibility, penalty clauses, and delivery risks. Be objective—cite specific clauses driving risk ratings.`,
});
