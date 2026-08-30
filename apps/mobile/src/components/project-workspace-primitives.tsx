import { forwardRef } from "react";
import { StyleSheet, View, type ViewProps } from "react-native";
import { palette } from "../theme";

export const ProjectWorkspaceRoot = forwardRef<View, ViewProps>(
  ({ style, ...props }, ref) => (
    <View ref={ref} style={[styles.root, style]} {...props} />
  ),
);
ProjectWorkspaceRoot.displayName = "ProjectWorkspaceRoot";

export const ProjectWorkspaceCanvas = forwardRef<View, ViewProps>(
  ({ style, ...props }, ref) => (
    <View ref={ref} style={[styles.canvas, style]} {...props} />
  ),
);
ProjectWorkspaceCanvas.displayName = "ProjectWorkspaceCanvas";

export const ProjectCanvasRoot = forwardRef<View, ViewProps>(
  ({ style, ...props }, ref) => (
    <View ref={ref} style={[styles.canvas, style]} {...props} />
  ),
);
ProjectCanvasRoot.displayName = "ProjectCanvasRoot";

export const ProjectCanvasSurface = forwardRef<View, ViewProps>(
  ({ style, ...props }, ref) => (
    <View ref={ref} style={[styles.surface, style]} {...props} />
  ),
);
ProjectCanvasSurface.displayName = "ProjectCanvasSurface";

export const ProjectComposerOverlay = forwardRef<View, ViewProps>(
  ({ style, ...props }, ref) => (
    <View ref={ref} style={[styles.composerOverlay, style]} {...props} />
  ),
);
ProjectComposerOverlay.displayName = "ProjectComposerOverlay";

const styles = StyleSheet.create({
  canvas: { backgroundColor: palette.canvas, flex: 1, minWidth: 0 },
  composerOverlay: {
    bottom: 0,
    left: 0,
    position: "absolute",
    right: 0,
    zIndex: 10,
  },
  root: {
    backgroundColor: palette.canvas,
    flex: 1,
    flexDirection: "row",
  },
  surface: { flex: 1 },
});
