import type { SidebarCollectionId } from "./components/notes-shell-model";
import { defaultProjectId } from "./workspace-catalog";

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

export const projectSessionRoute = (
  projectId: string,
  sessionId: string,
): `/projects/${string}/sessions/${string}` =>
  `/projects/${encodeURIComponent(projectId)}/sessions/${encodeURIComponent(sessionId)}`;

export const organizationRecentRoute = (
  organizationId: string,
): `/organizations/${string}/recent` =>
  `/organizations/${encodeURIComponent(organizationId)}/recent`;

export const organizationAgentsRoute = (
  organizationId: string,
): `/organizations/${string}/agents` =>
  `/organizations/${encodeURIComponent(organizationId)}/agents`;

export const routeIdForParam = (
  routeId: string | readonly string[] | undefined,
): string | undefined => {
  let value: string | undefined;
  if (typeof routeId === "string") value = routeId;
  else if (routeId) value = routeId[0];
  if (!value) return undefined;
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

export const projectIdForRouteParam = (
  routeProjectId: string | readonly string[] | undefined,
): string => {
  const projectId = routeIdForParam(routeProjectId);
  if (projectId) return projectId;
  return defaultProjectId;
};

export const collectionForPath = (pathname: string): SidebarCollectionId => {
  const segments = pathname.split("/").filter(Boolean);
  const projectIndex = segments.indexOf("projects");
  let segment: string | undefined;
  if (projectIndex >= 0) segment = segments[projectIndex + 2];
  if (
    segment === "audio" ||
    segment === "craft" ||
    segment === "memory" ||
    segment === "sessions"
  )
    return segment;
  return "sessions";
};
