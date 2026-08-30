import { useRouter } from "expo-router";
import { useCallback, useMemo } from "react";
import { useAppShell } from "./app-shell-context";
import type { SidebarCollectionId } from "./components/notes-shell-model";
import { useCuriosityWorkspaceContext } from "./curiosity-workspace-context";
import { projectCollectionRoute, projectSessionRoute } from "./workspace-routes";

export const useProjectNavigationController = (projectId: string) => {
  const router = useRouter();
  const { openParentSidebar, setNavigationLevel } = useAppShell();
  const { loadSession, newThread: resetThread, projectState } =
    useCuriosityWorkspaceContext();
  const activeThreadId = projectState(projectId).activeThreadId;

  const selectCollection = useCallback(
    (collectionId: SidebarCollectionId) => {
      setNavigationLevel("content");
      if (collectionId === "sessions" && activeThreadId) {
        router.replace(projectSessionRoute(projectId, activeThreadId));
        return;
      }
      router.replace(projectCollectionRoute(projectId, collectionId));
    },
    [activeThreadId, projectId, router, setNavigationLevel],
  );
  const newThread = useCallback(() => {
    resetThread(projectId);
    setNavigationLevel("content");
    router.replace(projectCollectionRoute(projectId, "sessions"));
  }, [projectId, resetThread, router, setNavigationLevel]);
  const openThread = useCallback(
    (threadId: string) => {
      setNavigationLevel("content");
      router.replace(projectSessionRoute(projectId, threadId));
      void loadSession(projectId, threadId);
    },
    [loadSession, projectId, router, setNavigationLevel],
  );
  const showSidebar = useCallback(
    () => setNavigationLevel("artifacts"),
    [setNavigationLevel],
  );

  return useMemo(
    () => ({
      newThread,
      openParentSidebar,
      openThread,
      selectCollection,
      showSidebar,
    }),
    [
      newThread,
      openParentSidebar,
      openThread,
      selectCollection,
      showSidebar,
    ],
  );
};

export type ProjectNavigationController = ReturnType<
  typeof useProjectNavigationController
>;
