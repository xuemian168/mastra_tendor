"use client";

import {
  ThreadListPrimitive,
  ThreadListItemPrimitive,
} from "@assistant-ui/react";
import { PlusIcon, TrashIcon } from "lucide-react";
import type { FC } from "react";

export const ThreadList: FC = () => {
  return (
    <ThreadListPrimitive.Root className="flex flex-1 flex-col overflow-hidden bg-sidebar/50 backdrop-blur-md">
      <div className="p-4">
        <ThreadListNew />
      </div>
      <div className="flex-1 overflow-y-auto px-3 pb-4">
        <div className="mb-2 px-2 text-[10px] font-semibold tracking-wider text-muted-foreground/60 uppercase">
          Recent
        </div>
        <ThreadListPrimitive.Items
          components={{ ThreadListItem }}
        />
      </div>
    </ThreadListPrimitive.Root>
  );
};

const ThreadListNew: FC = () => {
  return (
    <ThreadListPrimitive.New className="group flex w-full items-center gap-3 rounded-[18px] bg-secondary/80 px-4 py-3 text-sm font-medium text-foreground transition-all hover:bg-secondary hover:shadow-sm active:scale-[0.98]">
      <PlusIcon className="size-4 text-primary" />
      <span>New Analysis</span>
    </ThreadListPrimitive.New>
  );
};

const ThreadListItem: FC = () => {
  return (
    <ThreadListItemPrimitive.Root className="group relative my-0.5 flex items-center rounded-xl transition-all hover:bg-sidebar-accent/50 data-[active]:bg-sidebar-accent shadow-sm data-[active]:shadow-none border border-transparent data-[active]:border-border/40">
      <ThreadListItemPrimitive.Trigger className="flex-1 truncate px-4 py-2.5 text-left text-sm font-normal text-sidebar-foreground/80 group-data-[active]:font-medium group-data-[active]:text-foreground">
        <ThreadListItemPrimitive.Title fallback="Untitled Analysis" />
      </ThreadListItemPrimitive.Trigger>
      <div className="mr-2 flex shrink-0 items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100">
        <ThreadListItemPrimitive.Delete className="flex size-7 items-center justify-center rounded-lg text-muted-foreground/60 transition-colors hover:bg-destructive/10 hover:text-destructive">
          <TrashIcon className="size-3.5" />
        </ThreadListItemPrimitive.Delete>
      </div>
    </ThreadListItemPrimitive.Root>
  );
};
