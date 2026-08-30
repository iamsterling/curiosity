import { Stack } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  useWindowDimensions,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { useWorkstationCommands } from "../commands/use-workstation-commands";
import { workstationCommandIds } from "../commands/workstation-commands";
import { AudioSurface } from "../components/audio-surface";
import { CommandPalette } from "../components/command-palette";
import { Composer } from "../components/composer";
import { ConversationView } from "../components/conversation-view";
import { CraftSurface } from "../components/craft-surface";
import { IssuesSurface } from "../components/issues-surface";
import { MemorySurface } from "../components/memory-surface";
import {
  NestedSidebar,
  type SidebarOrganization,
} from "../components/nested-sidebar";
import type { SidebarNavigationLevel } from "../components/nested-sidebar-layout";
import { ProviderSurface } from "../components/provider-surface";
import { WorkspaceToolbar } from "../components/workspace-toolbar";
import { runtimeStatusLabel } from "../curiosity-client";
import { localCuriosityClient } from "../local-curiosity-runtime";
import { palette } from "../theme";
import { useCuriosityWorkspace } from "../use-curiosity-workspace";
import type { WorkspaceView } from "../workspace-types";
import { styles } from "./workspace-screen.styles";

const organizations: readonly SidebarOrganization[] = Object.freeze([
  {
    detail: "Local workspace",
    id: "curiosity",
    name: "Curiosity",
  },
]);

const viewTitles: Readonly<Record<WorkspaceView, string>> = Object.freeze({
  audio: "Audio",
  chat: "New Session",
  craft: "Craft",
  issues: "Issues",
  memory: "Memory",
  providers: "Providers",
});

export const WorkspaceScreen = () => {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const contentWidth =
    width >= 1_180 ? width - 530 : width >= 760 ? width - 300 : width;
  const split = contentWidth >= 600;
  const [view, setView] = useState<WorkspaceView>("chat");
  const [activeOrganizationId, setActiveOrganizationId] = useState("curiosity");
  const [navigationLevel, setNavigationLevel] =
    useState<SidebarNavigationLevel>("content");
  const [showHighOnly, setShowHighOnly] = useState(false);
  const [draft, setDraft] = useState("");
  const workspace = useCuriosityWorkspace(localCuriosityClient);
  const {
    loadSession,
    newThread: resetThread,
    send: sendMessage,
    state,
  } = workspace;
  const activeThreadTitle = state.threads.find(
    ({ threadId }) => threadId === state.activeThreadId,
  )?.title;
  const workspaceTitle =
    view === "chat" ? (activeThreadTitle ?? viewTitles.chat) : viewTitles[view];

  const selectView = useCallback((nextView: WorkspaceView) => {
    setView(nextView);
  }, []);

  const newThread = useCallback(() => {
    setView("chat");
    resetThread();
  }, [resetThread]);

  const openThread = useCallback(
    (threadId: string) => {
      setView("chat");
      void loadSession(threadId);
    },
    [loadSession],
  );

  const preparePrompt = useCallback((prefix: string) => {
    setView("chat");
    setDraft(prefix);
  }, []);

  const refreshSession = useCallback(() => {
    void loadSession(state.activeThreadId);
  }, [loadSession, state.activeThreadId]);

  const commandActions = useMemo(
    () => ({
      newChat: newThread,
      preparePrompt,
      refreshSession,
      showAudio: () => selectView("audio"),
      showChat: () => selectView("chat"),
      showCraft: () => selectView("craft"),
      showIssues: () => selectView("issues"),
      showMemory: () => selectView("memory"),
      showProviders: () => selectView("providers"),
    }),
    [newThread, preparePrompt, refreshSession, selectView],
  );
  const workstationCommands = useWorkstationCommands(
    {
      busy: state.busy,
      view,
    },
    commandActions,
  );

  const send = async () => {
    if (await sendMessage("overview", draft)) setDraft("");
  };

  const workspaceContent = (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.keyboard}
    >
      <View style={styles.surface}>
        {view === "chat" ? (
          <>
            <ConversationView
              contentBottomInset={split ? 18 : 104 + insets.bottom}
              error={state.error}
              messages={state.messages}
            />
            {split ? (
              <Composer
                busy={state.busy}
                onChangeText={setDraft}
                onSend={() => void send()}
                value={draft}
              />
            ) : (
              <View style={styles.composerOverlay}>
                <Composer
                  bottomInset={insets.bottom}
                  busy={state.busy}
                  onChangeText={setDraft}
                  onSend={() => void send()}
                  value={draft}
                />
              </View>
            )}
          </>
        ) : view === "craft" ? (
          <CraftSurface />
        ) : view === "memory" ? (
          <MemorySurface />
        ) : view === "providers" ? (
          <ProviderSurface />
        ) : view === "audio" ? (
          <AudioSurface />
        ) : (
          <IssuesSurface
            busy={state.busy}
            compact={!split}
            draft={draft}
            filterOn={showHighOnly}
            onChangeText={setDraft}
            onSend={() => void send()}
          />
        )}
      </View>
    </KeyboardAvoidingView>
  );

  return (
    <>
      <Stack.Screen
        options={{
          headerBackVisible: false,
          headerBackground: () => null,
          headerShadowVisible: false,
          headerShown: true,
          headerStyle: { backgroundColor: "transparent" },
          headerTintColor: palette.controlTint,
          headerTitle: () => (
            <View style={[styles.headerTitle, { width }]}>
              <WorkspaceToolbar
                compact={width < 760}
                filterOn={showHighOnly}
                onFilter={() => setShowHighOnly((current) => !current)}
                onNewSession={newThread}
                onSearch={() =>
                  workstationCommands.execute(
                    workstationCommandIds.commandPalette,
                  )
                }
                onShowSessions={() => setNavigationLevel("sessions")}
                showFilter={view === "issues"}
                title={workspaceTitle}
              />
            </View>
          ),
          title: "",
        }}
      />
      <SafeAreaView edges={["left", "right", "bottom"]} style={styles.safe}>
        <NestedSidebar
          activeOrganizationId={activeOrganizationId}
          activeThreadId={state.activeThreadId}
          navigationLevel={navigationLevel}
          onNavigationLevelChange={setNavigationLevel}
          onNewThread={newThread}
          onOpenThread={openThread}
          onSelectOrganization={setActiveOrganizationId}
          organizations={organizations}
          runtimeStatusLabel={runtimeStatusLabel(state.runtimeStatus)}
          threads={state.threads}
          width={width}
        >
          {workspaceContent}
        </NestedSidebar>
      </SafeAreaView>
      <CommandPalette
        commands={workstationCommands.commands}
        onClose={workstationCommands.closePalette}
        onRun={workstationCommands.execute}
        visible={workstationCommands.paletteVisible}
      />
    </>
  );
};
