import assert from "node:assert/strict";
import { test } from "bun:test";
import { createDurableCuriosityClient } from "../src/durable-curiosity-client.ts";

const stored = (type, body, sequence) => ({
  actorId: "curiosity-kernel",
  aggregateVersion: sequence,
  body,
  catalogDigest: "0".repeat(64),
  causationId: `cause-${sequence}`,
  childExecutionId: "agent-execution:turn-1",
  commandId: `command-${sequence}`,
  contributionId: "curiosity.agent.generalist",
  contributionVersion: "1",
  correlationId: "thread-1",
  eventHash: "0".repeat(64),
  eventId: `event-${sequence}`,
  eventSchemaVersion: 1,
  occurredAt: "2026-08-30T12:00:00.000Z",
  parentExecutionId: "agent-execution:turn-1",
  pluginId: "curiosity.agent.runtime",
  previousHash: "0".repeat(64),
  rootExecutionId: "agent-execution:turn-1",
  sequence,
  streamId: "thread-1",
  type,
});

test("durable client waits for the scheduler-owned terminal projection", async () => {
  const events = [];
  let id = 0;
  let submitted;
  const authority = {
    events: () => events,
    messages: () =>
      events
        .filter(({ type }) => type === "message.appended")
        .map(({ body, sequence }) => ({ ...body, sequence })),
    threads: () => [
      {
        openedBy: "local-ipad-owner",
        sequence: 1,
        threadId: "thread-1",
        title: "Question",
      },
    ],
  };
  const client = createDurableCuriosityClient({
    admission: {
      admit: async (_authority, command) => {
        submitted = command;
        return {
          acknowledgement: {
            actorId: "local-ipad-owner",
            commandId: command.id,
            disposition: "accepted",
            eventCount: 3,
            firstSequence: 1,
            lastSequence: 3,
          },
          run: { disposition: "accepted", revision: 0, runId: "run-1" },
          runId: "run-1",
          turnId: command.payload.turnId,
        };
      },
    },
    cancellation: { cancelTurn: async () => ({}) },
    createAuthority: async () => authority,
    createId: () =>
      ["thread-1", "turn-1", "assistant-1", "command-1", "user-1"][id++],
    scheduler: {
      wake: async () => {
        events.push(
          stored(
            "message.appended",
            {
              durationMs: 0,
              effort: "durable-agent",
              messageId: "assistant-1",
              modelId: "gpt-5.4-mini",
              role: "assistant",
              schemaVersion: 1,
              text: "Durable answer",
              threadId: "thread-1",
              turnId: "turn-1",
            },
            4,
          ),
          stored(
            "turn.completed",
            {
              assistantMessageId: "assistant-1",
              schemaVersion: 1,
              threadId: "thread-1",
              turnId: "turn-1",
            },
            5,
          ),
        );
        return { admittedRuns: 0, drains: [], stopped: "idle" };
      },
    },
    status: async () => ({
      localRuntime: "available",
      mainProvider: "available",
      onDeviceModel: "available",
      profile: "local",
      researchProvider: "unavailable",
      storage: "durable",
    }),
  });

  const deltas = [];
  const turn = await client.submit(
    { mode: "ask", projectId: "project-1", text: "Question" },
    (delta) => deltas.push(delta),
  );

  assert.equal(submitted.payload.projectId, "project-1");
  assert.equal(turn.text, "Durable answer");
  assert.deepEqual(deltas, ["Durable answer"]);
});

test("durable client cancellation delegates the exact turn identity", async () => {
  const turns = [];
  const client = createDurableCuriosityClient({
    admission: { admit: async () => assert.fail("unexpected admission") },
    cancellation: {
      cancelTurn: async (turnId) => {
        turns.push(turnId);
        return {
          disposition: "accepted",
          physicalCalls: [],
          runId: `agent-run:${turnId}`,
          status: "cancelled",
        };
      },
    },
    createAuthority: async () => assert.fail("unexpected authority"),
    createId: () => assert.fail("unexpected id"),
    scheduler: { wake: async () => assert.fail("unexpected wake") },
    status: async () => assert.fail("unexpected status"),
  });

  await client.cancel("turn-cancel");
  assert.deepEqual(turns, ["turn-cancel"]);
});
