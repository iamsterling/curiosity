import { Pressable, Text, View } from "react-native";
import type {
  WorkspaceOrganization,
  WorkspaceProject,
} from "../workspace-catalog";
import { palette } from "../theme";
import {
  AppSidebarNavigationBody,
  AppSidebarNavigationDetail,
  AppSidebarNavigationFooter,
  AppSidebarNavigationGroupLabel,
  AppSidebarNavigationHeader,
  AppSidebarNavigationRoot,
  AppSidebarNavigationRow,
  AppSidebarNavigationRowCopy,
  AppSidebarNavigationSection,
  AppSidebarNavigationSectionMeta,
  AppSidebarNavigationSectionTitle,
  AppSidebarNavigationTitle,
  appSidebarNavigationStyles as styles,
} from "./app-sidebar-navigation-primitives";
import { OrganizationSelector } from "./organization-selector";
import {
  FolderGlyph,
  NotesHeaderButton,
  SmartGlyph,
} from "./notes-sidebar-controls";

interface ParentSidebarContentProps {
  readonly activeOrganizationId: string;
  readonly agentsActive: boolean;
  readonly bottomInset: number;
  readonly onAddOrganization: () => void;
  readonly onAddProject: () => void;
  readonly onClose: () => void;
  readonly onOpenAgents: () => void;
  readonly onOpenProject: (projectId: string) => void;
  readonly onOpenRecent: () => void;
  readonly onSelectOrganization: (organizationId: string) => void;
  readonly onSettings: () => void;
  readonly organizations: readonly WorkspaceOrganization[];
  readonly projects: readonly WorkspaceProject[];
  readonly recentActive: boolean;
  readonly settingsActive: boolean;
  readonly threadCount: number;
  readonly topInset: number;
}

const ProjectRow = ({
  onOpen,
  project,
}: {
  readonly onOpen: (projectId: string) => void;
  readonly project: WorkspaceProject;
}) => (
  <AppSidebarNavigationRow onPress={() => onOpen(project.id)}>
    <FolderGlyph />
    <AppSidebarNavigationRowCopy>
      <AppSidebarNavigationTitle numberOfLines={1}>
        {project.name}
      </AppSidebarNavigationTitle>
      <AppSidebarNavigationDetail>Project · 4 collections</AppSidebarNavigationDetail>
    </AppSidebarNavigationRowCopy>
    <Text accessibilityElementsHidden style={styles.disclosure}>›</Text>
  </AppSidebarNavigationRow>
);

const OrganizationDestination = ({
  color,
  detail,
  onPress,
  selected,
  symbol,
  title,
}: {
  readonly color: typeof palette.recentAccent;
  readonly detail: string;
  readonly onPress: () => void;
  readonly selected: boolean;
  readonly symbol: string;
  readonly title: string;
}) => (
  <AppSidebarNavigationRow selected={selected} onPress={onPress}>
    <SmartGlyph color={color} symbol={symbol} />
    <AppSidebarNavigationRowCopy>
      <AppSidebarNavigationTitle>{title}</AppSidebarNavigationTitle>
      <AppSidebarNavigationDetail>{detail}</AppSidebarNavigationDetail>
    </AppSidebarNavigationRowCopy>
  </AppSidebarNavigationRow>
);

export const ParentSidebarContent = ({
  activeOrganizationId,
  agentsActive,
  bottomInset,
  onAddOrganization,
  onAddProject,
  onClose,
  onOpenAgents,
  onOpenProject,
  onOpenRecent,
  onSelectOrganization,
  onSettings,
  organizations,
  projects,
  recentActive,
  settingsActive,
  threadCount,
  topInset,
}: ParentSidebarContentProps) => (
  <AppSidebarNavigationRoot
    accessibilityLabel="Organizations and projects"
    accessibilityRole="menu"
  >
    <AppSidebarNavigationHeader style={{ paddingTop: topInset }}>
      <View style={styles.organizationContext}>
        <Text style={styles.organizationEyebrow}>ORGANIZATION</Text>
        <OrganizationSelector
          activeOrganizationId={activeOrganizationId}
          onAddOrganization={onAddOrganization}
          onSelectOrganization={onSelectOrganization}
          organizations={organizations}
        />
      </View>
      <View style={styles.headerSpacer} />
      <NotesHeaderButton label="Close sidebar" onPress={onClose} symbol="×" />
    </AppSidebarNavigationHeader>

    <AppSidebarNavigationBody>
      <AppSidebarNavigationGroupLabel>ORGANIZATION OVERVIEW</AppSidebarNavigationGroupLabel>
      <OrganizationDestination
        color={palette.recentAccent}
        detail="Sessions across every project"
        onPress={onOpenRecent}
        selected={recentActive}
        symbol="◷"
        title="Recent"
      />
      <OrganizationDestination
        color={palette.agentsAccent}
        detail="Runs and agent activity"
        onPress={onOpenAgents}
        selected={agentsActive}
        symbol="◎"
        title="Activity"
      />
      <View style={styles.organizationCount}>
        <Text style={styles.organizationCountLabel}>RECENT SESSIONS</Text>
        <Text style={styles.count}>{threadCount}</Text>
      </View>

      <AppSidebarNavigationSection>
        <AppSidebarNavigationSectionTitle>
          Projects
        </AppSidebarNavigationSectionTitle>
        <AppSidebarNavigationSectionMeta>
          {projects.length} {projects.length === 1 ? "PROJECT" : "PROJECTS"}
        </AppSidebarNavigationSectionMeta>
        <Pressable
          accessibilityLabel="New project"
          accessibilityRole="button"
          hitSlop={8}
          onPress={onAddProject}
          style={styles.sectionAction}
        >
          <Text style={styles.sectionActionLabel}>＋</Text>
        </Pressable>
      </AppSidebarNavigationSection>
      {projects.map((project) => (
        <ProjectRow key={project.id} onOpen={onOpenProject} project={project} />
      ))}
      {projects.length === 0 ? (
        <Text style={styles.empty}>
          Create a project to organize sessions and canvases.
        </Text>
      ) : null}
    </AppSidebarNavigationBody>

    <AppSidebarNavigationFooter
      style={{ paddingBottom: Math.max(12, bottomInset) }}
    >
      <AppSidebarNavigationRow selected={settingsActive} onPress={onSettings}>
        <SmartGlyph color={palette.textMuted} symbol="⚙︎" />
        <AppSidebarNavigationRowCopy>
          <AppSidebarNavigationTitle>Settings</AppSidebarNavigationTitle>
          <AppSidebarNavigationDetail>
            Providers and workspace preferences
          </AppSidebarNavigationDetail>
        </AppSidebarNavigationRowCopy>
      </AppSidebarNavigationRow>
    </AppSidebarNavigationFooter>
  </AppSidebarNavigationRoot>
);
