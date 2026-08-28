import { useCallback, useEffect, useRef, useState } from "react";
import type {
  CuriosityApi,
  CuriosityMessage,
  CuriosityThread,
} from "./curiosity-api";
import { presentCuriosityError } from "./curiosity-api";
import type { ConversationMode } from "./workspace-types";

export interface CuriosityWorkspaceState {
  readonly activeThreadId?: string;
  readonly busy: boolean;
  readonly error?: string;
  readonly messages: readonly CuriosityMessage[];
  readonly online: boolean;
  readonly threads: readonly CuriosityThread[];
}

const initialState: CuriosityWorkspaceState = Object.freeze({
  busy: false,
  messages: Object.freeze([]),
  online: false,
  threads: Object.freeze([]),
});

export const useCuriosityWorkspace = (api: CuriosityApi) => {
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
        const session = await api.session(threadId);
        if (revision !== requestRevision.current) return;
        setState((current) => ({
          ...current,
          busy: false,
          messages: session.messages,
          online: true,
          threads: session.threads,
        }));
      } catch (error) {
        if (revision !== requestRevision.current) return;
        setState((current) => ({
          ...current,
          busy: false,
          error: presentCuriosityError(error),
          online: false,
        }));
      }
    },
    [api],
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
        const turn = await api.submit({
          mode,
          text: prompt,
          ...(state.activeThreadId
            ? { threadId: state.activeThreadId }
            : {}),
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
            },
          ],
          online: true,
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
    [api, state.activeThreadId, state.busy],
  );

  return Object.freeze({
    loadSession,
    newThread,
    send,
    state,
  });
};
