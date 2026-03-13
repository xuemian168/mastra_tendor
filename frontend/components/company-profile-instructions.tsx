"use client";

import { useAssistantInstructions } from "@assistant-ui/react";
import { type CompanyProfile, profileToSystemPrompt } from "@/lib/company-profile";

/**
 * 将公司资料注入 assistant-ui 的 body.system 字段。
 *
 * 重要：此组件不会直接将 system prompt 发送给 LLM。
 * fetch 拦截器（page.tsx）会拦截请求，将 body.system 的内容
 * 移入第一条用户消息的 parts 中，避免与 orchestrator agent
 * 的长指令形成双重 system prompt（Gemini 2.5 Flash 会因此耗尽 thinking budget）。
 *
 * 如果移除此组件，body.system 将为 undefined，公司资料不会被注入。
 */
export function CompanyProfileInstructions({ profile }: { profile: CompanyProfile }) {
  const system = profileToSystemPrompt(profile);
  useAssistantInstructions(system ?? "");
  return null;
}
