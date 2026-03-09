import { createTool } from "@mastra/core/tools";
import { z } from "zod";

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
    const url = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
    return {
      query,
      message:
        "Web search is a placeholder — integrate a search API (e.g. Google Custom Search, Exa) for production use.",
      searchUrl: url,
    };
  },
});
