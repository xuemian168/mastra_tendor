"use client";

import { useMessage } from "@assistant-ui/react";

export function useToolStages(toolName: string): string[] {
  const message = useMessage();

  const stages: string[] = [];
  for (const part of message.content) {
    if (
      part.type === ("data-tool-stage" as string) &&
      (part as any).data?.toolName === toolName
    ) {
      stages.push((part as any).data.stage);
    }
  }

  return stages;
}
