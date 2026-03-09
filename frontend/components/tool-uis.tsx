"use client";

import { makeAssistantToolUI } from "@assistant-ui/react";
import { ToolCallDisplay } from "@/components/tool-call-display";

/**
 * Register each known tool's UI via assistant-ui's built-in makeAssistantToolUI.
 * When mounted in the component tree, these components register themselves with
 * the framework so MessagePrimitive.Parts automatically uses them — no manual
 * dispatching (SmartToolRenderer) needed.
 */

const TOOL_NAMES = [
  "ingest-document",
  "analyze-compliance",
  "assess-risk",
  "recommend-strategy",
  "analyze-document",
  "summarize-document",
  "decompose-goal",
] as const;

/** One registration component per tool, all delegating to ToolCallDisplay */
const toolUIs = TOOL_NAMES.map((name) =>
  makeAssistantToolUI({
    toolName: name,
    render: (props) => <ToolCallDisplay {...props} />,
  }),
);

/** Mount this once inside AssistantRuntimeProvider to register all tool UIs */
export function RegisterToolUIs() {
  return (
    <>
      {toolUIs.map((ToolUI, i) => (
        <ToolUI key={TOOL_NAMES[i]} />
      ))}
    </>
  );
}
