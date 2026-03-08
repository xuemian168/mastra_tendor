"use client";

interface ToolCallInfo {
  toolName: string;
  status: "running" | "done";
}

interface PipelineProgressProps {
  toolCalls: ToolCallInfo[];
}

const TENDER_PIPELINE_TOOLS = [
  "ingest-document",
  "analyze-compliance",
  "assess-risk",
  "recommend-strategy",
];

interface StageConfig {
  id: string;
  label: string;
  tools: string[];
}

const STAGES: StageConfig[] = [
  { id: "ingest", label: "Ingest", tools: ["ingest-document"] },
  { id: "analysis", label: "Compliance | Risk", tools: ["analyze-compliance", "assess-risk"] },
  { id: "strategy", label: "Strategy", tools: ["recommend-strategy"] },
];

type StageStatus = "pending" | "processing" | "done";

function getStageStatus(stage: StageConfig, toolCalls: ToolCallInfo[]): StageStatus {
  const relevant = toolCalls.filter((tc) => stage.tools.includes(tc.toolName));
  if (relevant.length === 0) return "pending";
  if (relevant.some((tc) => tc.status === "running")) return "processing";
  if (relevant.every((tc) => tc.status === "done")) return "done";
  return "processing";
}

export function isTenderPipeline(toolCalls: ToolCallInfo[]): boolean {
  const toolNames = new Set(toolCalls.map((tc) => tc.toolName));
  const hasIngest = toolNames.has("ingest-document");
  const hasAnalysis =
    toolNames.has("analyze-compliance") || toolNames.has("assess-risk");
  return hasIngest && hasAnalysis;
}

const STATUS_STYLES: Record<StageStatus, { bg: string; text: string; border: string }> = {
  pending: {
    bg: "bg-gray-100 dark:bg-gray-800",
    text: "text-gray-400 dark:text-gray-500",
    border: "border-gray-200 dark:border-gray-700",
  },
  processing: {
    bg: "bg-blue-50 dark:bg-blue-950",
    text: "text-blue-600 dark:text-blue-400",
    border: "border-blue-300 dark:border-blue-700",
  },
  done: {
    bg: "bg-green-50 dark:bg-green-950",
    text: "text-green-600 dark:text-green-400",
    border: "border-green-300 dark:border-green-700",
  },
};

const STATUS_LABELS: Record<StageStatus, string> = {
  pending: "Pending",
  processing: "Processing",
  done: "Done",
};

const CONNECTOR_STYLES: Record<StageStatus, string> = {
  pending: "bg-gray-200 dark:bg-gray-700",
  processing: "bg-blue-300 dark:bg-blue-700 animate-pulse",
  done: "bg-green-300 dark:bg-green-700",
};

export function PipelineProgress({ toolCalls }: PipelineProgressProps) {
  return (
    <div className="my-3 rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-3 not-prose">
      <div className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)] mb-3">
        Analysis Pipeline
      </div>
      <div className="flex items-center gap-1">
        {STAGES.map((stage, i) => {
          const status = getStageStatus(stage, toolCalls);
          const styles = STATUS_STYLES[status];
          return (
            <div key={stage.id} className="flex items-center gap-1 flex-1">
              <div
                className={`flex-1 rounded-md border ${styles.border} ${styles.bg} px-3 py-2 text-center`}
              >
                <div className={`text-xs font-medium ${styles.text}`}>{stage.label}</div>
                <div className={`text-[10px] mt-0.5 ${styles.text}`}>
                  {status === "processing" && (
                    <span className="inline-block animate-pulse">{STATUS_LABELS[status]}</span>
                  )}
                  {status !== "processing" && STATUS_LABELS[status]}
                </div>
              </div>
              {i < STAGES.length - 1 && (
                <div className="flex items-center px-0.5">
                  <div
                    className={`h-0.5 w-4 rounded ${CONNECTOR_STYLES[status === "done" ? "done" : "pending"]}`}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export type { ToolCallInfo };
