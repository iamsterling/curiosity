import { DatabaseSync } from "node:sqlite";
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

export const readNodeThreadProjections = (
  databasePath: string,
): readonly ThreadProjection[] => {
  if (!path.isAbsolute(databasePath)) throw unavailable();

  let database: DatabaseSync | undefined;
  try {
    database = new DatabaseSync(databasePath, { readOnly: true });
    const metadata = database
      .prepare("SELECT value FROM harness_metadata WHERE key = ?")
      .get("schema_version") as MetadataRow | undefined;
    if (metadata?.value !== "1") throw unavailable();

    const events = database
      .prepare(
        "SELECT global_sequence,event_id,command_id,actor_id,plugin_id,event_type,stream_id,body_json,occurred_at,previous_hash,event_hash FROM events ORDER BY global_sequence",
      )
      .all() as unknown as EventRow[];
    return projectThreads(events.map(toStoredEvent));
  } catch {
    throw unavailable();
  } finally {
    database?.close();
  }
};
