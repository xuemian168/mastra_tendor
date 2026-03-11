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
  const [profile, setProfile] = useState<CompanyProfile>({
    companyName: "",
    description: "",
  });
  const [profileLoaded, setProfileLoaded] = useState(false);
  const hasProfile = profile.description.trim().length > 0;
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    const loaded = loadProfile();
    setProfile(loaded);
    setProfileLoaded(true);
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
