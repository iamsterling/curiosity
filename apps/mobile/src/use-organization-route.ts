import { useGlobalSearchParams } from "expo-router";
import { useEffect, useMemo } from "react";
import { useWorkspaceCatalog } from "./workspace-catalog-context";
import { routeIdForParam } from "./workspace-routes";

export const useOrganizationRoute = () => {
  const { organizationId: routeOrganizationId } = useGlobalSearchParams<{
    organizationId?: string | string[];
  }>();
  const catalog = useWorkspaceCatalog();
  const requestedOrganizationId = routeIdForParam(routeOrganizationId);
  const organization = useMemo(() => {
    const requested = catalog.organizations.find(
      ({ id }) => id === requestedOrganizationId,
    );
    return requested ?? catalog.activeOrganization ?? catalog.organizations[0];
  }, [catalog.activeOrganization, catalog.organizations, requestedOrganizationId]);

  useEffect(() => {
    if (!organization || organization.id === catalog.activeOrganizationId) return;
    catalog.selectOrganization(organization.id);
  }, [catalog, organization]);

  const projectIds = useMemo(
    () => organization?.projects.map(({ id }) => id) ?? [],
    [organization],
  );

  return {
    organization,
    organizationId: organization?.id ?? catalog.activeOrganizationId,
    projectIds,
  } as const;
};
