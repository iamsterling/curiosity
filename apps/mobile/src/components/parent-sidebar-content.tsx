import { Pressable, Text, View } from "react-native";
import type {
  WorkspaceOrganization,
  WorkspaceProject,
} from "../workspace-catalog";
import { palette } from "../theme";
import {
  AppSidebarNavigationBody,
  AppSidebarNavigationFooter,
  AppSidebarNavigationHeader,
  AppSidebarNavigationLabel,
  AppSidebarNavigationRoot,
  AppSidebarNavigationRow,
  AppSidebarNavigationSection,
  AppSidebarNavigationSectionTitle,
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
    <AppSidebarNavigationLabel numberOfLines={1}>
      {project.name}
    </AppSidebarNavigationLabel>
    <Text accessibilityElementsHidden style={styles.disclosure}>›</Text>
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
      <OrganizationSelector
        activeOrganizationId={activeOrganizationId}
        onAddOrganization={onAddOrganization}
        onSelectOrganization={onSelectOrganization}
        organizations={organizations}
      />
      <View style={styles.headerSpacer} />
      <NotesHeaderButton label="Close sidebar" onPress={onClose} symbol="×" />
    </AppSidebarNavigationHeader>

    <AppSidebarNavigationBody>
      <AppSidebarNavigationRow selected={recentActive} onPress={onOpenRecent}>
        <SmartGlyph color={palette.recentAccent} symbol="◷" />
        <AppSidebarNavigationLabel>Recent</AppSidebarNavigationLabel>
        <Text style={styles.count}>{threadCount}</Text>
      </AppSidebarNavigationRow>
      <AppSidebarNavigationRow selected={agentsActive} onPress={onOpenAgents}>
        <SmartGlyph color={palette.agentsAccent} symbol="◎" />
        <AppSidebarNavigationLabel>Agents</AppSidebarNavigationLabel>
      </AppSidebarNavigationRow>

      <AppSidebarNavigationSection>
        <AppSidebarNavigationSectionTitle>
          Projects
        </AppSidebarNavigationSectionTitle>
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
        <AppSidebarNavigationLabel>Settings</AppSidebarNavigationLabel>
      </AppSidebarNavigationRow>
    </AppSidebarNavigationFooter>
  </AppSidebarNavigationRoot>
);
