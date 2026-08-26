import { afterEach, describe, expect, test } from "bun:test";
import { randomBytes } from "node:crypto";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import {
  createCuriosityHarness,
  signCommand,
  type CuriosityHarness,
  type UnsignedCommandEnvelope,
} from "../src/index.js";

const roots: string[] = [];
const secret = randomBytes(32).toString("hex");
const actorId = "local-owner";
const supervisorPath = path.resolve(
  import.meta.dir,
  "../native/supervisor/target/debug/curiosity-supervisor",
);

const fixture = () => {
  const root = mkdtempSync(path.join(tmpdir(), "curiosity-harness-"));
  roots.push(root);
  const databasePath = path.join(root, "events.sqlite");
  const harness = createCuriosityHarness({
    actorId,
    authenticationSecret: secret,
    databasePath,
    supervisorPath,
    workspaceRoot: root,
  });
  return { databasePath, harness };
};

const command = (overrides: Partial<UnsignedCommandEnvelope> = {}) =>
  signCommand(
    {
      actorId,
      command: {
        id: "command-001",
        kind: "thread.open",
        payload: { threadId: "thread-001", title: "Build Curiosity" },
        schemaVersion: 1,
      },
      issuedAt: new Date().toISOString(),
      nonce: "nonce-001",
      schemaVersion: 1,
      ...overrides,
    },
    secret,
  );

afterEach(() => {
  for (const root of roots.splice(0))
    rmSync(root, { force: true, recursive: true });
});

describe("sealed command authority", () => {
  test("exposes the immutable stock plugin catalog identity", async () => {
    const { harness } = fixture();

    expect(harness.catalog.pluginIds).toEqual([
      "curiosity.stock.context",
      "curiosity.stock.ledger",
      "curiosity.stock.evidence",
      "curiosity.stock.loop",
      "curiosity.stock.compatibility-tools",
      "curiosity.stock.agents",
      "curiosity.stock.observations",
      "curiosity.stock.orchestration",
      "curiosity.stock.search",
      "curiosity.stock.skills",
      "curiosity.stock.thread",
      "curiosity.stock.tools",
      "curiosity.stock.workspace",
      "curiosity.stock.chat",
    ]);
    expect(harness.catalog.digest).toMatch(/^[a-f0-9]{64}$/u);
    expect(Object.isFrozen(harness.catalog)).toBe(true);
    expect(Object.isFrozen(harness.catalog.pluginIds)).toBe(true);
    await harness.dispose();
  });

  test("authenticates one command, commits one event, and rebuilds a read-only projection after restart", async () => {
    const { databasePath, harness } = fixture();

    const acknowledgement = await harness.submit(command());
    expect(acknowledgement).toMatchObject({
      actorId,
      commandId: "command-001",
      disposition: "accepted",
      eventCount: 1,
      firstSequence: 1,
      lastSequence: 1,
    });
    await harness.dispose();

    const reopened = createCuriosityHarness({
      actorId,
      authenticationSecret: secret,
      databasePath,
      supervisorPath,
      workspaceRoot: path.dirname(databasePath),
    });
    expect(await reopened.projections.threads()).toEqual([
      {
        threadId: "thread-001",
        title: "Build Curiosity",
        openedBy: actorId,
        sequence: 1,
      },
    ]);
    await reopened.dispose();
  });

  test("rejects an invalid signature without writing an event", async () => {
    const { harness } = fixture();
    const envelope = { ...command(), signature: "0".repeat(64) };

    await expect(harness.submit(envelope)).rejects.toMatchObject({
      _tag: "AuthenticationRejected",
    });
    expect(await harness.projections.threads()).toEqual([]);
    await harness.dispose();
  });

  test("deduplicates the same actor command and rejects a changed payload under the same identity", async () => {
    const { harness } = fixture();
    const original = command();

    expect((await harness.submit(original)).disposition).toBe("accepted");
    expect((await harness.submit(original)).disposition).toBe("duplicate");

    const changed = command({
      command: {
        id: "command-001",
        kind: "thread.open",
        payload: { threadId: "thread-001", title: "Changed payload" },
        schemaVersion: 1,
      },
    });
    await expect(harness.submit(changed)).rejects.toMatchObject({
      _tag: "CommandConflict",
    });
    expect(await harness.projections.threads()).toHaveLength(1);
    await harness.dispose();
  });

  test("rejects commands without a statically registered owner", async () => {
    const { harness } = fixture();
    const unknown = command({
      command: {
        id: "command-unknown",
        kind: "extension.load",
        payload: {},
        schemaVersion: 1,
      },
      nonce: "nonce-unknown",
    });

    await expect(harness.submit(unknown)).rejects.toMatchObject({
      _tag: "CommandUnavailable",
    });
    await harness.dispose();
  });
});

const close = async (harness: CuriosityHarness | undefined) =>
  harness?.dispose();
void close;
