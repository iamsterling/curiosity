import type { CuriosityThread } from "./curiosity-client";
import { defaultProjectId } from "./workspace-catalog";

export type ThreadOwnership = Readonly<Record<string, string>>;

export const assignThreadToProject = (
  ownership: ThreadOwnership,
  projectId: string,
  threadId: string,
): ThreadOwnership => ({ ...ownership, [threadId]: projectId });

export const projectIdForThread = (
  ownership: ThreadOwnership,
  threadId: string,
  durableProjectId?: string,
): string => durableProjectId ?? ownership[threadId] ?? defaultProjectId;

export const threadsForProject = (
  ownership: ThreadOwnership,
  projectId: string,
  threads: readonly CuriosityThread[],
): readonly CuriosityThread[] =>
  threads.filter(
    ({ projectId: durableProjectId, threadId }) =>
      projectIdForThread(ownership, threadId, durableProjectId) === projectId,
  );

export const threadsForProjects = (
  ownership: ThreadOwnership,
  projectIds: readonly string[],
  threads: readonly CuriosityThread[],
): readonly CuriosityThread[] => {
  const includedProjects = new Set(projectIds);
  return threads.filter(({ projectId, threadId }) =>
    includedProjects.has(projectIdForThread(ownership, threadId, projectId)),
  );
};
