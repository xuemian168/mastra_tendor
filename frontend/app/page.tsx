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
});

export default function Home() {
  const runtime = useLocalChatRuntime({
    transport,
    adapters: { attachments: documentAttachmentAdapter },
  });
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
      <RegisterToolUIs />
      <TooltipProvider>
        <SidebarProvider>
          <div className="flex h-screen">
            <Sidebar />
            <main className="flex min-w-0 flex-1 flex-col">
              <header className="flex items-center justify-between border-b border-border/60 bg-background/80 px-4 py-3 shadow-[var(--shadow-sm)] backdrop-blur-lg">
                <div className="flex items-center gap-3">
                  <SidebarToggle />
                  <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10">
                    <SparklesIcon className="size-4 text-primary" />
                  </div>
                  <h1 className="text-lg font-semibold">Analysis Assistant</h1>
                </div>
                {hasProfile ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDialogOpen(true)}
                  >
                    <Building2Icon className="mr-1.5 size-3.5" />
                    {profile.companyName}
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDialogOpen(true)}
                    className="border-destructive text-destructive hover:bg-destructive/10"
                  >
                    <Building2Icon className="mr-1.5 size-3.5" />
                    Set Company Profile
                  </Button>
                )}
              </header>
              <div className="flex-1 overflow-hidden">
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
      />
    </AssistantRuntimeProvider>
  );
}
