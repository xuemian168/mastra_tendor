import {
  createUIMessageStreamResponse,
  createUIMessageStream,
  type UIMessageStreamWriter,
  generateId,
} from "ai";

export const maxDuration = 120;

const MASTRA_URL = process.env.MASTRA_URL || "http://localhost:4111";

export async function POST(req: Request) {
  const body = await req.json();

  // Inject company profile as a system message if provided by the frontend
  const messages = body.messages ?? [];
  if (body.system) {
    messages.unshift({ role: "system", content: body.system });
  }
  const mastraBody = { ...body, messages };

  const stream = createUIMessageStream({
    execute: async ({ writer }) => {
      const response = await fetch(
        `${MASTRA_URL}/api/agents/orchestratorAgent/stream`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(mastraBody),
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        writer.write({
          type: "error",
          errorText: `Backend error (${response.status}): ${errorText}`,
        });
        return;
      }

      if (!response.body) {
        writer.write({ type: "error", errorText: "No response body" });
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            processLine(line.trim(), writer);
          }
        }

        if (buffer.trim()) {
          processLine(buffer.trim(), writer);
        }
      } finally {
        reader.releaseLock();
      }
    },
    onError: (error) => {
      console.error("Stream error:", error);
      return error instanceof Error ? error.message : "An error occurred";
    },
  });

  return createUIMessageStreamResponse({ stream });
}

function processLine(line: string, writer: UIMessageStreamWriter) {
  if (!line) return;

  // Handle SSE "data: {...}" format
  if (line.startsWith("data: ")) {
    const data = line.slice(6);
    if (data === "[DONE]") return;
    try {
      forwardJsonChunk(JSON.parse(data), writer);
    } catch {
      // ignore
    }
    return;
  }

  // Handle AI SDK data stream protocol: "CODE:PAYLOAD\n"
  const colonIdx = line.indexOf(":");
  if (colonIdx < 1) return;

  const code = line.slice(0, colonIdx);
  const payload = line.slice(colonIdx + 1);

  try {
    switch (code) {
      case "0": // text delta
        writer.write({
          type: "text-delta",
          delta: JSON.parse(payload) as string,
          id: generateId(),
        });
        break;
      case "9": { // tool call
        const tc = JSON.parse(payload);
        writer.write({
          type: "tool-input-available",
          toolCallId: tc.toolCallId,
          toolName: tc.toolName,
          input: tc.args,
        });
        break;
      }
      case "a": { // tool result
        const tr = JSON.parse(payload);
        writer.write({
          type: "tool-output-available",
          toolCallId: tr.toolCallId,
          output: tr.result,
        });
        break;
      }
      case "e": // step finish
        writer.write({ type: "finish-step" });
        break;
      case "d": // finish
        writer.write({ type: "finish" });
        break;
      case "3": // error
        writer.write({ type: "error", errorText: JSON.parse(payload) });
        break;
    }
  } catch {
    // Skip unparseable lines
  }
}

function forwardJsonChunk(
  chunk: Record<string, unknown>,
  writer: UIMessageStreamWriter,
) {
  const type = chunk.type as string;
  const payload = chunk.payload as Record<string, unknown> | undefined;

  switch (type) {
    // Mastra format: payload.text contains the delta text
    case "text-delta":
      writer.write({
        type: "text-delta",
        delta: (payload?.text ?? chunk.textDelta ?? chunk.delta ?? "") as string,
        id: generateId(),
      });
      break;
    case "tool-call":
      writer.write({
        type: "tool-input-available",
        toolCallId: (payload?.toolCallId ?? chunk.toolCallId) as string,
        toolName: (payload?.toolName ?? chunk.toolName) as string,
        input: payload?.args ?? chunk.args,
      });
      break;
    case "tool-result":
      writer.write({
        type: "tool-output-available",
        toolCallId: (payload?.toolCallId ?? chunk.toolCallId) as string,
        output: payload?.result ?? chunk.result,
      });
      break;
    case "step-finish":
      writer.write({ type: "finish-step" });
      break;
    case "finish":
      writer.write({ type: "finish" });
      break;
    case "error":
      writer.write({
        type: "error",
        errorText: String(payload?.error ?? chunk.error ?? "Unknown error"),
      });
      break;
    // Mastra-specific types we can safely ignore
    case "start":
    case "text-start":
    case "text-end":
      break;
  }
}
