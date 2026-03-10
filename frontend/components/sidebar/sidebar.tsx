"use client";

import { useSidebar } from "./sidebar-context";
import { ThreadList } from "./thread-list";
import type { FC } from "react";

export const Sidebar: FC = () => {
  const { isOpen, close } = useSidebar();

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden"
          onClick={close}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          ${isOpen ? "translate-x-0 shadow-[var(--shadow-lg)]" : "-translate-x-full"}
          fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col border-r border-sidebar-border/60 bg-sidebar transition-transform duration-200 ease-in-out
          md:relative md:z-auto md:shadow-none md:transition-[width] md:duration-200
          ${isOpen ? "md:w-[260px]" : "md:w-0 md:translate-x-0 md:overflow-hidden md:border-r-0"}
        `}
      >
        <div className="flex w-[260px] flex-1 flex-col overflow-hidden">
          <ThreadList />
        </div>
      </aside>
    </>
  );
};
