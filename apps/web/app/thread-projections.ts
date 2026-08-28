import type { ThreadProjection } from "@curiosity/custom-harness/thread-projections";

const dashboardRuntimeSpecifier =
  "@curiosity/custom-harness/dashboard/" + "node";

export type ThreadProjectionView = Readonly<{
  status: "available" | "unavailable" | "unconfigured";
  threads: readonly ThreadProjection[];
}>;

const empty = (status: "unavailable" | "unconfigured"): ThreadProjectionView =>
  Object.freeze({ status, threads: Object.freeze([]) });

export const loadThreadProjectionView =
  async (): Promise<ThreadProjectionView> => {
    if ("Bun" in globalThis) {
      try {
        const { readDashboardSession } = (await import(
          /* webpackIgnore: true */ dashboardRuntimeSpecifier
        )) as typeof import("@curiosity/custom-harness/dashboard/node");
        const { threads } = await readDashboardSession();
        return Object.freeze({ status: "available", threads });
      } catch {
        return empty("unavailable");
      }
    }

    const databasePath = process.env.CURIOSITY_DATABASE_PATH?.trim();
    if (!databasePath) return empty("unconfigured");

    try {
      const { readThreadProjections } =
        await import("@curiosity/custom-harness/thread-projections/node");
      return Object.freeze({
        status: "available",
        threads: readThreadProjections(databasePath),
      });
    } catch {
      return empty("unavailable");
    }
  };
