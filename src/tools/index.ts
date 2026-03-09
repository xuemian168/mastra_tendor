export { ingestDocumentTool } from "./ingest-document.tool.js";
export { analyzeComplianceTool } from "./analyze-compliance.tool.js";
export { assessRiskTool } from "./assess-risk.tool.js";
export { recommendStrategyTool } from "./recommend-strategy.tool.js";
export { analyzeDocumentTool } from "./analyze-document.tool.js";
export { summarizeDocumentTool } from "./summarize-document.tool.js";
export { decomposeGoalTool } from "./decompose-goal.tool.js";
export { webSearchTool } from "./web-search.tool.js";

/* ── Grouped exports ── */

import { ingestDocumentTool } from "./ingest-document.tool.js";
import { analyzeComplianceTool } from "./analyze-compliance.tool.js";
import { assessRiskTool } from "./assess-risk.tool.js";
import { recommendStrategyTool } from "./recommend-strategy.tool.js";
import { analyzeDocumentTool } from "./analyze-document.tool.js";
import { summarizeDocumentTool } from "./summarize-document.tool.js";
import { decomposeGoalTool } from "./decompose-goal.tool.js";
import { webSearchTool } from "./web-search.tool.js";

/** Document analysis tools — ingest, compliance, risk, strategy, general analysis, summary, goal decomposition */
export const documentTools = {
  "ingest-document": ingestDocumentTool,
  "analyze-compliance": analyzeComplianceTool,
  "assess-risk": assessRiskTool,
  "recommend-strategy": recommendStrategyTool,
  "analyze-document": analyzeDocumentTool,
  "summarize-document": summarizeDocumentTool,
  "decompose-goal": decomposeGoalTool,
};

/** General-purpose tools — web search, etc. */
export const generalTools = {
  "web-search": webSearchTool,
};

/** All tools combined */
export const allTools = { ...documentTools, ...generalTools };
