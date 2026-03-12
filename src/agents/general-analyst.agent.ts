import { Agent } from "@mastra/core/agent";
import { google } from "@ai-sdk/google";

export const generalAnalystAgent = new Agent({
  id: "generalAnalystAgent",
  name: "General Document Analyst",
  model: google("gemini-2.5-flash"),
  defaultOptions: { modelSettings: { temperature: 0 } },
  instructions: `You are a versatile document analyst. Analyze documents based on the user's specific goal or intent. Adapt your analysis approach to match the document type and the requested analysis. Be thorough, cite specific details from the document, and provide actionable insights.`,
});
