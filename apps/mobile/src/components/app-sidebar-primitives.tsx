import { forwardRef } from "react";
import {
  Pressable,
  type PressableProps,
  StyleSheet,
  View,
  type ViewProps,
} from "react-native";
import { palette } from "../theme";

export const AppSidebarRoot = forwardRef<View, ViewProps>(
  ({ style, ...props }, ref) => (
    <View ref={ref} style={[styles.root, style]} {...props} />
  ),
);
AppSidebarRoot.displayName = "AppSidebarRoot";

export const AppSidebarViewport = forwardRef<View, ViewProps>(
  ({ style, ...props }, ref) => (
    <View ref={ref} style={[styles.viewport, style]} {...props} />
  ),
);
AppSidebarViewport.displayName = "AppSidebarViewport";

export const AppSidebarOverlay = forwardRef<View, ViewProps>(
  ({ style, ...props }, ref) => (
    <View ref={ref} style={[styles.overlay, style]} {...props} />
  ),
);
AppSidebarOverlay.displayName = "AppSidebarOverlay";

export const AppSidebarScrim = forwardRef<View, PressableProps>(
  ({ style, ...props }, ref) => (
    <Pressable
      ref={ref}
      style={(state) => [
        styles.scrim,
        typeof style === "function" ? style(state) : style,
      ]}
      {...props}
    />
  ),
);
AppSidebarScrim.displayName = "AppSidebarScrim";

export const AppSidebarPanel = forwardRef<View, ViewProps>(
  ({ style, ...props }, ref) => (
    <View ref={ref} style={[styles.panel, style]} {...props} />
  ),
);
AppSidebarPanel.displayName = "AppSidebarPanel";

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    flexDirection: "row",
    zIndex: 100,
  },
  panel: {
    alignSelf: "stretch",
    backgroundColor: palette.navigationSidebar,
    shadowColor: "#000000",
    shadowOffset: { height: 0, width: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
  },
  root: { flex: 1 },
  scrim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(20, 24, 31, 0.22)",
  },
  viewport: { flex: 1, minWidth: 0 },
});
