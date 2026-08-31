import type {
  AgentJournalOperatorRequests,
  AgentJournalQuestionProjection,
  AgentRunProjection,
} from "@curiosity/authority";
import type { CuriosityMessage } from "./curiosity-client.ts";
import { defaultProjectId } from "./workspace-catalog";

export const projectIdForAgentRun = (run: AgentRunProjection): string => {
  if (!run.input || typeof run.input !== "object" || Array.isArray(run.input))
    return defaultProjectId;
  const projectId = (run.input as Record<string, unknown>).projectId;
  return typeof projectId === "string" && projectId.length > 0
    ? projectId
    : defaultProjectId;
};

export const agentRunsForProjects = (
  runs: readonly AgentRunProjection[],
  projectIds: readonly string[],
): readonly AgentRunProjection[] => {
  const includedProjects = new Set(projectIds);
  return runs.filter((run) => includedProjects.has(projectIdForAgentRun(run)));
};

export const agentRunFamily = (
  runs: readonly AgentRunProjection[],
  rootRunIds: readonly string[],
): readonly AgentRunProjection[] => {
  const includedRuns = new Set(rootRunIds);
  let previousSize = -1;
  while (previousSize !== includedRuns.size) {
    previousSize = includedRuns.size;
    for (const run of runs)
      if (run.parentRunId && includedRuns.has(run.parentRunId))
        includedRuns.add(run.runId);
  }
  return runs.filter(({ runId }) => includedRuns.has(runId));
};

export const agentRunsForThread = (
  runs: readonly AgentRunProjection[],
  projectId: string,
  threadId?: string,
): readonly AgentRunProjection[] => {
  if (!threadId) return Object.freeze([]);
  const rootRunIds = runs
    .filter((run) => {
      if (run.parentRunId) return false;
      if (
        !run.input ||
        typeof run.input !== "object" ||
        Array.isArray(run.input)
      )
        return false;
      const input = run.input as Record<string, unknown>;
      return input.projectId === projectId && input.threadId === threadId;
    })
    .map(({ runId }) => runId);
  return agentRunFamily(runs, rootRunIds);
};

export const latestRootRun = (
  runs: readonly AgentRunProjection[],
): AgentRunProjection | undefined =>
  runs.find(({ parentRunId }) => !parentRunId);

export const agentRunTerminalError = (
  run: AgentRunProjection | undefined,
): string | undefined => {
  if (run?.status === "failed")
    return run.errorCode ?? "DURABLE_AGENT_TURN_FAILED";
  if (run?.status === "cancelled") return "ACTION_CANCELLED";
  return undefined;
};

export const agentRunTerminalKey = (
  run: AgentRunProjection | undefined,
): string | undefined =>
  run && ["cancelled", "completed", "failed"].includes(run.status)
    ? `${run.runId}:${run.revision}:${run.status}`
    : undefined;

export const agentOperatorRequestsForRuns = (
  requests: AgentJournalOperatorRequests,
  runs: readonly AgentRunProjection[],
): AgentJournalOperatorRequests => {
  const includedRuns = new Set(runs.map(({ runId }) => runId));
  return Object.freeze({
    gates: Object.freeze(
      requests.gates.filter(({ runId }) => includedRuns.has(runId)),
    ),
    questions: Object.freeze(
      requests.questions.filter(({ runId }) => includedRuns.has(runId)),
    ),
  });
};

export const pendingAgentQuestionMessages = (
  questions: readonly AgentJournalQuestionProjection[],
): readonly CuriosityMessage[] =>
  Object.freeze(
    questions
      .filter(({ status }) => status === "pending")
      .map(({ options, prompt, questionId }) =>
        Object.freeze({
          messageId: `agent-question:${questionId}`,
          role: "assistant" as const,
          text:
            options.length === 0
              ? prompt
              : `${prompt}\n\nOptions: ${options.join(" · ")}`,
        }),
      ),
  );
