export type ProjectNavigationLevel = "artifacts" | "content";

export interface ProjectPaneLayout {
  readonly canvas: boolean;
  readonly sessions: boolean;
}

const simultaneousPaneWidth = 1_100;

export const projectSidebarWidth = (width: number): number =>
  width >= simultaneousPaneWidth ? 400 : 320;

export const parentSidebarWidth = (width: number): number =>
  width >= simultaneousPaneWidth ? 320 : 300;

export const resolveProjectPaneLayout = (
  width: number,
  level: ProjectNavigationLevel,
): ProjectPaneLayout => {
  if (width >= simultaneousPaneWidth) return { canvas: true, sessions: true };
  return {
    canvas: level === "content",
    sessions: level === "artifacts",
  };
};
