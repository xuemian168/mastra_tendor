import { embed, embedMany } from "ai";
import { google } from "@ai-sdk/google";

const model = google.textEmbeddingModel("gemini-embedding-001");

export async function embedTexts(texts: string[]): Promise<number[][]> {
  const { embeddings } = await embedMany({ model, values: texts });
  return embeddings;
}

export async function embedQuery(query: string): Promise<number[]> {
  const { embedding } = await embed({ model, value: query });
  return embedding;
}
