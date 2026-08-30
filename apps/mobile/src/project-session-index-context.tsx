import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import type { CuriosityThread } from "./curiosity-client";
import {
  assignThreadToProject,
  projectIdForThread as resolveProjectIdForThread,
  threadsForProject as selectThreadsForProject,
  threadsForProjects as selectThreadsForProjects,
  type ThreadOwnership,
} from "./project-session-index";

interface ProjectSessionIndex {
  readonly assignThread: (projectId: string, threadId: string) => void;
  readonly projectIdForThread: (threadId: string) => string;
  readonly threadsForProject: (
    projectId: string,
    threads: readonly CuriosityThread[],
  ) => readonly CuriosityThread[];
  readonly threadsForProjects: (
    projectIds: readonly string[],
    threads: readonly CuriosityThread[],
  ) => readonly CuriosityThread[];
}

const ProjectSessionIndexContext = createContext<ProjectSessionIndex | null>(
  null,
);

export const ProjectSessionIndexProvider = ({
  children,
}: {
  readonly children: ReactNode;
}) => {
  const [ownership, setOwnership] = useState<ThreadOwnership>(Object.freeze({}));
  const projectIdForThread = useCallback(
    (threadId: string): string => resolveProjectIdForThread(ownership, threadId),
    [ownership],
  );
  const assignThread = useCallback((projectId: string, threadId: string) => {
    setOwnership((current) => assignThreadToProject(current, projectId, threadId));
  }, []);
  const threadsForProject = useCallback(
    (projectId: string, threads: readonly CuriosityThread[]) =>
      selectThreadsForProject(ownership, projectId, threads),
    [ownership],
  );
  const threadsForProjects = useCallback(
    (projectIds: readonly string[], threads: readonly CuriosityThread[]) =>
      selectThreadsForProjects(ownership, projectIds, threads),
    [ownership],
  );
  const value = useMemo(
    () => ({
      assignThread,
      projectIdForThread,
      threadsForProject,
      threadsForProjects,
    }),
    [
      assignThread,
      projectIdForThread,
      threadsForProject,
      threadsForProjects,
    ],
  );

  return (
    <ProjectSessionIndexContext.Provider value={value}>
      {children}
    </ProjectSessionIndexContext.Provider>
  );
};

export const useProjectSessionIndex = (): ProjectSessionIndex => {
  const index = useContext(ProjectSessionIndexContext);
  if (!index) throw new Error("PROJECT_SESSION_INDEX_CONTEXT_MISSING");
  return index;
};
