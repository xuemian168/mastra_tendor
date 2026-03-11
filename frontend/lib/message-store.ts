import type { UIMessage } from "@ai-sdk/react";

const PREFIX = "aui-messages-";

export function loadMessages(threadId: string): UIMessage[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(PREFIX + threadId);
    return raw ? (JSON.parse(raw) as UIMessage[]) : [];
  } catch {
    return [];
  }
}

export function saveMessages(threadId: string, messages: UIMessage[]): void {
  if (typeof window === "undefined") return;
  if (messages.length === 0) return;
  localStorage.setItem(PREFIX + threadId, JSON.stringify(messages));
}

export function deleteMessages(threadId: string): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(PREFIX + threadId);
}
