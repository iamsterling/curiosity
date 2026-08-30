import { StyleSheet } from "react-native";
import { palette } from "../theme";

export const sourceSidebarStyles = StyleSheet.create({
  count: { color: palette.textMuted, fontSize: 14, minWidth: 28, textAlign: "right" },
  expanded: { flex: 1, width: undefined },
  header: {
    alignItems: "center",
    flexDirection: "row",
    gap: 9,
    minHeight: 64,
    paddingBottom: 9,
    paddingHorizontal: 12,
  },
  headerSpacer: { flex: 1 },
  list: { gap: 2, paddingBottom: 24, paddingHorizontal: 12, paddingTop: 8 },
  row: {
    alignItems: "center",
    borderRadius: 16,
    flexDirection: "row",
    gap: 11,
    minHeight: 44,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  rowLabel: { color: palette.textPrimary, flex: 1, fontSize: 16, lineHeight: 21 },
  sectionHeader: {
    alignItems: "center",
    flexDirection: "row",
    marginTop: 20,
    minHeight: 34,
    paddingHorizontal: 10,
  },
  sectionTitle: { color: palette.textMuted, flex: 1, fontSize: 16, fontWeight: "600" },
  selected: { backgroundColor: palette.navigationSelection },
  sidebar: {
    backgroundColor: palette.navigationSidebar,
    borderRightColor: palette.line,
    borderRightWidth: StyleSheet.hairlineWidth,
  },
});
