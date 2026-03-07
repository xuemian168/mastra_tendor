"use client";

import { useAssistantInstructions } from "@assistant-ui/react";
import { type CompanyProfile, profileToSystemPrompt } from "@/lib/company-profile";

export function CompanyProfileInstructions({ profile }: { profile: CompanyProfile }) {
  const system = profileToSystemPrompt(profile);
  useAssistantInstructions(system ?? "");
  return null;
}
