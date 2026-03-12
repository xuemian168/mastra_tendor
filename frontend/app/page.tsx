"use client";

import { useState, useEffect } from "react";
import { AssistantRuntimeProvider } from "@assistant-ui/react";
import { AssistantChatTransport } from "@assistant-ui/react-ai-sdk";
import { Thread } from "@/components/assistant-ui/thread";
import { RegisterToolUIs } from "@/components/tool-uis";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CompanyProfileDialog } from "@/components/company-profile-dialog";
import {
  type CompanyProfile,
  loadProfile,
} from "@/lib/company-profile";
import { CompanyProfileInstructions } from "@/components/company-profile-instructions";
import { documentAttachmentAdapter } from "@/lib/document-attachment-adapter";
import { useLocalChatRuntime } from "@/lib/use-local-chat-runtime";
import { SidebarProvider } from "@/components/sidebar/sidebar-context";
import { Sidebar } from "@/components/sidebar/sidebar";
import { SidebarToggle } from "@/components/sidebar/sidebar-toggle";
import { Button } from "@/components/ui/button";
import { SparklesIcon, Building2Icon } from "lucide-react";

const MASTRA_URL =
  process.env.NEXT_PUBLIC_MASTRA_URL || "http://localhost:4111";

const transport = new AssistantChatTransport({
  api: `${MASTRA_URL}/chat/orchestratorAgent`,
  fetch: async (url, init) => {
    if (init?.body && typeof init.body === "string") {
      const body = JSON.parse(init.body);
      // Only keep fields that Mastra handleChatStream expects.
      // Avoids leaking extra fields (tools, metadata, trigger) into agent options.
      const cleaned: Record<string, unknown> = {};
      // Move system prompt (company profile) into the first user message
      // to avoid double system prompts that overwhelm Gemini's thinking budget.
      const messages = Array.isArray(body.messages) ? [...body.messages] : [];
      if (body.system && messages.length > 0) {
        const firstUserIdx = messages.findIndex(
          (m: { role: string }) => m.role === "user",
        );
        if (firstUserIdx !== -1) {
          const msg = { ...messages[firstUserIdx] };
          const parts = Array.isArray(msg.parts) ? [...msg.parts] : [];
          // Prepend company profile as context before user's text
          parts.unshift({ type: "text", text: `${body.system}\n\n---\n\n` });
          msg.parts = parts;
          messages[firstUserIdx] = msg;
        }
      }
      cleaned.messages = messages;
      if (body.id) cleaned.id = body.id;
      if (body.runId) cleaned.runId = body.runId;
      if (body.resumeData) cleaned.resumeData = body.resumeData;
      init = { ...init, body: JSON.stringify(cleaned) };
    }
    return globalThis.fetch(url, init);
  },
});

export default function Home() {
  const runtime = useLocalChatRuntime({
    transport,
    adapters: { attachments: documentAttachmentAdapter },
  });
  const [profile, setProfile] = useState<CompanyProfile>({
    companyName: "",
    description: "",
  });
  const hasProfile = profile.description.trim().length > 0;
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    const loaded = loadProfile();
    setProfile(loaded);
    if (!loaded.description.trim()) {
      setDialogOpen(true);
    }
  }, []);

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <CompanyProfileInstructions profile={profile} />
      <RegisterToolUIs />
      <TooltipProvider>
        <SidebarProvider>
          <div className="flex h-dvh overflow-hidden bg-background">
            <Sidebar />
            <main className="flex min-w-0 flex-1 flex-col relative">
              <header className="flex shrink-0 items-center justify-between bg-background/80 px-6 md:px-12 lg:px-16 py-4 md:py-6 backdrop-blur-lg z-20">
                <div className="flex items-center gap-4">
                  <SidebarToggle />
                  <div className="flex items-center gap-2">
                    <div className="flex size-6 items-center justify-center rounded-md bg-primary/10">
                      <SparklesIcon className="size-3.5 text-primary" />
                    </div>
                    <h1 className="text-sm font-medium text-foreground/80 tracking-tight">Analysis Assistant</h1>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {hasProfile ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDialogOpen(true)}
                      className="h-8 gap-2 rounded-full border border-border/40 px-3 text-xs font-medium hover:bg-accent"
                    >
                      <Building2Icon className="size-3.5 text-muted-foreground" />
                      {profile.companyName}
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDialogOpen(true)}
                      className="h-8 gap-2 rounded-full border border-destructive/20 px-3 text-xs font-medium text-destructive hover:bg-destructive/5"
                    >
                      <Building2Icon className="size-3.5" />
                      Set Company Profile
                    </Button>
                  )}
                </div>
              </header>
              <div className="flex-1 overflow-hidden relative">
                <Thread />
              </div>
            </main>
          </div>
        </SidebarProvider>
      </TooltipProvider>
      <CompanyProfileDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSave={setProfile}
        required={!hasProfile}
      />
    </AssistantRuntimeProvider>
  );
}
