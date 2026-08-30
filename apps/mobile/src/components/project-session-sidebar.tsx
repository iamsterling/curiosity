import { SectionList, View } from "react-native";
import type { CuriosityThread } from "../curiosity-client";
import type { WorkspaceProject } from "../workspace-catalog";
import type { SidebarCollectionId } from "./notes-shell-model";
import { NotesHeaderButton } from "./notes-sidebar-controls";
import {
  ProjectSidebarDestination,
  ProjectSidebarDestinationLabel,
  ProjectSidebarDestinations,
  ProjectSidebarEyebrow,
  ProjectSidebarHeader,
  ProjectSidebarHeaderCopy,
  ProjectSidebarRoot,
  ProjectSidebarSectionTitle,
  ProjectSidebarSession,
  ProjectSidebarSessionDetail,
  ProjectSidebarSessionTitle,
  ProjectSidebarTitle,
  projectSidebarStyles as styles,
} from "./project-sidebar-primitives";

interface SessionRow {
  readonly detail: string;
  readonly id: string;
  readonly threadId?: string;
  readonly title: string;
}

const destinations: readonly {
  readonly id: SidebarCollectionId;
  readonly title: string;
}[] = [
  { id: "sessions", title: "Sessions" },
  { id: "craft", title: "Craft" },
  { id: "memory", title: "Memory" },
  { id: "audio", title: "Audio" },
];

const rowsFor = (
  activeThreadId: string | undefined,
  threads: readonly CuriosityThread[],
): readonly SessionRow[] => [
  ...(activeThreadId
    ? []
    : [{ detail: "Ready when you are", id: "new-session", title: "New Session" }]),
  ...threads.map((thread) => ({
    detail: `Session ${thread.sequence}  Durable conversation`,
    id: thread.threadId,
    threadId: thread.threadId,
    title: thread.title,
  })),
];

export const ProjectSessionSidebar = ({
  activeCollectionId,
  activeThreadId,
  bottomInset,
  expanded,
  onManage,
  onNewThread,
  onOpenParent,
  onOpenThread,
  onSelectCollection,
  project,
  threads,
  topInset,
  width,
}: {
  readonly activeCollectionId: SidebarCollectionId;
  readonly activeThreadId?: string;
  readonly bottomInset: number;
  readonly expanded: boolean;
  readonly onManage: () => void;
  readonly onNewThread: () => void;
  readonly onOpenParent: () => void;
  readonly onOpenThread: (threadId: string) => void;
  readonly onSelectCollection: (collectionId: SidebarCollectionId) => void;
  readonly project: WorkspaceProject;
  readonly threads: readonly CuriosityThread[];
  readonly topInset: number;
  readonly width: number;
}) => {
  const rows = rowsFor(activeThreadId, threads);
  const sections = [
    { data: rows.slice(0, 3), title: "Today" },
    ...(rows.length > 3
      ? [{ data: rows.slice(3), title: "Previous Sessions" }]
      : []),
  ];

  return (
    <ProjectSidebarRoot
      accessibilityLabel={`${project.name} sessions`}
      accessibilityRole="menu"
      style={[{ width }, expanded && styles.expanded]}
    >
      <ProjectSidebarHeader style={{ paddingTop: topInset }}>
        <NotesHeaderButton label="All projects" onPress={onOpenParent} symbol="‹" />
        <ProjectSidebarHeaderCopy>
          <ProjectSidebarTitle numberOfLines={1}>{project.name}</ProjectSidebarTitle>
          <ProjectSidebarEyebrow>PROJECT</ProjectSidebarEyebrow>
        </ProjectSidebarHeaderCopy>
        <NotesHeaderButton label="More options" onPress={onManage} symbol="•••" />
      </ProjectSidebarHeader>

      <SectionList
        contentContainerStyle={[styles.content, { paddingBottom: bottomInset }]}
        keyExtractor={({ id }) => id}
        ListHeaderComponent={(
          <ProjectSidebarDestinations>
            {destinations.map((destination) => (
              <ProjectSidebarDestination
                key={destination.id}
                onPress={() => onSelectCollection(destination.id)}
                selected={destination.id === activeCollectionId}
              >
                <ProjectSidebarDestinationLabel
                  numberOfLines={1}
                  selected={destination.id === activeCollectionId}
                >
                  {destination.title}
                </ProjectSidebarDestinationLabel>
              </ProjectSidebarDestination>
            ))}
          </ProjectSidebarDestinations>
        )}
        renderItem={({ item }) => {
          const selected = item.threadId
            ? item.threadId === activeThreadId
            : !activeThreadId && activeCollectionId === "sessions";
          return (
            <View style={styles.sessionGroup}>
              <ProjectSidebarSession
                onPress={() =>
                  item.threadId ? onOpenThread(item.threadId) : onNewThread()
                }
                selected={selected}
              >
                <ProjectSidebarSessionTitle numberOfLines={1}>
                  {item.title}
                </ProjectSidebarSessionTitle>
                <ProjectSidebarSessionDetail numberOfLines={1}>
                  {item.detail}
                </ProjectSidebarSessionDetail>
              </ProjectSidebarSession>
            </View>
          );
        }}
        renderSectionHeader={({ section }) => (
          <ProjectSidebarSectionTitle>{section.title}</ProjectSidebarSectionTitle>
        )}
        sections={sections}
        showsVerticalScrollIndicator={false}
        stickySectionHeadersEnabled={false}
      />
    </ProjectSidebarRoot>
  );
};
