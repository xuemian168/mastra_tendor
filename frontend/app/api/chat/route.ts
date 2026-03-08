import { MastraClient } from "@mastra/client-js";
import type { ChunkType } from "@mastra/core/stream";
import {
  createUIMessageStreamResponse,
  createUIMessageStream,
  generateId,
} from "ai";

export const maxDuration = 300;

const client = new MastraClient({
  baseUrl: process.env.MASTRA_URL || "http://localhost:4111",
});

export async function POST(req: Request) {
  const body = await req.json();

  // Convert UIMessage format (parts) to CoreMessage format (content) for Mastra
  const rawMessages = body.messages ?? [];
  const messages = rawMessages.map((msg: Record<string, unknown>) => {
    if (typeof msg.content === "string") return msg;
    const parts = msg.parts as Array<Record<string, unknown>> | undefined;
    if (Array.isArray(parts)) {
      const text = parts
        .filter((p) => p.type === "text")
        .map((p) => p.text)
        .join("\n");
      return { role: msg.role, content: text };
    }
    return msg;
  });

  // Inject company profile as a system message if provided
  if (body.system) {
    messages.unshift({ role: "system", content: body.system });
  }

  const agent = client.getAgent("orchestratorAgent");

  const stream = createUIMessageStream({
    execute: async ({ writer }) => {
      const response = await agent.stream(messages, {
        maxSteps: body.maxSteps ?? 10,
      });

      let currentTextId: string | undefined;

      await response.processDataStream({
        async onChunk(chunk: ChunkType) {
          switch (chunk.type) {
            case "text-start": {
              currentTextId = chunk.payload.id ?? generateId();
              writer.write({ type: "text-start", id: currentTextId });
              break;
            }
            case "text-delta": {
              if (!currentTextId) {
                currentTextId = chunk.payload.id ?? generateId();
                writer.write({ type: "text-start", id: currentTextId });
              }
              writer.write({
                type: "text-delta",
                delta: chunk.payload.text,
                id: currentTextId,
              });
              break;
            }
            case "tool-call": {
              if (currentTextId) {
                writer.write({ type: "text-end", id: currentTextId });
                currentTextId = undefined;
              }
              writer.write({
                type: "tool-input-available",
                toolCallId: chunk.payload.toolCallId,
                toolName: chunk.payload.toolName,
                input: chunk.payload.args,
              });
              break;
            }
            case "tool-result": {
              writer.write({
                type: "tool-output-available",
                toolCallId: chunk.payload.toolCallId,
                output: chunk.payload.result,
              });
              break;
            }
            case "step-finish": {
              if (currentTextId) {
                writer.write({ type: "text-end", id: currentTextId });
                currentTextId = undefined;
              }
              writer.write({ type: "finish-step" });
              break;
            }
            case "finish": {
              if (currentTextId) {
                writer.write({ type: "text-end", id: currentTextId });
                currentTextId = undefined;
              }
              writer.write({ type: "finish" });
              break;
            }
            case "error": {
              if (currentTextId) {
                writer.write({ type: "text-end", id: currentTextId });
                currentTextId = undefined;
              }
              writer.write({
                type: "error",
                errorText: String(chunk.payload.error ?? "Unknown error"),
              });
              break;
            }
            // Ignore other chunk types (start, step-start, raw, etc.)
          }
        },
      });
    },
    onError: (error) => {
      console.error("Stream error:", error);
      return error instanceof Error ? error.message : "An error occurred";
    },
  });

  return createUIMessageStreamResponse({ stream });
}
