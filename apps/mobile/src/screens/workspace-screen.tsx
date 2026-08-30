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
import { ProviderSurface } from "../components/provider-surface";
import { SurfaceSwitcher } from "../components/surface-switcher";
import { runtimeStatusLabel } from "../curiosity-client";
import { localCuriosityClient } from "../local-curiosity-runtime";
import { palette } from "../theme";
import { useCuriosityWorkspace } from "../use-curiosity-workspace";
import type { WorkspaceView } from "../workspace-types";
import { styles } from "./workspace-screen.styles";

export const WorkspaceScreen = () => {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const split = width >= 760;
  const [view, setView] = useState<WorkspaceView>("issues");
  const [showHighOnly, setShowHighOnly] = useState(false);
  const [draft, setDraft] = useState("");
  const workspace = useCuriosityWorkspace(localCuriosityClient);
  const {
    loadSession,
    newThread: resetThread,
    send: sendMessage,
    state,
  } = workspace;

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
              <SurfaceSwitcher
                activeThreadId={state.activeThreadId}
                compact={!split}
                filterOn={showHighOnly}
                onAdd={newThread}
                onFilter={() => setShowHighOnly((current) => !current)}
                onNewThread={newThread}
                onOpenThread={openThread}
                onSearch={() =>
                  workstationCommands.execute(
                    workstationCommandIds.commandPalette,
                  )
                }
                onSelect={selectView}
                runtimeStatusLabel={runtimeStatusLabel(state.runtimeStatus)}
                threads={state.threads}
                view={view}
              />
            </View>
          ),
          title: "",
        }}
      />
      <SafeAreaView edges={["left", "right", "bottom"]} style={styles.safe}>
        {workspaceContent}
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
