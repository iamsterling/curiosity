import type * as DashboardRuntime from "@curiosity/custom-harness/dashboard/node";

type DashboardRuntimeModule = typeof DashboardRuntime;

const dashboardRuntimeSpecifier =
  "@curiosity/custom-harness/dashboard/" + "node";

/**
 * The governed journal uses Bun's SQLite driver. Keep that runtime boundary
 * external to Next's Node-based build workers, then load it only when the Bun
 * dashboard server handles a request.
 */
export const loadDashboardKernel = async (): Promise<DashboardRuntimeModule> =>
  import(
    /* webpackIgnore: true */ dashboardRuntimeSpecifier
  ) as Promise<DashboardRuntimeModule>;
