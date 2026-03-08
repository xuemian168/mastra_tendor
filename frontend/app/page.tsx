"use client";

import { useState, useEffect } from "react";
import { AssistantRuntimeProvider } from "@assistant-ui/react";
import { useChatRuntime, AssistantChatTransport } from "@assistant-ui/react-ai-sdk";
import { Thread } from "@/components/assistant-ui/thread";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CompanyProfileDialog } from "@/components/company-profile-dialog";
import {
  type CompanyProfile,
  loadProfile,
} from "@/lib/company-profile";
import { CompanyProfileInstructions } from "@/components/company-profile-instructions";

const MASTRA_URL =
  process.env.NEXT_PUBLIC_MASTRA_URL || "http://localhost:4111";

const transport = new AssistantChatTransport({
  api: `${MASTRA_URL}/chat/orchestratorAgent`,
});

export default function Home() {
  const runtime = useChatRuntime({ transport });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [profile, setProfile] = useState<CompanyProfile>({
    companyName: "",
    description: "",
  });

  useEffect(() => {
    setProfile(loadProfile());
  }, []);

  const hasProfile = profile.description.trim().length > 0;

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <CompanyProfileInstructions profile={profile} />
      <TooltipProvider>
        <main className="flex h-screen flex-col">
          <header className="flex items-center justify-between border-b border-border px-6 py-3">
            <h1 className="text-lg font-semibold">Analysis Assistant</h1>
            <button
              onClick={() => setDialogOpen(true)}
              className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                hasProfile
                  ? "border-primary text-primary hover:bg-accent"
                  : "border-destructive text-destructive hover:bg-destructive/10"
              }`}
            >
              {hasProfile ? profile.companyName : "Set Company Profile"}
            </button>
          </header>
          <div className="flex-1 overflow-hidden">
            <Thread />
          </div>
        </main>
      </TooltipProvider>
      <CompanyProfileDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSave={setProfile}
      />
    </AssistantRuntimeProvider>
  );
}
