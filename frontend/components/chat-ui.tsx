"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  ThreadPrimitive,
  ComposerPrimitive,
  MessagePrimitive,
  useMessage,
  useComposerRuntime,
} from "@assistant-ui/react";
import { MarkdownTextPrimitive } from "@assistant-ui/react-markdown";
import { ToolCallDisplay } from "./tool-call-display";
import { PipelineProgress, isTenderPipeline } from "./pipeline-progress";
import type { ToolCallInfo } from "./pipeline-progress";
import { parseFile, type ParsedFile } from "@/lib/file-parser";

export function ChatUI() {
  return (
    <ThreadPrimitive.Root className="flex h-full flex-col">
      <ThreadPrimitive.Viewport className="flex-1 overflow-y-auto px-4 py-6">
        <ThreadPrimitive.Empty>
          <div className="mx-auto max-w-2xl space-y-6 py-16 text-center">
            <h2 className="text-2xl font-semibold">Document Analysis Assistant</h2>
            <p className="text-[var(--muted-foreground)]">
              Upload a document or paste text below — tenders, contracts, reports, or policies.
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
        <ComposerArea />
      </div>
    </ThreadPrimitive.Root>
  );
}

function ComposerArea() {
  const composerRuntime = useComposerRuntime();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loadedFile, setLoadedFile] = useState<ParsedFile | null>(null);
  const [parsing, setParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setParsing(true);
      setParseError(null);
      try {
        const parsed = await parseFile(file);
        setLoadedFile(parsed);
        // Set the extracted text into the composer input
        composerRuntime.setText(
          `Please analyze the following document titled "${parsed.title}":\n\n${parsed.text}`,
        );
      } catch (err) {
        setParseError(err instanceof Error ? err.message : "Failed to parse file");
      } finally {
        setParsing(false);
        // Reset input so the same file can be re-selected
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    },
    [composerRuntime],
  );

  const removeFile = useCallback(() => {
    setLoadedFile(null);
    composerRuntime.setText("");
  }, [composerRuntime]);

  return (
    <div className="mx-auto max-w-3xl space-y-2">
      {/* File tag */}
      {loadedFile && (
        <div className="flex items-center gap-2 rounded-lg bg-[var(--accent)] px-3 py-1.5 text-xs">
          <FileIcon />
          <span className="font-medium">{loadedFile.title}</span>
          <span className="text-[var(--muted-foreground)]">
            ({(loadedFile.text.length / 1000).toFixed(1)}k chars)
          </span>
          <button
            onClick={removeFile}
            className="ml-auto rounded p-0.5 hover:bg-[var(--muted)] transition-colors"
            aria-label="Remove file"
          >
            <CloseIcon />
          </button>
        </div>
      )}

      {/* Parse error */}
      {parseError && (
        <div className="rounded-lg bg-red-50 dark:bg-red-950 px-3 py-1.5 text-xs text-red-600 dark:text-red-400">
          {parseError}
        </div>
      )}

      {/* Composer */}
      <ComposerPrimitive.Root className="flex items-end gap-2 rounded-xl border border-[var(--border)] bg-[var(--muted)] p-2">
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".txt,.md,.pdf,.docx"
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Upload button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={parsing}
          className="flex-shrink-0 rounded-lg p-2 hover:bg-[var(--background)] transition-colors disabled:opacity-50"
          title="Upload document (.txt, .md, .pdf, .docx)"
        >
          {parsing ? <SpinnerIcon /> : <UploadIcon />}
        </button>

        <ComposerPrimitive.Input
          placeholder="Paste a document or ask a question..."
          className="min-h-[60px] flex-1 resize-none bg-transparent px-2 py-1 text-sm outline-none"
        />
        <ComposerPrimitive.Send className="rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary-foreground)] hover:opacity-90 disabled:opacity-50">
          Send
        </ComposerPrimitive.Send>
      </ComposerPrimitive.Root>
    </div>
  );
}

/* ── Icons ── */

function UploadIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}

function FileIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="animate-spin">
      <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
      <path d="M12 2a10 10 0 0 1 10 10" strokeOpacity="0.75" />
    </svg>
  );
}

/* ── Message Components ── */

function UserMessage() {
  return (
    <MessagePrimitive.Root className="mx-auto mb-4 flex max-w-3xl justify-end">
      <div className="max-w-[80%] rounded-xl bg-[var(--primary)] px-4 py-3 text-sm text-[var(--primary-foreground)]">
        <MessagePrimitive.Content />
      </div>
    </MessagePrimitive.Root>
  );
}

function AssistantMessagePipeline() {
  const message = useMessage();
  const [toolCalls, setToolCalls] = useState<ToolCallInfo[]>([]);

  useEffect(() => {
    if (message.role !== "assistant") return;
    const parts = message.content;
    const calls: ToolCallInfo[] = [];
    for (const part of parts) {
      if (part.type === "tool-call") {
        calls.push({
          toolName: part.toolName,
          status: part.result !== undefined ? "done" : "running",
        });
      }
    }
    setToolCalls(calls);
  }, [message]);

  if (!isTenderPipeline(toolCalls)) return null;
  return <PipelineProgress toolCalls={toolCalls} />;
}

function AssistantMessage() {
  return (
    <MessagePrimitive.Root className="mx-auto mb-4 flex max-w-3xl">
      <div className="max-w-[80%] rounded-xl bg-[var(--muted)] px-4 py-3 text-sm prose prose-sm dark:prose-invert">
        <AssistantMessagePipeline />
        <MessagePrimitive.Content
          components={{
            Text: () => <MarkdownTextPrimitive />,
            tools: {
              Fallback: ToolCallDisplay,
            },
          }}
        />
      </div>
    </MessagePrimitive.Root>
  );
}
