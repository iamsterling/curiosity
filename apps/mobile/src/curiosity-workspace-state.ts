import type {
  CuriosityMessage,
  CuriosityRuntimeStatus,
  CuriosityThread,
} from "./curiosity-client";
import { startingRuntimeStatus } from "./curiosity-client";

export interface CuriosityProjectWorkspaceState {
  readonly activeThreadId?: string;
  readonly busy: boolean;
  readonly error?: string;
  readonly messages: readonly CuriosityMessage[];
  readonly waitingForInput?: boolean;
}

export interface CuriosityWorkspaceState {
  readonly projects: Readonly<Record<string, CuriosityProjectWorkspaceState>>;
  readonly runtimeStatus: CuriosityRuntimeStatus;
  readonly threads: readonly CuriosityThread[];
}

export const emptyProjectWorkspaceState: CuriosityProjectWorkspaceState =
  Object.freeze({
    busy: false,
    messages: Object.freeze([]),
  });

export const initialCuriosityWorkspaceState: CuriosityWorkspaceState =
  Object.freeze({
    projects: Object.freeze({}),
    runtimeStatus: startingRuntimeStatus,
    threads: Object.freeze([]),
  });

export const projectWorkspaceState = (
  state: CuriosityWorkspaceState,
  projectId: string,
): CuriosityProjectWorkspaceState =>
  state.projects[projectId] ?? emptyProjectWorkspaceState;

export const updateProjectWorkspaceState = (
  current: CuriosityWorkspaceState,
  projectId: string,
  update: (
    project: CuriosityProjectWorkspaceState,
  ) => CuriosityProjectWorkspaceState,
): CuriosityWorkspaceState => ({
  ...current,
  projects: {
    ...current.projects,
    [projectId]: update(projectWorkspaceState(current, projectId)),
  },
});
