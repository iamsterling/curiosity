import type { WorkspaceView } from "../workspace-types";

export type SidebarCollectionId =
  | "audio"
  | "craft"
  | "memory"
  | "sessions";

export const collectionView = (
  collectionId: SidebarCollectionId,
): WorkspaceView => {
  if (collectionId === "sessions") return "chat";
  return collectionId;
};

export const collectionTitle = (
  collectionId: SidebarCollectionId,
): string => {
  if (collectionId === "sessions") return "Sessions";
  if (collectionId === "craft") return "Craft";
  if (collectionId === "memory") return "Memory";
  return "Audio";
};
