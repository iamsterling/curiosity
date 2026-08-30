import type { AgentRunProjection } from "@curiosity/authority";
import { useCallback, useEffect, useRef, useState } from "react";
import { localCuriosityClient } from "./local-curiosity-runtime";
import { nativeAgentJournal } from "./native-agent-journal";

interface AgentActivityState {
  readonly busy: boolean;
  readonly error?: string;
  readonly refreshedAt?: string;
  readonly runs: readonly AgentRunProjection[];
}

const initialState: AgentActivityState = Object.freeze({
  busy: true,
  runs: Object.freeze([]),
});

export const useAgentActivity = () => {
  const [state, setState] = useState(initialState);
  const revision = useRef(0);

  const refresh = useCallback(async () => {
    const request = ++revision.current;
    setState((current) => ({ ...current, busy: true, error: undefined }));
    try {
      await localCuriosityClient.status();
      const runs = await nativeAgentJournal.listRunProjections(128);
      if (request !== revision.current) return;
      setState({
        busy: false,
        refreshedAt: new Date().toISOString(),
        runs,
      });
    } catch (error) {
      if (request !== revision.current) return;
      setState((current) => ({
        ...current,
        busy: false,
        error: error instanceof Error ? error.message : "Agent activity unavailable",
      }));
    }
  }, []);

  useEffect(() => {
    void refresh();
    const timer = setInterval(() => void refresh(), 3_000);
    return () => {
      revision.current += 1;
      clearInterval(timer);
    };
  }, [refresh]);

  return Object.freeze({ refresh, state });
};
