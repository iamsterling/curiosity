import { Database } from "bun:sqlite";
import path from "node:path";
import {
  projectThreads,
  type ThreadProjection,
} from "../projection/thread-projection.js";
import { toStoredEvent, type EventRow } from "./event-record.js";

interface MetadataRow {
  readonly value: string;
}

const unavailable = (): Error => new Error("THREAD_PROJECTION_UNAVAILABLE");

export const readThreadProjections = (
  databasePath: string,
): readonly ThreadProjection[] => {
  if (!path.isAbsolute(databasePath)) throw unavailable();

  let database: Database | undefined;
  try {
    database = new Database(databasePath, {
      readonly: true,
      strict: true,
    });
    const metadata = database
      .query<MetadataRow, [string]>(
        "SELECT value FROM harness_metadata WHERE key = ?",
      )
      .get("schema_version");
    if (metadata?.value !== "15") throw unavailable();

    const events = database
      .query<EventRow, []>(
        "SELECT * FROM events ORDER BY global_sequence",
      )
      .all()
      .map(toStoredEvent);
    return projectThreads(events);
  } catch {
    throw unavailable();
  } finally {
    database?.close(false);
  }
};
