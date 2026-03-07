"use client";

import {
  ThreadPrimitive,
  ComposerPrimitive,
  MessagePrimitive,
} from "@assistant-ui/react";
import { ToolCallDisplay } from "./tool-call-display";

export function ChatUI() {
  return (
    <ThreadPrimitive.Root className="flex h-full flex-col">
      <ThreadPrimitive.Viewport className="flex-1 overflow-y-auto px-4 py-6">
        <ThreadPrimitive.Empty>
          <div className="mx-auto max-w-2xl space-y-6 py-16 text-center">
            <h2 className="text-2xl font-semibold">Document Analysis Assistant</h2>
            <p className="text-[var(--muted-foreground)]">
              Paste any document below — tenders, contracts, reports, or policies.
              Get a full analysis, quick summary, or ask specific questions.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {[
                "Run a full bid/no-bid analysis on my tender document",
                "Summarize this document",
                "Analyze key clauses in this contract",
                "Assess risks in this tender",
              ].map((suggestion) => (
                <ThreadPrimitive.Suggestion
                  key={suggestion}
                  prompt={suggestion}
                  method="replace"
                  autoSend={false}
                  className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm hover:bg-[var(--muted)] transition-colors"
                >
                  {suggestion}
                </ThreadPrimitive.Suggestion>
              ))}
            </div>
          </div>
        </ThreadPrimitive.Empty>

        <ThreadPrimitive.Messages
          components={{
            UserMessage,
            AssistantMessage,
          }}
        />
      </ThreadPrimitive.Viewport>

      <div className="border-t border-[var(--border)] p-4">
        <ComposerPrimitive.Root className="mx-auto flex max-w-3xl items-end gap-2 rounded-xl border border-[var(--border)] bg-[var(--muted)] p-2">
          <ComposerPrimitive.Input
            placeholder="Paste a document or ask a question..."
            className="min-h-[60px] flex-1 resize-none bg-transparent px-2 py-1 text-sm outline-none"
          />
          <ComposerPrimitive.Send className="rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary-foreground)] hover:opacity-90 disabled:opacity-50">
            Send
          </ComposerPrimitive.Send>
        </ComposerPrimitive.Root>
      </div>
    </ThreadPrimitive.Root>
  );
}

function UserMessage() {
  return (
    <MessagePrimitive.Root className="mx-auto mb-4 flex max-w-3xl justify-end">
      <div className="max-w-[80%] rounded-xl bg-[var(--primary)] px-4 py-3 text-sm text-[var(--primary-foreground)]">
        <MessagePrimitive.Content />
      </div>
    </MessagePrimitive.Root>
  );
}

function AssistantMessage() {
  return (
    <MessagePrimitive.Root className="mx-auto mb-4 flex max-w-3xl">
      <div className="max-w-[80%] rounded-xl bg-[var(--muted)] px-4 py-3 text-sm prose prose-sm dark:prose-invert">
        <MessagePrimitive.Content
          components={{
            tools: {
              Fallback: ToolCallDisplay,
            },
          }}
        />
      </div>
    </MessagePrimitive.Root>
  );
}
