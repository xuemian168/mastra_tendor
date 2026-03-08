import { createStep } from "@mastra/core/workflows";
import { ingestOutputSchema } from "../../schemas/ingest-output.schema.js";
import { complianceOutputSchema } from "../../schemas/compliance.schema.js";
import { complianceAgent } from "../../agents/index.js";
import { buildTenderPrompt, buildRagPrompt } from "../../utils/prompt.js";
import { tokenTracker } from "../../utils/token-tracker.js";
import { vectorStore } from "../../rag/in-memory-vector-store.js";
import { retrieveForAgent, COMPLIANCE_RETRIEVAL_CONFIG } from "../../rag/retriever.js";
import { embedQuery } from "../../rag/embedder.js";

export const complianceStep = createStep({
  id: "compliance-step",
  inputSchema: ingestOutputSchema,
  outputSchema: complianceOutputSchema,
  execute: async ({ inputData }) => {
    tokenTracker.startStep("compliance-step");
    let prompt: string;

    if (inputData.fullText) {
      prompt = buildTenderPrompt(
        "Analyze the following tender document for compliance requirements.",
        inputData.fullText,
        inputData.tenderTitle,
      );
    } else {
      const chunks = await retrieveForAgent(
        vectorStore,
        inputData.indexName,
        COMPLIANCE_RETRIEVAL_CONFIG,
        embedQuery,
      );
      prompt = buildRagPrompt(
        "Analyze the following tender document for compliance requirements.",
        chunks,
        inputData.tenderTitle,
      );
    }

    const result = await complianceAgent.generate(prompt, {
      structuredOutput: { schema: complianceOutputSchema },
    });

    if (result.usage) {
      tokenTracker.record("compliance-step", result.usage.inputTokens ?? 0, result.usage.outputTokens ?? 0);
    }

    tokenTracker.completeStep("compliance-step");
    return result.object;
  },
});
