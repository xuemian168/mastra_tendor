import type {
  RemoteThreadListAdapter,
  RemoteThreadListResponse,
  RemoteThreadInitializeResponse,
  RemoteThreadMetadata,
} from "@assistant-ui/core";
import type { ThreadMessage } from "@assistant-ui/core";
import { createAssistantStream } from "assistant-stream";

const STORAGE_KEY = "aui-threads";

type StoredThread = {
  readonly status: "regular" | "archived";
  readonly remoteId: string;
  readonly externalId?: string | undefined;
  readonly title?: string | undefined;
};

function readThreads(): StoredThread[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StoredThread[]) : [];
  } catch {
    return [];
  }
}

function writeThreads(threads: StoredThread[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(threads));
}

function updateThread(
  remoteId: string,
  updater: (t: StoredThread) => StoredThread,
): void {
  const threads = readThreads();
  const idx = threads.findIndex((t) => t.remoteId === remoteId);
  if (idx === -1) return;
  const updated = [...threads];
  updated[idx] = updater(threads[idx]);
  writeThreads(updated);
}

export class LocalThreadListAdapter implements RemoteThreadListAdapter {
  async list(): Promise<RemoteThreadListResponse> {
    return { threads: readThreads() as RemoteThreadMetadata[] };
  }

  async initialize(
    threadId: string,
  ): Promise<RemoteThreadInitializeResponse> {
    const remoteId = crypto.randomUUID();
    const threads = readThreads();
    writeThreads([
      { status: "regular", remoteId, title: undefined },
      ...threads,
    ]);
    return { remoteId, externalId: undefined };
  }

  async rename(remoteId: string, newTitle: string): Promise<void> {
    updateThread(remoteId, (t) => ({ ...t, title: newTitle }));
  }

  async archive(remoteId: string): Promise<void> {
    updateThread(remoteId, (t) => ({ ...t, status: "archived" }));
  }

  async unarchive(remoteId: string): Promise<void> {
    updateThread(remoteId, (t) => ({ ...t, status: "regular" }));
  }

  async delete(remoteId: string): Promise<void> {
    const threads = readThreads();
    writeThreads(threads.filter((t) => t.remoteId !== remoteId));
  }

  async generateTitle(
    remoteId: string,
    messages: readonly ThreadMessage[],
  ): Promise<ReturnType<typeof createAssistantStream>> {
    const firstUserMsg = messages.find((m) => m.role === "user");
    let title = "新对话";
    if (firstUserMsg) {
      const textPart = firstUserMsg.content.find((p) => p.type === "text");
      if (textPart && "text" in textPart) {
        title = textPart.text.slice(0, 50).trim() || "新对话";
      }
    }

    updateThread(remoteId, (t) => ({ ...t, title }));

    return createAssistantStream((controller) => {
      controller.appendText(title);
      controller.close();
    });
  }

  async fetch(threadId: string): Promise<RemoteThreadMetadata> {
    const threads = readThreads();
    const found = threads.find((t) => t.remoteId === threadId);
    if (!found) {
      return { status: "regular", remoteId: threadId, title: undefined };
    }
    return found as RemoteThreadMetadata;
  }
}
