"use client";

import { useChat, type UIMessage } from "@ai-sdk/react";
import {
  type AssistantRuntime,
  unstable_useRemoteThreadListRuntime,
  useAuiState,
  type ExternalStoreAdapter,
  type ThreadHistoryAdapter,
} from "@assistant-ui/react";
import {
  useAISDKRuntime,
  AssistantChatTransport,
} from "@assistant-ui/react-ai-sdk";
import { type ChatInit, type ChatTransport } from "ai";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { LocalThreadListAdapter } from "./local-thread-list-adapter";
import { loadMessages, saveMessages } from "./message-store";

type RuntimeAdapters =
  | (NonNullable<ExternalStoreAdapter["adapters"]> & {
      history?: ThreadHistoryAdapter | undefined;
    })
  | undefined;

export type UseLocalChatRuntimeOptions<
  UI_MESSAGE extends UIMessage = UIMessage,
> = ChatInit<UI_MESSAGE> & {
  adapters?: RuntimeAdapters;
};

const useDynamicChatTransport = <UI_MESSAGE extends UIMessage = UIMessage>(
  transport: ChatTransport<UI_MESSAGE>,
): ChatTransport<UI_MESSAGE> => {
  const transportRef = useRef<ChatTransport<UI_MESSAGE>>(transport);
  useEffect(() => {
    transportRef.current = transport;
  });
  return useMemo(
    () =>
      new Proxy(transportRef.current, {
        get(_, prop) {
          const res =
            transportRef.current[prop as keyof ChatTransport<UI_MESSAGE>];
          return typeof res === "function"
            ? res.bind(transportRef.current)
            : res;
        },
      }),
    [],
  );
};

export const useLocalChatRuntime = <
  UI_MESSAGE extends UIMessage = UIMessage,
>(
  options: UseLocalChatRuntimeOptions<UI_MESSAGE>,
): AssistantRuntime => {
  const adapter = useMemo(() => new LocalThreadListAdapter(), []);

  return unstable_useRemoteThreadListRuntime({
    runtimeHook: function RuntimeHook() {
      const { adapters, transport: transportOptions, ...chatOptions } = options;

      const transport = useDynamicChatTransport(
        transportOptions ?? new AssistantChatTransport(),
      );

      const id = useAuiState((s) => s.threadListItem.id);
      const chat = useChat({
        ...chatOptions,
        id,
        transport,
      });

      // Restore messages from localStorage on initial load and when switching threads
      const prevIdRef = useRef<string | null>(null);
      useEffect(() => {
        if (prevIdRef.current !== id) {
          prevIdRef.current = id;
          const stored = loadMessages(id);
          if (stored.length > 0 && chat.messages.length === 0) {
            chat.setMessages(stored as UI_MESSAGE[]);
          }
        }
      }, [id, chat.messages.length, chat.setMessages]);

      // Persist messages to localStorage when new message is added or streaming finishes
      const prevLenRef = useRef(chat.messages.length);
      const prevStatusRef = useRef(chat.status);
      useEffect(() => {
        if (chat.messages.length === 0) return;

        const lengthChanged = chat.messages.length !== prevLenRef.current;
        const streamingDone =
          prevStatusRef.current !== "ready" && chat.status === "ready";

        prevLenRef.current = chat.messages.length;
        prevStatusRef.current = chat.status;

        if (lengthChanged || streamingDone) {
          saveMessages(id, chat.messages);
        }
      }, [id, chat.messages, chat.status]);

      const runtime = useAISDKRuntime(chat, { adapters });

      if (transport instanceof AssistantChatTransport) {
        transport.setRuntime(runtime);
      }

      return runtime;
    },
    adapter,
  });
};
