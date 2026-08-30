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
  const draft = drafts[projectId] ?? "";
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
    if (!project || project.organizationId === catalog.activeOrganizationId) return;
    catalog.selectOrganization(project.organizationId);
  }, [catalog, project]);

  useEffect(() => {
    if (!sessionId || projectState.activeThreadId === sessionId) return;
    void loadSession(projectId, sessionId);
  }, [loadSession, projectId, projectState.activeThreadId, sessionId]);

  const sendDraft = useCallback(async () => {
    const threadId = await workspace.send(projectId, "overview", draft);
    if (!threadId) return false;
    sessions.assignThread(projectId, threadId);
    setDraft("");
    return true;
  }, [draft, projectId, sessions, setDraft, workspace]);

  return {
    activeCollectionId,
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
    selectCollection: navigation.selectCollection,
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
