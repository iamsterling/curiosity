import type { SidebarCollectionId } from "./components/notes-shell-model";

const projectSegments = Object.freeze({
  audio: "audio",
  craft: "craft",
  memory: "memory",
  sessions: "sessions",
} as const satisfies Readonly<Record<SidebarCollectionId, string>>);

export const projectCollectionRoute = (
  projectId: string,
  collectionId: SidebarCollectionId,
): `/projects/${string}/${string}` =>
  `/projects/${encodeURIComponent(projectId)}/${projectSegments[collectionId]}`;

export const collectionForPath = (pathname: string): SidebarCollectionId => {
  const segment = pathname.split("/").filter(Boolean).at(-1);
  if (
    segment === "audio" ||
    segment === "craft" ||
    segment === "memory" ||
    segment === "sessions"
  )
    return segment;
  return "sessions";
};
