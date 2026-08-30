import { useMemo } from "react";
import type { ProjectNavigationLevel } from "./components/project-pane-layout";
import {
  projectSidebarWidth,
  resolveProjectPaneLayout,
} from "./components/project-pane-layout";
import { useContainerWidth } from "./use-container-width";

export const useProjectPaneLayout = (level: ProjectNavigationLevel) => {
  const { onLayout, width } = useContainerWidth();
  return useMemo(() => {
    const layout = resolveProjectPaneLayout(width, level);
    const sidebarWidth = projectSidebarWidth(width);
    return {
      contentWidth: Math.max(0, width - (layout.sessions ? sidebarWidth : 0)),
      layout,
      onLayout,
      sidebarWidth,
      width,
    } as const;
  }, [level, onLayout, width]);
};
