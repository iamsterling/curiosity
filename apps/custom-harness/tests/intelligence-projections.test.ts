import { afterEach, describe, expect, test } from "bun:test";
import { Database } from "bun:sqlite";
import { randomBytes } from "node:crypto";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { Effect } from "effect";
import {
  createCuriosityHarness,
  signCommand,
  type CuriosityHarness,
} from "../src/index.js";
import type { StoredEvent } from "../src/domain/event.js";
import { ProjectionEngine } from "../src/kernel/projection-engine.js";
import { createStockPluginCatalog } from "../src/plugins/registry.js";

const roots: string[] = [];
const actorId = "local-owner";
const secret = randomBytes(32).toString("hex");
const supervisorPath = path.resolve(
  import.meta.dir,
  "../native/supervisor/target/debug/curiosity-supervisor",
);
let ordinal = 0;

const fixture = () => {
  const root = mkdtempSync(path.join(tmpdir(), "curiosity-intelligence-"));
  roots.push(root);
  const databasePath = path.join(root, "events.sqlite");
  return {
    databasePath,
    harness: createCuriosityHarness({
      actorId,
      authenticationSecret: secret,
      databasePath,
      supervisorPath,
    }),
  };
};

const submit = (harness: CuriosityHarness, kind: string, payload: unknown) => {
  ordinal += 1;
  return harness.submit(
    signCommand(
      {
        actorId,
        command: {
          id: `intelligence-command-${ordinal}`,
          kind,
          payload,
          schemaVersion: 1,
        },
        issuedAt: new Date().toISOString(),
        nonce: `intelligence-nonce-${ordinal}`,
        schemaVersion: 1,
      },
      secret,
    ),
  );
};

afterEach(() => {
  ordinal = 0;
  for (const root of roots.splice(0))
    rmSync(root, { force: true, recursive: true });
});

describe("native observation, Ledger, and evidence projections", () => {
  test("replays equivalent bounded views while keeping evidence and resolution non-authoritative", async () => {
    const { databasePath, harness } = fixture();
    await submit(harness, "ledger.intent.record", {
      id: "intent-001",
      invariant: "Plugins never gain kernel authority",
      nonGoals: ["deployment"],
      objective: "secret objective text must not enter observations",
      revision: 1,
      rigor: "rigorous",
      schemaVersion: 1,
      scope: ["apps/custom-harness"],
    });
    await submit(harness, "ledger.criterion.record", {
      id: "criterion-001",
      intentId: "intent-001",
      intentRevision: 1,
      observable: "projection replays exactly",
      oracle: "focused test passes",
      requiredEvidence: ["test-green"],
      revision: 1,
      schemaVersion: 1,
    });
    await submit(harness, "ledger.work.record", {
      criterionIds: ["criterion-001"],
      id: "work-001",
      intentId: "intent-001",
      intentRevision: 1,
      schemaVersion: 1,
      state: "pending",
      writableScope: ["apps/custom-harness"],
    });

    const database = new Database(databasePath, {
      readonly: true,
      strict: true,
    });
    const source = database
      .query<{ event_id: string }, []>(
        "SELECT event_id FROM events WHERE event_type = 'ledger.work.recorded'",
      )
      .get()!;
    database.close();
    await submit(harness, "evidence.record", {
      criterionId: "criterion-001",
      criterionRevision: 1,
      environmentDigest: "a".repeat(64),
      executionId: "execution-001",
      id: "evidence-001",
      inputDigest: "b".repeat(64),
      intentId: "intent-001",
      kind: "test-green",
      observedAt: "2026-08-25T00:00:00.000Z",
      outputDigest: "c".repeat(64),
      schemaVersion: 1,
      sourceEventIds: [source.event_id],
      status: "passed",
      workId: "work-001",
    });
    await submit(harness, "ledger.resolution.propose", {
      evidenceIds: ["evidence-001"],
      id: "resolution-001",
      intentId: "intent-001",
      rationale: "The candidate evidence reports a passing test.",
      schemaVersion: 1,
      verdict: "accept",
    });

    const ledger = await harness.projections.plugin(
      "curiosity.stock.ledger.projections.domain",
    );
    const evidence = await harness.projections.plugin(
      "curiosity.stock.evidence.projections.candidates",
    );
    const observations = await harness.projections.plugin(
      "curiosity.stock.observations.projections.recent",
    );
    expect(ledger).toMatchObject({
      criteria: [expect.objectContaining({ id: "criterion-001" })],
      intents: [expect.objectContaining({ id: "intent-001" })],
      resolutions: [
        expect.objectContaining({
          authority: "proposal-only",
          id: "resolution-001",
          verdict: "accept",
        }),
      ],
      work: [expect.objectContaining({ id: "work-001" })],
    });
    expect(evidence).toMatchObject({
      candidates: [
        expect.objectContaining({
          assertionState: "PENDING",
          authority: "none",
          custody: "PROVISIONAL",
          id: "evidence-001",
          status: "passed",
        }),
      ],
    });
    expect(JSON.stringify(observations)).not.toContain("secret objective text");
    const observationView = observations as {
      readonly observations: readonly Record<string, unknown>[];
    };
    expect(observationView.observations.length).toBeGreaterThan(0);
    expect(observationView.observations[0]).toEqual(
      expect.objectContaining({
        sourceEventId: expect.any(String),
        summary: expect.stringContaining("Observed canonical"),
      }),
    );
    await harness.dispose();

    const reopened = createCuriosityHarness({
      actorId,
      authenticationSecret: secret,
      databasePath,
      supervisorPath,
    });
    expect(
      await reopened.projections.plugin(
        "curiosity.stock.ledger.projections.domain",
      ),
    ).toEqual(ledger);
    expect(
      await reopened.projections.plugin(
        "curiosity.stock.evidence.projections.candidates",
      ),
    ).toEqual(evidence);
    expect(
      await reopened.projections.plugin(
        "curiosity.stock.observations.projections.recent",
      ),
    ).toEqual(observations);
    await reopened.dispose();
  });

  test("fails closed on an unknown projection event schema version", async () => {
    const event: StoredEvent = {
      actorId,
      body: {
        category: "action",
        observationId: "observation:event-001",
        schemaVersion: 2,
        sourceEventHash: "a".repeat(64),
        sourceEventId: "event-001",
        sourceEventType: "action.proposed",
        summary: "unknown version",
        taint: "trusted-kernel-metadata",
      },
      commandId: "command-001",
      eventHash: "b".repeat(64),
      eventId: "event-002",
      occurredAt: "2026-08-25T00:00:00.000Z",
      pluginId: "curiosity.stock.observations",
      previousHash: "0".repeat(64),
      sequence: 1,
      streamId: "stream-001",
      type: "observation.recorded",
    };
    const engine = new ProjectionEngine(createStockPluginCatalog(), () => [
      event,
    ]);
    await expect(
      Effect.runPromise(
        engine.replay("curiosity.stock.observations.projections.recent"),
      ),
    ).rejects.toMatchObject({
      _tag: "PluginFailure",
      message: "PROJECTION_EVENT_SCHEMA_UNSUPPORTED",
    });
  });
});
