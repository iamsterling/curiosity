import { StyleSheet } from "react-native";
import { palette } from "../theme";

export const styles = StyleSheet.create({
  composerOverlay: {
    bottom: 0,
    left: 0,
    position: "absolute",
    right: 0,
    zIndex: 10,
  },
  headerTitle: { alignItems: "stretch", justifyContent: "center" },
  keyboard: { backgroundColor: palette.canvas, flex: 1 },
  safe: { backgroundColor: palette.canvas, flex: 1 },
  surface: { flex: 1 },
});
