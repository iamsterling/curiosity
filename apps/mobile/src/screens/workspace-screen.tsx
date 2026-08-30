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
import { NestedSidebar } from "../components/nested-sidebar";
import {
  resolveNestedSidebarColumnWidths,
  resolveNestedSidebarLayout,
  type SidebarNavigationLevel,
} from "../components/nested-sidebar-layout";
import {
  collectionView,
  type SidebarCollectionId,
} from "../components/notes-shell-model";
import { ProviderSurface } from "../components/provider-surface";
import { WorkspaceToolbar } from "../components/workspace-toolbar";
import { localCuriosityClient } from "../local-curiosity-runtime";
import { useCuriosityWorkspace } from "../use-curiosity-workspace";
import type { WorkspaceView } from "../workspace-types";
import { styles } from "./workspace-screen.styles";

const viewTitles: Readonly<Record<WorkspaceView, string>> = Object.freeze({
  audio: "Audio",
  chat: "New Session",
  craft: "Craft",
  issues: "Issues",
  memory: "Memory",
  providers: "Providers",
});

const viewCollections: Readonly<Record<WorkspaceView, SidebarCollectionId>> =
  Object.freeze({
    audio: "audio",
    chat: "sessions",
    craft: "craft",
    issues: "issues",
    memory: "memory",
    providers: "providers",
  });

export const WorkspaceScreen = () => {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [view, setView] = useState<WorkspaceView>("chat");
  const [activeCollectionId, setActiveCollectionId] =
    useState<SidebarCollectionId>("sessions");
  const [navigationLevel, setNavigationLevel] =
    useState<SidebarNavigationLevel>("content");
  const [showHighOnly, setShowHighOnly] = useState(false);
  const [draft, setDraft] = useState("");
  const layout = resolveNestedSidebarLayout(width, navigationLevel);
  const columnWidths = resolveNestedSidebarColumnWidths(width);
  const contentWidth = Math.max(
    0,
    width -
      (layout.source ? columnWidths.source : 0) -
      (layout.artifacts ? columnWidths.artifacts : 0),
  );
  const split = contentWidth >= 600;
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
    setActiveCollectionId(viewCollections[nextView]);
  }, []);

  const selectCollection = useCallback((collectionId: SidebarCollectionId) => {
    setActiveCollectionId(collectionId);
    setView(collectionView(collectionId));
  }, []);

  const newThread = useCallback(() => {
    setView("chat");
    setActiveCollectionId("sessions");
    resetThread();
  }, [resetThread]);

  const openThread = useCallback(
    (threadId: string) => {
      setView("chat");
      setActiveCollectionId("sessions");
      void loadSession(threadId);
    },
    [loadSession],
  );

  const preparePrompt = useCallback((prefix: string) => {
    setView("chat");
    setActiveCollectionId("sessions");
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
    { busy: state.busy, view },
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
      <WorkspaceToolbar
        compact={!layout.artifacts}
        filterOn={showHighOnly}
        onFilter={() => setShowHighOnly((current) => !current)}
        onNewSession={newThread}
        onSearch={() =>
          workstationCommands.execute(workstationCommandIds.commandPalette)
        }
        onShowSessions={() => setNavigationLevel("artifacts")}
        showFilter={view === "issues"}
        title={workspaceTitle}
        topInset={insets.top}
      />
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

  const manage = () =>
    workstationCommands.execute(workstationCommandIds.commandPalette);

  return (
    <>
      <Stack.Screen options={{ headerShown: false, title: "" }} />
      <SafeAreaView edges={["left", "right"]} style={styles.safe}>
        <NestedSidebar
          activeCollectionId={activeCollectionId}
          activeThreadId={state.activeThreadId}
          bottomInset={insets.bottom}
          navigationLevel={navigationLevel}
          onManage={manage}
          onNavigationLevelChange={setNavigationLevel}
          onNewThread={newThread}
          onOpenThread={openThread}
          onSelectCollection={selectCollection}
          threads={state.threads}
          topInset={insets.top}
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
