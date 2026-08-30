export interface WorkspaceProject {
  readonly id: string;
  readonly name: string;
  readonly organizationId: string;
}

export interface WorkspaceOrganization {
  readonly id: string;
  readonly name: string;
  readonly projects: readonly WorkspaceProject[];
}

export interface WorkspaceCatalogState {
  readonly activeOrganizationId: string;
  readonly organizations: readonly WorkspaceOrganization[];
}

export const defaultOrganizationId = "curiosity";
export const defaultProjectId = "curiosity";

export const initialWorkspaceCatalog: WorkspaceCatalogState = Object.freeze({
  activeOrganizationId: defaultOrganizationId,
  organizations: Object.freeze([
    {
      id: defaultOrganizationId,
      name: "Curiosity",
      projects: Object.freeze([
        {
          id: defaultProjectId,
          name: "Curiosity",
          organizationId: defaultOrganizationId,
        },
      ]),
    },
  ]),
});

export const findProject = (
  organizations: readonly WorkspaceOrganization[],
  projectId: string,
): WorkspaceProject | undefined =>
  organizations
    .flatMap(({ projects }) => projects)
    .find(({ id }) => id === projectId);
