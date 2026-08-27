import { afterEach, describe, expect, test } from "bun:test";
import { Database } from "bun:sqlite";
import { createHash } from "node:crypto";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { canonicalJson } from "../src/kernel/canonical-json.js";
import { EventJournal } from "../src/storage/event-journal.js";
import { readThreadProjections } from "../src/storage/thread-projection-reader.js";

const roots: string[] = [];
const digest = (value: string) =>
  createHash("sha256").update(value).digest("hex");

const fixture = () => {
  const root = mkdtempSync(path.join(tmpdir(), "curiosity-schema-"));
  roots.push(root);
  return path.join(root, "events.sqlite");
};

afterEach(() => {
  for (const root of roots.splice(0))
    rmSync(root, { force: true, recursive: true });
});

describe("atomic schema migration", () => {
  test("upgrades a supported prior version while preserving canonical event identity", () => {
    const databasePath = fixture();
    const journal = EventJournal.open(databasePath);
    journal.admit({
      acceptedAt: "2026-08-26T00:00:00.000Z",
      actorId: "local-owner",
      commandDigest: digest("migration-command"),
      commandId: "migration-command",
      events: [
        {
          body: { schemaVersion: 1, value: "preserved" },
          streamId: "migration-stream",
          type: "migration.fixture",
        },
      ],
      nonce: "migration-nonce",
      pluginId: "curiosity.test.migration",
    });
    const legacyEventHash = createHash("sha256")
      .update(
        canonicalJson({
          actorId: "local-owner",
          body: { schemaVersion: 1, value: "preserved" },
          commandId: "migration-command",
          occurredAt: "2026-08-26T00:00:00.000Z",
          pluginId: "curiosity.test.migration",
          previousHash: "0".repeat(64),
          sequence: 1,
          streamId: "migration-stream",
          type: "migration.fixture",
        }),
      )
      .digest("hex");
    const legacyEventId = createHash("sha256")
      .update(`local-owner:migration-command:0:${legacyEventHash}`)
      .digest("hex");
    journal.close();

    const legacy = new Database(databasePath, { readwrite: true, strict: true });
    legacy.exec(`
      DROP INDEX events_aggregate_version_idx;
      DROP TRIGGER events_no_update;
      DROP TRIGGER events_no_delete;
      UPDATE events
        SET event_hash = '${legacyEventHash}', event_id = '${legacyEventId}';
      CREATE TABLE events_v14 (
        global_sequence INTEGER PRIMARY KEY,
        event_id TEXT NOT NULL UNIQUE,
        command_id TEXT NOT NULL,
        actor_id TEXT NOT NULL,
        plugin_id TEXT NOT NULL,
        event_type TEXT NOT NULL,
        stream_id TEXT NOT NULL,
        body_json TEXT NOT NULL,
        occurred_at TEXT NOT NULL,
        previous_hash TEXT NOT NULL,
        event_hash TEXT NOT NULL UNIQUE
      ) STRICT;
      INSERT INTO events_v14
        SELECT global_sequence,event_id,command_id,actor_id,plugin_id,event_type,
          stream_id,body_json,occurred_at,previous_hash,event_hash
        FROM events;
      DROP TABLE events;
      ALTER TABLE events_v14 RENAME TO events;
      UPDATE harness_metadata SET value = '14' WHERE key = 'schema_version';
      DROP TABLE questions;
      DROP TABLE resource_leases;
    `);
    legacy.close(true);

    const migrated = EventJournal.open(databasePath);
    expect(migrated.readEvents()[0]).toMatchObject({
      aggregateVersion: 1,
      catalogDigest: "legacy:catalog-unbound",
      causationId: "migration-command",
      childExecutionId: "migration-stream",
      contributionId: "curiosity.test.migration",
      contributionVersion: "1",
      correlationId: "migration-stream",
      eventHash: legacyEventHash,
      eventSchemaVersion: 0,
      parentExecutionId: "migration-stream",
      rootExecutionId: "migration-stream",
    });
    migrated.close();
    expect(readThreadProjections(databasePath)).toEqual([]);
    const database = new Database(databasePath, { readonly: true, strict: true });
    expect(
      database
        .query<{ value: string }, [string]>(
          "SELECT value FROM harness_metadata WHERE key = ?",
        )
        .get("schema_version")?.value,
    ).toBe("15");
    expect(
      database
        .query<{ count: number }, []>(
          "SELECT count(*) AS count FROM sqlite_master WHERE type = 'table' AND name IN ('questions','resource_leases')",
        )
        .get()?.count,
    ).toBe(2);
    expect(
      database
        .query<{ sql: string }, [string]>(
          "SELECT sql FROM sqlite_master WHERE type = 'table' AND name = ?",
        )
        .get("delegation_groups")?.sql,
    ).toMatch(/expected_children\s+BETWEEN\s+1\s+AND\s+4/iu);
    database.close();
  });

  test("rejects an unknown version before creating missing current tables", () => {
    const databasePath = fixture();
    const journal = EventJournal.open(databasePath);
    journal.close();
    const unknown = new Database(databasePath, { readwrite: true, strict: true });
    unknown.exec("DROP TABLE questions;");
    unknown.run(
      "UPDATE harness_metadata SET value = '999' WHERE key = 'schema_version'",
    );
    unknown.close(true);

    expect(() => EventJournal.open(databasePath)).toThrow(
      "EVENT_SCHEMA_VERSION_UNSUPPORTED",
    );
    const database = new Database(databasePath, { readonly: true, strict: true });
    expect(
      database
        .query<{ value: string }, [string]>(
          "SELECT value FROM harness_metadata WHERE key = ?",
        )
        .get("schema_version")?.value,
    ).toBe("999");
    expect(
      database
        .query<{ count: number }, []>(
          "SELECT count(*) AS count FROM sqlite_master WHERE type = 'table' AND name = 'questions'",
        )
        .get()?.count,
    ).toBe(0);
    database.close();
  });

  test("rejects a current envelope whose hash-bound lineage was altered", () => {
    const databasePath = fixture();
    const journal = EventJournal.open(databasePath);
    journal.admit({
      acceptedAt: "2026-08-26T00:00:00.000Z",
      actorId: "local-owner",
      commandDigest: digest("tamper-command"),
      commandId: "tamper-command",
      events: [
        {
          body: { schemaVersion: 1, turnId: "tamper-turn" },
          streamId: "tamper-stream",
          type: "tamper.fixture",
        },
      ],
      nonce: "tamper-nonce",
      pluginId: "curiosity.test.tamper",
    });
    journal.close();
    const database = new Database(databasePath, {
      readwrite: true,
      strict: true,
    });
    database.exec("DROP TRIGGER events_no_update");
    database.run(
      "UPDATE events SET event_schema_version = 99, root_execution_id = 'forged-root' WHERE global_sequence = 1",
    );
    database.close();
    expect(() => readThreadProjections(databasePath)).toThrow(
      "THREAD_PROJECTION_UNAVAILABLE",
    );
    expect(() => EventJournal.open(databasePath)).toThrow(
      "EVENT_HASH_CHAIN_INVALID",
    );
  });

  test("rolls back all DDL when a known-version malformed fixture cannot migrate", () => {
    const databasePath = fixture();
    const malformed = new Database(databasePath, {
      create: true,
      readwrite: true,
      strict: true,
    });
    malformed.exec(`
      CREATE TABLE harness_metadata (key TEXT PRIMARY KEY, value TEXT NOT NULL) STRICT;
      INSERT INTO harness_metadata(key,value) VALUES ('schema_version','1');
      CREATE TABLE provider_calls (bad TEXT) STRICT;
    `);
    malformed.close(true);

    expect(() => EventJournal.open(databasePath)).toThrow();
    const database = new Database(databasePath, { readonly: true, strict: true });
    expect(
      database
        .query<{ count: number }, []>(
          "SELECT count(*) AS count FROM sqlite_master WHERE type = 'table' AND name = 'actions'",
        )
        .get()?.count,
    ).toBe(0);
    expect(
      database
        .query<{ name: string }, []>("PRAGMA table_info(provider_calls)")
        .all()
        .map(({ name }) => name),
    ).toEqual(["bad"]);
    expect(
      database
        .query<{ value: string }, [string]>(
          "SELECT value FROM harness_metadata WHERE key = ?",
        )
        .get("schema_version")?.value,
    ).toBe("1");
    database.close();
  });
});
