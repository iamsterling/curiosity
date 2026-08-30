import { forwardRef } from "react";
import { StyleSheet, View, type ViewProps } from "react-native";
import { palette } from "../theme";

export const AppSidebarPanel = forwardRef<View, ViewProps>(
  ({ style, ...props }, ref) => (
    <View ref={ref} style={[styles.panel, style]} {...props} />
  ),
);
AppSidebarPanel.displayName = "AppSidebarPanel";

const styles = StyleSheet.create({
  panel: {
    alignSelf: "stretch",
    backgroundColor: palette.navigationSidebar,
    shadowColor: "#000000",
    shadowOffset: { height: 0, width: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
  },
});
