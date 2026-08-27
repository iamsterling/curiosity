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
  type TextGenerator,
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
const submit = (harness: CuriosityHarness, kind: string, payload: unknown) => {
  ordinal += 1;
  return harness.submit(
    signCommand(
      {
        actorId,
        command: {
          id: `rebuild-command-${ordinal}`,
          kind,
          payload,
          schemaVersion: 1,
        },
        issuedAt: new Date().toISOString(),
        nonce: `rebuild-nonce-${ordinal}`,
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

describe("canonical projection rebuild matrix", () => {
  test("rebuilds thread, child, Ledger, evidence, and workflow views with no disposable projection tables and rejects unknown schema", async () => {
    const root = mkdtempSync(path.join(tmpdir(), "curiosity-rebuild-matrix-"));
    roots.push(root);
    const databasePath = path.join(root, "events.sqlite");
    let calls = 0;
    const generator: TextGenerator = {
      effort: "medium",
      modelId: "test:projection-rebuild",
      stream: async function* () {
        calls += 1;
        if (calls === 1) {
          yield {
            input: {
              agentId: "reviewer",
              description: "Projection rebuild child",
              ownership: { readOnly: true, resources: ["workspace:projection"] },
              requested: {
                capabilities: ["provider.generate"],
                maximumProviderCalls: 1,
                maximumToolCalls: 0,
                tools: [],
              },
              schemaVersion: 1,
              task: {
                acceptanceChecks: ["Return one result."],
                contextRefs: [],
                deliverable: "Projection child result",
                nonGoals: ["No mutation"],
                objective: "Return projection child evidence.",
              },
            },
            toolCallId: "projection-child-call",
            toolName: "agent.delegate",
            type: "tool-call",
          } as never;
          return;
        }
        yield calls === 2 ? "Projection child result." : "Projection parent result.";
      },
    };
    const config = {
      actorId,
      authenticationSecret: secret,
      databasePath,
      supervisorPath,
      textGenerator: generator,
      workspaceRoot: root,
    };
    const harness = createCuriosityHarness(config);
    await harness.chat(
      signCommand(
        {
          actorId,
          command: {
            id: "rebuild-chat-command",
            kind: "chat.turn",
            payload: {
              assistantMessageId: "rebuild-assistant",
              text: "Create canonical projection fixtures.",
              threadId: "rebuild-thread",
              turnId: "rebuild-turn",
              userMessageId: "rebuild-user",
            },
            schemaVersion: 1,
          },
          issuedAt: new Date().toISOString(),
          nonce: "rebuild-chat-nonce",
          schemaVersion: 1,
        },
        secret,
      ),
    );
    await submit(harness, "ledger.intent.record", {
      id: "rebuild-intent",
      invariant: "Canonical events survive projection deletion",
      nonGoals: [],
      objective: "Rebuild every disposable view",
      revision: 1,
      rigor: "rigorous",
      schemaVersion: 1,
      scope: ["apps/custom-harness"],
    });
    await submit(harness, "ledger.criterion.record", {
      id: "rebuild-criterion",
      intentId: "rebuild-intent",
      intentRevision: 1,
      observable: "views are equivalent",
      oracle: "focused test",
      requiredEvidence: ["test-green"],
      revision: 1,
      schemaVersion: 1,
    });
    await submit(harness, "ledger.work.record", {
      criterionIds: ["rebuild-criterion"],
      id: "rebuild-work",
      intentId: "rebuild-intent",
      intentRevision: 1,
      schemaVersion: 1,
      state: "pending",
      writableScope: ["apps/custom-harness"],
    });
    const sourceDatabase = new Database(databasePath, {
      readonly: true,
      strict: true,
    });
    const sourceEventId = sourceDatabase
      .query<{ event_id: string }, []>(
        "SELECT event_id FROM events WHERE event_type = 'ledger.work.recorded'",
      )
      .get()!.event_id;
    sourceDatabase.close();
    await submit(harness, "evidence.record", {
      criterionId: "rebuild-criterion",
      criterionRevision: 1,
      environmentDigest: "a".repeat(64),
      executionId: "rebuild-execution",
      id: "rebuild-evidence",
      inputDigest: "b".repeat(64),
      intentId: "rebuild-intent",
      kind: "test-green",
      observedAt: "2026-08-27T00:00:00.000Z",
      outputDigest: "c".repeat(64),
      schemaVersion: 1,
      sourceEventIds: [sourceEventId],
      status: "passed",
      workId: "rebuild-work",
    });
    await submit(harness, "workflow.start", {
      capabilityRequests: [],
      instanceId: "rebuild-workflow",
      objective: "Rebuild workflow projection",
      schemaVersion: 1,
      workflowName: "goal-loop",
    });
    const before = {
      children: await harness.projections.children("rebuild-turn"),
      evidence: await harness.projections.plugin(
        "curiosity.stock.evidence.projections.candidates",
      ),
      ledger: await harness.projections.plugin(
        "curiosity.stock.ledger.projections.domain",
      ),
      messages: await harness.projections.messages("rebuild-thread"),
      threads: await harness.projections.threads(),
      workflow: await harness.projections.plugin(
        "curiosity.stock.loop.projections.runs",
      ),
    };
    const storage = new Database(databasePath, {
      readonly: true,
      strict: true,
    });
    expect(
      storage
        .query<{ name: string }, []>(
          "SELECT name FROM sqlite_master WHERE type = 'table' AND (name LIKE '%projection%' OR name LIKE '%view_cache%') ORDER BY name",
        )
        .all(),
    ).toEqual([]);
    expect(
      storage
        .query<{ count: number }, []>(
          "SELECT count(*) AS count FROM events WHERE event_type IN ('chat.message-recorded','child.allocated','ledger.intent.recorded','evidence.recorded','workflow.started')",
        )
        .get()?.count,
    ).toBeGreaterThan(0);
    storage.close();
    await harness.dispose();

    // Every public view is replayed on demand from canonical events, so the set
    // of disposable materialized projection tables is intentionally empty.
    const reopened = createCuriosityHarness(config);
    const after = {
      children: await reopened.projections.children("rebuild-turn"),
      evidence: await reopened.projections.plugin(
        "curiosity.stock.evidence.projections.candidates",
      ),
      ledger: await reopened.projections.plugin(
        "curiosity.stock.ledger.projections.domain",
      ),
      messages: await reopened.projections.messages("rebuild-thread"),
      threads: await reopened.projections.threads(),
      workflow: await reopened.projections.plugin(
        "curiosity.stock.loop.projections.runs",
      ),
    };
    expect(after).toEqual(before);
    expect(calls).toBe(3);
    await reopened.dispose();

    const unknown: StoredEvent = {
      aggregateVersion: 1,
      actorId,
      body: { schemaVersion: 1 },
      catalogDigest: "c".repeat(64),
      causationId: "unknown-command",
      childExecutionId: "unknown-stream",
      commandId: "unknown-command",
      contributionId: "curiosity.stock.ledger",
      contributionVersion: "1",
      correlationId: "unknown-stream",
      eventHash: "b".repeat(64),
      eventId: "unknown-event",
      eventSchemaVersion: 99,
      occurredAt: "2026-08-27T00:00:00.000Z",
      parentExecutionId: "unknown-stream",
      pluginId: "curiosity.stock.ledger",
      previousHash: "0".repeat(64),
      rootExecutionId: "unknown-stream",
      sequence: 1,
      streamId: "unknown-stream",
      type: "ledger.intent.recorded",
    };
    const projection = new ProjectionEngine(createStockPluginCatalog(), () => [
      unknown,
    ]);
    await expect(
      Effect.runPromise(
        projection.replay("curiosity.stock.ledger.projections.domain"),
      ),
    ).rejects.toMatchObject({ message: "PROJECTION_EVENT_SCHEMA_UNSUPPORTED" });
  });
});
