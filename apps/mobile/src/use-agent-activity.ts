import type {
  AgentJournalDecideGate,
  AgentJournalOperatorRequests,
  AgentRunProjection,
} from "@curiosity/authority";
import { useCallback, useEffect, useRef, useState } from "react";
import type { DurableGateDecisionTarget } from "./durable-agent-control";
import {
  localAgentControl,
  localCuriosityClient,
} from "./local-curiosity-runtime";
import { nativeAgentJournal } from "./native-agent-journal";

interface AgentActivityState {
  readonly busy: boolean;
  readonly error?: string;
  readonly mutatingId?: string;
  readonly operatorRequests: AgentJournalOperatorRequests;
  readonly refreshedAt?: string;
  readonly runs: readonly AgentRunProjection[];
}

const initialState: AgentActivityState = Object.freeze({
  busy: true,
  operatorRequests: Object.freeze({
    gates: Object.freeze([]),
    questions: Object.freeze([]),
  }),
  runs: Object.freeze([]),
});

export const useAgentActivity = () => {
  const [state, setState] = useState(initialState);
  const revision = useRef(0);

  const refresh = useCallback(async () => {
    const request = ++revision.current;
    setState((current) => ({ ...current, busy: true, error: undefined }));
    try {
      const [, runs, operatorRequests] = await Promise.all([
        localCuriosityClient.status(),
        nativeAgentJournal.listRunProjections(128),
        localAgentControl.listOperatorRequests(),
      ]);
      if (request !== revision.current) return;
      setState((current) => ({
        busy: false,
        ...(current.mutatingId ? { mutatingId: current.mutatingId } : {}),
        operatorRequests,
        refreshedAt: new Date().toISOString(),
        runs,
      }));
    } catch (error) {
      if (request !== revision.current) return;
      setState((current) => ({
        ...current,
        busy: false,
        error:
          error instanceof Error ? error.message : "Agent activity unavailable",
      }));
    }
  }, []);

  const mutate = useCallback(
    async (requestId: string, operation: () => Promise<unknown>) => {
      setState((current) => ({
        ...current,
        error: undefined,
        mutatingId: requestId,
      }));
      try {
        await operation();
        await refresh();
        setState((current) => ({ ...current, mutatingId: undefined }));
      } catch (error) {
        setState((current) => ({
          ...current,
          error:
            error instanceof Error ? error.message : "Operator request failed",
          mutatingId: undefined,
        }));
      }
    },
    [refresh],
  );

  const answerQuestion = useCallback(
    (questionId: string, answer: string) =>
      mutate(questionId, () =>
        localAgentControl.answerQuestion(questionId, answer),
      ),
    [mutate],
  );

  const decideGate = useCallback(
    (
      target: DurableGateDecisionTarget,
      decision: AgentJournalDecideGate["decision"],
    ) =>
      mutate(target.gateId, () =>
        localAgentControl.decideGate(target, decision),
      ),
    [mutate],
  );

  useEffect(() => {
    void refresh();
    const timer = setInterval(() => void refresh(), 3_000);
    return () => {
      revision.current += 1;
      clearInterval(timer);
    };
  }, [refresh]);

  return Object.freeze({ answerQuestion, decideGate, refresh, state });
};
