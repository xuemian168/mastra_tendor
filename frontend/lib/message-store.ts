import type { UIMessage } from "@ai-sdk/react";
import { getStorage, setStorage, removeStorage } from "./storage";

const PREFIX = "aui-messages-";

export function loadMessages(threadId: string): UIMessage[] {
  return getStorage<UIMessage[]>(PREFIX + threadId, []);
}

export function saveMessages(threadId: string, messages: UIMessage[]): void {
  if (messages.length === 0) return;
  setStorage(PREFIX + threadId, messages);
}

export function deleteMessages(threadId: string): void {
  removeStorage(PREFIX + threadId);
}
