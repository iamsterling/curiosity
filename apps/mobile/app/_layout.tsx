import {
  DarkTheme,
  DefaultTheme,
  Stack,
  ThemeProvider,
} from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useColorScheme } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AppShellProvider } from "../src/app-shell-context";
import { CuriosityWorkspaceProvider } from "../src/curiosity-workspace-context";
import { palette } from "../src/theme";
import { WorkspaceCatalogProvider } from "../src/workspace-catalog-context";
import { ProjectSessionIndexProvider } from "../src/project-session-index-context";

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
          <StatusBar style="auto" />
          <CuriosityWorkspaceProvider>
            <WorkspaceCatalogProvider>
              <ProjectSessionIndexProvider>
                <AppShellProvider>
                  <Stack
                    screenOptions={{
                      animation: "none",
                      contentStyle: { backgroundColor: palette.canvas },
                      gestureEnabled: false,
                      headerShown: false,
                      headerShadowVisible: false,
                      statusBarStyle: "auto",
                    }}
                  />
                </AppShellProvider>
              </ProjectSessionIndexProvider>
            </WorkspaceCatalogProvider>
          </CuriosityWorkspaceProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
