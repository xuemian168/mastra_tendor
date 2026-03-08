import { readFileSync } from "node:fs";
import { evalResultSchema } from "./schemas/eval-result.schema.js";
import type { EvalResult } from "./schemas/eval-result.schema.js";

function loadResult(path: string): EvalResult {
  const raw = JSON.parse(readFileSync(path, "utf-8"));
  return evalResultSchema.parse(raw);
}

function formatDelta(before: number, after: number): string {
  const delta = after - before;
  const pct = before !== 0 ? ((delta / before) * 100).toFixed(1) : "N/A";
  const sign = delta > 0 ? "+" : "";
  return `${sign}${delta.toFixed(3)} (${sign}${pct}%)`;
}

function printComparison(r1: EvalResult, r2: EvalResult): void {
  console.log("\n=== Evaluation Comparison ===\n");
  console.log(`Run 1: ${r1.runId} (${r1.datasetVersion})`);
  console.log(`Run 2: ${r2.runId} (${r2.datasetVersion})\n`);

  // Summary comparison
  console.log("--- Summary ---");
  console.log(
    `Pass rate: ${r1.summary.passedCases}/${r1.summary.totalCases} → ${r2.summary.passedCases}/${r2.summary.totalCases}`,
  );
  console.log(
    `Total tokens: ${r1.summary.totalTokens} → ${r2.summary.totalTokens} (${formatDelta(r1.summary.totalTokens, r2.summary.totalTokens)})`,
  );
  console.log(
    `Total duration: ${r1.summary.totalDurationMs}ms → ${r2.summary.totalDurationMs}ms (${formatDelta(r1.summary.totalDurationMs, r2.summary.totalDurationMs)})`,
  );

  // Average scores comparison
  const allMetrics = new Set([
    ...Object.keys(r1.summary.averageScores),
    ...Object.keys(r2.summary.averageScores),
  ]);
  if (allMetrics.size > 0) {
    console.log("\n--- Average Scores ---");
    console.log(`${"Metric".padEnd(35)} ${"Run 1".padEnd(10)} ${"Run 2".padEnd(10)} Delta`);
    console.log("-".repeat(75));
    for (const metric of [...allMetrics].sort()) {
      const v1 = r1.summary.averageScores[metric] ?? 0;
      const v2 = r2.summary.averageScores[metric] ?? 0;
      const delta = v2 - v1;
      const marker = delta < -0.05 ? " <<<REGRESSION" : delta > 0.05 ? " +++IMPROVEMENT" : "";
      console.log(
        `${metric.padEnd(35)} ${v1.toFixed(3).padEnd(10)} ${v2.toFixed(3).padEnd(10)} ${formatDelta(v1, v2)}${marker}`,
      );
    }
  }

  // Per-case comparison
  console.log("\n--- Per-Case ---");
  const r2Map = new Map(r2.cases.map((c) => [c.caseId, c]));
  for (const c1 of r1.cases) {
    const c2 = r2Map.get(c1.caseId);
    if (!c2) {
      console.log(`\n${c1.caseId}: only in Run 1`);
      continue;
    }
    console.log(`\n${c1.caseId} (${c1.category}):`);
    console.log(`  passed: ${c1.passed} → ${c2.passed}`);
    console.log(`  duration: ${c1.durationMs}ms → ${c2.durationMs}ms`);
    const caseMetrics = new Set([...Object.keys(c1.scores), ...Object.keys(c2.scores)]);
    for (const m of [...caseMetrics].sort()) {
      const v1 = c1.scores[m] ?? 0;
      const v2 = c2.scores[m] ?? 0;
      const delta = v2 - v1;
      const marker = delta < -0.05 ? " <<<" : delta > 0.05 ? " +++" : "";
      console.log(`  ${m}: ${v1.toFixed(3)} → ${v2.toFixed(3)}${marker}`);
    }
  }

  console.log("");
}

// CLI entry point
const args = process.argv.slice(2);
if (args.length < 2) {
  console.error("Usage: npx tsx src/eval/comparator.ts <result1.json> <result2.json>");
  process.exit(1);
}

const r1 = loadResult(args[0]);
const r2 = loadResult(args[1]);
printComparison(r1, r2);
