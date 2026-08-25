import {
  readThreadProjections,
  type ThreadProjection,
} from "@curiosity/custom-harness/thread-projections/node";

export type ThreadProjectionView = Readonly<{
  status: "available" | "unavailable" | "unconfigured";
  threads: readonly ThreadProjection[];
}>;

const empty = (status: "unavailable" | "unconfigured"): ThreadProjectionView =>
  Object.freeze({ status, threads: Object.freeze([]) });

export const loadThreadProjectionView =
  async (): Promise<ThreadProjectionView> => {
    const databasePath = process.env.CURIOSITY_DATABASE_PATH?.trim();
    if (!databasePath) return empty("unconfigured");

    try {
      return Object.freeze({
        status: "available",
        threads: readThreadProjections(databasePath),
      });
    } catch {
      return empty("unavailable");
    }
  };
