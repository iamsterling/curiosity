import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { palette } from "../theme";
import type { WorkspaceView } from "../workspace-types";

const surfaces: readonly {
  readonly label: string;
  readonly symbol: string;
  readonly view: WorkspaceView;
}[] = Object.freeze([
  { label: "Issues", symbol: "☷", view: "issues" },
  { label: "Chat", symbol: "◌", view: "chat" },
  { label: "Craft", symbol: "◇", view: "craft" },
  { label: "Memory", symbol: "⌘", view: "memory" },
  { label: "Audio", symbol: "≋", view: "audio" },
]);

export const SurfaceSwitcher = ({
  compact,
  online,
  onSelect,
  topInset,
  view,
}: {
  readonly compact: boolean;
  readonly online: boolean;
  readonly onSelect: (view: WorkspaceView) => void;
  readonly topInset: number;
  readonly view: WorkspaceView;
}) => (
  <View style={[styles.root, compact && { paddingTop: topInset + 38 }]}>
    {!compact ? (
      <View style={styles.identity}>
        <Text style={styles.projectLabel}>PROJECT</Text>
        <Text numberOfLines={1} style={styles.projectTitle}>
          Curiosity
        </Text>
      </View>
    ) : null}
    <ScrollView
      contentContainerStyle={styles.tabs}
      horizontal
      showsHorizontalScrollIndicator={false}
    >
      {surfaces.map((surface) => {
        const selected = surface.view === view;
        return (
          <Pressable
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            key={surface.view}
            onPress={() => onSelect(surface.view)}
            style={({ pressed }) => [
              styles.tab,
              selected && styles.selectedTab,
              pressed && styles.pressed,
            ]}
          >
            <Text style={[styles.tabSymbol, selected && styles.selectedText]}>
              {surface.symbol}
            </Text>
            <Text style={[styles.tabLabel, selected && styles.selectedText]}>
              {surface.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
    {!compact ? (
      <Pressable
        accessibilityLabel="Open memory system"
        accessibilityRole="button"
        onPress={() => onSelect("memory")}
        style={({ pressed }) => [styles.kernel, pressed && styles.pressed]}
      >
        <View
          style={[
            styles.statusDot,
            { backgroundColor: online ? palette.success : palette.danger },
          ]}
        />
        <View>
          <Text style={styles.kernelLabel}>MEMORY / MODEL</Text>
          <Text style={styles.kernelState}>{online ? "session live" : "offline"}</Text>
        </View>
      </Pressable>
    ) : null}
  </View>
);

const styles = StyleSheet.create({
  identity: {
    borderRightColor: palette.line,
    borderRightWidth: StyleSheet.hairlineWidth,
    justifyContent: "center",
    paddingHorizontal: 18,
    width: 150,
  },
  kernel: {
    alignItems: "center",
    borderLeftColor: palette.line,
    borderLeftWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    gap: 8,
    minWidth: 150,
    paddingHorizontal: 16,
  },
  kernelLabel: {
    color: palette.textSecondary,
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 1,
  },
  kernelState: { color: palette.textMuted, fontSize: 9, marginTop: 2 },
  pressed: { opacity: 0.58 },
  projectLabel: {
    color: palette.textMuted,
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 1.2,
  },
  projectTitle: {
    color: palette.textPrimary,
    fontSize: 14,
    fontWeight: "700",
    marginTop: 2,
  },
  root: {
    backgroundColor: palette.surfaceQuiet,
    borderBottomColor: palette.line,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    minHeight: 58,
  },
  selectedTab: { borderBottomColor: palette.focus, borderBottomWidth: 2 },
  selectedText: { color: palette.textPrimary },
  statusDot: { borderRadius: 4, height: 7, width: 7 },
  tab: {
    alignItems: "center",
    borderBottomColor: "transparent",
    borderBottomWidth: 2,
    flexDirection: "row",
    gap: 7,
    minHeight: 58,
    paddingHorizontal: 15,
  },
  tabLabel: { color: palette.textMuted, fontSize: 12, fontWeight: "700" },
  tabSymbol: { color: palette.textMuted, fontSize: 13 },
  tabs: { alignItems: "stretch", flexGrow: 1 },
});
