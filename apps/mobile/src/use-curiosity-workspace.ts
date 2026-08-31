import { useCallback, useEffect, useRef, useState } from "react";
import type { CuriosityClient } from "./curiosity-client";
import type { MobilePrimaryAgentId } from "./mobile-agent-catalog";
import { presentCuriosityError } from "./curiosity-response";
import {
  emptyProjectWorkspaceState,
  initialCuriosityWorkspaceState,
  projectWorkspaceState,
  updateProjectWorkspaceState,
  type CuriosityProjectWorkspaceState,
} from "./curiosity-workspace-state";
import type { ConversationMode } from "./workspace-types";

export const useCuriosityWorkspace = (client: CuriosityClient) => {
  const [state, setState] = useState(initialCuriosityWorkspaceState);
  const requestRevisions = useRef(new Map<string, number>());
  const sendState = useRef(state);
  sendState.current = state;

  const nextRevision = useCallback((projectId: string): number => {
    const next = (requestRevisions.current.get(projectId) ?? 0) + 1;
    requestRevisions.current.set(projectId, next);
    return next;
  }, []);

  const refresh = useCallback(async (): Promise<void> => {
    try {
      const [session, runtimeStatus] = await Promise.all([
        client.session(),
        client.status(),
      ]);
      setState((current) => ({
        ...current,
        runtimeStatus,
        threads: session.threads,
      }));
    } catch {
      setState((current) => ({
        ...current,
        runtimeStatus: {
          ...current.runtimeStatus,
          localRuntime: "unavailable",
        },
      }));
    }
  }, [client]);

  useEffect(() => {
    const revisions = requestRevisions.current;
    void refresh();
    return () => {
      revisions.clear();
    };
  }, [refresh]);

  const loadSession = useCallback(
    async (projectId: string, threadId: string): Promise<void> => {
      const revision = nextRevision(projectId);
      setState((current) =>
        updateProjectWorkspaceState(current, projectId, (project) => ({
          ...project,
          activeThreadId: threadId,
          busy: true,
          error: undefined,
          waitingForInput: false,
        })),
      );
      try {
        const [session, runtimeStatus] = await Promise.all([
          client.session(threadId),
          client.status(),
        ]);
        if (revision !== requestRevisions.current.get(projectId)) return;
        setState((current) => ({
          ...updateProjectWorkspaceState(current, projectId, (project) => ({
            ...project,
            activeThreadId: threadId,
            busy: false,
            messages: session.messages,
          })),
          runtimeStatus,
          threads: session.threads,
        }));
      } catch (error) {
        if (revision !== requestRevisions.current.get(projectId)) return;
        setState((current) => ({
          ...updateProjectWorkspaceState(current, projectId, (project) => ({
            ...project,
            busy: false,
            error: presentCuriosityError(error),
          })),
          runtimeStatus: {
            ...current.runtimeStatus,
            localRuntime: "unavailable",
          },
        }));
      }
    },
    [client, nextRevision],
  );

  const newThread = useCallback(
    (projectId: string) => {
      nextRevision(projectId);
      setState((current) =>
        updateProjectWorkspaceState(
          current,
          projectId,
          () => emptyProjectWorkspaceState,
        ),
      );
    },
    [nextRevision],
  );

  const projectState = useCallback(
    (projectId: string): CuriosityProjectWorkspaceState =>
      state.projects[projectId] ?? emptyProjectWorkspaceState,
    [state.projects],
  );

  const send = useCallback(
    async (
      projectId: string,
      mode: ConversationMode,
      text: string,
      agentId: MobilePrimaryAgentId = "generalist",
    ): Promise<string | undefined> => {
      const prompt = text.trim();
      const project = projectWorkspaceState(sendState.current, projectId);
      if (!prompt || project.busy) return undefined;
      const revision = nextRevision(projectId);
      const pendingId = `pending:${Date.now()}`;
      const pendingAssistantId = `${pendingId}:assistant`;
      const optimisticMessage = Object.freeze({
        messageId: pendingId,
        role: "user" as const,
        text: prompt,
      });
      setState((current) =>
        updateProjectWorkspaceState(current, projectId, (currentProject) => ({
          ...currentProject,
            busy: true,
            error: undefined,
            messages: [...currentProject.messages, optimisticMessage],
            waitingForInput: false,
        })),
      );
      try {
        const turn = await client.submit(
          {
            agentId,
            mode,
            projectId,
            text: prompt,
            ...(project.activeThreadId
              ? { threadId: project.activeThreadId }
              : {}),
          },
          (delta) => {
            if (revision !== requestRevisions.current.get(projectId)) return;
            setState((current) =>
              updateProjectWorkspaceState(
                current,
                projectId,
                (currentProject) => {
                  const existing = currentProject.messages.some(
                    ({ messageId }) => messageId === pendingAssistantId,
                  );
                  return {
                    ...currentProject,
                    messages: existing
                      ? currentProject.messages.map((message) =>
                          message.messageId === pendingAssistantId
                            ? { ...message, text: `${message.text}${delta}` }
                            : message,
                        )
                      : [
                          ...currentProject.messages,
                          {
                            messageId: pendingAssistantId,
                            role: "assistant" as const,
                            text: delta,
                          },
                        ],
                  };
                },
              ),
            );
          },
        );
        if (revision !== requestRevisions.current.get(projectId))
          return undefined;
        if (turn.status === "waiting-for-input") {
          setState((current) => ({
            ...updateProjectWorkspaceState(
              current,
              projectId,
              (currentProject) => ({
                ...currentProject,
                activeThreadId: turn.threadId,
                busy: false,
                messages: currentProject.messages.filter(
                  ({ messageId }) => messageId !== pendingAssistantId,
                ),
                waitingForInput: true,
              }),
            ),
            threads: turn.threads,
          }));
          return turn.threadId;
        }
        setState((current) => ({
          ...updateProjectWorkspaceState(
            current,
            projectId,
            (currentProject) => ({
              ...currentProject,
              activeThreadId: turn.threadId,
              busy: false,
              messages: [
                ...currentProject.messages.filter(
                  ({ messageId }) => messageId !== pendingAssistantId,
                ),
                {
                  messageId: turn.assistantMessageId,
                  role: "assistant",
                  text: turn.text,
                  ...(turn.transportReceipt
                    ? { transportReceipt: turn.transportReceipt }
                    : {}),
                },
              ],
              waitingForInput: false,
            }),
          ),
          threads: turn.threads,
        }));
        return turn.threadId;
      } catch (error) {
        if (revision !== requestRevisions.current.get(projectId))
          return undefined;
        setState((current) =>
          updateProjectWorkspaceState(current, projectId, (currentProject) => ({
            ...currentProject,
            busy: false,
            error: presentCuriosityError(error),
            messages: currentProject.messages.filter(
              ({ messageId }) =>
                messageId !== pendingId && messageId !== pendingAssistantId,
            ),
            waitingForInput: false,
          })),
        );
        return undefined;
      }
    },
    [client, nextRevision],
  );

  return Object.freeze({
    loadSession,
    newThread,
    projectState,
    refresh,
    send,
    state,
  });
};
