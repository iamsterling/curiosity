import { Stack } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { KeyboardAvoidingView, Platform, useWindowDimensions, View } from "react-native";
import { Drawer } from "react-native-drawer-layout";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { useWorkstationCommands } from "../commands/use-workstation-commands";
import { AudioSurface } from "../components/audio-surface";
import { CommandPalette } from "../components/command-palette";
import { Composer } from "../components/composer";
import { ConversationView } from "../components/conversation-view";
import { CraftSurface } from "../components/craft-surface";
import { IssuesSurface } from "../components/issues-surface";
import { MemorySurface } from "../components/memory-surface";
import { SurfaceSwitcher } from "../components/surface-switcher";
import { WorkspaceSidebar } from "../components/workspace-sidebar";
import { createCuriosityApi } from "../curiosity-api";
import { palette } from "../theme";
import { useCuriosityWorkspace } from "../use-curiosity-workspace";
import type { WorkspaceView } from "../workspace-types";
import { styles } from "./workspace-screen.styles";

const defaultServerUrl = "http://10.1.0.121:3000";

export const WorkspaceScreen = () => {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const split = width >= 760;
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [view, setView] = useState<WorkspaceView>("issues");
  const [draft, setDraft] = useState("");
  const serverUrl =
    process.env.EXPO_PUBLIC_CURIOSITY_URL?.trim() || defaultServerUrl;
  const api = useMemo(() => createCuriosityApi(serverUrl), [serverUrl]);
  const workspace = useCuriosityWorkspace(api);
  const { loadSession, newThread: resetThread, send: sendMessage, state } = workspace;

  const closeCompactDrawer = useCallback(() => {
    if (!split) setDrawerOpen(false);
  }, [split]);

  const selectView = useCallback((nextView: WorkspaceView) => {
    setView(nextView);
    closeCompactDrawer();
  }, [closeCompactDrawer]);

  const newThread = useCallback(() => {
    setView("chat");
    resetThread();
    closeCompactDrawer();
  }, [closeCompactDrawer, resetThread]);

  const openThread = useCallback((threadId: string) => {
    setView("chat");
    closeCompactDrawer();
    void loadSession(threadId);
  }, [closeCompactDrawer, loadSession]);

  const preparePrompt = useCallback((prefix: string) => {
    setView("chat");
    setDraft(prefix);
    closeCompactDrawer();
  }, [closeCompactDrawer]);

  const refreshSession = useCallback(() => {
    void loadSession(state.activeThreadId);
  }, [loadSession, state.activeThreadId]);

  const toggleSidebar = useCallback(() => {
    if (split) {
      setSidebarVisible((current) => !current);
      return;
    }
    setDrawerOpen((current) => !current);
  }, [split]);

  const commandActions = useMemo(() => ({
    newChat: newThread,
    preparePrompt,
    refreshSession,
    showAudio: () => selectView("audio"),
    showChat: () => selectView("chat"),
    showCraft: () => selectView("craft"),
    showIssues: () => selectView("issues"),
    showMemory: () => selectView("memory"),
    toggleSidebar,
  }), [newThread, preparePrompt, refreshSession, selectView, toggleSidebar]);
  const workstationCommands = useWorkstationCommands(
    {
      busy: state.busy,
      sidebarVisible: split ? sidebarVisible : drawerOpen,
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
      <SurfaceSwitcher
        compact={!split}
        online={state.online}
        onSelect={selectView}
        topInset={insets.top}
        view={view}
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
      ) : view === "audio" ? (
        <AudioSurface />
      ) : (
        <IssuesSurface />
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
          headerShown: !split && !drawerOpen,
          headerStyle: { backgroundColor: "transparent" },
          headerTintColor: palette.controlTint,
          headerTitle: "",
          headerTransparent: true,
          title: "",
        }}
      />
      {!split && !drawerOpen ? (
        <>
          <Stack.Toolbar placement="left">
            <Stack.Toolbar.Button
              accessibilityLabel="Open sidebar"
              icon="sidebar.left"
              onPress={() => setDrawerOpen(true)}
            />
          </Stack.Toolbar>
          <Stack.Toolbar placement="right">
            <Stack.Toolbar.Button
              accessibilityLabel="New conversation"
              disabled={state.busy}
              icon="square.and.pencil"
              onPress={newThread}
            />
          </Stack.Toolbar>
        </>
      ) : null}
      {split && !sidebarVisible ? (
        <SafeAreaView
          edges={["top", "right", "bottom", "left"]}
          style={styles.safe}
        >
          {workspaceContent}
        </SafeAreaView>
      ) : (
        <Drawer
          drawerPosition="left"
          drawerStyle={[
            styles.drawer,
            { width: split ? 300 : Math.min(width * 0.88, 360) },
          ]}
          drawerType={split ? "permanent" : "front"}
          onClose={() => setDrawerOpen(false)}
          onOpen={() => setDrawerOpen(true)}
          open={split || drawerOpen}
          overlayAccessibilityLabel="Close sidebar"
          overlayStyle={styles.drawerOverlay}
          renderDrawerContent={() => (
            <WorkspaceSidebar
              activeThreadId={state.activeThreadId}
              busy={state.busy}
              compact={!split}
              onClose={() => setDrawerOpen(false)}
              onNewThread={newThread}
              onOpenThread={openThread}
              onSelectView={selectView}
              online={state.online}
              serverUrl={serverUrl}
              threads={state.threads}
              view={view}
            />
          )}
          style={styles.drawerLayout}
          swipeEnabled={!split}
        >
          {split ? (
            <SafeAreaView
              edges={["top", "right", "bottom"]}
              style={styles.safe}
            >
              {workspaceContent}
            </SafeAreaView>
          ) : (
            workspaceContent
          )}
        </Drawer>
      )}
      <CommandPalette
        commands={workstationCommands.commands}
        onClose={workstationCommands.closePalette}
        onRun={workstationCommands.execute}
        visible={workstationCommands.paletteVisible}
      />
    </>
  );
};
