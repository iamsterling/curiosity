import { Database } from "bun:sqlite";
import type { StoredEvent } from "../domain/event.js";
import { ActionJournal } from "./action-journal.js";
import { AttemptJournal } from "./attempt-journal.js";
import {
  admitInTransaction,
  type AdmissionInput,
  type AdmissionResult,
} from "./event-append.js";
import { toStoredEvent, type EventRow } from "./event-record.js";
import { eventSchema } from "./event-schema.js";
import { WorkflowJournal } from "./workflow-journal.js";

export type { AdmissionInput, AdmissionResult } from "./event-append.js";

const providerSnapshotColumns = [
  ["attempt_id", "TEXT"],
  ["generation", "INTEGER NOT NULL DEFAULT 0"],
  ["purpose", "TEXT NOT NULL DEFAULT 'normal'"],
  ["catalog_digest", "TEXT NOT NULL DEFAULT ''"],
  ["prompt_snapshot_digest", "TEXT NOT NULL DEFAULT ''"],
  ["prompt_snapshot_json", "TEXT NOT NULL DEFAULT '{}'"],
  ["source_revision", "INTEGER NOT NULL DEFAULT 0"],
  ["dispatch_state", "TEXT NOT NULL DEFAULT 'armed'"],
  ["dispatched_at", "TEXT"],
  ["usage_state", "TEXT NOT NULL DEFAULT 'UNKNOWN'"],
  ["usage_json", "TEXT"],
  ["delivery_certainty", "TEXT NOT NULL DEFAULT 'NOT_DISPATCHED'"],
] as const;
const actionAuthorityColumns = [
  ["execution_id", "TEXT NOT NULL DEFAULT ''"],
  ["resource", "TEXT NOT NULL DEFAULT ''"],
  ["gate_class", "TEXT NOT NULL DEFAULT 'none-requested'"],
  ["deadline_class", "TEXT NOT NULL DEFAULT 'interactive'"],
] as const;

const migrateSchema = (database: Database): void => {
  const metadata = database
    .query<{ value: string }, [string]>(
      "SELECT value FROM harness_metadata WHERE key = ?",
    )
    .get("schema_version");
  if (!["1", "2", "3", "4", "5", "6", "7", "8"].includes(metadata?.value ?? ""))
    throw new Error("EVENT_SCHEMA_VERSION_UNSUPPORTED");
  database
    .transaction(() => {
      const columns = new Set(
        database
          .query<{ name: string }, []>("PRAGMA table_info(provider_calls)")
          .all()
          .map(({ name }) => name),
      );
      for (const [name, definition] of providerSnapshotColumns)
        if (!columns.has(name))
          database.exec(
            `ALTER TABLE provider_calls ADD COLUMN ${name} ${definition}`,
          );
      const actionColumns = new Set(
        database
          .query<{ name: string }, []>("PRAGMA table_info(actions)")
          .all()
          .map(({ name }) => name),
      );
      for (const [name, definition] of actionAuthorityColumns)
        if (!actionColumns.has(name))
          database.exec(`ALTER TABLE actions ADD COLUMN ${name} ${definition}`);
      if (metadata?.value !== "8")
        database.run(
          "UPDATE harness_metadata SET value = '8' WHERE key = 'schema_version'",
        );
      database.exec(`
        DROP TRIGGER IF EXISTS provider_call_snapshot_immutable;
        CREATE TRIGGER provider_call_snapshot_immutable
        BEFORE UPDATE ON provider_calls
        WHEN OLD.action_id != NEW.action_id
          OR OLD.model_id != NEW.model_id
          OR OLD.request_digest != NEW.request_digest
          OR OLD.attempt_id IS NOT NEW.attempt_id
          OR OLD.generation != NEW.generation
          OR OLD.purpose != NEW.purpose
          OR OLD.catalog_digest != NEW.catalog_digest
          OR OLD.prompt_snapshot_digest != NEW.prompt_snapshot_digest
          OR OLD.prompt_snapshot_json != NEW.prompt_snapshot_json
          OR OLD.source_revision != NEW.source_revision
        BEGIN
          SELECT RAISE(ABORT, 'PROVIDER_CALL_SNAPSHOT_IMMUTABLE');
        END;
      `);
      database.exec(`
        DROP TRIGGER IF EXISTS tool_call_snapshot_immutable;
        CREATE TRIGGER tool_call_snapshot_immutable
        BEFORE UPDATE ON tool_calls
        WHEN OLD.action_id != NEW.action_id
          OR OLD.attempt_id != NEW.attempt_id
          OR OLD.generation != NEW.generation
          OR OLD.tool_name != NEW.tool_name
          OR OLD.tool_version != NEW.tool_version
          OR OLD.model_tool_call_id != NEW.model_tool_call_id
          OR OLD.request_digest != NEW.request_digest
          OR OLD.catalog_digest != NEW.catalog_digest
        BEGIN
          SELECT RAISE(ABORT, 'TOOL_CALL_SNAPSHOT_IMMUTABLE');
        END;
      `);
    })
    .immediate();
};

export class EventJournal {
  readonly #database: Database;
  readonly actions: ActionJournal;
  readonly attempts: AttemptJournal;
  readonly workflows: WorkflowJournal;

  private constructor(database: Database) {
    this.#database = database;
    this.actions = new ActionJournal(database);
    this.attempts = new AttemptJournal(database);
    this.workflows = new WorkflowJournal(database);
  }

  static open(databasePath: string): EventJournal {
    const database = new Database(databasePath, {
      create: true,
      readwrite: true,
      strict: true,
    });
    database.exec("PRAGMA journal_mode=WAL");
    database.exec("PRAGMA synchronous=FULL");
    database.exec("PRAGMA foreign_keys=ON");
    database.exec("PRAGMA busy_timeout=5000");
    database.exec("PRAGMA trusted_schema=OFF");
    database.exec(eventSchema);
    migrateSchema(database);
    const metadata = database
      .query<{ value: string }, [string]>(
        "SELECT value FROM harness_metadata WHERE key = ?",
      )
      .get("schema_version");
    if (metadata?.value !== "8") {
      database.close(true);
      throw new Error("EVENT_SCHEMA_VERSION_UNSUPPORTED");
    }
    return new EventJournal(database);
  }

  admit(input: AdmissionInput): AdmissionResult {
    return this.#database
      .transaction(() => admitInTransaction(this.#database, input))
      .immediate();
  }

  readEvents(): readonly StoredEvent[] {
    return this.#database
      .query<EventRow, []>("SELECT * FROM events ORDER BY global_sequence")
      .all()
      .map(toStoredEvent);
  }

  close(): void {
    Bun.gc(true);
    this.#database.close(true);
  }
}
