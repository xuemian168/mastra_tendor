import { Agent } from "@mastra/core/agent";
import { google } from "@ai-sdk/google";

export const complianceAgent = new Agent({
  name: "Compliance Analyst",
  model: google("gemini-2.5-flash"),
  instructions: `Extract compliance requirements from tender documents: technical specs, deadlines, mandatory requirements, qualifications. Be thorough—extract exact values, dates, and thresholds.`,
});
