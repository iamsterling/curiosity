import { Pressable, ScrollView, Text, View } from "react-native";
import { palette } from "../theme";
import type { SidebarCollectionId } from "./notes-shell-model";
import {
  FolderGlyph,
  NotesHeaderButton,
  NotesTextButton,
  SmartGlyph,
} from "./notes-sidebar-controls";
import { sourceSidebarStyles as styles } from "./notes-source-sidebar.styles";

interface SourceRow {
  readonly count?: number;
  readonly id: SidebarCollectionId;
  readonly title: string;
}

const workspaceRows: readonly SourceRow[] = [
  { id: "sessions", title: "Sessions" },
  { id: "craft", title: "Craft" },
  { id: "memory", title: "Memory" },
  { id: "audio", title: "Audio" },
  { id: "providers", title: "Providers" },
];

const CollectionRow = ({
  active,
  count,
  id,
  onSelect,
  title,
}: SourceRow & {
  readonly active: boolean;
  readonly onSelect: (id: SidebarCollectionId) => void;
}) => (
  <Pressable
    accessibilityRole="button"
    accessibilityState={{ selected: active }}
    onPress={() => onSelect(id)}
    style={({ pressed }) => [
      styles.row,
      active && styles.selected,
      pressed && { opacity: 0.55 },
    ]}
  >
    <FolderGlyph />
    <Text numberOfLines={1} style={styles.rowLabel}>
      {title}
    </Text>
    {count !== undefined ? <Text style={styles.count}>{count}</Text> : null}
  </Pressable>
);

export const NotesSourceSidebar = ({
  activeCollectionId,
  bottomInset,
  columnWidth,
  expanded,
  onClose,
  onManage,
  onNewThread,
  onSelectCollection,
  threadCount,
  topInset,
}: {
  readonly activeCollectionId: SidebarCollectionId;
  readonly bottomInset: number;
  readonly columnWidth: number;
  readonly expanded: boolean;
  readonly onClose: () => void;
  readonly onManage: () => void;
  readonly onNewThread: () => void;
  readonly onSelectCollection: (id: SidebarCollectionId) => void;
  readonly threadCount: number;
  readonly topInset: number;
}) => (
  <View
    accessibilityLabel="Collections"
    accessibilityRole="menu"
    style={[styles.sidebar, { width: columnWidth }, expanded && styles.expanded]}
  >
    <View style={[styles.header, { paddingTop: topInset }]}>
      <NotesTextButton label="Search" onPress={onManage} />
      <View style={styles.headerSpacer} />
      <NotesHeaderButton
        label="New session"
        onPress={onNewThread}
        symbol="＋"
      />
      <NotesHeaderButton label="Hide collections" onPress={onClose} symbol="▥" />
    </View>
    <ScrollView
      contentContainerStyle={[
        styles.list,
        { paddingBottom: 24 + bottomInset },
      ]}
    >
      <Pressable
        accessibilityRole="button"
        onPress={onNewThread}
        style={({ pressed }) => [styles.row, pressed && { opacity: 0.55 }]}
      >
        <SmartGlyph color={palette.captureAccent} symbol="✦" />
        <Text style={styles.rowLabel}>Quick Capture</Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ selected: activeCollectionId === "recent" }}
        onPress={() => onSelectCollection("recent")}
        style={({ pressed }) => [
          styles.row,
          activeCollectionId === "recent" && styles.selected,
          pressed && { opacity: 0.55 },
        ]}
      >
        <SmartGlyph color={palette.recentAccent} symbol="◷" />
        <Text style={styles.rowLabel}>Recent</Text>
        <Text style={styles.count}>{threadCount}</Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ selected: activeCollectionId === "issues" }}
        onPress={() => onSelectCollection("issues")}
        style={({ pressed }) => [
          styles.row,
          activeCollectionId === "issues" && styles.selected,
          pressed && { opacity: 0.55 },
        ]}
      >
        <SmartGlyph color={palette.issuesAccent} symbol="!" />
        <Text style={styles.rowLabel}>Issues</Text>
        <Text style={styles.count}>3</Text>
      </Pressable>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Curiosity</Text>
        <Text style={styles.count}>⌄</Text>
      </View>
      {workspaceRows.map((row) => (
        <CollectionRow
          {...row}
          active={row.id === activeCollectionId}
          count={row.id === "sessions" ? threadCount : row.count}
          key={row.id}
          onSelect={onSelectCollection}
        />
      ))}
    </ScrollView>
  </View>
);
