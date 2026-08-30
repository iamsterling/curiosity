import { StyleSheet } from "react-native";
import { palette } from "../theme";

export const projectSidebarStyles = StyleSheet.create({
  content: { flex: 1 },
  expanded: { flex: 1, width: undefined },
  sessionGroup: { paddingBottom: 6 },
});

export const projectSidebarPrimitiveStyles = StyleSheet.create({
  destination: {
    alignItems: "center",
    borderRadius: 10,
    flexGrow: 1,
    justifyContent: "center",
    minHeight: 34,
    paddingHorizontal: 8,
  },
  destinationLabel: {
    color: palette.textSecondary,
    fontSize: 12,
    fontWeight: "600",
  },
  destinationLabelSelected: { color: palette.textPrimary },
  destinations: {
    borderBottomColor: palette.line,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    gap: 3,
    padding: 10,
  },
  eyebrow: {
    color: palette.textMuted,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.8,
    lineHeight: 14,
  },
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
  pressed: { opacity: 0.55 },
  root: {
    backgroundColor: palette.artifactList,
    borderRightColor: palette.line,
    borderRightWidth: StyleSheet.hairlineWidth,
  },
  sectionTitle: {
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
  session: {
    borderRadius: 16,
    gap: 2,
    marginHorizontal: 12,
    minHeight: 66,
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  sessionDetail: { color: palette.textMuted, fontSize: 13, lineHeight: 18 },
  sessionTitle: {
    color: palette.textPrimary,
    fontSize: 15,
    fontWeight: "600",
    lineHeight: 20,
  },
  title: {
    color: palette.textPrimary,
    fontSize: 18,
    fontWeight: "700",
    lineHeight: 22,
  },
});
