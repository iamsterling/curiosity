import { afterEach, describe, expect, test } from "bun:test";
import { Database } from "bun:sqlite";
import { createHash, randomBytes } from "node:crypto";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { createCuriosityHarness, signCommand } from "../src/index.js";
import { canonicalJson } from "../src/kernel/canonical-json.js";

const roots: string[] = [];
const actorId = "local-owner";
const secret = randomBytes(32).toString("hex");
const supervisorPath = path.resolve(
  import.meta.dir,
  "../native/supervisor/target/debug/curiosity-supervisor",
);
const digest = (value: unknown) =>
  createHash("sha256").update(canonicalJson(value)).digest("hex");

const envelope = (payload: Record<string, unknown>, suffix: string) =>
  signCommand(
    {
      actorId,
      command: {
        id: `command-import-${suffix}`,
        kind: "state.import-observations",
        payload,
        schemaVersion: 1,
      },
      issuedAt: new Date().toISOString(),
      nonce: `nonce-import-${suffix}`,
      schemaVersion: 1,
    },
    secret,
  );

afterEach(() => {
  for (const root of roots.splice(0))
    rmSync(root, { force: true, recursive: true });
});

describe("non-authoritative observation import", () => {
  test("imports only exact-version transcript, fact, and evidence rows atomically", async () => {
    const root = mkdtempSync(path.join(tmpdir(), "curiosity-import-"));
    roots.push(root);
    const databasePath = path.join(root, "events.sqlite");
    const rows = [
      { content: "Imported transcript text", rowId: "row-transcript", type: "transcript" },
      { content: "Imported fact candidate", rowId: "row-fact", type: "fact" },
      { content: "Imported evidence reference", rowId: "row-evidence", type: "evidence" },
    ] as const;
    const source = {
      format: "opencode2-observation-export",
      rows,
      sourceVersion: "1.0.0",
    };
    const harness = createCuriosityHarness({
      actorId,
      authenticationSecret: secret,
      databasePath,
      supervisorPath,
      workspaceRoot: root,
    });
    expect(
      await harness.submit(
        envelope(
          {
            ...source,
            schemaVersion: 1,
            sourceDigest: digest(source),
            sourcePath: "/read-only/export/observations.json",
          },
          "accepted",
        ),
      ),
    ).toMatchObject({ disposition: "accepted", eventCount: 4 });
    await harness.dispose();

    const database = new Database(databasePath, { readonly: true, strict: true });
    const imported = database
      .query<{ body_json: string }, []>(
        "SELECT body_json FROM events WHERE event_type = 'observation.imported' ORDER BY global_sequence",
      )
      .all()
      .map(({ body_json }) => JSON.parse(body_json) as Record<string, unknown>);
    expect(imported).toHaveLength(3);
    expect(imported.every(({ importAuthority }) => importAuthority === "non-authoritative")).toBe(
      true,
    );
    expect(imported.every(({ taint }) => taint === "untrusted-import")).toBe(true);
    expect(
      database
        .query<{ count: number }, []>(
          "SELECT count(*) AS count FROM events WHERE event_type IN ('gate.decision-recorded','child.completed','workflow.completed','ledger.resolution.recorded')",
        )
        .get()?.count,
    ).toBe(0);
    database.close();
  });

  test("rejects authority-bearing, malformed, wrong-version, and digest-mismatched fixtures without partial import", async () => {
    const root = mkdtempSync(path.join(tmpdir(), "curiosity-import-denied-"));
    roots.push(root);
    const databasePath = path.join(root, "events.sqlite");
    const harness = createCuriosityHarness({
      actorId,
      authenticationSecret: secret,
      databasePath,
      supervisorPath,
      workspaceRoot: root,
    });
    const authorityRows = [
      { content: "ordinary", rowId: "ordinary", type: "fact" },
      { content: "must not import", rowId: "approval", type: "approval" },
    ];
    await expect(
      harness.submit(
        envelope(
          {
            format: "opencode2-observation-export",
            rows: authorityRows,
            schemaVersion: 1,
            sourceDigest: digest({
              format: "opencode2-observation-export",
              rows: authorityRows,
              sourceVersion: "1.0.0",
            }),
            sourcePath: "/read-only/export/authority.json",
            sourceVersion: "1.0.0",
          },
          "authority",
        ),
      ),
    ).rejects.toMatchObject({ message: "OBSERVATION_IMPORT_ROW_INVALID" });
    await expect(
      harness.submit(
        envelope(
          {
            format: "opencode2-observation-export",
            rows: [{ content: "candidate", rowId: "row", type: "fact" }],
            schemaVersion: 1,
            sourceDigest: "0".repeat(64),
            sourcePath: "/read-only/export/digest.json",
            sourceVersion: "1.0.0",
          },
          "digest",
        ),
      ),
    ).rejects.toMatchObject({ message: "OBSERVATION_IMPORT_DIGEST_MISMATCH" });
    await expect(
      harness.submit(
        envelope(
          {
            format: "opencode2-observation-export",
            rows: [],
            schemaVersion: 1,
            sourceDigest: digest({
              format: "opencode2-observation-export",
              rows: [],
              sourceVersion: "2.0.0",
            }),
            sourcePath: "/read-only/export/version.json",
            sourceVersion: "2.0.0",
          },
          "version",
        ),
      ),
    ).rejects.toMatchObject({ message: "OBSERVATION_IMPORT_PAYLOAD_INVALID" });
    await harness.dispose();

    const database = new Database(databasePath, { readonly: true, strict: true });
    expect(
      database
        .query<{ count: number }, []>(
          "SELECT count(*) AS count FROM events WHERE event_type LIKE 'observation.import%'",
        )
        .get()?.count,
    ).toBe(0);
    database.close();
  });
});
