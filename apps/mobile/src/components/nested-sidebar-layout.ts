export type SidebarNavigationLevel = "artifacts" | "collections" | "content";

export interface NestedSidebarLayout {
  readonly artifacts: boolean;
  readonly content: boolean;
  readonly source: boolean;
}

const regularWidth = 700;
const wideWidth = 1_100;

export interface NestedSidebarColumnWidths {
  readonly artifacts: number;
  readonly source: number;
}

export const resolveNestedSidebarColumnWidths = (
  width: number,
): NestedSidebarColumnWidths =>
  width >= wideWidth
    ? { artifacts: 400, source: 320 }
    : { artifacts: 320, source: 300 };

export const resolveNestedSidebarLayout = (
  width: number,
  level: SidebarNavigationLevel,
): NestedSidebarLayout => {
  if (width >= wideWidth) {
    return { artifacts: true, content: true, source: true };
  }

  if (width >= regularWidth) {
    if (level === "collections") {
      return { artifacts: true, content: false, source: true };
    }

    return {
      artifacts: true,
      content: true,
      source: false,
    };
  }

  return {
    artifacts: level === "artifacts",
    content: level === "content",
    source: level === "collections",
  };
};
