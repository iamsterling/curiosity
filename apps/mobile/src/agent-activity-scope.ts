import type { AgentRunProjection } from "@curiosity/authority";
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
