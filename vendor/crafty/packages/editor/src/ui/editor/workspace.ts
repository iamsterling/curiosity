export type EditorWorkspaceMode = "design";

export type EditorFileWorkspace = {
  mode: EditorWorkspaceMode;
  file: {
    slug: string;
    href: string;
    browserHref: string;
  };
};

export type EditorWorkspace = EditorFileWorkspace;

export const createFileWorkspace = (slug: string): EditorFileWorkspace => ({
  mode: "design",
  file: {
    slug,
    href: `/editor/${slug}`,
    browserHref: "/editor",
  },
});
