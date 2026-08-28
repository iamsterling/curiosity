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
  drawer: { backgroundColor: palette.sidebar },
  drawerLayout: { backgroundColor: palette.canvas, flex: 1 },
  drawerOverlay: { backgroundColor: palette.overlay },
  keyboard: { backgroundColor: palette.canvas, flex: 1 },
  safe: { backgroundColor: palette.canvas, flex: 1 },
  surface: { flex: 1 },
});
