import { afterEach, describe, expect, test } from "bun:test";
import { Database } from "bun:sqlite";
import { randomBytes } from "node:crypto";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import {
  createCuriosityHarness,
  signCommand,
  type CapabilityStatusEntry,
} from "../src/index.js";

const roots: string[] = [];
const actorId = "local-owner";
const secret = randomBytes(32).toString("hex");
const supervisorPath = path.resolve(
  import.meta.dir,
  "../native/supervisor/target/debug/curiosity-supervisor",
);

const fixture = () => {
  const root = mkdtempSync(path.join(tmpdir(), "curiosity-status-"));
  roots.push(root);
  const databasePath = path.join(root, "events.sqlite");
  return {
    databasePath,
    harness: createCuriosityHarness({
      actorId,
      authenticationSecret: secret,
      databasePath,
      supervisorPath,
      workspaceRoot: root,
    }),
  };
};

const byId = (entries: readonly CapabilityStatusEntry[]) =>
  new Map(entries.map((entry) => [entry.id, entry]));

afterEach(() => {
  for (const root of roots.splice(0))
    rmSync(root, { force: true, recursive: true });
});

describe("qualification and capability truth", () => {
  test("reports the candidate profile without production, mutation, remote, or platform overclaims", async () => {
    const { harness } = fixture();
    const status = await harness.status();
    expect(status).toMatchObject({
      candidateReady: true,
      deploymentReady: false,
      lifecycle: "candidate",
      productionReady: false,
      profile: "trusted-local-single-user",
      publicationReady: false,
      schemaVersion: 1,
      supervisor: {
        filesystemMutation: false,
        filesystemRead: true,
        git: false,
        gitMutation: false,
        process: false,
        sandbox: false,
      },
    });
    const capabilities = byId(status.capabilities);
    expect([...capabilities.keys()]).toEqual(
      [...capabilities.keys()].sort((left, right) => left.localeCompare(right)),
    );
    expect(capabilities.get("workflow.loop")).toMatchObject({
      qualifiedForProduction: false,
      state: "available",
    });
    expect(capabilities.get("workflow.orchestration")).toMatchObject({
      qualifiedForProduction: false,
      state: "available",
    });
    expect(capabilities.get("provider.generate")).toEqual({
      id: "provider.generate",
      qualifiedForProduction: false,
      reason: "PROVIDER_ADAPTER_NOT_CONFIGURED",
      state: "unavailable",
    });
    expect(capabilities.get("filesystem.read")).toEqual({
      id: "filesystem.read",
      qualifiedForProduction: false,
      reason: "WORKSPACE_READ_SUPERVISOR_ACTIVE",
      state: "available",
    });
    for (const id of [
      "deployment",
      "filesystem.mutation",
      "git.mutation",
      "mobile",
      "network.fetch",
      "network.search",
      "platform.windows",
      "process.execution",
      "production",
      "publication",
      "remote.transport",
      "sandbox.execution",
      "storage.hard-reset-durability",
      "tool.evidence-read",
      "tool.projection-read",
      "updates.automatic",
    ])
      expect(capabilities.get(id)).toMatchObject({
        qualifiedForProduction: false,
        state: "unavailable",
      });
    expect(Object.isFrozen(status)).toBe(true);
    expect(Object.isFrozen(status.capabilities)).toBe(true);
    expect(status.capabilities.every(Object.isFrozen)).toBe(true);
    await harness.dispose();
  });

  test("keeps every deferred command surface unreachable without journal mutation", async () => {
    const { databasePath, harness } = fixture();
    const commandKinds = [
      "deployment.deploy",
      "filesystem.mutate",
      "git.commit",
      "mobile.sync",
      "process.spawn",
      "production.enable",
      "publication.publish",
      "remote.connect",
      "sandbox.run",
      "update.install",
    ];
    for (const [index, kind] of commandKinds.entries())
      await expect(
        harness.submit(
          signCommand(
            {
              actorId,
              command: {
                id: `deferred-command-${index}`,
                kind,
                payload: { schemaVersion: 1 },
                schemaVersion: 1,
              },
              issuedAt: new Date().toISOString(),
              nonce: `deferred-nonce-${index}`,
              schemaVersion: 1,
            },
            secret,
          ),
        ),
      ).rejects.toMatchObject({
        _tag: "CommandUnavailable",
        kind,
        message: "COMMAND_KIND_UNAVAILABLE",
      });
    await harness.dispose();

    const database = new Database(databasePath, {
      readonly: true,
      strict: true,
    });
    expect(
      database
        .query<{ count: number }, []>(
          "SELECT count(*) AS count FROM command_admissions",
        )
        .get()?.count,
    ).toBe(0);
    expect(
      database
        .query<{ count: number }, []>("SELECT count(*) AS count FROM events")
        .get()?.count,
    ).toBe(0);
    database.close(true);
  });
});
