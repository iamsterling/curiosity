import type { CuriosityThread } from "./curiosity-client";
import { defaultProjectId } from "./workspace-catalog";

export type ThreadOwnership = Readonly<Record<string, string>>;

const recencySequence = (thread: CuriosityThread): number =>
  thread.updatedSequence ?? thread.sequence;

export const sortThreadsByRecency = (
  threads: readonly CuriosityThread[],
): readonly CuriosityThread[] =>
  Object.freeze(
    [...threads].sort((left, right) => {
      const activity = recencySequence(right) - recencySequence(left);
      if (activity !== 0) return activity;
      const opened = right.sequence - left.sequence;
      if (opened !== 0) return opened;
      if (left.threadId < right.threadId) return -1;
      if (left.threadId > right.threadId) return 1;
      return 0;
    }),
  );

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
  sortThreadsByRecency(
    threads.filter(
      ({ projectId: durableProjectId, threadId }) =>
        projectIdForThread(ownership, threadId, durableProjectId) === projectId,
    ),
  );

export const threadsForProjects = (
  ownership: ThreadOwnership,
  projectIds: readonly string[],
  threads: readonly CuriosityThread[],
): readonly CuriosityThread[] => {
  const includedProjects = new Set(projectIds);
  return sortThreadsByRecency(
    threads.filter(({ projectId, threadId }) =>
      includedProjects.has(projectIdForThread(ownership, threadId, projectId)),
    ),
  );
};
