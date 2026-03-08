import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { evalDatasetSchema } from "./schemas/eval-dataset.schema.js";
import type { EvalCase } from "./schemas/eval-dataset.schema.js";
import type { EvalCaseResult, EvalResult } from "./schemas/eval-result.schema.js";
import { evaluate, isPassed } from "./evaluator.js";
import { tokenTracker } from "../utils/token-tracker.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Parse CLI args
const args = process.argv.slice(2);
let datasetVersion = "v1";
let filterTag: string | undefined;
let filterCase: string | undefined;

for (let i = 0; i < args.length; i++) {
  if (args[i] === "--dataset" && args[i + 1]) datasetVersion = args[++i];
  if (args[i] === "--filter" && args[i + 1]) filterTag = args[++i];
  if (args[i] === "--case" && args[i + 1]) filterCase = args[++i];
}

async function loadDataset(version: string) {
  const path = resolve(__dirname, `datasets/${version}/dataset.json`);
  const raw = JSON.parse(readFileSync(path, "utf-8"));
  return evalDatasetSchema.parse(raw);
}

async function runTenderBidNoBid(evalCase: EvalCase): Promise<Record<string, unknown>> {
  const { ingestDocumentTool } = await import("../tools/ingest-document.tool.js");
  const { analyzeComplianceTool } = await import("../tools/analyze-compliance.tool.js");
  const { assessRiskTool } = await import("../tools/assess-risk.tool.js");
  const { recommendStrategyTool } = await import("../tools/recommend-strategy.tool.js");

  // Step 1: Ingest
  const ingestResult = await ingestDocumentTool.execute!(
    {
      documentText: evalCase.input.documentText,
      documentTitle: evalCase.input.documentTitle,
    },
    {} as any,
  );
  const indexName = (ingestResult as any).indexName;

  // Step 2: Compliance + Risk in parallel
  const [complianceResult, riskResult] = await Promise.all([
    analyzeComplianceTool.execute!(
      {
        indexName,
        documentTitle: evalCase.input.documentTitle,
      },
      {} as any,
    ),
    assessRiskTool.execute!(
      {
        indexName,
        documentTitle: evalCase.input.documentTitle,
      },
      {} as any,
    ),
  ]);

  const compliance = complianceResult as any;
  const risk = riskResult as any;

  // Step 3: Strategy
  const strategyResult = await recommendStrategyTool.execute!(
    {
      complianceSummary: compliance.summary ?? "",
      technicalSpecs: compliance.technicalSpecs ?? [],
      deadlines: compliance.deadlines ?? [],
      mandatoryRequirements: compliance.mandatoryRequirements ?? [],
      qualifications: compliance.qualifications ?? [],
      overallRiskLevel: risk.overallRiskLevel ?? "medium",
      technicalComplexity: risk.difficultyAssessment?.technicalComplexity ?? "medium",
      resourceRequirements: risk.difficultyAssessment?.resourceRequirements ?? "medium",
      timelineFeasibility: risk.difficultyAssessment?.timelineFeasibility ?? "tight",
      penaltyClauses: risk.penaltyClauses ?? [],
      deliveryRisks: risk.deliveryRisks ?? [],
      riskSummary: risk.summary ?? "",
      companyProfile: evalCase.input.companyProfile,
    },
    {} as any,
  );

  // Merge results for evaluation
  return {
    ...(strategyResult as any),
    overallRiskLevel: risk.overallRiskLevel,
    deadlines: compliance.deadlines,
    mandatoryRequirements: compliance.mandatoryRequirements,
  };
}

async function runGeneralAnalysis(evalCase: EvalCase): Promise<Record<string, unknown>> {
  const { ingestDocumentTool } = await import("../tools/ingest-document.tool.js");
  const { analyzeDocumentTool } = await import("../tools/analyze-document.tool.js");

  const ingestResult = await ingestDocumentTool.execute!(
    {
      documentText: evalCase.input.documentText,
      documentTitle: evalCase.input.documentTitle,
    },
    {} as any,
  );
  const indexName = (ingestResult as any).indexName;

  const result = await analyzeDocumentTool.execute!(
    {
      indexName,
      analysisGoal: evalCase.input.analysisGoal,
      documentTitle: evalCase.input.documentTitle,
    },
    {} as any,
  );

  return result as any;
}

async function runDocumentSummary(evalCase: EvalCase): Promise<Record<string, unknown>> {
  const { ingestDocumentTool } = await import("../tools/ingest-document.tool.js");
  const { summarizeDocumentTool } = await import("../tools/summarize-document.tool.js");

  const ingestResult = await ingestDocumentTool.execute!(
    {
      documentText: evalCase.input.documentText,
      documentTitle: evalCase.input.documentTitle,
    },
    {} as any,
  );
  const indexName = (ingestResult as any).indexName;

  const result = await summarizeDocumentTool.execute!(
    {
      indexName,
      documentTitle: evalCase.input.documentTitle,
    },
    {} as any,
  );

  return result as any;
}

async function runCase(evalCase: EvalCase): Promise<Record<string, unknown>> {
  switch (evalCase.category) {
    case "tender-bid-nobid":
      return runTenderBidNoBid(evalCase);
    case "general-analysis":
      return runGeneralAnalysis(evalCase);
    case "document-summary":
      return runDocumentSummary(evalCase);
  }
}

async function main() {
  console.log(`\nLoading dataset: ${datasetVersion}...`);
  const dataset = await loadDataset(datasetVersion);
  console.log(`Dataset: ${dataset.description}`);

  let cases = dataset.cases;
  if (filterCase) {
    cases = cases.filter((c) => c.id === filterCase);
  } else if (filterTag) {
    cases = cases.filter((c) => c.tags?.includes(filterTag!));
  }

  console.log(`Running ${cases.length} case(s)...\n`);

  const caseResults: EvalCaseResult[] = [];
  const allScores: Record<string, number[]> = {};

  for (const evalCase of cases) {
    console.log(`--- ${evalCase.id} (${evalCase.category}) ---`);
    tokenTracker.reset();
    const start = Date.now();

    try {
      const rawOutput = await runCase(evalCase);
      const durationMs = Date.now() - start;
      const tokenSummary = tokenTracker.getSummary();
      const scores = evaluate(evalCase, rawOutput);
      const passed = isPassed(scores);

      // Accumulate scores for averaging
      for (const [key, val] of Object.entries(scores)) {
        if (!allScores[key]) allScores[key] = [];
        allScores[key].push(val);
      }

      console.log(`  Duration: ${(durationMs / 1000).toFixed(1)}s`);
      console.log(`  Tokens: ${tokenSummary.total}`);
      console.log(`  Passed: ${passed}`);
      console.log(`  Scores: ${JSON.stringify(scores)}`);

      caseResults.push({
        caseId: evalCase.id,
        category: evalCase.category,
        passed,
        durationMs,
        tokenUsage: {
          prompt: tokenSummary.totalPrompt || 0,
          completion: tokenSummary.totalCompletion || 0,
        },
        scores,
        rawOutput,
      });
    } catch (error) {
      const durationMs = Date.now() - start;
      console.error(`  ERROR: ${error instanceof Error ? error.message : String(error)}`);

      caseResults.push({
        caseId: evalCase.id,
        category: evalCase.category,
        passed: false,
        durationMs,
        tokenUsage: { prompt: 0, completion: 0 },
        scores: {},
        rawOutput: { error: String(error) },
      });
    }
    console.log("");
  }

  // Compute averages
  const averageScores: Record<string, number> = {};
  for (const [key, values] of Object.entries(allScores)) {
    averageScores[key] = values.reduce((a, b) => a + b, 0) / values.length;
  }

  const totalTokens = caseResults.reduce(
    (sum, c) => sum + c.tokenUsage.prompt + c.tokenUsage.completion,
    0,
  );
  const totalDurationMs = caseResults.reduce((sum, c) => sum + c.durationMs, 0);

  const result: EvalResult = {
    runId: `${new Date().toISOString().replace(/[:.]/g, "-")}_${datasetVersion}`,
    datasetVersion,
    timestamp: new Date().toISOString(),
    summary: {
      totalCases: caseResults.length,
      passedCases: caseResults.filter((c) => c.passed).length,
      averageScores,
      totalTokens,
      totalDurationMs,
    },
    cases: caseResults,
  };

  // Save result
  const resultsDir = resolve(__dirname, "results");
  mkdirSync(resultsDir, { recursive: true });
  const resultPath = resolve(resultsDir, `${result.runId}.json`);
  writeFileSync(resultPath, JSON.stringify(result, null, 2));
  console.log(`\n=== Summary ===`);
  console.log(`Passed: ${result.summary.passedCases}/${result.summary.totalCases}`);
  console.log(`Total tokens: ${totalTokens}`);
  console.log(`Total duration: ${(totalDurationMs / 1000).toFixed(1)}s`);
  console.log(`Average scores:`);
  for (const [key, val] of Object.entries(averageScores).sort()) {
    console.log(`  ${key}: ${val.toFixed(3)}`);
  }
  console.log(`\nResult saved to: ${resultPath}`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
