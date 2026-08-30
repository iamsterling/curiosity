import { useRouter } from "expo-router";
import { useCallback, useMemo } from "react";
import { useAppShell } from "./app-shell-context";
import type { SidebarCollectionId } from "./components/notes-shell-model";
import { useCuriosityWorkspaceContext } from "./curiosity-workspace-context";
import { projectCollectionRoute } from "./workspace-routes";

export const useProjectNavigationController = (projectId: string) => {
  const router = useRouter();
  const { openParentSidebar, setNavigationLevel } = useAppShell();
  const { loadSession, newThread: resetThread } = useCuriosityWorkspaceContext();

  const selectCollection = useCallback(
    (collectionId: SidebarCollectionId) => {
      setNavigationLevel("content");
      router.replace(projectCollectionRoute(projectId, collectionId));
    },
    [projectId, router, setNavigationLevel],
  );
  const newThread = useCallback(() => {
    resetThread(projectId);
    selectCollection("sessions");
  }, [projectId, resetThread, selectCollection]);
  const openThread = useCallback(
    (threadId: string) => {
      selectCollection("sessions");
      void loadSession(projectId, threadId);
    },
    [loadSession, projectId, selectCollection],
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
