import type { TenderChunk } from "../rag/types.js";

export function buildTenderPrompt(task: string, text: string, title?: string): string {
  return `${task}${title ? `\nTitle: ${title}` : ""}\n\n${text}`;
}

export function buildRagPrompt(task: string, chunks: TenderChunk[], title?: string): string {
  const context = chunks
    .map((c) => `[${c.metadata.sectionType}] ${c.content}`)
    .join("\n\n---\n\n");
  return `${task}${title ? `\nTitle: ${title}` : ""}\n\nRelevant sections:\n${context}`;
}
