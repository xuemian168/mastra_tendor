import {
  createUIMessageStreamResponse,
  createUIMessageStream,
  type UIMessageStreamWriter,
  generateId,
} from "ai";

export const maxDuration = 300;

const MASTRA_URL = process.env.MASTRA_URL || "http://localhost:4111";

export async function POST(req: Request) {
  const body = await req.json();

  // Convert UIMessage format (parts) to CoreMessage format (content) for Mastra
  const rawMessages = body.messages ?? [];
  const messages = rawMessages.map((msg: Record<string, unknown>) => {
    // Already has content — pass through
    if (typeof msg.content === "string") return msg;
    // UIMessage format: extract text from parts array
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

  // Inject company profile as a system message if provided by the frontend
  if (body.system) {
    messages.unshift({ role: "system", content: body.system });
  }

  // Only forward fields Mastra needs — do NOT spread the full browser body
  // (browser sends 'system', 'tools', 'id', 'trigger', 'metadata' which can
  // override the agent's instructions or tools configuration)
  const mastraBody = { messages, maxSteps: body.maxSteps ?? 10 };

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
    // Text lifecycle: text-start → text-delta(s) → text-end
    // AI SDK requires text-start before any text-delta with matching id
    case "text-start": {
      const id = (payload?.id ?? chunk.id ?? generateId()) as string;
      writer.write({ type: "text-start", id });
      break;
    }
    case "text-delta": {
      const id = (payload?.id ?? chunk.id ?? generateId()) as string;
      writer.write({
        type: "text-delta",
        delta: (payload?.text ?? chunk.textDelta ?? chunk.delta ?? "") as string,
        id,
      });
      break;
    }
    case "text-end": {
      const id = (payload?.id ?? chunk.id ?? generateId()) as string;
      writer.write({ type: "text-end", id });
      break;
    }
    // Tool events
    case "tool-call":
    case "tool-input-available":
      writer.write({
        type: "tool-input-available",
        toolCallId: (payload?.toolCallId ?? chunk.toolCallId) as string,
        toolName: (payload?.toolName ?? chunk.toolName) as string,
        input: payload?.args ?? chunk.args ?? chunk.input,
      });
      break;
    case "tool-result":
    case "tool-output-available":
      writer.write({
        type: "tool-output-available",
        toolCallId: (payload?.toolCallId ?? chunk.toolCallId) as string,
        output: payload?.result ?? chunk.result ?? chunk.output,
      });
      break;
    // Step lifecycle
    case "step-start":
      writer.write({ type: "start-step" });
      break;
    case "step-finish":
    case "finish-step":
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
    case "tool-call-input-streaming-start":
    case "tool-call-input-streaming-end":
    case "tool-call-delta":
      break;
  }
}
