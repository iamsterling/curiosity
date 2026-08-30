import { useRouter } from "expo-router";
import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppShell } from "../app-shell-context";
import { palette } from "../theme";

export const SystemScreenShell = ({
  children,
  subtitle,
  showsBackButton = true,
  title,
  trailing,
}: {
  readonly children: ReactNode;
  readonly subtitle: string;
  readonly showsBackButton?: boolean;
  readonly title: string;
  readonly trailing?: ReactNode;
}) => {
  const router = useRouter();
  const appShell = useAppShell();
  const close = () => {
    if (router.canGoBack()) return router.back();
    router.replace("/");
  };

  return (
    <SafeAreaView edges={["top", "left", "right", "bottom"]} style={styles.safe}>
      <View style={styles.header}>
        <Pressable
          accessibilityLabel="Show organizations and projects"
          accessibilityRole="button"
          onPress={appShell.openParentSidebar}
          style={({ pressed }) => [styles.back, pressed && styles.pressed]}
        >
          <Text accessibilityElementsHidden style={styles.sidebarGlyph}>☰</Text>
        </Pressable>
        {showsBackButton ? (
          <Pressable
            accessibilityLabel="Back to workspace"
            accessibilityRole="button"
            onPress={close}
            style={({ pressed }) => [styles.back, pressed && styles.pressed]}
          >
            <Text accessibilityElementsHidden style={styles.backGlyph}>‹</Text>
          </Pressable>
        ) : null}
        <View style={styles.heading}>
          <Text style={styles.title}>{title}</Text>
          <Text numberOfLines={1} style={styles.subtitle}>{subtitle}</Text>
        </View>
        <View style={styles.trailing}>{trailing}</View>
      </View>
      <View style={styles.content}>{children}</View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  back: {
    alignItems: "center",
    backgroundColor: palette.navigationControl,
    borderColor: palette.glassLine,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  backGlyph: { color: palette.textPrimary, fontSize: 34, lineHeight: 37 },
  content: { flex: 1, minHeight: 0 },
  header: {
    alignItems: "center",
    borderBottomColor: palette.line,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    gap: 12,
    minHeight: 72,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  heading: { flex: 1, minWidth: 0 },
  pressed: { opacity: 0.55 },
  safe: { backgroundColor: palette.canvas, flex: 1 },
  sidebarGlyph: { color: palette.textPrimary, fontSize: 19, lineHeight: 23 },
  subtitle: { color: palette.textSecondary, fontSize: 12, marginTop: 2 },
  title: { color: palette.textPrimary, fontSize: 22, fontWeight: "700" },
  trailing: { alignItems: "flex-end", minWidth: 40 },
});
