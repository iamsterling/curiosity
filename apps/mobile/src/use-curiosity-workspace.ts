import { useCallback, useEffect, useRef, useState } from "react";
import type {
  CuriosityClient,
  CuriosityMessage,
  CuriosityRuntimeStatus,
  CuriosityThread,
} from "./curiosity-client";
import { startingRuntimeStatus } from "./curiosity-client";
import { presentCuriosityError } from "./curiosity-response";
import type { ConversationMode } from "./workspace-types";

export interface CuriosityWorkspaceState {
  readonly activeThreadId?: string;
  readonly busy: boolean;
  readonly error?: string;
  readonly messages: readonly CuriosityMessage[];
  readonly runtimeStatus: CuriosityRuntimeStatus;
  readonly threads: readonly CuriosityThread[];
}

const initialState: CuriosityWorkspaceState = Object.freeze({
  busy: false,
  messages: Object.freeze([]),
  runtimeStatus: startingRuntimeStatus,
  threads: Object.freeze([]),
});

export const useCuriosityWorkspace = (client: CuriosityClient) => {
  const [state, setState] = useState(initialState);
  const requestRevision = useRef(0);

  const loadSession = useCallback(
    async (threadId?: string): Promise<void> => {
      const revision = ++requestRevision.current;
      setState((current) => ({
        ...current,
        ...(threadId ? { activeThreadId: threadId } : {}),
        busy: true,
        error: undefined,
      }));
      try {
        const [session, runtimeStatus] = await Promise.all([
          client.session(threadId),
          client.status(),
        ]);
        if (revision !== requestRevision.current) return;
        setState((current) => ({
          ...current,
          busy: false,
          messages: session.messages,
          runtimeStatus,
          threads: session.threads,
        }));
      } catch (error) {
        if (revision !== requestRevision.current) return;
        setState((current) => ({
          ...current,
          busy: false,
          error: presentCuriosityError(error),
          runtimeStatus: {
            ...current.runtimeStatus,
            localRuntime: "unavailable",
          },
        }));
      }
    },
    [client],
  );

  useEffect(() => {
    void loadSession();
    return () => {
      requestRevision.current += 1;
    };
  }, [loadSession]);

  const newThread = useCallback(() => {
    requestRevision.current += 1;
    setState((current) => ({
      ...current,
      activeThreadId: undefined,
      busy: false,
      error: undefined,
      messages: Object.freeze([]),
    }));
  }, []);

  const send = useCallback(
    async (mode: ConversationMode, text: string): Promise<boolean> => {
      const prompt = text.trim();
      if (!prompt || state.busy) return false;
      const pendingId = `pending:${Date.now()}`;
      const optimisticMessage = Object.freeze({
        messageId: pendingId,
        role: "user" as const,
        text: prompt,
      });
      setState((current) => ({
        ...current,
        busy: true,
        error: undefined,
        messages: [...current.messages, optimisticMessage],
      }));
      try {
        const turn = await client.submit({
          mode,
          text: prompt,
          ...(state.activeThreadId ? { threadId: state.activeThreadId } : {}),
        });
        setState((current) => ({
          ...current,
          activeThreadId: turn.threadId,
          busy: false,
          messages: [
            ...current.messages,
            {
              messageId: turn.assistantMessageId,
              role: "assistant",
              text: turn.text,
              ...(turn.transportReceipt
                ? { transportReceipt: turn.transportReceipt }
                : {}),
            },
          ],
          threads: turn.threads,
        }));
        return true;
      } catch (error) {
        setState((current) => ({
          ...current,
          busy: false,
          error: presentCuriosityError(error),
          messages: current.messages.filter(
            ({ messageId }) => messageId !== pendingId,
          ),
        }));
        return false;
      }
    },
    [client, state.activeThreadId, state.busy],
  );

  return Object.freeze({
    loadSession,
    newThread,
    send,
    state,
  });
};
