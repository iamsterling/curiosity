import { FlatList, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { CuriosityThread } from "../curiosity-api";
import { palette } from "../theme";
import type { WorkspaceView } from "../workspace-types";
import { styles } from "./workspace-sidebar.styles";

const SidebarRow = ({
  detail,
  disabled = false,
  label,
  onPress,
  selected = false,
}: {
  readonly detail?: string;
  readonly disabled?: boolean;
  readonly label: string;
  readonly onPress?: () => void;
  readonly selected?: boolean;
}) => (
  <Pressable
    accessibilityRole={onPress ? "button" : undefined}
    disabled={disabled || !onPress}
    onPress={onPress}
    style={({ pressed }) => [
      styles.row,
      selected && styles.selectedRow,
      pressed && styles.pressedRow,
      disabled && styles.disabledRow,
    ]}
  >
    <Text numberOfLines={1} style={styles.rowLabel}>
      {label}
    </Text>
    {detail ? (
      <Text numberOfLines={1} style={styles.rowDetail}>
        {detail}
      </Text>
    ) : null}
  </Pressable>
);

export const WorkspaceSidebar = ({
  activeThreadId,
  busy,
  compact,
  onClose,
  onNewThread,
  onOpenThread,
  onSelectView,
  online,
  serverUrl,
  threads,
  view,
}: {
  readonly activeThreadId?: string;
  readonly busy: boolean;
  readonly compact: boolean;
  readonly onClose: () => void;
  readonly onNewThread: () => void;
  readonly onOpenThread: (threadId: string) => void;
  readonly onSelectView: (view: WorkspaceView) => void;
  readonly online: boolean;
  readonly serverUrl: string;
  readonly threads: readonly CuriosityThread[];
  readonly view: WorkspaceView;
}) => {
  const activeThread = threads.find(({ threadId }) => threadId === activeThreadId);

  return (
    <SafeAreaView edges={["top", "bottom", "left"]} style={styles.safe}>
      <View style={styles.brandRow}>
        <View>
          <Text style={styles.brand}>Curiosity</Text>
          <Text style={styles.brandDetail}>PROJECT SYSTEM</Text>
        </View>
        {compact ? (
          <Pressable
            accessibilityLabel="Close sidebar"
            accessibilityRole="button"
            onPress={onClose}
            style={({ pressed }) => [
              styles.closeButton,
              pressed && styles.pressedRow,
            ]}
          >
            <Text style={styles.closeLabel}>×</Text>
          </Pressable>
        ) : null}
      </View>

      <Pressable
        accessibilityRole="button"
        disabled={busy}
        onPress={onNewThread}
        style={({ pressed }) => [
          styles.newChat,
          pressed && styles.newChatPressed,
          busy && styles.disabledRow,
        ]}
      >
        <Text style={styles.newChatLabel}>New conversation</Text>
        <Text style={styles.newChatSymbol}>＋</Text>
      </Pressable>

      <Text style={styles.sectionLabel}>WORKSPACE</Text>
      <SidebarRow
        detail="Project plan"
        label="Issues"
        onPress={() => onSelectView("issues")}
        selected={view === "issues"}
      />
      <SidebarRow
        detail="Conversation history"
        label="Chat"
        onPress={() => onSelectView("chat")}
        selected={view === "chat"}
      />
      <SidebarRow
        detail="Visual document"
        label="Craft"
        onPress={() => onSelectView("craft")}
        selected={view === "craft"}
      />
      <SidebarRow
        detail="Evidence and recall"
        label="Memory"
        onPress={() => onSelectView("memory")}
        selected={view === "memory"}
      />
      <SidebarRow
        detail="Timeline and tracks"
        label="Audio"
        onPress={() => onSelectView("audio")}
        selected={view === "audio"}
      />

      <Text style={styles.sectionLabel}>PROJECTS</Text>
      <View style={styles.projectRow}>
        <View style={styles.projectMark}>
          <Text style={styles.projectMarkText}>C</Text>
        </View>
        <View style={styles.projectCopy}>
          <Text style={styles.projectLabel}>Curiosity</Text>
          <Text style={styles.projectDetail}>6 issues · {threads.length} threads</Text>
        </View>
      </View>

      <Text style={styles.sectionLabel}>CONVERSATIONS · {threads.length}</Text>
      <FlatList
        data={threads}
        keyExtractor={({ threadId }) => threadId}
        ListEmptyComponent={
          <Text style={styles.empty}>Your conversations will appear here.</Text>
        }
        renderItem={({ item }) => (
          <SidebarRow
            detail={`Session ${item.sequence}`}
            disabled={busy}
            label={item.title}
            onPress={() => onOpenThread(item.threadId)}
            selected={item.threadId === activeThreadId}
          />
        )}
        showsVerticalScrollIndicator={false}
        style={styles.threads}
      />

      <View style={styles.session}>
        <View style={styles.statusRow}>
          <View
            style={[
              styles.statusDot,
              { backgroundColor: online ? palette.success : palette.danger },
            ]}
          />
          <Text style={styles.sessionTitle}>
            {online ? "Session connected" : "Session offline"}
          </Text>
        </View>
        <Text numberOfLines={1} style={styles.sessionDetail}>
          {activeThread ? `Session ${activeThread.sequence}` : "New session"}
        </Text>
        <Text numberOfLines={1} style={styles.serverUrl}>
          {serverUrl}
        </Text>
      </View>
    </SafeAreaView>
  );
};
