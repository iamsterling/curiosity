import { Database } from "bun:sqlite";
import { createHash } from "node:crypto";
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
import { canonicalJson } from "../kernel/canonical-json.js";

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
const currentSchemaVersion = "15";
const supportedSchemaVersions = new Set(
  Array.from({ length: Number(currentSchemaVersion) }, (_, index) =>
    String(index + 1),
  ),
);

const migrateDelegationGroupCapacity = (database: Database): void => {
  const definition = database
    .query<{ sql: string | null }, [string]>(
      "SELECT sql FROM sqlite_master WHERE type = 'table' AND name = ?",
    )
    .get("delegation_groups")?.sql;
  if (!definition || !/expected_children\s+BETWEEN\s+1\s+AND\s+2/iu.test(definition))
    return;
  database.exec(`
    CREATE TABLE delegation_groups_v14 (
      delegation_group_id TEXT PRIMARY KEY,
      root_execution_id TEXT NOT NULL REFERENCES executions(execution_id),
      parent_execution_id TEXT NOT NULL REFERENCES executions(execution_id),
      parent_provider_action_id TEXT NOT NULL REFERENCES actions(action_id),
      expected_children INTEGER NOT NULL CHECK(expected_children BETWEEN 1 AND 4),
      status TEXT NOT NULL CHECK(status IN ('allocated', 'ready', 'delivered')),
      result_digest TEXT,
      allocated_at TEXT NOT NULL,
      ready_at TEXT,
      delivered_at TEXT
    ) STRICT;
    INSERT INTO delegation_groups_v14
      SELECT * FROM delegation_groups;
    DROP TABLE delegation_groups;
    ALTER TABLE delegation_groups_v14 RENAME TO delegation_groups;
  `);
};

const eventEnvelopeColumns = [
  ["event_schema_version", "INTEGER NOT NULL DEFAULT 1"],
  ["aggregate_version", "INTEGER NOT NULL DEFAULT 0"],
  ["causation_id", "TEXT NOT NULL DEFAULT ''"],
  ["correlation_id", "TEXT NOT NULL DEFAULT ''"],
  ["root_execution_id", "TEXT NOT NULL DEFAULT ''"],
  ["parent_execution_id", "TEXT NOT NULL DEFAULT ''"],
  ["child_execution_id", "TEXT NOT NULL DEFAULT ''"],
  ["contribution_id", "TEXT NOT NULL DEFAULT ''"],
  ["contribution_version", "TEXT NOT NULL DEFAULT '1'"],
  ["catalog_digest", "TEXT NOT NULL DEFAULT ''"],
] as const;

const migrateEventEnvelope = (database: Database, legacy: boolean): void => {
  database.exec(`
    DROP TRIGGER IF EXISTS events_no_update;
    DROP TRIGGER IF EXISTS events_no_delete;
  `);
  const columns = new Set(
    database
      .query<{ name: string }, []>("PRAGMA table_info(events)")
      .all()
      .map(({ name }) => name),
  );
  for (const [name, definition] of eventEnvelopeColumns)
    if (!columns.has(name))
      database.exec(`ALTER TABLE events ADD COLUMN ${name} ${definition}`);
  if (legacy)
    database.run("UPDATE events SET event_schema_version = 0");
  database.exec(`
    UPDATE events
    SET aggregate_version = (
      SELECT count(*) FROM events AS earlier
      WHERE earlier.stream_id = events.stream_id
        AND earlier.global_sequence <= events.global_sequence
    )
    WHERE aggregate_version = 0;
    UPDATE events
    SET causation_id = command_id WHERE causation_id = '';
    UPDATE events
    SET correlation_id = stream_id WHERE correlation_id = '';
    UPDATE events
    SET root_execution_id = stream_id WHERE root_execution_id = '';
    UPDATE events
    SET parent_execution_id = root_execution_id WHERE parent_execution_id = '';
    UPDATE events
    SET child_execution_id = root_execution_id WHERE child_execution_id = '';
    UPDATE events
    SET contribution_id = plugin_id WHERE contribution_id = '';
    UPDATE events
    SET catalog_digest = 'legacy:catalog-unbound' WHERE catalog_digest = '';
    CREATE UNIQUE INDEX IF NOT EXISTS events_aggregate_version_idx
      ON events(stream_id, aggregate_version);
    CREATE TRIGGER events_no_update BEFORE UPDATE ON events BEGIN
      SELECT RAISE(ABORT, 'EVENT_LOG_IMMUTABLE');
    END;
    CREATE TRIGGER events_no_delete BEFORE DELETE ON events BEGIN
      SELECT RAISE(ABORT, 'EVENT_LOG_IMMUTABLE');
    END;
  `);
};

const migrateSchema = (database: Database): void => {
  const metadata = database
    .query<{ value: string }, [string]>(
      "SELECT value FROM harness_metadata WHERE key = ?",
    )
    .get("schema_version");
  if (!supportedSchemaVersions.has(metadata?.value ?? ""))
    throw new Error("EVENT_SCHEMA_VERSION_UNSUPPORTED");
  migrateDelegationGroupCapacity(database);
  migrateEventEnvelope(database, metadata?.value !== currentSchemaVersion);
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
  requiredColumns("events", [
    "global_sequence",
    "event_id",
    "event_type",
    "stream_id",
    ...eventEnvelopeColumns.map(([name]) => name),
  ]);
  if (metadata?.value !== currentSchemaVersion)
    database.run(
      "UPDATE harness_metadata SET value = ? WHERE key = 'schema_version'",
      [currentSchemaVersion],
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

const verifyEventChain = (database: Database): void => {
  const emptyHash = "0".repeat(64);
  let previousHash = emptyHash;
  const rows = database
    .query<EventRow, []>("SELECT * FROM events ORDER BY global_sequence")
    .all();
  for (const row of rows) {
    if (
      row.previous_hash !== previousHash ||
      (row.event_schema_version !== 0 && row.event_schema_version !== 1)
    )
      throw new Error("EVENT_HASH_CHAIN_INVALID");
    const base = {
      actorId: row.actor_id,
      body: JSON.parse(row.body_json) as unknown,
      commandId: row.command_id,
      occurredAt: row.occurred_at,
      pluginId: row.plugin_id,
      previousHash: row.previous_hash,
      sequence: row.global_sequence,
      streamId: row.stream_id,
      type: row.event_type,
    };
    const hashInput =
      row.event_schema_version === 0
        ? base
        : {
            ...base,
            aggregateVersion: row.aggregate_version,
            catalogDigest: row.catalog_digest,
            causationId: row.causation_id,
            childExecutionId: row.child_execution_id,
            contributionId: row.contribution_id,
            contributionVersion: row.contribution_version,
            correlationId: row.correlation_id,
            eventSchemaVersion: row.event_schema_version,
            parentExecutionId: row.parent_execution_id,
            rootExecutionId: row.root_execution_id,
          };
    const eventHash = createHash("sha256")
      .update(canonicalJson(hashInput))
      .digest("hex");
    const eventId = createHash("sha256")
      .update(
        `${row.actor_id}:${row.command_id}:${
          row.global_sequence -
          (database
            .query<{ first_sequence: number }, [string, string]>(
              "SELECT first_sequence FROM command_admissions WHERE actor_id = ? AND command_id = ?",
            )
            .get(row.actor_id, row.command_id)?.first_sequence ??
            row.global_sequence)
        }:${eventHash}`,
      )
      .digest("hex");
    if (eventHash !== row.event_hash || eventId !== row.event_id)
      throw new Error("EVENT_HASH_CHAIN_INVALID");
    previousHash = row.event_hash;
  }
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

  static open(databasePath: string, catalogDigest = "0".repeat(64)): EventJournal {
    const database = new Database(databasePath, {
      create: true,
      readwrite: true,
      strict: true,
    });
    database.exec("PRAGMA journal_mode=WAL");
    database.exec("PRAGMA synchronous=FULL");
    // Table-rebuild migrations run atomically with foreign-key enforcement
    // disabled, then are checked before commit and re-enabled before use.
    database.exec("PRAGMA foreign_keys=OFF");
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
      if (!supportedSchemaVersions.has(preflight?.value ?? "")) {
        database.close(true);
        throw new Error("EVENT_SCHEMA_VERSION_UNSUPPORTED");
      }
    }
    try {
      database
        .transaction(() => {
          database.exec(eventSchema);
          database.run(
            "INSERT INTO harness_metadata(key,value) VALUES ('active_catalog_digest',?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
            [catalogDigest],
          );
          migrateSchema(database);
          verifyEventChain(database);
          if (
            database
              .query<Record<string, unknown>, []>("PRAGMA foreign_key_check")
              .all().length > 0
          )
            throw new Error("EVENT_SCHEMA_INTEGRITY_FAILED");
        })
        .immediate();
    } catch (error) {
      database.close(true);
      throw error;
    }
    database.exec("PRAGMA foreign_keys=ON");
    const metadata = database
      .query<{ value: string }, [string]>(
        "SELECT value FROM harness_metadata WHERE key = ?",
      )
      .get("schema_version");
    if (metadata?.value !== currentSchemaVersion) {
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
    this.#database.close(false);
  }
}
