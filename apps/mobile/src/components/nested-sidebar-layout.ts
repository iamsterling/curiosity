export type SidebarNavigationLevel = "content" | "organizations" | "sessions";

export interface NestedSidebarLayout {
  readonly content: boolean;
  readonly organizations: boolean;
  readonly sessions: boolean;
}

const regularWidth = 760;
const wideWidth = 1_180;

export const resolveNestedSidebarLayout = (
  width: number,
  level: SidebarNavigationLevel,
): NestedSidebarLayout => {
  if (width >= wideWidth) {
    return { content: true, organizations: true, sessions: true };
  }

  if (width >= regularWidth) {
    return {
      content: true,
      organizations: level === "organizations",
      sessions: level !== "organizations",
    };
  }

  return {
    content: level === "content",
    organizations: level === "organizations",
    sessions: level === "sessions",
  };
};
