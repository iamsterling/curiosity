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
    if (metadata?.value !== "1") throw unavailable();

    const events = database
      .query<EventRow, []>(
        "SELECT global_sequence,event_id,command_id,actor_id,plugin_id,event_type,stream_id,body_json,occurred_at,previous_hash,event_hash FROM events ORDER BY global_sequence",
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
