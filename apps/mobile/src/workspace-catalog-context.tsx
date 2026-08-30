import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import {
  findProject,
  initialWorkspaceCatalog,
  type WorkspaceOrganization,
  type WorkspaceProject,
} from "./workspace-catalog";

const WorkspaceCatalogContext = createContext<WorkspaceCatalog | null>(null);

const localId = (): string => `local:${Date.now()}`;

export const WorkspaceCatalogProvider = ({
  children,
}: {
  readonly children: ReactNode;
}) => {
  const [state, setState] = useState(initialWorkspaceCatalog);
  const activeOrganization =
    state.organizations.find(({ id }) => id === state.activeOrganizationId) ??
    state.organizations[0];

  const addOrganization = useCallback((name: string): WorkspaceOrganization => {
    const organization = Object.freeze({
      id: localId(),
      name,
      projects: Object.freeze([]),
    });
    setState((current) => ({
      activeOrganizationId: organization.id,
      organizations: [...current.organizations, organization],
    }));
    return organization;
  }, []);

  const addProject = useCallback(
    (name: string): WorkspaceProject | undefined => {
      if (!activeOrganization) return undefined;
      const project = Object.freeze({
        id: localId(),
        name,
        organizationId: activeOrganization.id,
      });
      setState((current) => ({
        ...current,
        organizations: current.organizations.map((organization) =>
          organization.id === current.activeOrganizationId
            ? { ...organization, projects: [...organization.projects, project] }
            : organization,
        ),
      }));
      return project;
    },
    [activeOrganization],
  );

  const project = useCallback(
    (projectId: string): WorkspaceProject | undefined =>
      findProject(state.organizations, projectId),
    [state.organizations],
  );
  const selectOrganization = useCallback((organizationId: string) => {
    setState((current) => ({
      ...current,
      activeOrganizationId: organizationId,
    }));
  }, []);

  const value = useMemo(
    () => ({
      activeOrganization,
      activeOrganizationId: state.activeOrganizationId,
      addOrganization,
      addProject,
      organizations: state.organizations,
      project,
      selectOrganization,
    }),
    [
      activeOrganization,
      addOrganization,
      addProject,
      project,
      selectOrganization,
      state.activeOrganizationId,
      state.organizations,
    ],
  );

  return (
    <WorkspaceCatalogContext.Provider value={value}>
      {children}
    </WorkspaceCatalogContext.Provider>
  );
};

export const useWorkspaceCatalog = (): WorkspaceCatalog => {
  const catalog = useContext(WorkspaceCatalogContext);
  if (!catalog) throw new Error("WORKSPACE_CATALOG_CONTEXT_MISSING");
  return catalog;
};

export type WorkspaceCatalog = {
  readonly activeOrganization?: WorkspaceOrganization;
  readonly activeOrganizationId: string;
  readonly addOrganization: (name: string) => WorkspaceOrganization;
  readonly addProject: (name: string) => WorkspaceProject | undefined;
  readonly organizations: readonly WorkspaceOrganization[];
  readonly project: (projectId: string) => WorkspaceProject | undefined;
  readonly selectOrganization: (organizationId: string) => void;
};
