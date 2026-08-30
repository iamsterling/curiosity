import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import type { CuriosityThread } from "../curiosity-client";
import { palette } from "../theme";
import {
  resolveNestedSidebarLayout,
  type SidebarNavigationLevel,
} from "./nested-sidebar-layout";

export interface SidebarOrganization {
  readonly detail: string;
  readonly id: string;
  readonly name: string;
}

const HeaderButton = ({
  label,
  onPress,
  symbol,
}: {
  readonly label: string;
  readonly onPress: () => void;
  readonly symbol: string;
}) => (
  <Pressable
    accessibilityLabel={label}
    accessibilityRole="button"
    hitSlop={6}
    onPress={onPress}
    style={({ pressed }) => [styles.headerButton, pressed && styles.pressed]}
  >
    <Text accessibilityElementsHidden style={styles.headerButtonSymbol}>
      {symbol}
    </Text>
  </Pressable>
);

const OrganizationSidebar = ({
  activeOrganizationId,
  contentVisible,
  onClose,
  onSelectOrganization,
  organizations,
}: {
  readonly activeOrganizationId: string;
  readonly contentVisible: boolean;
  readonly onClose: () => void;
  readonly onSelectOrganization: (organizationId: string) => void;
  readonly organizations: readonly SidebarOrganization[];
}) => (
  <View
    accessibilityLabel="Organizations"
    accessibilityRole="menu"
    style={styles.organizationSidebar}
  >
    <View style={styles.sidebarHeader}>
      <View style={styles.headerCopy}>
        <Text style={styles.eyebrow}>WORKSPACES</Text>
        <Text style={styles.sidebarTitle}>Organizations</Text>
      </View>
      {!contentVisible ? (
        <Pressable
          accessibilityLabel="Close organizations"
          accessibilityRole="button"
          onPress={onClose}
          style={({ pressed }) => [
            styles.doneButton,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.doneButtonText}>Done</Text>
        </Pressable>
      ) : null}
    </View>

    <View style={styles.organizationList}>
      {organizations.map((organization) => {
        const selected = organization.id === activeOrganizationId;
        return (
          <Pressable
            accessibilityHint="Shows this organization’s sessions."
            accessibilityLabel={`${organization.name}. ${organization.detail}.`}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            key={organization.id}
            onPress={() => onSelectOrganization(organization.id)}
            style={({ pressed }) => [
              styles.organizationRow,
              selected && styles.selectedRow,
              pressed && styles.pressed,
            ]}
          >
            <View style={styles.monogram}>
              <Text style={styles.monogramText}>
                {organization.name.slice(0, 1).toUpperCase()}
              </Text>
            </View>
            <View style={styles.rowCopy}>
              <Text style={styles.rowTitle}>{organization.name}</Text>
              <Text style={styles.rowDetail}>{organization.detail}</Text>
            </View>
            {selected ? (
              <Text accessibilityElementsHidden style={styles.selectedMark}>
                ✓
              </Text>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  </View>
);

const SessionSidebar = ({
  activeOrganization,
  activeThreadId,
  contentVisible,
  onClose,
  onNewThread,
  onOpenThread,
  onShowOrganizations,
  organizationsVisible,
  runtimeStatusLabel,
  threads,
}: {
  readonly activeOrganization?: SidebarOrganization;
  readonly activeThreadId?: string;
  readonly contentVisible: boolean;
  readonly onClose: () => void;
  readonly onNewThread: () => void;
  readonly onOpenThread: (threadId: string) => void;
  readonly onShowOrganizations: () => void;
  readonly organizationsVisible: boolean;
  readonly runtimeStatusLabel: string;
  readonly threads: readonly CuriosityThread[];
}) => (
  <View
    accessibilityLabel="Sessions"
    accessibilityRole="menu"
    style={styles.sessionSidebar}
  >
    <View style={styles.sidebarHeader}>
      {!organizationsVisible ? (
        <HeaderButton
          label="Show organizations"
          onPress={onShowOrganizations}
          symbol="‹"
        />
      ) : null}
      <View style={styles.headerCopy}>
        <Text style={styles.eyebrow}>
          {activeOrganization?.name ?? "WORKSPACE"}
        </Text>
        <Text style={styles.sidebarTitle}>Sessions</Text>
      </View>
      <HeaderButton label="New session" onPress={onNewThread} symbol="＋" />
      {!contentVisible ? (
        <Pressable
          accessibilityLabel="Close sessions"
          accessibilityRole="button"
          onPress={onClose}
          style={({ pressed }) => [
            styles.doneButton,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.doneButtonText}>Done</Text>
        </Pressable>
      ) : null}
    </View>

    <FlatList
      contentContainerStyle={
        threads.length === 0 ? styles.emptySessionList : styles.sessionList
      }
      data={threads}
      keyExtractor={({ threadId }) => threadId}
      ListEmptyComponent={
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No sessions yet</Text>
          <Text style={styles.emptyDetail}>
            Start a session to keep its objective and history together.
          </Text>
        </View>
      }
      renderItem={({ item }) => {
        const selected = item.threadId === activeThreadId;
        return (
          <Pressable
            accessibilityHint="Opens this session in the workspace."
            accessibilityLabel={`${item.title}. Session ${item.sequence}.`}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            onPress={() => onOpenThread(item.threadId)}
            style={({ pressed }) => [
              styles.sessionRow,
              selected && styles.selectedSessionRow,
              pressed && styles.pressed,
            ]}
          >
            <View style={styles.rowCopy}>
              <Text style={styles.rowTitle}>{item.title}</Text>
              <Text style={styles.rowDetail}>Session {item.sequence}</Text>
            </View>
            {selected ? (
              <View
                accessibilityElementsHidden
                style={styles.activeIndicator}
              />
            ) : null}
          </Pressable>
        );
      }}
      showsVerticalScrollIndicator={false}
      style={styles.threadList}
    />

    <View style={styles.statusBar}>
      <View accessibilityElementsHidden style={styles.statusDot} />
      <Text style={styles.statusText}>{runtimeStatusLabel}</Text>
    </View>
  </View>
);

export const NestedSidebar = ({
  activeOrganizationId,
  activeThreadId,
  children,
  navigationLevel,
  onNavigationLevelChange,
  onNewThread,
  onOpenThread,
  onSelectOrganization,
  organizations,
  runtimeStatusLabel,
  threads,
  width,
}: {
  readonly activeOrganizationId: string;
  readonly activeThreadId?: string;
  readonly children: React.ReactNode;
  readonly navigationLevel: SidebarNavigationLevel;
  readonly onNavigationLevelChange: (level: SidebarNavigationLevel) => void;
  readonly onNewThread: () => void;
  readonly onOpenThread: (threadId: string) => void;
  readonly onSelectOrganization: (organizationId: string) => void;
  readonly organizations: readonly SidebarOrganization[];
  readonly runtimeStatusLabel: string;
  readonly threads: readonly CuriosityThread[];
  readonly width: number;
}) => {
  const layout = resolveNestedSidebarLayout(width, navigationLevel);
  const activeOrganization = organizations.find(
    ({ id }) => id === activeOrganizationId,
  );
  const compact = width < 760;

  const selectOrganization = (organizationId: string) => {
    onSelectOrganization(organizationId);
    onNavigationLevelChange("sessions");
  };
  const newThread = () => {
    onNewThread();
    if (compact) onNavigationLevelChange("content");
  };
  const openThread = (threadId: string) => {
    onOpenThread(threadId);
    if (compact) onNavigationLevelChange("content");
  };

  return (
    <View style={styles.root}>
      {layout.organizations ? (
        <OrganizationSidebar
          activeOrganizationId={activeOrganizationId}
          contentVisible={layout.content}
          onClose={() => onNavigationLevelChange("content")}
          onSelectOrganization={selectOrganization}
          organizations={organizations}
        />
      ) : null}
      {layout.sessions ? (
        <SessionSidebar
          activeOrganization={activeOrganization}
          activeThreadId={activeThreadId}
          contentVisible={layout.content}
          onClose={() => onNavigationLevelChange("content")}
          onNewThread={newThread}
          onOpenThread={openThread}
          onShowOrganizations={() => onNavigationLevelChange("organizations")}
          organizationsVisible={layout.organizations}
          runtimeStatusLabel={runtimeStatusLabel}
          threads={threads}
        />
      ) : null}
      {layout.content ? <View style={styles.content}>{children}</View> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  activeIndicator: {
    alignSelf: "stretch",
    backgroundColor: palette.focus,
    borderRadius: 2,
    width: 3,
  },
  content: { flex: 1, minWidth: 0 },
  doneButton: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
    minWidth: 44,
    paddingHorizontal: 8,
  },
  doneButtonText: { color: palette.focus, fontSize: 14, fontWeight: "600" },
  emptyDetail: {
    color: palette.textMuted,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 6,
    maxWidth: 220,
    textAlign: "center",
  },
  emptySessionList: { flexGrow: 1 },
  emptyState: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    padding: 24,
  },
  emptyTitle: { color: palette.textSecondary, fontSize: 15, fontWeight: "600" },
  eyebrow: {
    color: palette.textMuted,
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1.1,
    textTransform: "uppercase",
  },
  headerButton: {
    alignItems: "center",
    borderRadius: 10,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  headerButtonSymbol: {
    color: palette.focus,
    fontSize: 28,
    fontWeight: "400",
    lineHeight: 30,
  },
  headerCopy: { flex: 1, gap: 2, minWidth: 0 },
  monogram: {
    alignItems: "center",
    backgroundColor: palette.focusQuiet,
    borderColor: palette.glassLine,
    borderRadius: 11,
    borderWidth: StyleSheet.hairlineWidth,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  monogramText: { color: palette.focus, fontSize: 14, fontWeight: "700" },
  organizationList: { gap: 5, padding: 10 },
  organizationRow: {
    alignItems: "center",
    borderRadius: 12,
    flexDirection: "row",
    gap: 11,
    minHeight: 58,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  organizationSidebar: {
    backgroundColor: palette.sidebar,
    borderRightColor: palette.line,
    borderRightWidth: StyleSheet.hairlineWidth,
    width: 230,
  },
  pressed: { opacity: 0.62 },
  root: { flex: 1, flexDirection: "row" },
  rowCopy: { flex: 1, gap: 3, minWidth: 0 },
  rowDetail: { color: palette.textMuted, fontSize: 11, lineHeight: 15 },
  rowTitle: {
    color: palette.textPrimary,
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 19,
  },
  selectedMark: { color: palette.focus, fontSize: 14, fontWeight: "700" },
  selectedRow: { backgroundColor: palette.focusQuiet },
  selectedSessionRow: {
    backgroundColor: palette.focusQuiet,
    paddingRight: 0,
  },
  sessionList: { gap: 4, padding: 10 },
  sessionRow: {
    alignItems: "center",
    borderRadius: 11,
    flexDirection: "row",
    gap: 10,
    minHeight: 58,
    overflow: "hidden",
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  sessionSidebar: {
    backgroundColor: palette.surfaceQuiet,
    borderRightColor: palette.line,
    borderRightWidth: StyleSheet.hairlineWidth,
    width: 300,
  },
  sidebarHeader: {
    alignItems: "center",
    borderBottomColor: palette.line,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    gap: 4,
    minHeight: 64,
    paddingHorizontal: 10,
  },
  sidebarTitle: {
    color: palette.textPrimary,
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: -0.35,
  },
  statusBar: {
    alignItems: "center",
    borderTopColor: palette.line,
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    gap: 8,
    minHeight: 42,
    paddingHorizontal: 15,
  },
  statusDot: {
    backgroundColor: palette.success,
    borderRadius: 3,
    height: 6,
    width: 6,
  },
  statusText: { color: palette.textMuted, flex: 1, fontSize: 10 },
  threadList: { flex: 1 },
});
