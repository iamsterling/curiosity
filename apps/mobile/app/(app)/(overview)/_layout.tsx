import { Stack } from "expo-router";

const OverviewLayout = () => (
  <Stack
    screenOptions={{
      animation: "none",
      gestureEnabled: false,
      headerShown: false,
    }}
  />
);

export default OverviewLayout;
