import { afterEach, describe, expect, test } from "bun:test";
import { Database } from "bun:sqlite";
import { createHash, randomBytes } from "node:crypto";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import {
  createCuriosityHarness,
  signCommand,
  type TextGenerator,
} from "../src/index.js";
import type { StoredAction } from "../src/domain/action.js";
import type {
  ProviderAttemptSnapshot,
  ToolAttemptSnapshot,
} from "../src/domain/attempt.js";
import type { PromptSnapshot } from "../src/domain/prompt.js";
import { canonicalJson } from "../src/kernel/canonical-json.js";
import { EventJournal } from "../src/storage/event-journal.js";

const roots: string[] = [];
const actorId = "local-owner";
const secret = randomBytes(32).toString("hex");
const supervisorPath = path.resolve(
  import.meta.dir,
  "../native/supervisor/target/debug/curiosity-supervisor",
);
const digest = (value: unknown): string =>
  createHash("sha256").update(canonicalJson(value)).digest("hex");

const databaseFixture = () => {
  const root = mkdtempSync(path.join(tmpdir(), "curiosity-attempt-"));
  roots.push(root);
  return path.join(root, "events.sqlite");
};

const proposedAction = (
  journal: EventJournal,
  options: {
    readonly actionId: string;
    readonly actionType?: string;
    readonly executionId: string;
    readonly gateClass?: StoredAction["gateClass"];
    readonly requestedCapabilities?: readonly string[];
    readonly resource?: string;
  },
): StoredAction => {
  journal.admit({
    acceptedAt: "2026-08-25T00:00:00.000Z",
    actorId,
    commandDigest: digest({ source: options.actionId }),
    commandId: `source:${options.actionId}`,
    events: [
      {
        body: { schemaVersion: 1 },
        streamId: options.actionId,
        type: "source.event",
      },
    ],
    nonce: `source:${options.actionId}`,
    pluginId: "curiosity.test.source",
  });
  const source = journal.readEvents().at(-1)!;
  const reactorId = "curiosity.test.attempts.reactors.source";
  journal.actions.beginReaction({
    pluginId: "curiosity.test.attempts",
    reactorId,
    reactorVersion: 1,
    sourceEventId: source.eventId,
    startedAt: "2026-08-25T00:00:01.000Z",
  });
  const input = {
    agentId: "generalist",
    correlation: { kind: "test" },
    messages: [{ content: "test", role: "user" }],
  };
  journal.actions.completeReaction({
    acceptedAt: "2026-08-25T00:00:02.000Z",
    actions: [
      {
        actionId: options.actionId,
        actionSchemaVersion: 1,
         actionType: options.actionType ?? "provider.generate",
        deadlineClass: "interactive",
        executionId: options.executionId,
        gateClass: options.gateClass ?? "none-requested",
        input,
        inputDigest: digest(input),
        pluginId: "curiosity.test.attempts",
        reactorId,
         requestedCapabilities: options.requestedCapabilities ?? ["provider.generate"],
         resource: options.resource ?? "thread:test",
        sourceEventId: source.eventId,
      },
    ],
    events: [
      {
        body: { actionId: options.actionId, schemaVersion: 1 },
        streamId: options.actionId,
        type: "action.proposed",
      },
    ],
    gateEligibleActorId: actorId,
    gateExpiresAt: "2026-08-26T00:00:00.000Z",
    outputDigest: digest({ actionId: options.actionId }),
    pluginId: "curiosity.test.attempts",
    reactionId: `reaction:${options.actionId}`,
    reactorId,
    reactorVersion: 1,
    sourceEventId: source.eventId,
  });
  return journal.actions
    .proposedActions()
    .find(({ actionId }) => actionId === options.actionId)!;
};

const attemptSnapshot = (
  action: StoredAction,
  generation: number,
): {
  readonly prompt: PromptSnapshot;
  readonly requestDigest: string;
  readonly snapshot: ProviderAttemptSnapshot;
} => {
  const prompt: PromptSnapshot = {
    agent: {
      contentDigest: digest("agent"),
      id: "generalist",
      pluginId: "curiosity.stock.agents",
      pluginVersion: "1.0.0",
      version: "1.0.0",
    },
    blocks: [],
    catalogDigest: digest("catalog"),
    conversation: {
      includedDigest: digest([]),
      includedMessages: 0,
      omittedDigests: [],
    },
    messages: [],
    omittedBlocks: [],
    revision: 1,
    schemaVersion: 1,
    tools: [],
  };
  const requestDigest = digest({ actionId: action.actionId, generation });
  return {
    prompt,
    requestDigest,
    snapshot: {
      action: {
        actionId: action.actionId,
        actionType: action.actionType,
        deadlineClass: action.deadlineClass,
        gateClass: action.gateClass,
        inputDigest: action.inputDigest,
        requestedCapabilities: action.requestedCapabilities,
        resource: action.resource,
      },
      catalogDigest: prompt.catalogDigest,
      configDigest: digest("test-config"),
      effort: "medium",
      generation,
      grantedCapabilities: ["provider.generate"],
      modelId: "test:model",
      policyVersion: "local-v1",
      promptSnapshot: prompt,
      promptSnapshotDigest: digest(prompt),
      providerPurpose: generation === 1 ? "normal" : "retry",
      requestDigest,
      route: {
        adapterVersion: "test-v1",
        policyDigest: digest("test-route-policy"),
        routeId: "test-route",
      },
      schemaVersion: 1,
    },
  };
};

const allocate = (
  journal: EventJournal,
  action: StoredAction,
  generation: number,
) => {
  const { prompt, requestDigest, snapshot } = attemptSnapshot(
    action,
    generation,
  );
  const attemptId = digest({ actionId: action.actionId, generation });
  const callId = digest({ attemptId, call: 1 });
  const snapshotDigest = digest(snapshot);
  const allocation = journal.attempts.allocateProviderAttempt({
    action,
    allocatedAt: `2026-08-25T00:00:0${generation + 2}.000Z`,
    attemptId,
    callId,
    generation,
    leaseExpiresAt: "2026-08-25T00:10:00.000Z",
    modelId: "test:model",
    ownerId: "curiosity-kernel",
    promptSnapshotDigest: digest(prompt),
    promptSnapshotJson: canonicalJson(prompt),
    providerPurpose: snapshot.providerPurpose,
    requestDigest,
    snapshot,
    snapshotDigest,
    sourceRevision: prompt.revision,
  });
  if (!allocation) throw new Error("TEST_ATTEMPT_ALLOCATION_FAILED");
  return { allocation, requestDigest, snapshotDigest };
};

afterEach(() => {
  for (const root of roots.splice(0))
    rmSync(root, { force: true, recursive: true });
});

describe("attempt, gate, cancellation, and fencing governance", () => {
  test("binds one authenticated actor decision to the exact gate revision and payload", () => {
    const journal = EventJournal.open(databaseFixture());
    const action = proposedAction(journal, {
      actionId: digest("gated-action"),
      executionId: "execution-gated",
      gateClass: "binding-human-requested",
    });
    expect(
      journal.attempts.isActionDispatchReady(
        action,
        "2026-08-25T00:00:03.000Z",
      ),
    ).toBe(false);
    const decision = {
      acceptedAt: "2026-08-25T00:00:04.000Z",
      actorId,
      commandDigest: digest("approve"),
      commandId: "gate-command-001",
      decidedAt: "2026-08-25T00:00:04.000Z",
      decision: "approved" as const,
      decisionCommandId: "gate-command-001",
      events: [
        {
          body: {
            decision: "approved",
            gateId: `gate:${action.actionId}:1`,
            payloadDigest: action.inputDigest,
            proposalRevision: 1,
            schemaVersion: 1,
          },
          streamId: `gate:${action.actionId}:1`,
          type: "gate.decision-recorded",
        },
      ],
      gateId: `gate:${action.actionId}:1`,
      nonce: "gate-nonce-001",
      payloadDigest: action.inputDigest,
      pluginId: "curiosity.kernel.control",
      proposalRevision: 1,
    };
    expect(() =>
      journal.attempts.decideGate({
        ...decision,
        actorId: "not-the-owner",
      }),
    ).toThrow("GATE_DECISION_DENIED");
    const accepted = journal.attempts.decideGate(decision);
    expect(accepted).toMatchObject({
      _tag: "Acknowledged",
      acknowledgement: { disposition: "accepted" },
    });
    expect(journal.attempts.decideGate(decision)).toMatchObject({
      _tag: "Acknowledged",
      acknowledgement: { disposition: "duplicate" },
    });
    expect(
      journal.attempts.isActionDispatchReady(
        action,
        "2026-08-25T00:00:05.000Z",
      ),
    ).toBe(true);
    journal.close();
  });

  test("fences an older generation, quarantines its receipt, and preserves immutable snapshots", () => {
    const databasePath = databaseFixture();
    const journal = EventJournal.open(databasePath);
    const first = proposedAction(journal, {
      actionId: digest("attempt-one"),
      executionId: "execution-fenced",
    });
    const firstAttempt = allocate(journal, first, 1);
    expect(
      journal.attempts.authorizeProviderDispatch({
        actionId: first.actionId,
        attemptId: firstAttempt.allocation.attemptId,
        callId: firstAttempt.allocation.callId,
        generation: 1,
        now: "2026-08-25T00:00:04.000Z",
        requestDigest: firstAttempt.requestDigest,
      }),
    ).toBe("authorized");

    const second = proposedAction(journal, {
      actionId: digest("attempt-two"),
      executionId: "execution-fenced",
    });
    const secondAttempt = allocate(journal, second, 2);
    expect(
      journal.attempts.authorizeProviderDispatch({
        actionId: second.actionId,
        attemptId: secondAttempt.allocation.attemptId,
        callId: secondAttempt.allocation.callId,
        generation: 2,
        now: "2026-08-25T00:00:05.000Z",
        requestDigest: secondAttempt.requestDigest,
      }),
    ).toBe("authorized");
    const staleEvent = {
      body: { actionId: first.actionId, schemaVersion: 1 },
      streamId: first.actionId,
      type: "action.succeeded",
    };
    expect(
      journal.attempts.completeProviderCall({
        actionId: first.actionId,
        attemptId: firstAttempt.allocation.attemptId,
        callId: firstAttempt.allocation.callId,
        completedAt: "2026-08-25T00:00:06.000Z",
        event: staleEvent,
        generation: 1,
        outputDigest: digest(staleEvent),
        status: "succeeded",
        usage: {},
        usageState: "UNKNOWN",
      }),
    ).toBe("stale");
    journal.close();

    const database = new Database(databasePath, { strict: true });
    expect(
      database
        .query<{ count: number }, []>(
          "SELECT count(*) AS count FROM quarantined_receipts",
        )
        .get()?.count,
    ).toBe(1);
    expect(() =>
      database.run(
        "UPDATE attempts SET snapshot_json = '{}' WHERE attempt_id = ?",
        [secondAttempt.allocation.attemptId],
      ),
    ).toThrow("ATTEMPT_SNAPSHOT_IMMUTABLE");
    expect(
      database
        .query<{ generations: string }, []>(
          "SELECT group_concat(generation, ',') AS generations FROM attempts ORDER BY generation",
        )
        .get()?.generations,
    ).toBe("1,2");
    database.close();
  });

  test("cancellation after allocation but before dispatch leaves the physical call not delivered", () => {
    const databasePath = databaseFixture();
    const journal = EventJournal.open(databasePath);
    const action = proposedAction(journal, {
      actionId: digest("cancel-before-dispatch"),
      executionId: "execution-cancel-before-dispatch",
    });
    const attempt = allocate(journal, action, 1);
    journal.attempts.cancelExecution({
      acceptedAt: "2026-08-25T00:00:04.000Z",
      actorId,
      commandDigest: digest("cancel-before-dispatch-command"),
      commandId: "cancel-before-dispatch-command",
      events: [
        {
          body: {
            executionId: action.executionId,
            schemaVersion: 1,
          },
          streamId: action.executionId,
          type: "execution.cancelled",
        },
      ],
      executionId: action.executionId,
      nonce: "cancel-before-dispatch-nonce",
      pluginId: "curiosity.kernel.control",
    });
    expect(
      journal.attempts.authorizeProviderDispatch({
        actionId: action.actionId,
        attemptId: attempt.allocation.attemptId,
        callId: attempt.allocation.callId,
        generation: 1,
        now: "2026-08-25T00:00:05.000Z",
        requestDigest: attempt.requestDigest,
      }),
    ).toBe("denied");
    journal.close();

    const database = new Database(databasePath, {
      readonly: true,
      strict: true,
    });
    expect(
      database
        .query<
          {
            delivery_certainty: string;
            dispatch_state: string;
            error_code: string;
            status: string;
          },
          []
        >(
          "SELECT delivery_certainty,dispatch_state,error_code,status FROM provider_calls",
        )
        .get(),
    ).toEqual({
      delivery_certainty: "NOT_DELIVERED",
      dispatch_state: "armed",
      error_code: "ACTION_CANCELLED",
      status: "failed",
    });
    database.close();
  });

  test("releases a known resource completion and fences delivery ambiguity", () => {
    const databasePath = databaseFixture();
    const journal = EventJournal.open(databasePath);
    const resource = "workspace:path:claimed.txt";
    const first = proposedAction(journal, {
      actionId: digest("resource-first"),
      actionType: "workspace.write",
      executionId: "execution-resource-first",
      requestedCapabilities: ["filesystem.mutation"],
      resource,
    });
    const third = proposedAction(journal, {
      actionId: digest("resource-third"),
      actionType: "workspace.write",
      executionId: "execution-resource-third",
      requestedCapabilities: ["filesystem.mutation"],
      resource,
    });
    const second = proposedAction(journal, {
      actionId: digest("resource-second"),
      actionType: "workspace.write",
      executionId: "execution-resource-second",
      requestedCapabilities: ["filesystem.mutation"],
      resource,
    });
    const snapshot = (action: StoredAction): ToolAttemptSnapshot => ({
      action: {
        actionId: action.actionId,
        actionType: action.actionType,
        deadlineClass: action.deadlineClass,
        gateClass: action.gateClass,
        inputDigest: action.inputDigest,
        requestedCapabilities: action.requestedCapabilities,
        resource: action.resource,
      },
      catalogDigest: digest("resource-catalog"),
      configDigest: digest("test-config"),
      generation: 1,
      grantedCapabilities: ["filesystem.mutation"],
      policyVersion: "local-v1",
      requestDigest: digest({ actionId: action.actionId }),
      schemaVersion: 1,
      tool: {
        digest: digest("workspace-write-tool"),
        name: "workspace_write",
        pluginId: "curiosity.stock.workspace-mutation",
        pluginVersion: "1.0.0",
        version: "1.0.0",
      },
    });
    const allocateTool = (action: StoredAction, suffix: string) => {
      const toolSnapshot = snapshot(action);
      return journal.attempts.allocateToolAttempt({
        action,
        allocatedAt: `2026-08-25T00:00:0${suffix}.000Z`,
        attemptId: digest({ attempt: suffix }),
        callId: digest({ call: suffix }),
        generation: 1,
        leaseExpiresAt: "2026-08-25T00:10:00.000Z",
        modelToolCallId: `model-tool-${suffix}`,
        ownerId: "curiosity-kernel",
        requestDigest: toolSnapshot.requestDigest,
        snapshot: toolSnapshot,
        snapshotDigest: digest(toolSnapshot),
        toolName: "workspace_write",
        toolVersion: "1.0.0",
      });
    };
    const firstAllocation = allocateTool(first, "3");
    expect(firstAllocation).toMatchObject({ actionId: first.actionId });
    expect(allocateTool(second, "4")).toBe("resource-collision");
    if (!firstAllocation || firstAllocation === "resource-collision")
      throw new Error("TEST_RESOURCE_ALLOCATION_FAILED");
    expect(
      journal.attempts.completeToolCall({
        actionId: first.actionId,
        attemptId: firstAllocation.attemptId,
        callId: firstAllocation.callId,
        completedAt: "2026-08-25T00:00:05.000Z",
        event: {
          body: { actionId: first.actionId, schemaVersion: 1 },
          streamId: first.actionId,
          type: "action.succeeded",
        },
        generation: 1,
        outputDigest: digest("resource-first-completed"),
        status: "succeeded",
      }),
    ).toBe("committed");
    const secondAllocation = allocateTool(second, "6");
    expect(secondAllocation).toMatchObject({ actionId: second.actionId });
    if (!secondAllocation || secondAllocation === "resource-collision")
      throw new Error("TEST_RESOURCE_SECOND_ALLOCATION_FAILED");
    expect(
      journal.attempts.completeToolCall({
        actionId: second.actionId,
        attemptId: secondAllocation.attemptId,
        callId: secondAllocation.callId,
        completedAt: "2026-08-25T00:00:07.000Z",
        errorCode: "WORKSPACE_MUTATION_RECONCILIATION_FAILED",
        event: {
          body: {
            actionId: second.actionId,
            errorCode: "WORKSPACE_MUTATION_RECONCILIATION_FAILED",
            schemaVersion: 1,
          },
          streamId: second.actionId,
          type: "action.failed",
        },
        generation: 1,
        outputDigest: digest("resource-second-unknown"),
        status: "delivery-unknown",
      }),
    ).toBe("committed");
    expect(allocateTool(third, "8")).toBe("resource-collision");
    journal.close();

    const database = new Database(databasePath, {
      readonly: true,
      strict: true,
    });
    expect(
      database
        .query<{ action_id: string; resource: string; status: string }, []>(
          "SELECT action_id,resource,status FROM resource_leases ORDER BY acquired_at",
        )
        .all(),
    ).toEqual([
      { action_id: first.actionId, resource, status: "released" },
      { action_id: second.actionId, resource, status: "fenced" },
    ]);
    database.close();
  });

  test("cancels an active provider stream without allowing a success receipt", async () => {
    const databasePath = databaseFixture();
    let startedResolve: (() => void) | undefined;
    const started = new Promise<void>((resolve) => {
      startedResolve = resolve;
    });
    const generator: TextGenerator = {
      effort: "medium",
      modelId: "test:cancellation",
      stream: async function* ({ abortSignal }) {
        startedResolve?.();
        await new Promise<void>((resolve, reject) => {
          if (abortSignal.aborted) return reject(new Error("cancelled"));
          abortSignal.addEventListener(
            "abort",
            () => reject(new Error("cancelled")),
            { once: true },
          );
        });
        yield "must not complete";
      },
    };
    const harness = createCuriosityHarness({
      actorId,
      authenticationSecret: secret,
      databasePath,
      supervisorPath,
      textGenerator: generator,
      workspaceRoot: path.dirname(databasePath),
    });
    const chat = harness.chat(
      signCommand(
        {
          actorId,
          command: {
            id: "cancel-chat-command",
            kind: "chat.turn",
            payload: {
              assistantMessageId: "cancel-assistant",
              text: "wait",
              threadId: "cancel-thread",
              turnId: "cancel-execution",
              userMessageId: "cancel-user",
            },
            schemaVersion: 1,
          },
          issuedAt: new Date().toISOString(),
          nonce: "cancel-chat-nonce",
          schemaVersion: 1,
        },
        secret,
      ),
    );
    await started;
    const cancellation = await harness.submit(
      signCommand(
        {
          actorId,
          command: {
            id: "cancel-control-command",
            kind: "execution.cancel",
            payload: { executionId: "cancel-execution", schemaVersion: 1 },
            schemaVersion: 1,
          },
          issuedAt: new Date().toISOString(),
          nonce: "cancel-control-nonce",
          schemaVersion: 1,
        },
        secret,
      ),
    );
    expect(cancellation.disposition).toBe("accepted");
    await expect(chat).rejects.toMatchObject({
      _tag: "TextGenerationFailure",
      message: "ACTION_CANCELLED",
    });
    await harness.dispose();

    const database = new Database(databasePath, {
      readonly: true,
      strict: true,
    });
    expect(
      database
        .query<{ count: number }, []>(
          "SELECT count(*) AS count FROM events WHERE event_type = 'action.succeeded'",
        )
        .get()?.count,
    ).toBe(0);
    expect(
      database
        .query<{ count: number }, []>(
          "SELECT count(*) AS count FROM events WHERE event_type = 'turn.failed' AND json_extract(body_json, '$.errorCode') = 'ACTION_CANCELLED'",
        )
        .get()?.count,
    ).toBe(1);
    expect(
      database
        .query<{ count: number }, []>(
          "SELECT count(*) AS count FROM quarantined_receipts",
        )
        .get()?.count,
    ).toBe(1);
    database.close();
  });
});
