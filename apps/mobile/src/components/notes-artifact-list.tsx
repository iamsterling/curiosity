import { Pressable, SectionList, Text, View } from "react-native";
import type { CuriosityThread } from "../curiosity-client";
import type { WorkspaceView } from "../workspace-types";
import { collectionTitle, type SidebarCollectionId } from "./notes-shell-model";
import { NotesHeaderButton } from "./notes-sidebar-controls";
import { artifactListStyles as styles } from "./notes-artifact-list.styles";

interface ArtifactRow {
  readonly detail: string;
  readonly id: string;
  readonly threadId?: string;
  readonly title: string;
}

const surfaceDetails: Readonly<Record<Exclude<WorkspaceView, "chat">, string>> = {
  audio: "Recording and transcription workspace",
  craft: "Native canvas document",
  issues: "Project issue board",
  memory: "Evidence and decisions",
  providers: "Model connections",
};

const recordsFor = (
  activeThreadId: string | undefined,
  threads: readonly CuriosityThread[],
  view: WorkspaceView,
): readonly ArtifactRow[] => {
  if (view !== "chat") {
    return [
      {
        detail: surfaceDetails[view],
        id: `surface:${view}`,
        title: collectionTitle(view),
      },
    ];
  }

  const rows = threads.map((thread) => ({
    detail: `Session ${thread.sequence}  Durable conversation`,
    id: thread.threadId,
    threadId: thread.threadId,
    title: thread.title,
  }));
  if (activeThreadId) return rows;
  return [
    {
      detail: "Ready when you are",
      id: "new-session",
      title: "New Session",
    },
    ...rows,
  ];
};

export const NotesArtifactList = ({
  activeCollectionId,
  activeThreadId,
  bottomInset,
  columnWidth,
  expanded,
  onManage,
  onNewThread,
  onOpenSurface,
  onOpenThread,
  onShowCollections,
  showCollectionsButton,
  threads,
  topInset,
  view,
}: {
  readonly activeCollectionId: SidebarCollectionId;
  readonly activeThreadId?: string;
  readonly bottomInset: number;
  readonly columnWidth: number;
  readonly expanded: boolean;
  readonly onManage: () => void;
  readonly onNewThread: () => void;
  readonly onOpenSurface: () => void;
  readonly onOpenThread: (threadId: string) => void;
  readonly onShowCollections: () => void;
  readonly showCollectionsButton: boolean;
  readonly threads: readonly CuriosityThread[];
  readonly topInset: number;
  readonly view: WorkspaceView;
}) => {
  const records = recordsFor(activeThreadId, threads, view);
  const sections = [
    { data: records.slice(0, 3), title: view === "chat" ? "Today" : "Workspace" },
    ...(records.length > 3
      ? [{ data: records.slice(3), title: "Previous Sessions" }]
      : []),
  ];
  const title = collectionTitle(activeCollectionId);

  const open = (record: ArtifactRow) => {
    if (record.threadId) return onOpenThread(record.threadId);
    if (record.id === "new-session") return onNewThread();
    onOpenSurface();
  };

  return (
    <View
      accessibilityLabel={`${title} list`}
      accessibilityRole="menu"
      style={[styles.list, { width: columnWidth }, expanded && styles.expanded]}
    >
      <View style={[styles.header, { paddingTop: topInset }]}>
        {showCollectionsButton ? (
          <View style={styles.backButton}>
            <NotesHeaderButton
              label="Show collections"
              onPress={onShowCollections}
              symbol="‹"
            />
          </View>
        ) : null}
        <View style={styles.headerCopy}>
          <Text numberOfLines={1} style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>
            {view === "chat"
              ? `${threads.length} ${threads.length === 1 ? "Session" : "Sessions"}`
              : "Curiosity Workspace"}
          </Text>
        </View>
        <NotesHeaderButton label="More options" onPress={onManage} symbol="•••" />
      </View>
      <SectionList
        contentContainerStyle={[styles.empty, { paddingBottom: bottomInset }]}
        keyExtractor={({ id }) => id}
        renderItem={({ item }) => {
          const selected = item.threadId
            ? item.threadId === activeThreadId
            : !activeThreadId || view !== "chat";
          return (
            <View style={styles.section}>
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected }}
                onPress={() => open(item)}
                style={({ pressed }) => [
                  styles.row,
                  selected && styles.selected,
                  pressed && { opacity: 0.55 },
                ]}
              >
                <Text numberOfLines={1} style={styles.rowTitle}>
                  {item.title}
                </Text>
                <Text numberOfLines={1} style={styles.detail}>
                  {item.detail}
                </Text>
              </Pressable>
            </View>
          );
        }}
        renderSectionHeader={({ section }) => (
          <Text style={styles.sectionHeader}>{section.title}</Text>
        )}
        sections={sections}
        showsVerticalScrollIndicator={false}
        stickySectionHeadersEnabled={false}
      />
    </View>
  );
};
