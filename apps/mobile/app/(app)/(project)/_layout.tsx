import { Stack } from "expo-router";

const ProjectLayout = () => (
  <Stack
    screenOptions={{
      animation: "none",
      gestureEnabled: false,
      headerShown: false,
    }}
  />
);

export default ProjectLayout;
