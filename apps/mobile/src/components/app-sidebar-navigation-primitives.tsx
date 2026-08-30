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

export const AppSidebarNavigationLabel = forwardRef<Text, TextProps>(
  ({ style, ...props }, ref) => (
    <Text ref={ref} style={[styles.label, style]} {...props} />
  ),
);
AppSidebarNavigationLabel.displayName = "AppSidebarNavigationLabel";

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
  header: {
    alignItems: "center",
    flexDirection: "row",
    gap: 9,
    minHeight: 64,
    paddingBottom: 9,
    paddingHorizontal: 12,
  },
  label: {
    color: palette.textPrimary,
    flex: 1,
    fontSize: 16,
    lineHeight: 21,
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
    minHeight: 44,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
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
  selected: { backgroundColor: palette.navigationSelection },
});
