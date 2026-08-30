import type { WorkspaceView } from "../workspace-types";

export type SidebarCollectionId =
  | "audio"
  | "craft"
  | "issues"
  | "memory"
  | "providers"
  | "recent"
  | "sessions";

export const collectionView = (
  collectionId: SidebarCollectionId,
): WorkspaceView => {
  if (collectionId === "recent" || collectionId === "sessions") return "chat";
  return collectionId;
};

export const collectionTitle = (
  collectionId: SidebarCollectionId,
): string => {
  if (collectionId === "recent") return "Recent";
  if (collectionId === "sessions") return "Sessions";
  if (collectionId === "craft") return "Craft";
  if (collectionId === "issues") return "Issues";
  if (collectionId === "memory") return "Memory";
  if (collectionId === "audio") return "Audio";
  return "Providers";
};
