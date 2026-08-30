import { StyleSheet, View } from "react-native";
import type { CuriosityThread } from "../curiosity-client";
import { NotesArtifactList } from "./notes-artifact-list";
import {
  collectionView,
  type SidebarCollectionId,
} from "./notes-shell-model";
import { NotesSourceSidebar } from "./notes-source-sidebar";
import {
  resolveNestedSidebarColumnWidths,
  resolveNestedSidebarLayout,
  type SidebarNavigationLevel,
} from "./nested-sidebar-layout";

export const NestedSidebar = ({
  activeCollectionId,
  activeThreadId,
  bottomInset,
  children,
  navigationLevel,
  onManage,
  onNavigationLevelChange,
  onNewThread,
  onOpenThread,
  onSelectCollection,
  threads,
  topInset,
  width,
}: {
  readonly activeCollectionId: SidebarCollectionId;
  readonly activeThreadId?: string;
  readonly bottomInset: number;
  readonly children: React.ReactNode;
  readonly navigationLevel: SidebarNavigationLevel;
  readonly onManage: () => void;
  readonly onNavigationLevelChange: (level: SidebarNavigationLevel) => void;
  readonly onNewThread: () => void;
  readonly onOpenThread: (threadId: string) => void;
  readonly onSelectCollection: (id: SidebarCollectionId) => void;
  readonly threads: readonly CuriosityThread[];
  readonly topInset: number;
  readonly width: number;
}) => {
  const layout = resolveNestedSidebarLayout(width, navigationLevel);
  const columnWidths = resolveNestedSidebarColumnWidths(width);
  const compact = width < 700;
  const selectCollection = (collectionId: SidebarCollectionId) => {
    onSelectCollection(collectionId);
    onNavigationLevelChange("artifacts");
  };
  const showContent = (action: () => void) => {
    action();
    if (compact) onNavigationLevelChange("content");
  };

  return (
    <View style={styles.root}>
      {layout.source ? (
        <NotesSourceSidebar
          activeCollectionId={activeCollectionId}
          bottomInset={bottomInset}
          columnWidth={columnWidths.source}
          expanded={!layout.artifacts && !layout.content}
          onClose={() => onNavigationLevelChange("artifacts")}
          onManage={onManage}
          onNewThread={() => showContent(onNewThread)}
          onSelectCollection={selectCollection}
          threadCount={threads.length}
          topInset={topInset}
        />
      ) : null}
      {layout.artifacts ? (
        <NotesArtifactList
          activeCollectionId={activeCollectionId}
          activeThreadId={activeThreadId}
          bottomInset={bottomInset}
          columnWidth={columnWidths.artifacts}
          expanded={!layout.content}
          onManage={onManage}
          onNewThread={() => showContent(onNewThread)}
          onOpenSurface={() => showContent(() => undefined)}
          onOpenThread={(threadId) => showContent(() => onOpenThread(threadId))}
          onShowCollections={() => onNavigationLevelChange("collections")}
          showCollectionsButton={!layout.source}
          threads={threads}
          topInset={topInset}
          view={collectionView(activeCollectionId)}
        />
      ) : null}
      {layout.content ? <View style={styles.content}>{children}</View> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  content: { flex: 1, minWidth: 0 },
  root: { flex: 1, flexDirection: "row" },
});
