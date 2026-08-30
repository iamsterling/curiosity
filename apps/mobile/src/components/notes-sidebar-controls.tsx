import { forwardRef } from "react";
import type { ColorValue, PressableProps, ViewProps } from "react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { palette } from "../theme";

export const NotesHeaderButton = forwardRef<
  View,
  Omit<PressableProps, "children"> & {
    readonly label: string;
    readonly symbol: string;
  }
>(({ label, style, symbol, ...props }, ref) => (
  <Pressable
    accessibilityLabel={label}
    accessibilityRole="button"
    hitSlop={4}
    ref={ref}
    style={(state) => [
      styles.headerButton,
      state.pressed && styles.pressed,
      typeof style === "function" ? style(state) : style,
    ]}
    {...props}
  >
    <Text accessibilityElementsHidden style={styles.headerSymbol}>
      {symbol}
    </Text>
  </Pressable>
));
NotesHeaderButton.displayName = "NotesHeaderButton";

export const FolderGlyph = forwardRef<View, ViewProps>(({ style, ...props }, ref) => (
  <View
    accessibilityElementsHidden
    ref={ref}
    style={[styles.folder, style]}
    {...props}
  >
    <View style={styles.folderTab} />
  </View>
));
FolderGlyph.displayName = "FolderGlyph";

export const SmartGlyph = forwardRef<
  View,
  ViewProps & {
    readonly color: ColorValue;
    readonly symbol: string;
  }
>(({ color, style, symbol, ...props }, ref) => (
  <View
    accessibilityElementsHidden
    ref={ref}
    style={[styles.smartGlyph, { backgroundColor: color }, style]}
    {...props}
  >
    <Text style={styles.smartSymbol}>{symbol}</Text>
  </View>
));
SmartGlyph.displayName = "SmartGlyph";

const styles = StyleSheet.create({
  folder: {
    borderColor: palette.notesAccent,
    borderRadius: 3,
    borderWidth: 2,
    height: 17,
    marginHorizontal: 3,
    marginTop: 3,
    width: 23,
  },
  folderTab: {
    backgroundColor: palette.notesAccent,
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
    height: 3,
    left: 1,
    position: "absolute",
    top: -5,
    width: 9,
  },
  headerButton: {
    alignItems: "center",
    backgroundColor: palette.navigationControl,
    borderColor: palette.glassLine,
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  headerSymbol: {
    color: palette.textPrimary,
    fontSize: 23,
    fontWeight: "500",
    lineHeight: 26,
  },
  pressed: { opacity: 0.55 },
  smartGlyph: {
    alignItems: "center",
    borderRadius: 7,
    height: 28,
    justifyContent: "center",
    width: 28,
  },
  smartSymbol: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },
});
