import { useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { palette } from "../theme";

const tools = Object.freeze([
  { label: "Select", symbol: "↖" },
  { label: "Frame", symbol: "□" },
  { label: "Ellipse", symbol: "○" },
  { label: "Text", symbol: "T" },
  { label: "Pen", symbol: "⌁" },
]);

const LayerRow = ({
  depth = 0,
  label,
  selected = false,
  symbol,
}: {
  readonly depth?: number;
  readonly label: string;
  readonly selected?: boolean;
  readonly symbol: string;
}) => (
  <View style={[styles.layerRow, selected && styles.layerSelected, { paddingLeft: 10 + depth * 13 }]}>
    <Text style={styles.layerSymbol}>{symbol}</Text>
    <Text numberOfLines={1} style={styles.layerLabel}>
      {label}
    </Text>
  </View>
);

export const CraftSurface = () => {
  const { width } = useWindowDimensions();
  const [activeTool, setActiveTool] = useState("Select");
  const showsPanels = width >= 1_150;

  return (
    <View style={styles.root}>
      <View style={styles.toolbar}>
        <View>
          <Text style={styles.eyebrow}>CRAFT / DOCUMENT</Text>
          <Text style={styles.documentTitle}>Product shell.ui</Text>
        </View>
        <View style={styles.toolbarCenter}>
          <Text style={styles.zoom}>75%</Text>
          <View style={styles.toolbarRule} />
          <Text style={styles.toolbarValue}>Frame 01</Text>
        </View>
        <Text style={styles.preview}>BRIDGE PREVIEW</Text>
      </View>

      <View style={styles.editor}>
        <View style={styles.toolRail}>
          {tools.map((tool) => {
            const selected = activeTool === tool.label;
            return (
              <Pressable
                accessibilityLabel={tool.label}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                key={tool.label}
                onPress={() => setActiveTool(tool.label)}
                style={({ pressed }) => [
                  styles.tool,
                  selected && styles.toolSelected,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={[styles.toolSymbol, selected && styles.toolSymbolSelected]}>
                  {tool.symbol}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {showsPanels ? (
          <View style={styles.layers}>
            <View style={styles.panelHeader}>
              <Text style={styles.panelLabel}>LAYERS</Text>
              <Text style={styles.panelMeta}>6</Text>
            </View>
            <LayerRow label="Product shell" symbol="▣" />
            <LayerRow depth={1} label="Navigation" symbol="□" />
            <LayerRow depth={1} label="Surface switcher" symbol="□" />
            <LayerRow depth={1} label="Issue board" selected symbol="□" />
            <LayerRow depth={2} label="CUR-42" symbol="T" />
            <LayerRow depth={2} label="Focus rail" symbol="—" />
          </View>
        ) : null}

        <ScrollView
          contentContainerStyle={styles.canvasContent}
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.canvas}
        >
          <View style={styles.artboard}>
            <View style={styles.artboardSidebar}>
              <View style={styles.mockBrand} />
              <View style={[styles.mockNav, styles.mockNavActive]} />
              <View style={styles.mockNav} />
              <View style={styles.mockNav} />
              <View style={styles.mockNav} />
            </View>
            <View style={styles.artboardMain}>
              <View style={styles.mockTopbar}>
                <View style={styles.mockTitle} />
                <View style={styles.mockTabs}>
                  <View style={styles.mockTab} />
                  <View style={[styles.mockTab, styles.mockTabActive]} />
                  <View style={styles.mockTab} />
                </View>
              </View>
              <View style={styles.mockWorkspace}>
                <View style={styles.mockColumn}>
                  <View style={styles.mockColumnTitle} />
                  <View style={styles.mockIssue} />
                  <View style={styles.mockIssueShort} />
                </View>
                <View style={styles.mockColumn}>
                  <View style={styles.mockColumnTitle} />
                  <View style={[styles.mockIssue, styles.mockIssueFocused]} />
                </View>
                <View style={styles.mockColumn}>
                  <View style={styles.mockColumnTitle} />
                  <View style={styles.mockIssueShort} />
                  <View style={styles.mockIssue} />
                </View>
              </View>
            </View>
            <View pointerEvents="none" style={styles.selection}>
              <View style={[styles.handle, styles.handleTopLeft]} />
              <View style={[styles.handle, styles.handleTopRight]} />
              <View style={[styles.handle, styles.handleBottomLeft]} />
              <View style={[styles.handle, styles.handleBottomRight]} />
            </View>
            <Text style={styles.artboardName}>Issue board / iPad landscape</Text>
          </View>
        </ScrollView>

        {showsPanels ? (
          <View style={styles.inspector}>
            <View style={styles.panelHeader}>
              <Text style={styles.panelLabel}>INSPECTOR</Text>
              <Text style={styles.panelMeta}>FRAME</Text>
            </View>
            <Text style={styles.inspectorTitle}>Issue board</Text>
            <View style={styles.propertyGroup}>
              <Text style={styles.propertyHeading}>POSITION</Text>
              <View style={styles.propertyRow}>
                <Text style={styles.propertyLabel}>X</Text>
                <Text style={styles.propertyValue}>320</Text>
                <Text style={styles.propertyLabel}>Y</Text>
                <Text style={styles.propertyValue}>184</Text>
              </View>
            </View>
            <View style={styles.propertyGroup}>
              <Text style={styles.propertyHeading}>SIZE</Text>
              <View style={styles.propertyRow}>
                <Text style={styles.propertyLabel}>W</Text>
                <Text style={styles.propertyValue}>1024</Text>
                <Text style={styles.propertyLabel}>H</Text>
                <Text style={styles.propertyValue}>768</Text>
              </View>
            </View>
            <View style={styles.propertyGroup}>
              <Text style={styles.propertyHeading}>LAYOUT</Text>
              <View style={styles.instrumentRow}>
                <Text style={styles.instrumentLabel}>Direction</Text>
                <Text style={styles.instrumentValue}>Horizontal</Text>
              </View>
              <View style={styles.instrumentRow}>
                <Text style={styles.instrumentLabel}>Gap</Text>
                <Text style={styles.instrumentValue}>0</Text>
              </View>
              <View style={styles.instrumentRow}>
                <Text style={styles.instrumentLabel}>Sizing</Text>
                <Text style={styles.instrumentValue}>Fixed × Fixed</Text>
              </View>
            </View>
          </View>
        ) : null}
      </View>

      <View style={styles.statusStrip}>
        <Text style={styles.statusText}>TOOL / {activeTool.toUpperCase()}</Text>
        <Text style={styles.statusText}>CANVAS / WEBGPU TARGET</Text>
        <Text style={styles.statusWarning}>CRAFT BRIDGE NOT CONNECTED</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  artboard: {
    backgroundColor: "#f2f4f5",
    flexDirection: "row",
    height: 360,
    position: "relative",
    width: 570,
  },
  artboardMain: { flex: 1 },
  artboardName: {
    bottom: -24,
    color: palette.textMuted,
    fontSize: 9,
    left: 0,
    position: "absolute",
  },
  artboardSidebar: { backgroundColor: "#171c20", padding: 13, width: 105 },
  canvas: { backgroundColor: palette.canvas, flex: 1 },
  canvasContent: {
    alignItems: "center",
    flexGrow: 1,
    justifyContent: "center",
    minWidth: 650,
    padding: 54,
  },
  documentTitle: { color: palette.textPrimary, fontSize: 14, fontWeight: "700", marginTop: 3 },
  editor: { flex: 1, flexDirection: "row" },
  eyebrow: { color: palette.textMuted, fontSize: 8, fontWeight: "800", letterSpacing: 1.1 },
  handle: {
    backgroundColor: palette.canvas,
    borderColor: palette.focus,
    borderWidth: 1,
    height: 7,
    position: "absolute",
    width: 7,
  },
  handleBottomLeft: { bottom: -4, left: -4 },
  handleBottomRight: { bottom: -4, right: -4 },
  handleTopLeft: { left: -4, top: -4 },
  handleTopRight: { right: -4, top: -4 },
  inspector: {
    backgroundColor: palette.surfaceQuiet,
    borderLeftColor: palette.line,
    borderLeftWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 14,
    width: 210,
  },
  inspectorTitle: { color: palette.textPrimary, fontSize: 14, fontWeight: "700", paddingVertical: 13 },
  instrumentLabel: { color: palette.textSecondary, fontSize: 10 },
  instrumentRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 11 },
  instrumentValue: { color: palette.textPrimary, fontSize: 10, fontVariant: ["tabular-nums"] },
  layerLabel: { color: palette.textSecondary, flex: 1, fontSize: 10 },
  layerRow: { alignItems: "center", flexDirection: "row", gap: 7, height: 31 },
  layerSelected: { backgroundColor: palette.focusQuiet },
  layerSymbol: { color: palette.textMuted, fontSize: 10, width: 13 },
  layers: {
    backgroundColor: palette.surfaceQuiet,
    borderRightColor: palette.line,
    borderRightWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 7,
    width: 166,
  },
  mockBrand: { backgroundColor: "#e7edf0", borderRadius: 3, height: 8, marginBottom: 25, width: 46 },
  mockColumn: { borderRightColor: "#d6dade", borderRightWidth: 1, flex: 1, padding: 10 },
  mockColumnTitle: { backgroundColor: "#9ba7ad", borderRadius: 2, height: 5, marginBottom: 14, width: 42 },
  mockIssue: { backgroundColor: "#ffffff", borderColor: "#d8dde0", borderWidth: 1, height: 58, marginBottom: 8 },
  mockIssueFocused: { borderColor: "#087da8", borderLeftWidth: 3 },
  mockIssueShort: { backgroundColor: "#ffffff", borderColor: "#d8dde0", borderWidth: 1, height: 43, marginBottom: 8 },
  mockNav: { backgroundColor: "#354048", borderRadius: 2, height: 6, marginBottom: 13, width: 55 },
  mockNavActive: { backgroundColor: "#8bd5f7", width: 64 },
  mockTab: { backgroundColor: "#aab4b9", height: 4, width: 30 },
  mockTabActive: { backgroundColor: "#087da8", width: 38 },
  mockTabs: { flexDirection: "row", gap: 13 },
  mockTitle: { backgroundColor: "#263139", borderRadius: 2, height: 7, width: 55 },
  mockTopbar: { alignItems: "center", borderBottomColor: "#d6dade", borderBottomWidth: 1, flexDirection: "row", height: 52, justifyContent: "space-between", paddingHorizontal: 14 },
  mockWorkspace: { flex: 1, flexDirection: "row" },
  panelHeader: { alignItems: "center", borderBottomColor: palette.line, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: "row", height: 43, justifyContent: "space-between" },
  panelLabel: { color: palette.textMuted, fontSize: 8, fontWeight: "800", letterSpacing: 1 },
  panelMeta: { color: palette.textMuted, fontSize: 8 },
  pressed: { opacity: 0.55 },
  preview: { color: palette.warning, fontSize: 8, fontWeight: "800", letterSpacing: 1 },
  propertyGroup: { borderTopColor: palette.line, borderTopWidth: StyleSheet.hairlineWidth, paddingVertical: 14 },
  propertyHeading: { color: palette.textMuted, fontSize: 8, fontWeight: "800", letterSpacing: 1 },
  propertyLabel: { color: palette.textMuted, fontSize: 9 },
  propertyRow: { alignItems: "center", flexDirection: "row", gap: 8, marginTop: 10 },
  propertyValue: { backgroundColor: palette.surface, color: palette.textPrimary, flex: 1, fontSize: 10, paddingHorizontal: 7, paddingVertical: 6 },
  root: { backgroundColor: palette.canvas, flex: 1 },
  selection: { borderColor: palette.focus, borderWidth: 1, height: 262, left: 177, position: "absolute", top: 67, width: 250 },
  statusStrip: { alignItems: "center", borderTopColor: palette.line, borderTopWidth: StyleSheet.hairlineWidth, flexDirection: "row", gap: 22, height: 27, paddingHorizontal: 12 },
  statusText: { color: palette.textMuted, fontSize: 7, fontWeight: "700", letterSpacing: 0.8 },
  statusWarning: { color: palette.warning, fontSize: 7, fontWeight: "700", letterSpacing: 0.8, marginLeft: "auto" },
  tool: { alignItems: "center", height: 42, justifyContent: "center", width: 42 },
  toolRail: { alignItems: "center", backgroundColor: palette.surfaceQuiet, borderRightColor: palette.line, borderRightWidth: StyleSheet.hairlineWidth, paddingTop: 8, width: 48 },
  toolSelected: { backgroundColor: palette.focusQuiet },
  toolSymbol: { color: palette.textMuted, fontSize: 16 },
  toolSymbolSelected: { color: palette.focus },
  toolbar: { alignItems: "center", borderBottomColor: palette.line, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: "row", height: 56, justifyContent: "space-between", paddingHorizontal: 16 },
  toolbarCenter: { alignItems: "center", flexDirection: "row", gap: 10 },
  toolbarRule: { backgroundColor: palette.line, height: 18, width: StyleSheet.hairlineWidth },
  toolbarValue: { color: palette.textSecondary, fontSize: 10 },
  zoom: { color: palette.textPrimary, fontSize: 10, fontVariant: ["tabular-nums"] },
});
