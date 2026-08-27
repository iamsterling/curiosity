import { afterEach, describe, expect, test } from "bun:test";
import { Database } from "bun:sqlite";
import { createHash } from "node:crypto";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { EventJournal } from "../src/storage/event-journal.js";

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
    const eventHash = journal.readEvents()[0]!.eventHash;
    journal.close();

    const legacy = new Database(databasePath, { readwrite: true, strict: true });
    legacy.run(
      "UPDATE harness_metadata SET value = '11' WHERE key = 'schema_version'",
    );
    legacy.exec("DROP TABLE questions; DROP TABLE resource_leases;");
    legacy.close(true);

    const migrated = EventJournal.open(databasePath);
    expect(migrated.readEvents()[0]?.eventHash).toBe(eventHash);
    migrated.close();
    const database = new Database(databasePath, { readonly: true, strict: true });
    expect(
      database
        .query<{ value: string }, [string]>(
          "SELECT value FROM harness_metadata WHERE key = ?",
        )
        .get("schema_version")?.value,
    ).toBe("13");
    expect(
      database
        .query<{ count: number }, []>(
          "SELECT count(*) AS count FROM sqlite_master WHERE type = 'table' AND name IN ('questions','resource_leases')",
        )
        .get()?.count,
    ).toBe(2);
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
