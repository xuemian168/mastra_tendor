import { createStep } from "@mastra/core/workflows";
import { ingestOutputSchema } from "../../schemas/ingest-output.schema.js";
import { riskOutputSchema } from "../../schemas/risk.schema.js";
import { riskAgent } from "../../agents/index.js";
import { buildTenderPrompt, buildRagPrompt } from "../../utils/prompt.js";
import { tokenTracker } from "../../utils/token-tracker.js";
import { vectorStore } from "../../rag/in-memory-vector-store.js";
import { retrieveForAgent, RISK_RETRIEVAL_CONFIG } from "../../rag/retriever.js";
import { embedQuery } from "../../rag/embedder.js";

export const riskStep = createStep({
  id: "risk-step",
  inputSchema: ingestOutputSchema,
  outputSchema: riskOutputSchema,
  execute: async ({ inputData }) => {
    let prompt: string;

    if (inputData.fullText) {
      prompt = buildTenderPrompt(
        "Analyze the following tender document for risks.",
        inputData.fullText,
        inputData.tenderTitle,
      );
    } else {
      const chunks = await retrieveForAgent(
        vectorStore,
        inputData.indexName,
        RISK_RETRIEVAL_CONFIG,
        embedQuery,
      );
      prompt = buildRagPrompt(
        "Analyze the following tender document for risks.",
        chunks,
        inputData.tenderTitle,
      );
    }

    const result = await riskAgent.generate(prompt, {
      structuredOutput: { schema: riskOutputSchema },
    });

    if (result.usage) {
      tokenTracker.record("risk-step", result.usage.promptTokens, result.usage.completionTokens);
    }

    return result.object;
  },
});
