import { StyleSheet } from "react-native";
import { palette } from "../theme";

export const projectSidebarStyles = StyleSheet.create({
  content: { flex: 1 },
  expanded: { flex: 1, width: undefined },
  itemGroup: { paddingBottom: 6 },
});

export const projectSidebarPrimitiveStyles = StyleSheet.create({
  destination: {
    alignItems: "center",
    borderRadius: 14,
    flexDirection: "row",
    gap: 10,
    minHeight: 58,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  destinationCopy: { flex: 1, gap: 1, minWidth: 0 },
  destinationDetail: {
    color: palette.textMuted,
    fontSize: 11,
    lineHeight: 15,
  },
  destinationLabel: {
    color: palette.textSecondary,
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 18,
  },
  destinationLabelSelected: { color: palette.textPrimary },
  destinations: {
    borderBottomColor: palette.line,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 2,
    paddingBottom: 12,
    paddingHorizontal: 10,
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
  scope: {
    paddingBottom: 3,
    paddingHorizontal: 16,
    paddingTop: 15,
  },
  scopeTitle: {
    color: palette.textPrimary,
    fontSize: 18,
    fontWeight: "700",
    lineHeight: 23,
  },
  sectionTitle: {
    color: palette.textMuted,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.8,
    marginBottom: 4,
    marginHorizontal: 16,
    paddingBottom: 5,
    paddingTop: 12,
  },
  selected: { backgroundColor: palette.artifactSelection },
  item: {
    borderRadius: 16,
    gap: 2,
    marginHorizontal: 12,
    minHeight: 66,
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  itemDetail: { color: palette.textMuted, fontSize: 13, lineHeight: 18 },
  itemTitle: {
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
