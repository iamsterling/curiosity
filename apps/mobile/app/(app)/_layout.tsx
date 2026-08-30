import { Stack } from "expo-router";
import { ParentSidebarShell } from "../../src/components/parent-sidebar-shell";

const AppLayout = () => (
  <ParentSidebarShell>
    <Stack
      screenOptions={{
        animation: "none",
        gestureEnabled: false,
        headerShown: false,
      }}
    />
  </ParentSidebarShell>
);

export default AppLayout;
