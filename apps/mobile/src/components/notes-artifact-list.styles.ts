import { StyleSheet } from "react-native";
import { palette } from "../theme";

export const artifactListStyles = StyleSheet.create({
  backButton: { marginRight: 1 },
  detail: { color: palette.textMuted, fontSize: 13, lineHeight: 18 },
  empty: { flex: 1 },
  expanded: { flex: 1, width: undefined },
  header: {
    alignItems: "center",
    borderBottomColor: palette.line,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    gap: 9,
    minHeight: 76,
    paddingBottom: 10,
    paddingHorizontal: 14,
  },
  headerCopy: { flex: 1, gap: 1, minWidth: 0 },
  list: {
    backgroundColor: palette.artifactList,
    borderRightColor: palette.line,
    borderRightWidth: StyleSheet.hairlineWidth,
  },
  row: {
    borderRadius: 16,
    gap: 2,
    marginHorizontal: 12,
    minHeight: 66,
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  section: { paddingBottom: 6 },
  sectionHeader: {
    borderBottomColor: palette.line,
    borderBottomWidth: StyleSheet.hairlineWidth,
    color: palette.textPrimary,
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 5,
    marginHorizontal: 16,
    paddingBottom: 8,
    paddingTop: 17,
  },
  selected: { backgroundColor: palette.artifactSelection },
  subtitle: { color: palette.textMuted, fontSize: 14, lineHeight: 18 },
  title: { color: palette.textPrimary, fontSize: 18, fontWeight: "700", lineHeight: 22 },
  rowTitle: { color: palette.textPrimary, fontSize: 15, fontWeight: "600", lineHeight: 20 },
});
