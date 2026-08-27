import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { chmod, mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import process from "node:process";
import { DatabaseSync } from "node:sqlite";
import { afterEach, test } from "node:test";
import { loadThreadProjectionView } from "../app/thread-projections.ts";

const roots = [];
const originalDatabasePath = process.env.CURIOSITY_DATABASE_PATH;

const digest = async (databasePath) =>
  createHash("sha256")
    .update(await readFile(databasePath))
    .digest("hex");

const createProjectionFixture = (databasePath) => {
  const database = new DatabaseSync(databasePath);
  database.exec(`
    CREATE TABLE harness_metadata (key TEXT PRIMARY KEY, value TEXT NOT NULL) STRICT;
    INSERT INTO harness_metadata(key, value) VALUES ('schema_version', '15');
    CREATE TABLE events (
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
      event_hash TEXT NOT NULL UNIQUE,
      event_schema_version INTEGER NOT NULL,
      aggregate_version INTEGER NOT NULL,
      causation_id TEXT NOT NULL,
      correlation_id TEXT NOT NULL,
      root_execution_id TEXT NOT NULL,
      parent_execution_id TEXT NOT NULL,
      child_execution_id TEXT NOT NULL,
      contribution_id TEXT NOT NULL,
      contribution_version TEXT NOT NULL,
      catalog_digest TEXT NOT NULL
    ) STRICT;
  `);
  database
    .prepare("INSERT INTO events VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)")
    .run(
      1,
      "event-001",
      "command-001",
      "local-owner",
      "curiosity.stock.thread",
      "thread.opened",
      "thread-001",
      JSON.stringify({ threadId: "thread-001", title: "Build Curiosity" }),
      "2026-08-25T00:00:00.000Z",
      "0".repeat(64),
      "1".repeat(64),
      1,
      1,
      "command-001",
      "thread-001",
      "thread-001",
      "thread-001",
      "thread-001",
      "curiosity.stock.thread",
      "1",
      "2".repeat(64),
    );
  database.close();
};

afterEach(async () => {
  if (originalDatabasePath === undefined)
    delete process.env.CURIOSITY_DATABASE_PATH;
  else process.env.CURIOSITY_DATABASE_PATH = originalDatabasePath;
  await Promise.all(
    roots.splice(0).map((root) => rm(root, { force: true, recursive: true })),
  );
});

test("web reads an existing projection without mutating its database", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "curiosity-web-projection-"));
  roots.push(root);
  const databasePath = path.join(root, "events.sqlite");
  createProjectionFixture(databasePath);
  const before = await digest(databasePath);
  await chmod(databasePath, 0o444);
  process.env.CURIOSITY_DATABASE_PATH = databasePath;

  assert.deepEqual(await loadThreadProjectionView(), {
    status: "available",
    threads: [
      {
        openedBy: "local-owner",
        sequence: 1,
        threadId: "thread-001",
        title: "Build Curiosity",
      },
    ],
  });
  assert.equal(await digest(databasePath), before);
});

test("web reports an unconfigured view without fabricating data", async () => {
  delete process.env.CURIOSITY_DATABASE_PATH;

  assert.deepEqual(await loadThreadProjectionView(), {
    status: "unconfigured",
    threads: [],
  });
});

test("web fails closed for an unsupported outer event schema", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "curiosity-web-projection-"));
  roots.push(root);
  const databasePath = path.join(root, "events.sqlite");
  createProjectionFixture(databasePath);
  const database = new DatabaseSync(databasePath);
  database.exec("UPDATE events SET event_schema_version = 99");
  database.close();
  process.env.CURIOSITY_DATABASE_PATH = databasePath;

  assert.deepEqual(await loadThreadProjectionView(), {
    status: "unavailable",
    threads: [],
  });
});
