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
import { DelegationJournal } from "./delegation-journal.js";

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
const delegationRunSnapshotColumns = [
  ["budget_json", "TEXT NOT NULL DEFAULT '{}'"],
  ["resource_claims_json", "TEXT NOT NULL DEFAULT '{}'"],
  ["catalog_digest", "TEXT NOT NULL DEFAULT ''"],
] as const;

const migrateSchema = (database: Database): void => {
  const metadata = database
    .query<{ value: string }, [string]>(
      "SELECT value FROM harness_metadata WHERE key = ?",
    )
    .get("schema_version");
  if (!["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13"].includes(metadata?.value ?? ""))
    throw new Error("EVENT_SCHEMA_VERSION_UNSUPPORTED");
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
  const delegationRunColumns = new Set(
        database
          .query<{ name: string }, []>("PRAGMA table_info(agent_runs)")
          .all()
          .map(({ name }) => name),
      );
  for (const [name, definition] of delegationRunSnapshotColumns)
    if (!delegationRunColumns.has(name))
      database.exec(
        `ALTER TABLE agent_runs ADD COLUMN ${name} ${definition}`,
      );
  const requiredColumns = (
    table: string,
    required: readonly string[],
  ): void => {
    const actual = new Set(
      database
        .query<{ name: string }, []>(`PRAGMA table_info(${table})`)
        .all()
        .map(({ name }) => name),
    );
    if (required.some((name) => !actual.has(name)))
      throw new Error("EVENT_SCHEMA_SHAPE_INVALID");
  };
  requiredColumns("provider_calls", [
    "call_id",
    "action_id",
    "model_id",
    "request_digest",
    "source_revision",
    "status",
    "allocated_at",
    ...providerSnapshotColumns.map(([name]) => name),
  ]);
  requiredColumns("actions", [
    "action_id",
    "source_event_id",
    "action_type",
    "input_json",
    "input_digest",
    "requested_capabilities_json",
    "status",
    ...actionAuthorityColumns.map(([name]) => name),
  ]);
  requiredColumns("agent_runs", [
    "agent_run_id",
    "agent_session_id",
    "child_execution_id",
    "status",
    ...delegationRunSnapshotColumns.map(([name]) => name),
  ]);
  if (metadata?.value !== "13")
    database.run(
      "UPDATE harness_metadata SET value = '13' WHERE key = 'schema_version'",
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
  database.exec(`
        DROP TRIGGER IF EXISTS agent_run_snapshot_immutable;
        CREATE TRIGGER agent_run_snapshot_immutable
        BEFORE UPDATE ON agent_runs
        WHEN OLD.agent_session_id != NEW.agent_session_id
          OR OLD.delegation_group_id != NEW.delegation_group_id
          OR OLD.ordinal != NEW.ordinal
          OR OLD.child_execution_id != NEW.child_execution_id
          OR OLD.delegation_action_id != NEW.delegation_action_id
          OR OLD.provider_action_id != NEW.provider_action_id
          OR OLD.model_tool_call_id != NEW.model_tool_call_id
          OR OLD.task_json != NEW.task_json
          OR OLD.budget_json != NEW.budget_json
          OR OLD.resource_claims_json != NEW.resource_claims_json
          OR OLD.catalog_digest != NEW.catalog_digest
          OR OLD.created_at != NEW.created_at
        BEGIN
          SELECT RAISE(ABORT, 'AGENT_RUN_SNAPSHOT_IMMUTABLE');
        END;
      `);
};

export class EventJournal {
  readonly #database: Database;
  readonly actions: ActionJournal;
  readonly attempts: AttemptJournal;
  readonly delegations: DelegationJournal;
  readonly workflows: WorkflowJournal;

  private constructor(database: Database) {
    this.#database = database;
    this.actions = new ActionJournal(database);
    this.attempts = new AttemptJournal(database);
    this.delegations = new DelegationJournal(database);
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
    const hasMetadata =
      database
        .query<{ count: number }, []>(
          "SELECT count(*) AS count FROM sqlite_master WHERE type = 'table' AND name = 'harness_metadata'",
        )
        .get()?.count === 1;
    if (hasMetadata) {
      const preflight = database
        .query<{ value: string }, [string]>(
          "SELECT value FROM harness_metadata WHERE key = ?",
        )
        .get("schema_version");
      if (
        ![
          "1",
          "2",
          "3",
          "4",
          "5",
          "6",
          "7",
          "8",
          "9",
          "10",
          "11",
          "12",
          "13",
        ].includes(preflight?.value ?? "")
      ) {
        database.close(true);
        throw new Error("EVENT_SCHEMA_VERSION_UNSUPPORTED");
      }
    }
    try {
      database
        .transaction(() => {
          database.exec(eventSchema);
          migrateSchema(database);
        })
        .immediate();
    } catch (error) {
      database.close(true);
      throw error;
    }
    const metadata = database
      .query<{ value: string }, [string]>(
        "SELECT value FROM harness_metadata WHERE key = ?",
      )
      .get("schema_version");
    if (metadata?.value !== "13") {
      database.close(true);
      throw new Error("EVENT_SCHEMA_VERSION_UNSUPPORTED");
    }
    if (
      database.query<{ integrity_check: string }, []>("PRAGMA integrity_check").get()
        ?.integrity_check !== "ok" ||
      database
        .query<Record<string, unknown>, []>("PRAGMA foreign_key_check")
        .all().length > 0
    ) {
      database.close(true);
      throw new Error("EVENT_SCHEMA_INTEGRITY_FAILED");
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
