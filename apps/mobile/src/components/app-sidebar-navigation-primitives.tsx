import { forwardRef } from "react";
import {
  Pressable,
  type PressableProps,
  ScrollView,
  type ScrollViewProps,
  StyleSheet,
  Text,
  type TextProps,
  View,
  type ViewProps,
} from "react-native";
import { palette } from "../theme";

export const AppSidebarNavigationRoot = forwardRef<View, ViewProps>(
  ({ style, ...props }, ref) => (
    <View ref={ref} style={[styles.root, style]} {...props} />
  ),
);
AppSidebarNavigationRoot.displayName = "AppSidebarNavigationRoot";

export const AppSidebarNavigationHeader = forwardRef<View, ViewProps>(
  ({ style, ...props }, ref) => (
    <View ref={ref} style={[styles.header, style]} {...props} />
  ),
);
AppSidebarNavigationHeader.displayName = "AppSidebarNavigationHeader";

export const AppSidebarNavigationBody = forwardRef<ScrollView, ScrollViewProps>(
  ({ contentContainerStyle, style, ...props }, ref) => (
    <ScrollView
      contentContainerStyle={[styles.bodyContent, contentContainerStyle]}
      ref={ref}
      style={[styles.body, style]}
      {...props}
    />
  ),
);
AppSidebarNavigationBody.displayName = "AppSidebarNavigationBody";

export const AppSidebarNavigationFooter = forwardRef<View, ViewProps>(
  ({ style, ...props }, ref) => (
    <View ref={ref} style={[styles.footer, style]} {...props} />
  ),
);
AppSidebarNavigationFooter.displayName = "AppSidebarNavigationFooter";

export const AppSidebarNavigationRow = forwardRef<
  View,
  PressableProps & { readonly selected?: boolean }
>(({ accessibilityState, selected = false, style, ...props }, ref) => (
  <Pressable
    accessibilityRole="button"
    accessibilityState={{ ...accessibilityState, selected }}
    ref={ref}
    style={(state) => [
      styles.row,
      selected && styles.selected,
      state.pressed && styles.pressed,
      typeof style === "function" ? style(state) : style,
    ]}
    {...props}
  />
));
AppSidebarNavigationRow.displayName = "AppSidebarNavigationRow";

export const AppSidebarNavigationTitle = forwardRef<Text, TextProps>(
  ({ style, ...props }, ref) => (
    <Text ref={ref} style={[styles.title, style]} {...props} />
  ),
);
AppSidebarNavigationTitle.displayName = "AppSidebarNavigationTitle";

export const AppSidebarNavigationDetail = forwardRef<Text, TextProps>(
  ({ style, ...props }, ref) => (
    <Text ref={ref} style={[styles.detail, style]} {...props} />
  ),
);
AppSidebarNavigationDetail.displayName = "AppSidebarNavigationDetail";

export const AppSidebarNavigationRowCopy = forwardRef<View, ViewProps>(
  ({ style, ...props }, ref) => (
    <View ref={ref} style={[styles.rowCopy, style]} {...props} />
  ),
);
AppSidebarNavigationRowCopy.displayName = "AppSidebarNavigationRowCopy";

export const AppSidebarNavigationGroupLabel = forwardRef<Text, TextProps>(
  ({ style, ...props }, ref) => (
    <Text ref={ref} style={[styles.groupLabel, style]} {...props} />
  ),
);
AppSidebarNavigationGroupLabel.displayName = "AppSidebarNavigationGroupLabel";

export const AppSidebarNavigationSection = forwardRef<View, ViewProps>(
  ({ style, ...props }, ref) => (
    <View ref={ref} style={[styles.section, style]} {...props} />
  ),
);
AppSidebarNavigationSection.displayName = "AppSidebarNavigationSection";

export const AppSidebarNavigationSectionTitle = forwardRef<Text, TextProps>(
  ({ style, ...props }, ref) => (
    <Text ref={ref} style={[styles.sectionTitle, style]} {...props} />
  ),
);
AppSidebarNavigationSectionTitle.displayName =
  "AppSidebarNavigationSectionTitle";

export const AppSidebarNavigationSectionMeta = forwardRef<Text, TextProps>(
  ({ style, ...props }, ref) => (
    <Text ref={ref} style={[styles.sectionMeta, style]} {...props} />
  ),
);
AppSidebarNavigationSectionMeta.displayName =
  "AppSidebarNavigationSectionMeta";

export const appSidebarNavigationStyles = StyleSheet.create({
  count: {
    color: palette.textMuted,
    fontSize: 14,
    minWidth: 28,
    textAlign: "right",
  },
  disclosure: { color: palette.textMuted, fontSize: 22 },
  empty: {
    color: palette.textMuted,
    fontSize: 12,
    lineHeight: 18,
    paddingHorizontal: 10,
    paddingVertical: 12,
  },
  headerSpacer: { flex: 1 },
  organizationContext: { minWidth: 0 },
  organizationCount: {
    alignItems: "center",
    flexDirection: "row",
    marginHorizontal: 10,
    marginTop: 8,
  },
  organizationCountLabel: {
    color: palette.textMuted,
    flex: 1,
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.6,
  },
  organizationEyebrow: {
    color: palette.textMuted,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.8,
    marginBottom: 2,
    marginLeft: 2,
  },
  sectionAction: {
    alignItems: "center",
    height: 30,
    justifyContent: "center",
    width: 30,
  },
  sectionActionLabel: { color: palette.textSecondary, fontSize: 20 },
});

const styles = StyleSheet.create({
  body: { flex: 1 },
  bodyContent: {
    gap: 2,
    paddingBottom: 24,
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  footer: {
    borderTopColor: palette.line,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  detail: {
    color: palette.textMuted,
    fontSize: 12,
    lineHeight: 16,
  },
  groupLabel: {
    color: palette.textMuted,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.9,
    marginBottom: 7,
    marginHorizontal: 10,
    marginTop: 8,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    gap: 9,
    minHeight: 64,
    paddingBottom: 9,
    paddingHorizontal: 12,
  },
  title: {
    color: palette.textPrimary,
    fontSize: 15,
    fontWeight: "600",
    lineHeight: 19,
  },
  pressed: { opacity: 0.55 },
  root: {
    backgroundColor: palette.navigationSidebar,
    borderRightColor: palette.line,
    borderRightWidth: StyleSheet.hairlineWidth,
    flex: 1,
    minHeight: 0,
  },
  row: {
    alignItems: "center",
    borderRadius: 16,
    flexDirection: "row",
    gap: 11,
    minHeight: 54,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  rowCopy: { flex: 1, gap: 1, minWidth: 0 },
  section: {
    alignItems: "center",
    flexDirection: "row",
    marginTop: 20,
    minHeight: 34,
    paddingHorizontal: 10,
  },
  sectionTitle: {
    color: palette.textMuted,
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
  },
  sectionMeta: {
    color: palette.textMuted,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.6,
  },
  selected: { backgroundColor: palette.navigationSelection },
});
