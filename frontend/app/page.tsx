"use client";

import { useState, useEffect } from "react";
import { AssistantRuntimeProvider } from "@assistant-ui/react";
import { useChatRuntime, AssistantChatTransport } from "@assistant-ui/react-ai-sdk";
import { ChatUI } from "@/components/chat-ui";
import { CompanyProfileDialog } from "@/components/company-profile-dialog";
import {
  type CompanyProfile,
  loadProfile,
  profileToSystemPrompt,
} from "@/lib/company-profile";
import { CompanyProfileInstructions } from "@/components/company-profile-instructions";

const transport = new AssistantChatTransport({ api: "/api/chat" });

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
      <main className="flex h-screen flex-col">
        <header className="flex items-center justify-between border-b border-[var(--border)] px-6 py-3">
          <h1 className="text-lg font-semibold">Tender Analysis System</h1>
          <button
            onClick={() => setDialogOpen(true)}
            className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
              hasProfile
                ? "border-[var(--primary)] text-[var(--primary)] hover:bg-[var(--accent)]"
                : "border-[var(--destructive)] text-[var(--destructive)] hover:bg-red-50 dark:hover:bg-red-950"
            }`}
          >
            {hasProfile ? profile.companyName : "Set Company Profile"}
          </button>
        </header>
        <div className="flex-1 overflow-hidden">
          <ChatUI />
        </div>
      </main>
      <CompanyProfileDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSave={setProfile}
      />
    </AssistantRuntimeProvider>
  );
}
