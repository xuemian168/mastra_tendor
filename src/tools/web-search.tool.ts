import { createTool } from "@mastra/core/tools";
import { tavily } from "@tavily/core";
import { z } from "zod";

let tvly: ReturnType<typeof tavily>;
function getTavily() {
  if (!tvly) tvly = tavily({ apiKey: process.env.TAVILY_API_KEY ?? "" });
  return tvly;
}

export const webSearchTool = createTool({
  id: "web-search",
  description:
    "Search the web for current information, news, or data. " +
    "Use this when the user asks about recent events, real-time data, " +
    "or information that may be outdated in your training data.",
  inputSchema: z.object({
    query: z.string().describe("The search query"),
  }),
  execute: async ({ query }) => {
    const response = await getTavily().search(query, {
      maxResults: 5,
      includeAnswer: true,
    });

    const sources = response.results.map((r) => ({
      title: r.title,
      url: r.url,
      snippet: r.content,
    }));

    return {
      query,
      answer: response.answer,
      sources,
    };
  },
});
