import { MarkdownText } from "@/components/assistant-ui/markdown-text";
import { TooltipIconButton } from "@/components/assistant-ui/tooltip-icon-button";
import { ToolFallback } from "@/components/assistant-ui/tool-fallback";
import {
  ComposerAddAttachment,
  ComposerAttachments,
  UserMessageAttachments,
} from "@/components/assistant-ui/attachment";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  PipelineProgress,
  isTenderPipeline,
  type ToolCallInfo,
} from "@/components/pipeline-progress";
import {
  ActionBarMorePrimitive,
  ActionBarPrimitive,
  AuiIf,
  BranchPickerPrimitive,
  ComposerPrimitive,
  ErrorPrimitive,
  MessagePrimitive,
  ThreadPrimitive,
  useMessage,
} from "@assistant-ui/react";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CopyIcon,
  DownloadIcon,
  MoreHorizontalIcon,
  PencilIcon,
  RefreshCwIcon,
  SparklesIcon,
  SquareIcon,
} from "lucide-react";
import type { FC } from "react";

export const Thread: FC = () => {
  return (
    <ThreadPrimitive.Root
      className="aui-root aui-thread-root @container flex h-full flex-col bg-background mx-auto w-full"
      style={{
        ["--thread-max-width" as string]: "min(64rem, 100%)",
      }}
    >
      <ThreadPrimitive.Viewport
        turnAnchor="top"
        className="aui-thread-viewport relative flex flex-1 flex-col overflow-x-hidden overflow-y-auto scroll-smooth"
      >
        <div className="flex w-full max-w-(--thread-max-width) mx-auto flex-1 flex-col pt-6 md:pt-12 pb-20 px-6 md:px-12 lg:px-16">
          <AuiIf condition={(s) => s.thread.isEmpty}>
            <div className="flex-1 flex flex-col justify-center">
              <ThreadWelcome />
            </div>
          </AuiIf>

          <ThreadPrimitive.Messages
            components={{
              UserMessage,
              EditComposer,
              AssistantMessage,
            }}
          />
        </div>

        <ThreadPrimitive.ViewportFooter className="aui-thread-viewport-footer relative sticky bottom-0 mx-auto w-full max-w-(--thread-max-width) flex flex-col gap-4 overflow-visible px-6 md:px-12 lg:px-16 pb-8 md:pb-10 before:pointer-events-none before:absolute before:-top-20 before:left-0 before:right-0 before:h-20 before:bg-gradient-to-t before:from-background before:to-transparent z-10">
          <ThreadScrollToBottom />
          <Composer />
          <div className="text-center text-[10px] text-muted-foreground/30 px-4 tracking-wide mt-2">
            Analysis Assistant can make mistakes. Check important info.
          </div>
        </ThreadPrimitive.ViewportFooter>
      </ThreadPrimitive.Viewport>
    </ThreadPrimitive.Root>
  );
};

const ThreadScrollToBottom: FC = () => {
  return (
    <ThreadPrimitive.ScrollToBottom asChild>
      <TooltipIconButton
        tooltip="Scroll to bottom"
        variant="outline"
        className="aui-thread-scroll-to-bottom absolute -top-16 z-10 self-center rounded-full bg-background/80 p-3 shadow-md backdrop-blur-sm disabled:invisible hover:bg-accent"
      >
        <ArrowDownIcon className="size-4" />
      </TooltipIconButton>
    </ThreadPrimitive.ScrollToBottom>
  );
};

const ThreadWelcome: FC = () => {
  return (
    <div className="aui-thread-welcome-root flex w-full flex-col py-8 md:py-12">
      <div className="aui-thread-welcome-message flex flex-col px-0">
        <div className="fade-in slide-in-from-bottom-2 animate-in fill-mode-both mb-8 md:mb-10 flex size-12 md:size-14 items-center justify-center rounded-xl bg-primary/10 duration-500 md:-ml-1">
          <SparklesIcon className="size-6 md:size-7 text-primary" />
        </div>
        <h1 className="aui-thread-welcome-message-inner fade-in slide-in-from-bottom-2 animate-in fill-mode-both text-4xl md:text-6xl font-medium tracking-tight duration-500 [animation-delay:100ms] leading-tight text-foreground">
          Hello, <br className="md:hidden" />
          <span className="bg-gradient-to-r from-primary via-primary/80 to-primary/50 bg-clip-text text-transparent">how can I help?</span>
        </h1>
        <p className="aui-thread-welcome-message-inner fade-in slide-in-from-bottom-2 animate-in fill-mode-both mt-6 md:mt-8 max-w-3xl text-lg md:text-2xl text-muted-foreground/80 duration-500 [animation-delay:200ms] leading-relaxed">
          I'm your intelligent analysis assistant. I can help you with document review, risk assessment, and strategy recommendations.
        </p>
      </div>
      <div className="mt-12 md:mt-24">
        <ThreadSuggestions />
      </div>
    </div>
  );
};

const SUGGESTIONS = [
  {
    text: "Run a full bid/no-bid analysis",
    subtext: "on my tender document"
  },
  {
    text: "Key obligations",
    subtext: "Help me understand this contract"
  },
  {
    text: "Compare approaches",
    subtext: "Analyze pros and cons"
  },
  {
    text: "Vendor evaluation",
    subtext: "What should I consider?"
  },
];

const ThreadSuggestions: FC = () => {
  return (
    <div className="aui-thread-welcome-suggestions grid w-full grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 px-0">
      {SUGGESTIONS.map((s, i) => (
        <ThreadPrimitive.Suggestion
          key={s.text}
          prompt={`${s.text} ${s.subtext}`}
          method="replace"
          autoSend={false}
          className="fade-in slide-in-from-bottom-2 animate-in fill-mode-both h-full w-full flex-col items-start justify-start gap-1 rounded-2xl border border-border/40 bg-card/40 p-6 text-left transition-all hover:border-primary/20 hover:bg-accent/50 hover:shadow-sm active:scale-[0.98]"
          style={{ animationDelay: `${300 + i * 50}ms` }}
        >
          <span className="text-sm font-medium leading-snug">{s.text}</span>
          <span className="text-xs text-muted-foreground/60 mt-auto pt-4">{s.subtext}</span>
        </ThreadPrimitive.Suggestion>
      ))}
    </div>
  );
};

/* ── Composer (Floating Pill Design) ── */

const Composer: FC = () => {
  return (
    <ComposerPrimitive.Root className="aui-composer-root relative flex w-full flex-col">
      <ComposerAttachments />

      <div className="flex w-full flex-col rounded-[28px] border border-border/40 bg-card p-1.5 shadow-gemini transition-all duration-300 has-[textarea:focus-visible]:border-primary/20 has-[textarea:focus-visible]:ring-4 has-[textarea:focus-visible]:ring-primary/5">
        <ComposerPrimitive.Input
          placeholder="Ask anything..."
          className="aui-composer-input max-h-[25dvh] md:max-h-48 min-h-[52px] w-full resize-none bg-transparent px-5 py-3.5 text-base outline-none placeholder:text-muted-foreground/50 focus-visible:ring-0"
          rows={1}
          autoFocus
          aria-label="Message input"
        />
        <div className="aui-composer-action-wrapper relative flex items-center justify-between px-2 pb-1.5">
          <div className="flex items-center gap-1">
            <ComposerAddAttachment />
          </div>

          <div className="flex items-center gap-2">
            <AuiIf condition={(s) => !s.thread.isRunning}>
              <ComposerPrimitive.Send asChild>
                <TooltipIconButton
                  tooltip="Send"
                  side="top"
                  type="button"
                  variant="default"
                  size="icon"
                  className="aui-composer-send size-9 rounded-full bg-primary text-primary-foreground shadow-sm transition-all hover:opacity-90 active:scale-95 disabled:bg-muted disabled:text-muted-foreground"
                  aria-label="Send message"
                >
                  <ArrowUpIcon className="size-5" />
                </TooltipIconButton>
              </ComposerPrimitive.Send>
            </AuiIf>
            <AuiIf condition={(s) => s.thread.isRunning}>
              <ComposerPrimitive.Cancel asChild>
                <Button
                  type="button"
                  variant="default"
                  size="icon"
                  className="aui-composer-cancel size-9 rounded-full bg-foreground text-background"
                  aria-label="Stop"
                >
                  <SquareIcon className="size-4 fill-current" />
                </Button>
              </ComposerPrimitive.Cancel>
            </AuiIf>
          </div>
        </div>
      </div>
    </ComposerPrimitive.Root>
  );
};

/* ── Messages (Minimalist Gemini Style) ── */

const MessageError: FC = () => {
  return (
    <MessagePrimitive.Error>
      <ErrorPrimitive.Root className="aui-message-error-root mt-2 rounded-md border border-destructive bg-destructive/10 p-3 text-destructive text-sm dark:bg-destructive/5 dark:text-red-200">
        <ErrorPrimitive.Message className="aui-message-error-message line-clamp-2" />
      </ErrorPrimitive.Root>
    </MessagePrimitive.Error>
  );
};

const AssistantMessagePipeline: FC = () => {
  const message = useMessage();
  if (message.role !== "assistant") return null;

  const toolCalls: ToolCallInfo[] = message.content
    .filter((part): part is typeof part & { type: "tool-call" } => part.type === "tool-call")
    .map((part) => ({
      toolName: part.toolName,
      status: part.result !== undefined ? ("done" as const) : ("running" as const),
    }));

  if (!isTenderPipeline(toolCalls)) return null;
  return <PipelineProgress toolCalls={toolCalls} />;
};

const AssistantMessage: FC = () => {
  return (
    <MessagePrimitive.Root
      className="aui-assistant-message-root fade-in relative w-full animate-in py-8 md:py-14 duration-500"
      data-role="assistant"
    >
      <div className="flex gap-4 md:gap-8">
        <div className="mt-1 flex size-8 md:size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary shadow-sm border border-primary/5">
          <SparklesIcon className="size-4 md:size-5" />
        </div>
        <div className="aui-assistant-message-content wrap-break-word flex-1 px-1 pt-1.5 text-foreground leading-relaxed">
          <AssistantMessagePipeline />
          <MessagePrimitive.Parts
            components={{
              Text: MarkdownText,
              tools: { Fallback: ToolFallback },
            }}
          />
          <MessageError />
          
          <div className="aui-assistant-message-footer mt-10 flex items-center gap-2 opacity-0 transition-opacity hover:opacity-100 focus-within:opacity-100">
            <BranchPicker />
            <AssistantActionBar />
          </div>
        </div>
      </div>
    </MessagePrimitive.Root>
  );
};

const AssistantActionBar: FC = () => {
  return (
    <ActionBarPrimitive.Root
      hideWhenRunning
      autohide="not-last"
      className="aui-assistant-action-bar-root flex gap-1 text-muted-foreground"
    >
      <ActionBarPrimitive.Copy asChild>
        <TooltipIconButton tooltip="Copy">
          <AuiIf condition={(s) => s.message.isCopied}>
            <CheckIcon className="size-4" />
          </AuiIf>
          <AuiIf condition={(s) => !s.message.isCopied}>
            <CopyIcon className="size-4" />
          </AuiIf>
        </TooltipIconButton>
      </ActionBarPrimitive.Copy>
      <ActionBarPrimitive.Reload asChild>
        <TooltipIconButton tooltip="Refresh">
          <RefreshCwIcon className="size-4" />
        </TooltipIconButton>
      </ActionBarPrimitive.Reload>
      <ActionBarMorePrimitive.Root>
        <ActionBarMorePrimitive.Trigger asChild>
          <TooltipIconButton
            tooltip="More"
            className="data-[state=open]:bg-accent"
          >
            <MoreHorizontalIcon className="size-4" />
          </TooltipIconButton>
        </ActionBarMorePrimitive.Trigger>
        <ActionBarMorePrimitive.Content
          side="bottom"
          align="start"
          className="aui-action-bar-more-content z-50 min-w-32 overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md"
        >
          <ActionBarPrimitive.ExportMarkdown asChild>
            <ActionBarMorePrimitive.Item className="aui-action-bar-more-item flex cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground">
              <DownloadIcon className="size-4" />
              Export as Markdown
            </ActionBarMorePrimitive.Item>
          </ActionBarPrimitive.ExportMarkdown>
        </ActionBarMorePrimitive.Content>
      </ActionBarMorePrimitive.Root>
    </ActionBarPrimitive.Root>
  );
};

const UserMessage: FC = () => {
  return (
    <MessagePrimitive.Root
      className="aui-user-message-root fade-in flex w-full flex-col items-end animate-in py-6 md:py-8 duration-300"
      data-role="user"
    >
      <div className="max-w-[92%] md:max-w-[80%]">
        <UserMessageAttachments />
        <div className="aui-user-message-content-wrapper relative flex flex-col md:flex-row items-end md:items-start gap-3">
          <div className="aui-user-action-bar-wrapper order-2 md:order-1 opacity-0 transition-opacity hover:opacity-100">
            <UserActionBar />
          </div>
          <div className="aui-user-message-content order-1 md:order-2 wrap-break-word rounded-[22px] bg-secondary/80 px-5 md:px-6 py-3.5 md:py-4 text-foreground shadow-sm border border-border/10">
            <MessagePrimitive.Parts components={{ Text: MarkdownText }} />
          </div>
        </div>
        <BranchPicker className="mt-2 justify-end" />
      </div>
    </MessagePrimitive.Root>
  );
};

const UserActionBar: FC = () => {
  return (
    <ActionBarPrimitive.Root
      hideWhenRunning
      autohide="not-last"
      className="aui-user-action-bar-root flex flex-col items-end"
    >
      <ActionBarPrimitive.Edit asChild>
        <TooltipIconButton
          tooltip="Edit"
          className="aui-user-action-edit"
        >
          <PencilIcon className="size-4" />
        </TooltipIconButton>
      </ActionBarPrimitive.Edit>
    </ActionBarPrimitive.Root>
  );
};

const EditComposer: FC = () => {
  return (
    <MessagePrimitive.Root className="aui-edit-composer-wrapper mx-auto flex w-full max-w-(--thread-max-width) flex-col px-2 py-3">
      <ComposerPrimitive.Root className="aui-edit-composer-root ml-auto flex w-full max-w-[85%] flex-col rounded-2xl bg-muted p-2 shadow-sm">
        <ComposerPrimitive.Input
          className="aui-edit-composer-input min-h-14 w-full resize-none bg-transparent p-3 text-foreground text-sm outline-none"
          autoFocus
        />
        <div className="aui-edit-composer-footer mx-3 mb-2 flex items-center gap-2 self-end">
          <ComposerPrimitive.Cancel asChild>
            <Button variant="ghost" size="sm" className="rounded-full">Cancel</Button>
          </ComposerPrimitive.Cancel>
          <ComposerPrimitive.Send asChild>
            <Button size="sm" className="rounded-full">Update</Button>
          </ComposerPrimitive.Send>
        </div>
      </ComposerPrimitive.Root>
    </MessagePrimitive.Root>
  );
};

const BranchPicker: FC<BranchPickerPrimitive.Root.Props> = ({
  className,
  ...rest
}) => {
  return (
    <BranchPickerPrimitive.Root
      hideWhenSingleBranch
      className={cn(
        "aui-branch-picker-root mr-2 -ml-2 inline-flex items-center text-muted-foreground text-[10px]",
        className,
      )}
      {...rest}
    >
      <BranchPickerPrimitive.Previous asChild>
        <TooltipIconButton tooltip="Previous">
          <ChevronLeftIcon className="size-3" />
        </TooltipIconButton>
      </BranchPickerPrimitive.Previous>
      <span className="aui-branch-picker-state font-medium mx-1">
        <BranchPickerPrimitive.Number /> / <BranchPickerPrimitive.Count />
      </span>
      <BranchPickerPrimitive.Next asChild>
        <TooltipIconButton tooltip="Next">
          <ChevronRightIcon className="size-3" />
        </TooltipIconButton>
      </BranchPickerPrimitive.Next>
    </BranchPickerPrimitive.Root>
  );
};
