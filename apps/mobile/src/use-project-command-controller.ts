import { useRouter } from "expo-router";
import { useCallback, useMemo, type Dispatch, type SetStateAction } from "react";
import { useWorkstationCommands } from "./commands/use-workstation-commands";
import { workstationCommandIds } from "./commands/workstation-commands";
import { collectionView, type SidebarCollectionId } from "./components/notes-shell-model";
import { useCuriosityWorkspaceContext } from "./curiosity-workspace-context";
import type { ProjectNavigationController } from "./use-project-navigation-controller";

export const useProjectCommandController = (
  projectId: string,
  activeCollectionId: SidebarCollectionId,
  navigation: ProjectNavigationController,
  setDraft: Dispatch<SetStateAction<string>>,
) => {
  const router = useRouter();
  const { loadSession, projectState } = useCuriosityWorkspaceContext();
  const state = projectState(projectId);
  const refreshSession = useCallback(() => {
    if (state.activeThreadId) void loadSession(projectId, state.activeThreadId);
  }, [loadSession, projectId, state.activeThreadId]);
  const preparePrompt = useCallback(
    (prefix: string) => {
      navigation.selectCollection("sessions");
      setDraft(prefix);
    },
    [navigation, setDraft],
  );
  const actions = useMemo(
    () => ({
      newChat: navigation.newThread,
      preparePrompt,
      refreshSession,
      showAgents: () => router.push("/agents"),
      showAudio: () => navigation.selectCollection("audio"),
      showChat: () => navigation.selectCollection("sessions"),
      showCraft: () => navigation.selectCollection("craft"),
      showMemory: () => navigation.selectCollection("memory"),
      showProviders: () => router.push("/settings/providers"),
    }),
    [navigation, preparePrompt, refreshSession, router],
  );
  const commands = useWorkstationCommands(
    {
      busy: state.busy,
      view: collectionView(activeCollectionId),
    },
    actions,
  );
  const open = useCallback(
    () => commands.execute(workstationCommandIds.commandPalette),
    [commands],
  );
  return { commands, open } as const;
};
