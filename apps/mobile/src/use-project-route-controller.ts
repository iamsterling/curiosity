import { useGlobalSearchParams, usePathname } from "expo-router";
import { useCallback, useEffect, useState, type SetStateAction } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppShell } from "./app-shell-context";
import { useCuriosityWorkspaceContext } from "./curiosity-workspace-context";
import { useProjectSessionIndex } from "./project-session-index-context";
import { useProjectCommandController } from "./use-project-command-controller";
import { useProjectNavigationController } from "./use-project-navigation-controller";
import { useProjectPaneLayout } from "./use-project-pane-layout";
import { useWorkspaceCatalog } from "./workspace-catalog-context";
import type { MobilePrimaryAgentId } from "./mobile-agent-catalog";
import {
  collectionForPath,
  projectIdForRouteParam,
  routeIdForParam,
} from "./workspace-routes";

export const useProjectRouteController = () => {
  const pathname = usePathname();
  const { projectId: routeProjectId, sessionId: routeSessionId } =
    useGlobalSearchParams<{
      projectId?: string | string[];
      sessionId?: string | string[];
    }>();
  const projectId = projectIdForRouteParam(routeProjectId);
  const sessionId = routeIdForParam(routeSessionId);
  const insets = useSafeAreaInsets();
  const appShell = useAppShell();
  const catalog = useWorkspaceCatalog();
  const sessions = useProjectSessionIndex();
  const workspace = useCuriosityWorkspaceContext();
  const { loadSession } = workspace;
  const [drafts, setDrafts] = useState<Readonly<Record<string, string>>>({});
  const [agents, setAgents] = useState<
    Readonly<Record<string, MobilePrimaryAgentId>>
  >({});
  const draft = drafts[projectId] ?? "";
  const agentId = agents[projectId] ?? "generalist";
  const setDraft = useCallback(
    (next: SetStateAction<string>) => {
      setDrafts((current) => {
        const value =
          typeof next === "function" ? next(current[projectId] ?? "") : next;
        return { ...current, [projectId]: value };
      });
    },
    [projectId],
  );
  const activeCollectionId = collectionForPath(pathname);
  const project = catalog.project(projectId);
  const pane = useProjectPaneLayout(appShell.navigationLevel);
  const navigation = useProjectNavigationController(projectId);
  const commandPalette = useProjectCommandController(
    projectId,
    activeCollectionId,
    navigation,
    setDraft,
  );
  const projectState = workspace.projectState(projectId);
  const threads = sessions.threadsForProject(
    projectId,
    workspace.state.threads,
  );

  useEffect(() => {
    if (!project || project.organizationId === catalog.activeOrganizationId)
      return;
    catalog.selectOrganization(project.organizationId);
  }, [catalog, project]);

  useEffect(() => {
    if (!sessionId || projectState.activeThreadId === sessionId) return;
    void loadSession(projectId, sessionId);
  }, [loadSession, projectId, projectState.activeThreadId, sessionId]);

  const sendDraft = useCallback(async () => {
    const threadId = await workspace.send(
      projectId,
      "overview",
      draft,
      agentId,
    );
    if (!threadId) return false;
    sessions.assignThread(projectId, threadId);
    setDraft("");
    return true;
  }, [agentId, draft, projectId, sessions, setDraft, workspace]);

  const refreshSession = useCallback(async () => {
    if (!projectState.activeThreadId) return;
    await loadSession(projectId, projectState.activeThreadId);
  }, [loadSession, projectId, projectState.activeThreadId]);

  const selectAgent = useCallback(
    (nextAgentId: MobilePrimaryAgentId) => {
      setAgents((current) => ({ ...current, [projectId]: nextAgentId }));
    },
    [projectId],
  );

  return {
    activeCollectionId,
    agentId,
    bottomInset: insets.bottom,
    commands: commandPalette.commands,
    contentWidth: pane.contentWidth,
    draft,
    layout: pane.layout,
    newThread: navigation.newThread,
    onLayout: pane.onLayout,
    openCommandPalette: commandPalette.open,
    openParentSidebar: navigation.openParentSidebar,
    openThread: navigation.openThread,
    project,
    projectId,
    refreshSession,
    selectCollection: navigation.selectCollection,
    selectAgent,
    sendDraft,
    setDraft,
    showSidebar: navigation.showSidebar,
    sidebarWidth: pane.sidebarWidth,
    state: { ...projectState, threads },
    topInset: insets.top,
  } as const;
};

export type ProjectRouteController = ReturnType<
  typeof useProjectRouteController
>;
