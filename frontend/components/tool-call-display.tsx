"use client";

import { useState } from "react";
import type { ToolCallMessagePartProps } from "@assistant-ui/react";

const TOOL_META: Record<string, { label: string; icon: string }> = {
  "ingest-document": { label: "Document Ingestion", icon: "\u{1F4C4}" },
  "analyze-compliance": { label: "Compliance Analysis", icon: "\u{2705}" },
  "assess-risk": { label: "Risk Assessment", icon: "\u{26A0}\u{FE0F}" },
  "recommend-strategy": { label: "Strategy Recommendation", icon: "\u{1F3AF}" },
  "analyze-document": { label: "Document Analysis", icon: "\u{1F50D}" },
  "summarize-document": { label: "Document Summary", icon: "\u{1F4DD}" },
};

export function ToolCallDisplay(props: ToolCallMessagePartProps) {
  const { toolName, result, status } = props;
  const isRunning = status.type === "running";
  const isStrategy = toolName === "recommend-strategy";

  // Strategy result gets its own prominent card
  if (isStrategy && result && !isRunning) {
    return <StrategyCard result={result} />;
  }

  // Other tools get collapsible thinking steps
  return <ThinkingStep {...props} />;
}

/* ── Collapsible thinking step for non-strategy tools ── */

function ThinkingStep({ toolName, result, status }: ToolCallMessagePartProps) {
  const [expanded, setExpanded] = useState(false);
  const meta = TOOL_META[toolName] ?? { label: toolName, icon: "\u{1F527}" };
  const isRunning = status.type === "running";

  return (
    <div className="my-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm overflow-hidden not-prose">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-[var(--muted)] transition-colors"
      >
        <span className="text-base">{meta.icon}</span>
        <span className="font-medium flex-1">{meta.label}</span>
        {isRunning ? (
          <span className="thinking-dot text-[var(--primary)] text-xs">Processing...</span>
        ) : (
          <span className="text-xs text-[var(--muted-foreground)]">Done</span>
        )}
        <ChevronIcon expanded={expanded} />
      </button>

      {expanded && result != null && (
        <div className="border-t border-[var(--border)] px-3 py-3">
          {toolName === "ingest-document" && <IngestResult data={result} />}
          {toolName === "analyze-compliance" && <ComplianceResult data={result} />}
          {toolName === "assess-risk" && <RiskResult data={result} />}
          {!["ingest-document", "analyze-compliance", "assess-risk"].includes(toolName) && (
            <pre className="text-xs max-h-60 overflow-auto rounded bg-[var(--muted)] p-2 whitespace-pre-wrap">
              {JSON.stringify(result, null, 2)}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Structured result renderers ── */

function IngestResult({ data }: { data: any }) {
  return (
    <div className="space-y-1 text-xs">
      <div className="flex gap-4">
        <span className="text-[var(--muted-foreground)]">Document:</span>
        <span className="font-medium">{data.documentTitle ?? data.documentId}</span>
      </div>
      <div className="flex gap-4">
        <span className="text-[var(--muted-foreground)]">Chunks:</span>
        <span>{data.chunkCount === 0 ? "Full text (below RAG threshold)" : `${data.chunkCount} segments`}</span>
      </div>
      <div className="text-[var(--muted-foreground)]">{data.message}</div>
    </div>
  );
}

function ComplianceResult({ data }: { data: any }) {
  return (
    <div className="space-y-3 text-xs">
      <p className="text-[var(--foreground)]">{data.summary}</p>
      <div className="grid grid-cols-2 gap-3">
        <ListSection title="Technical Specs" items={data.technicalSpecs} max={5} />
        <ListSection title="Deadlines" items={data.deadlines} />
        <ListSection title="Mandatory Requirements" items={data.mandatoryRequirements} max={5} />
        <ListSection title="Qualifications" items={data.qualifications} />
      </div>
    </div>
  );
}

function RiskResult({ data }: { data: any }) {
  const riskColors: Record<string, string> = {
    low: "text-green-600 bg-green-50 dark:bg-green-950",
    medium: "text-yellow-600 bg-yellow-50 dark:bg-yellow-950",
    high: "text-orange-600 bg-orange-50 dark:bg-orange-950",
    critical: "text-red-600 bg-red-50 dark:bg-red-950",
  };
  const level = data.overallRiskLevel?.toLowerCase() ?? "medium";
  const diff = data.difficultyAssessment ?? {};

  return (
    <div className="space-y-3 text-xs">
      <div className="flex items-center gap-2">
        <span className="text-[var(--muted-foreground)]">Overall Risk:</span>
        <span className={`rounded px-2 py-0.5 font-semibold uppercase ${riskColors[level] ?? ""}`}>
          {data.overallRiskLevel}
        </span>
      </div>
      <div className="flex gap-4 flex-wrap">
        <Badge label="Technical" value={diff.technicalComplexity} />
        <Badge label="Resources" value={diff.resourceRequirements} />
        <Badge label="Timeline" value={diff.timelineFeasibility} />
      </div>
      <p className="text-[var(--foreground)]">{data.summary}</p>
      <ListSection title="Penalty Clauses" items={data.penaltyClauses} max={4} />
      <ListSection title="Delivery Risks" items={data.deliveryRisks} max={4} />
    </div>
  );
}

/* ── Strategy: prominent final result card ── */

function StrategyCard({ result }: { result: any }) {
  const decisionStyles: Record<string, { bg: string; border: string; text: string; label: string }> = {
    bid: {
      bg: "bg-green-50 dark:bg-green-950",
      border: "border-green-300 dark:border-green-700",
      text: "text-green-700 dark:text-green-300",
      label: "BID",
    },
    no_bid: {
      bg: "bg-red-50 dark:bg-red-950",
      border: "border-red-300 dark:border-red-700",
      text: "text-red-700 dark:text-red-300",
      label: "NO BID",
    },
    conditional_bid: {
      bg: "bg-yellow-50 dark:bg-yellow-950",
      border: "border-yellow-300 dark:border-yellow-700",
      text: "text-yellow-700 dark:text-yellow-300",
      label: "CONDITIONAL BID",
    },
  };

  const decision = result.decision ?? "no_bid";
  const style = decisionStyles[decision] ?? decisionStyles.no_bid;

  return (
    <div className={`my-3 rounded-xl border-2 ${style.border} ${style.bg} overflow-hidden not-prose`}>
      {/* Header: Decision + Confidence */}
      <div className="flex items-center justify-between px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{"\u{1F3AF}"}</span>
          <div>
            <div className="text-xs uppercase tracking-wider text-[var(--muted-foreground)]">Recommendation</div>
            <div className={`text-2xl font-bold ${style.text}`}>{style.label}</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-[var(--muted-foreground)]">Confidence</div>
          <div className="text-2xl font-bold">{result.confidenceScore ?? 0}%</div>
        </div>
      </div>

      {/* Executive Summary */}
      <div className="border-t border-[var(--border)] px-5 py-3">
        <div className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)] mb-1">
          Executive Summary
        </div>
        <p className="text-sm leading-relaxed">{result.executiveSummary}</p>
      </div>

      {/* Rationale */}
      <div className="border-t border-[var(--border)] px-5 py-3">
        <div className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)] mb-1">
          Rationale
        </div>
        <p className="text-sm leading-relaxed">{result.rationale}</p>
      </div>

      {/* Strengths & Weaknesses side by side */}
      <div className="border-t border-[var(--border)] grid grid-cols-2 divide-x divide-[var(--border)]">
        <div className="px-5 py-3">
          <div className="text-xs font-semibold uppercase tracking-wider text-green-600 dark:text-green-400 mb-2">
            Strengths
          </div>
          <ul className="space-y-1">
            {(result.strengths ?? []).map((s: string, i: number) => (
              <li key={i} className="text-xs flex gap-1.5">
                <span className="text-green-500 shrink-0">{"\u{2713}"}</span>
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="px-5 py-3">
          <div className="text-xs font-semibold uppercase tracking-wider text-red-600 dark:text-red-400 mb-2">
            Weaknesses
          </div>
          <ul className="space-y-1">
            {(result.weaknesses ?? []).map((w: string, i: number) => (
              <li key={i} className="text-xs flex gap-1.5">
                <span className="text-red-500 shrink-0">{"\u{2717}"}</span>
                <span>{w}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Key Conditions */}
      {result.keyConditions?.length > 0 && (
        <div className="border-t border-[var(--border)] px-5 py-3">
          <div className="text-xs font-semibold uppercase tracking-wider text-yellow-600 dark:text-yellow-400 mb-2">
            Key Conditions
          </div>
          <ul className="space-y-1">
            {result.keyConditions.map((c: string, i: number) => (
              <li key={i} className="text-xs flex gap-1.5">
                <span className="text-yellow-500 shrink-0">{"\u{25CF}"}</span>
                <span>{c}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Recommended Actions */}
      {result.recommendedActions?.length > 0 && (
        <div className="border-t border-[var(--border)] px-5 py-3">
          <div className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-2">
            Recommended Actions
          </div>
          <ol className="space-y-1 list-decimal list-inside">
            {result.recommendedActions.map((a: string, i: number) => (
              <li key={i} className="text-xs">{a}</li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}

/* ── Shared UI components ── */

function ListSection({ title, items, max }: { title: string; items?: string[]; max?: number }) {
  const [showAll, setShowAll] = useState(false);
  if (!items?.length) return null;

  const visible = max && !showAll ? items.slice(0, max) : items;
  const hasMore = max && items.length > max;

  return (
    <div>
      <div className="font-medium text-[var(--muted-foreground)] mb-1">{title} ({items.length})</div>
      <ul className="space-y-0.5">
        {visible.map((item, i) => (
          <li key={i} className="flex gap-1.5">
            <span className="text-[var(--muted-foreground)] shrink-0">{"\u{2022}"}</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
      {hasMore && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="mt-1 text-[var(--primary)] hover:underline"
        >
          {showAll ? "Show less" : `+${items.length - max!} more`}
        </button>
      )}
    </div>
  );
}

function Badge({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  const colors: Record<string, string> = {
    low: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
    medium: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
    high: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
    feasible: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
    tight: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
    unfeasible: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
  };
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[var(--muted-foreground)]">{label}:</span>
      <span className={`rounded px-1.5 py-0.5 font-medium ${colors[value.toLowerCase()] ?? "bg-[var(--muted)]"}`}>
        {value}
      </span>
    </div>
  );
}

function ChevronIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg
      className={`h-4 w-4 text-[var(--muted-foreground)] transition-transform ${expanded ? "rotate-180" : ""}`}
      fill="none" viewBox="0 0 24 24" stroke="currentColor"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  );
}
