import { tokenTracker } from "../utils/token-tracker.js";
import { documentCache } from "../rag/document-cache.js";
import { vectorStore } from "../rag/in-memory-vector-store.js";
import { retrieveForAgent, type RetrievalConfig } from "../rag/retriever.js";
import { embedQuery } from "../rag/embedder.js";
import { buildTenderPrompt, buildRagPrompt } from "../utils/prompt.js";

/**
 * Factory for tool stage emitter.
 * Replaces the 7-line emit function repeated in every tool.
 */
export function createEmit(
  context: { writer?: { custom: (data: unknown) => Promise<void> } } | undefined,
  toolName: string,
) {
  return async (stage: string) => {
    await context?.writer?.custom({
      type: "data-tool-stage" as const,
      data: { toolName, stage },
    });
  };
}

/**
 * Wraps an async tool execution with token tracking and error handling.
 * Eliminates repeated startStep/completeStep/try-catch boilerplate.
 */
export async function withTokenTracking<T>(
  stepName: string,
  fn: () => Promise<T>,
): Promise<T | { error: true; message: string }> {
  tokenTracker.startStep(stepName);
  try {
    const result = await fn();
    tokenTracker.completeStep(stepName);
    return result;
  } catch (error) {
    tokenTracker.completeStep(stepName);
    return {
      error: true,
      message: `Tool execution failed: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

/**
 * Records token usage from an agent generate result.
 */
export function recordUsage(
  stepName: string,
  usage: { inputTokens?: number; outputTokens?: number } | undefined,
): void {
  if (usage) {
    tokenTracker.record(
      stepName,
      usage.inputTokens ?? 0,
      usage.outputTokens ?? 0,
    );
  }
}

/**
 * Resolves document text (from cache or RAG retrieval) and builds a prompt.
 * Eliminates the repeated cache-check + prompt-building pattern in 4 analysis tools.
 */
export async function resolveDocumentPrompt(
  task: string,
  indexName: string,
  config: RetrievalConfig,
  opts?: { documentTitle?: string; fullText?: string },
): Promise<string> {
  const cached = documentCache.get(indexName);
  const fullText = opts?.fullText ?? cached?.fullText;
  const docTitle = opts?.documentTitle ?? cached?.documentTitle;

  if (fullText) {
    return buildTenderPrompt(task, fullText, docTitle);
  }

  const chunks = await retrieveForAgent(
    vectorStore,
    indexName,
    config,
    embedQuery,
  );
  return buildRagPrompt(task, chunks, docTitle);
}
