import type { ColorValue } from "react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { palette } from "../theme";

export const NotesHeaderButton = ({
  label,
  onPress,
  symbol,
}: {
  readonly label: string;
  readonly onPress: () => void;
  readonly symbol: string;
}) => (
  <Pressable
    accessibilityLabel={label}
    accessibilityRole="button"
    hitSlop={4}
    onPress={onPress}
    style={({ pressed }) => [
      styles.headerButton,
      pressed && styles.pressed,
    ]}
  >
    <Text accessibilityElementsHidden style={styles.headerSymbol}>
      {symbol}
    </Text>
  </Pressable>
);

export const NotesTextButton = ({
  label,
  onPress,
}: {
  readonly label: string;
  readonly onPress: () => void;
}) => (
  <Pressable
    accessibilityRole="button"
    onPress={onPress}
    style={({ pressed }) => [styles.textButton, pressed && styles.pressed]}
  >
    <Text style={styles.textButtonLabel}>{label}</Text>
  </Pressable>
);

export const FolderGlyph = () => (
  <View accessibilityElementsHidden style={styles.folder}>
    <View style={styles.folderTab} />
  </View>
);

export const SmartGlyph = ({
  color,
  symbol,
}: {
  readonly color: ColorValue;
  readonly symbol: string;
}) => (
  <View
    accessibilityElementsHidden
    style={[styles.smartGlyph, { backgroundColor: color }]}
  >
    <Text style={styles.smartSymbol}>{symbol}</Text>
  </View>
);

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
  textButton: {
    alignItems: "center",
    backgroundColor: palette.navigationControl,
    borderColor: palette.glassLine,
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
    height: 44,
    justifyContent: "center",
    paddingHorizontal: 17,
  },
  textButtonLabel: { color: palette.textPrimary, fontSize: 16, fontWeight: "600" },
});
