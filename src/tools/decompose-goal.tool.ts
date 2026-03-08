import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { generalAnalystAgent } from "../agents/general-analyst.agent.js";
import { tokenTracker } from "../utils/token-tracker.js";

const decomposeOutputSchema = z.object({
  originalGoal: z.string(),
  subTasks: z.array(
    z.object({
      taskId: z.number(),
      analysisGoal: z.string(),
      rationale: z.string(),
    }),
  ),
  executionNotes: z.string(),
});

export const decomposeGoalTool = createTool({
  id: "decompose-goal",
  description:
    "Break down a broad or open-ended analysis goal into focused sub-tasks. " +
    "Each sub-task produces an analysisGoal that can be passed to analyze-document.",
  inputSchema: z.object({
    goal: z.string().describe("The user's open-ended goal or request"),
    documentContext: z
      .string()
      .optional()
      .describe("Short label of the document type (e.g. 'software license agreement', 'consulting contract'). Do NOT paste the full document text here."),
  }),
  execute: async (inputData) => {
    tokenTracker.startStep("decompose-goal-tool");
    try {
      const contextHint = inputData.documentContext
        ? `\nDocument type: ${inputData.documentContext}`
        : "";

      const prompt = `You are a task decomposition specialist. Given a broad analysis goal, break it down into 3-6 focused, non-overlapping sub-tasks that together cover the goal comprehensively.

Goal: ${inputData.goal}${contextHint}

Rules:
- Each sub-task's analysisGoal should be specific enough for a single-pass document analysis
- Sub-tasks should be complementary, not redundant
- Order sub-tasks logically (foundational analysis first, synthesis last)
- Keep each analysisGoal concise (1-2 sentences)`;

      const result = await generalAnalystAgent.generate(prompt, {
        structuredOutput: { schema: decomposeOutputSchema },
      });

      if (result.usage) {
        tokenTracker.record(
          "decompose-goal-tool",
          result.usage.inputTokens ?? 0,
          result.usage.outputTokens ?? 0,
        );
      }

      tokenTracker.completeStep("decompose-goal-tool");
      return result.object;
    } catch (error) {
      tokenTracker.completeStep("decompose-goal-tool");
      return {
        error: true,
        message: `Tool execution failed: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  },
});
