"use client";

import {
  ThreadListPrimitive,
  ThreadListItemPrimitive,
} from "@assistant-ui/react";
import { PlusIcon, TrashIcon } from "lucide-react";
import type { FC } from "react";

export const ThreadList: FC = () => {
  return (
    <ThreadListPrimitive.Root className="flex flex-1 flex-col overflow-hidden">
      <ThreadListNew />
      <div className="flex-1 overflow-y-auto px-2 py-1">
        <ThreadListPrimitive.Items
          components={{ ThreadListItem }}
        />
      </div>
    </ThreadListPrimitive.Root>
  );
};

const ThreadListNew: FC = () => {
  return (
    <ThreadListPrimitive.New className="mx-2 mt-2 mb-1 flex items-center gap-2 rounded-xl bg-primary/10 px-3 py-2.5 text-sm font-medium text-primary transition-all hover:bg-primary/15 active:scale-[0.98]">
      <PlusIcon className="size-4" />
      New Chat
    </ThreadListPrimitive.New>
  );
};

const ThreadListItem: FC = () => {
  return (
    <ThreadListItemPrimitive.Root className="group relative flex items-center rounded-lg transition-colors hover:bg-sidebar-accent data-[active]:bg-primary/8 data-[active]:before:absolute data-[active]:before:inset-y-1 data-[active]:before:left-0 data-[active]:before:w-1 data-[active]:before:rounded-full data-[active]:before:bg-sidebar-primary">
      <ThreadListItemPrimitive.Trigger className="flex-1 truncate px-3 py-2 text-left text-sm text-sidebar-foreground">
        <ThreadListItemPrimitive.Title fallback="New Chat" />
      </ThreadListItemPrimitive.Trigger>
      <ThreadListItemPrimitive.Delete className="mr-2 hidden size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-all duration-150 hover:bg-destructive/10 hover:text-destructive group-hover:flex">
        <TrashIcon className="size-3.5" />
      </ThreadListItemPrimitive.Delete>
    </ThreadListItemPrimitive.Root>
  );
};
