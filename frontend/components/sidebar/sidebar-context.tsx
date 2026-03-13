"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import { getRawStorage, setRawStorage } from "@/lib/storage";

const SIDEBAR_STORAGE_KEY = "sidebar-open";

type SidebarContextValue = {
  isOpen: boolean;
  toggle: () => void;
  open: () => void;
  close: () => void;
};

const SidebarContext = createContext<SidebarContextValue | null>(null);

export function useSidebar(): SidebarContextValue {
  const ctx = useContext(SidebarContext);
  if (!ctx) throw new Error("useSidebar must be used within SidebarProvider");
  return ctx;
}

function getInitialOpen(): boolean {
  if (typeof window === "undefined") return true;
  const stored = getRawStorage(SIDEBAR_STORAGE_KEY, "");
  if (stored !== "") return stored === "true";
  return window.matchMedia("(min-width: 768px)").matches;
}

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(getInitialOpen);

  useEffect(() => {
    setRawStorage(SIDEBAR_STORAGE_KEY, String(isOpen));
  }, [isOpen]);

  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);
  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

  return (
    <SidebarContext.Provider value={{ isOpen, toggle, open, close }}>
      {children}
    </SidebarContext.Provider>
  );
}
