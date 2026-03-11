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
          className="fixed inset-0 z-40 bg-background/60 backdrop-blur-md md:hidden transition-opacity duration-300"
          onClick={close}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          ${isOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"}
          fixed inset-y-0 left-0 z-50 flex w-[300px] flex-col border-r border-border/10 bg-sidebar/95 backdrop-blur-xl transition-all duration-300 ease-in-out
          md:relative md:z-auto md:shadow-none
          ${isOpen ? "md:w-[300px]" : "md:w-0 md:translate-x-0 md:overflow-hidden md:border-r-0"}
        `}
      >
        <div className="flex w-[300px] flex-1 flex-col overflow-hidden">
          <ThreadList />
        </div>
      </aside>
    </>
  );
};
