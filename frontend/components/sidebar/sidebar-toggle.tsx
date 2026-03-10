"use client";

import { PanelLeftIcon } from "lucide-react";
import { useSidebar } from "./sidebar-context";
import type { FC } from "react";

export const SidebarToggle: FC = () => {
  const { toggle } = useSidebar();

  return (
    <button
      onClick={toggle}
      className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
      aria-label="Toggle sidebar"
    >
      <PanelLeftIcon className="size-5" />
    </button>
  );
};
