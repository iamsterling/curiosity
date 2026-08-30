import { Stack } from "expo-router";

const SystemLayout = () => (
  <Stack
    screenOptions={{
      animation: "none",
      gestureEnabled: false,
      headerShown: false,
    }}
  />
);

export default SystemLayout;
