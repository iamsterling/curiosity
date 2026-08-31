import type { CuriosityThread } from "./curiosity-client";
import type { SidebarCollectionId } from "./components/notes-shell-model";
import { sortThreadsByRecency } from "./project-session-index";

export interface ProjectNavigationItem {
  readonly collectionId?: SidebarCollectionId;
  readonly detail: string;
  readonly id: string;
  readonly threadId?: string;
  readonly title: string;
}

export interface ProjectNavigationSection {
  readonly data: readonly ProjectNavigationItem[];
  readonly title: string;
}

const collectionLandingItems: Readonly<
  Record<Exclude<SidebarCollectionId, "sessions">, ProjectNavigationItem>
> = Object.freeze({
  audio: {
    collectionId: "audio",
    detail: "Recordings, transcripts, and timeline",
    id: "project-audio",
    title: "Project Audio",
  },
  craft: {
    collectionId: "craft",
    detail: "Visual workspace and durable .ui package",
    id: "project-craft",
    title: "Project Canvas",
  },
  memory: {
    collectionId: "memory",
    detail: "Evidence, beliefs, recall, and decisions",
    id: "project-memory",
    title: "Project Memory",
  },
});

export const projectNavigationSections = (
  collectionId: SidebarCollectionId,
  activeThreadId: string | undefined,
  threads: readonly CuriosityThread[],
): readonly ProjectNavigationSection[] => {
  if (collectionId !== "sessions") {
    return [
      {
        data: [collectionLandingItems[collectionId]],
        title: "Current",
      },
    ];
  }

  const rows: readonly ProjectNavigationItem[] = [
    ...(activeThreadId
      ? []
      : [
          {
            detail: "Ready when you are",
            id: "new-session",
            title: "New Session",
          },
        ]),
    ...sortThreadsByRecency(threads).map((thread) => ({
      detail: `Session ${thread.sequence}  Durable conversation`,
      id: thread.threadId,
      threadId: thread.threadId,
      title: thread.title,
    })),
  ];

  return [
    { data: rows.slice(0, 3), title: "Today" },
    ...(rows.length > 3
      ? [{ data: rows.slice(3), title: "Previous Sessions" }]
      : []),
  ];
};
