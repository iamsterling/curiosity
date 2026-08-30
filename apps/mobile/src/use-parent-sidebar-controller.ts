import { usePathname, useRouter } from "expo-router";
import { useCallback } from "react";
import { Alert } from "react-native";
import { useAppShell } from "./app-shell-context";
import { useCuriosityWorkspaceContext } from "./curiosity-workspace-context";
import { useProjectSessionIndex } from "./project-session-index-context";
import { useWorkspaceCatalog } from "./workspace-catalog-context";
import type { WorkspaceProject } from "./workspace-catalog";
import {
  organizationAgentsRoute,
  organizationRecentRoute,
  projectCollectionRoute,
} from "./workspace-routes";

const prompt = (
  title: string,
  message: string,
  onCreate: (name: string) => void,
) => {
  Alert.prompt(
    title,
    message,
    [
      { style: "cancel", text: "Cancel" },
      {
        onPress: (value?: string) => {
          const name = value?.trim();
          if (name) onCreate(name);
        },
        text: "Create",
      },
    ],
    "plain-text",
  );
};

export const useParentSidebarController = () => {
  const pathname = usePathname();
  const router = useRouter();
  const appShell = useAppShell();
  const catalog = useWorkspaceCatalog();
  const sessions = useProjectSessionIndex();
  const workspace = useCuriosityWorkspaceContext();
  const organizationThreads = sessions.threadsForProjects(
    catalog.activeOrganization?.projects.map(({ id }) => id) ?? [],
    workspace.state.threads,
  );

  const closeAndReplace = useCallback(
    (route: Parameters<typeof router.replace>[0]) => {
      appShell.closeParentSidebar();
      router.replace(route);
    },
    [appShell, router],
  );
  const navigateToProject = useCallback(
    (project: WorkspaceProject) => {
      if (catalog.activeOrganizationId !== project.organizationId)
        catalog.selectOrganization(project.organizationId);
      appShell.setNavigationLevel("artifacts");
      closeAndReplace(projectCollectionRoute(project.id, "sessions"));
    },
    [appShell, catalog, closeAndReplace],
  );
  const openProject = useCallback(
    (projectId: string) => {
      const project = catalog.project(projectId);
      if (project) navigateToProject(project);
    },
    [catalog, navigateToProject],
  );
  const selectOrganization = useCallback(
    (organizationId: string) => {
      const organization = catalog.organizations.find(
        ({ id }) => id === organizationId,
      );
      if (!organization) return;
      catalog.selectOrganization(organization.id);
      const project = organization.projects[0];
      if (project) {
        navigateToProject(project);
        return;
      }
      closeAndReplace(organizationRecentRoute(organization.id));
    },
    [catalog, closeAndReplace, navigateToProject],
  );
  return {
    activeOrganizationId: catalog.activeOrganizationId,
    agentsActive: pathname.endsWith("/agents"),
    close: appShell.closeParentSidebar,
    open: appShell.parentSidebarOpen,
    openSidebar: appShell.openParentSidebar,
    openAgents: () =>
      closeAndReplace(organizationAgentsRoute(catalog.activeOrganizationId)),
    openProject,
    openRecent: () =>
      closeAndReplace(organizationRecentRoute(catalog.activeOrganizationId)),
    openSettings: () => closeAndReplace("/settings"),
    organizations: catalog.organizations,
    projects: catalog.activeOrganization?.projects ?? [],
    promptForOrganization: () =>
      prompt(
        "New Organization",
        "Choose a name for this local organization.",
        catalog.addOrganization,
      ),
    promptForProject: () => {
      const organization = catalog.activeOrganization;
      if (!organization) return;
      prompt(
        "New Project",
        `Create a project in ${organization.name}.`,
        (name) => {
          const project = catalog.addProject(name);
          if (project) navigateToProject(project);
        },
      );
    },
    recentActive: pathname.endsWith("/recent"),
    selectOrganization,
    settingsActive: pathname.startsWith("/settings"),
    threadCount: organizationThreads.length,
  } as const;
};
