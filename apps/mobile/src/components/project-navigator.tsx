import { SectionList, View } from "react-native";
import type { CuriosityThread } from "../curiosity-client";
import { projectNavigationSections } from "../project-navigation-model";
import { palette } from "../theme";
import type { WorkspaceProject } from "../workspace-catalog";
import {
  collectionTitle,
  type SidebarCollectionId,
} from "./notes-shell-model";
import { NotesHeaderButton, SmartGlyph } from "./notes-sidebar-controls";
import {
  ProjectSidebarDestination,
  ProjectSidebarDestinationCopy,
  ProjectSidebarDestinationDetail,
  ProjectSidebarDestinationLabel,
  ProjectSidebarDestinations,
  ProjectSidebarEyebrow,
  ProjectSidebarHeader,
  ProjectSidebarHeaderCopy,
  ProjectSidebarItem,
  ProjectSidebarItemDetail,
  ProjectSidebarItemScope,
  ProjectSidebarItemScopeTitle,
  ProjectSidebarItemTitle,
  ProjectSidebarRoot,
  ProjectSidebarSectionTitle,
  ProjectSidebarTitle,
  projectSidebarStyles as styles,
} from "./project-sidebar-primitives";

const destinations: readonly {
  readonly color: typeof palette.focus;
  readonly detail: string;
  readonly id: SidebarCollectionId;
  readonly symbol: string;
  readonly title: string;
}[] = [
  {
    color: palette.focus,
    detail: "Conversations and active work",
    id: "sessions",
    symbol: "≡",
    title: "Sessions",
  },
  {
    color: palette.notesAccent,
    detail: "Canvas and durable .ui package",
    id: "craft",
    symbol: "◇",
    title: "Craft",
  },
  {
    color: palette.agentsAccent,
    detail: "Evidence, recall, and decisions",
    id: "memory",
    symbol: "◎",
    title: "Memory",
  },
  {
    color: palette.captureAccent,
    detail: "Recordings and transcripts",
    id: "audio",
    symbol: "♪",
    title: "Audio",
  },
];

export const ProjectNavigator = ({
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
  const sections = projectNavigationSections(
    activeCollectionId,
    activeThreadId,
    threads,
  );

  return (
    <ProjectSidebarRoot
      accessibilityLabel={`${project.name} project navigator`}
      accessibilityRole="menu"
      style={[{ width }, expanded && styles.expanded]}
    >
      <ProjectSidebarHeader style={{ paddingTop: topInset }}>
        <NotesHeaderButton label="All projects" onPress={onOpenParent} symbol="‹" />
        <ProjectSidebarHeaderCopy>
          <ProjectSidebarTitle numberOfLines={1}>{project.name}</ProjectSidebarTitle>
          <ProjectSidebarEyebrow>
            PROJECT · {collectionTitle(activeCollectionId).toUpperCase()}
          </ProjectSidebarEyebrow>
        </ProjectSidebarHeaderCopy>
        <NotesHeaderButton label="More options" onPress={onManage} symbol="•••" />
      </ProjectSidebarHeader>

      <SectionList
        contentContainerStyle={[styles.content, { paddingBottom: bottomInset }]}
        keyExtractor={({ id }) => id}
        ListHeaderComponent={(
          <View>
            <ProjectSidebarSectionTitle>COLLECTIONS</ProjectSidebarSectionTitle>
            <ProjectSidebarDestinations>
              {destinations.map((destination) => (
                <ProjectSidebarDestination
                  key={destination.id}
                  onPress={() => onSelectCollection(destination.id)}
                  selected={destination.id === activeCollectionId}
                >
                  <SmartGlyph color={destination.color} symbol={destination.symbol} />
                  <ProjectSidebarDestinationCopy>
                    <ProjectSidebarDestinationLabel
                      numberOfLines={1}
                      selected={destination.id === activeCollectionId}
                    >
                      {destination.title}
                    </ProjectSidebarDestinationLabel>
                    <ProjectSidebarDestinationDetail numberOfLines={1}>
                      {destination.detail}
                    </ProjectSidebarDestinationDetail>
                  </ProjectSidebarDestinationCopy>
                </ProjectSidebarDestination>
              ))}
            </ProjectSidebarDestinations>
            <ProjectSidebarItemScope>
              <ProjectSidebarEyebrow>ITEMS</ProjectSidebarEyebrow>
              <ProjectSidebarItemScopeTitle>
                {collectionTitle(activeCollectionId)}
              </ProjectSidebarItemScopeTitle>
            </ProjectSidebarItemScope>
          </View>
        )}
        renderItem={({ item }) => {
          const selected = item.threadId
            ? item.threadId === activeThreadId
            : item.collectionId === activeCollectionId ||
              (!activeThreadId && activeCollectionId === "sessions");
          return (
            <View style={styles.itemGroup}>
              <ProjectSidebarItem
                onPress={() => {
                  if (item.threadId) {
                    onOpenThread(item.threadId);
                    return;
                  }
                  if (item.collectionId) {
                    onSelectCollection(item.collectionId);
                    return;
                  }
                  onNewThread();
                }}
                selected={selected}
              >
                <ProjectSidebarItemTitle numberOfLines={1}>
                  {item.title}
                </ProjectSidebarItemTitle>
                <ProjectSidebarItemDetail numberOfLines={1}>
                  {item.detail}
                </ProjectSidebarItemDetail>
              </ProjectSidebarItem>
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
