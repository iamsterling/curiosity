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
    hasPendingOperatorRequest: async () => false,
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
    {
      agentId: "orchestrator",
      mode: "ask",
      projectId: "project-1",
      text: "Question",
    },
    (delta) => deltas.push(delta),
  );

  assert.equal(submitted.payload.projectId, "project-1");
  assert.equal(submitted.payload.agentId, "orchestrator");
  assert.equal(turn.status, "completed");
  assert.equal(turn.text, "Durable answer");
  assert.deepEqual(deltas, ["Durable answer"]);
});

test("durable session keeps answered questions in transcript order", async () => {
  const events = [
    stored(
      "message.appended",
      {
        messageId: "user-1",
        role: "user",
        text: "Moon",
        threadId: "thread-1",
        turnId: "turn-1",
      },
      1,
    ),
    stored(
      "question.asked",
      {
        options: [],
        prompt: "What would you like to know about the Moon?",
        questionId: "question-1",
      },
      2,
    ),
    stored(
      "question.answered",
      {
        answer: "Anything",
        provenance: "untrusted-user-answer",
        questionId: "question-1",
      },
      3,
    ),
    stored(
      "message.appended",
      {
        messageId: "assistant-1",
        role: "assistant",
        text: "The Moon is Earth's only natural satellite.",
        threadId: "thread-1",
        turnId: "turn-1",
      },
      4,
    ),
  ];
  const authority = {
    events: () => events,
    messages: () =>
      events
        .filter(({ type }) => type === "message.appended")
        .map(({ body, sequence }) => ({ ...body, sequence })),
    threads: () => [],
  };
  const client = createDurableCuriosityClient({
    admission: { admit: async () => assert.fail("unexpected admission") },
    cancellation: { cancelTurn: async () => assert.fail("unexpected cancel") },
    createAuthority: async () => authority,
    createId: () => assert.fail("unexpected id"),
    hasPendingOperatorRequest: async () => assert.fail("unexpected request"),
    scheduler: { wake: async () => assert.fail("unexpected wake") },
    status: async () => assert.fail("unexpected status"),
  });

  assert.deepEqual((await client.session("thread-1")).messages, [
    { messageId: "user-1", role: "user", text: "Moon" },
    {
      messageId: "agent-question:question-1",
      role: "assistant",
      text: "What would you like to know about the Moon?",
    },
    {
      messageId: "agent-question-answer:question-1",
      role: "user",
      text: "Anything",
    },
    {
      messageId: "assistant-1",
      role: "assistant",
      text: "The Moon is Earth's only natural satellite.",
    },
  ]);
});

test("durable session restores project ownership from turn admission", async () => {
  const events = [
    stored(
      "turn.requested",
      {
        projectId: "project:moon",
        threadId: "thread-1",
        turnId: "turn-1",
      },
      1,
    ),
  ];
  const authority = {
    events: () => events,
    messages: () => [],
    threads: () => [
      {
        openedBy: "local-ipad-owner",
        sequence: 1,
        threadId: "thread-1",
        title: "Moon",
      },
    ],
  };
  const client = createDurableCuriosityClient({
    admission: { admit: async () => assert.fail("unexpected admission") },
    cancellation: { cancelTurn: async () => assert.fail("unexpected cancel") },
    createAuthority: async () => authority,
    createId: () => assert.fail("unexpected id"),
    hasPendingOperatorRequest: async () => assert.fail("unexpected request"),
    scheduler: { wake: async () => assert.fail("unexpected wake") },
    status: async () => assert.fail("unexpected status"),
  });

  assert.deepEqual((await client.session()).threads, [
    {
      projectId: "project:moon",
      sequence: 1,
      threadId: "thread-1",
      title: "Moon",
      updatedSequence: 1,
    },
  ]);
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
    hasPendingOperatorRequest: async () => assert.fail("unexpected request"),
    scheduler: { wake: async () => assert.fail("unexpected wake") },
    status: async () => assert.fail("unexpected status"),
  });

  await client.cancel("turn-cancel");
  assert.deepEqual(turns, ["turn-cancel"]);
});

test("durable client forwards transient run deltas without duplicating terminal text", async () => {
  const events = [];
  let listener;
  let unsubscribed = false;
  let subscribedRunId;
  let id = 0;
  const authority = {
    events: () => events,
    messages: () =>
      events
        .filter(({ type }) => type === "message.appended")
        .map(({ body, sequence }) => ({ ...body, sequence })),
    threads: () => [],
  };
  const client = createDurableCuriosityClient({
    admission: {
      admit: async (_authority, command) => ({
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
      }),
    },
    cancellation: { cancelTurn: async () => ({}) },
    createAuthority: async () => authority,
    createId: () =>
      ["thread-1", "turn-1", "assistant-1", "command-1", "user-1"][id++],
    hasPendingOperatorRequest: async () => false,
    scheduler: {
      wake: async () => {
        listener("Durable ");
        listener("answer");
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
    status: async () => assert.fail("unexpected status"),
    subscribeToRunDeltas: (runId, next) => {
      subscribedRunId = runId;
      listener = next;
      return () => {
        listener = undefined;
        unsubscribed = true;
      };
    },
  });
  const deltas = [];

  const turn = await client.submit({ mode: "ask", text: "Question" }, (delta) =>
    deltas.push(delta),
  );

  assert.equal(subscribedRunId, "run-1");
  assert.equal(unsubscribed, true);
  assert.equal(listener, undefined);
  assert.equal(turn.status, "completed");
  assert.equal(turn.text, "Durable answer");
  assert.deepEqual(deltas, ["Durable ", "answer"]);
});

test("durable client rejects unavailable prompt commands before admission", async () => {
  let authorityCalls = 0;
  const client = createDurableCuriosityClient({
    admission: { admit: async () => assert.fail("unexpected admission") },
    cancellation: { cancelTurn: async () => assert.fail("unexpected cancel") },
    createAuthority: async () => {
      authorityCalls += 1;
      return assert.fail("unexpected authority");
    },
    createId: () => assert.fail("unexpected id"),
    hasPendingOperatorRequest: async () => assert.fail("unexpected request"),
    scheduler: { wake: async () => assert.fail("unexpected wake") },
    status: async () => assert.fail("unexpected status"),
  });

  for (const [input, code] of [
    [{ mode: "build", text: "Ship it" }, "PROMPT_COMMAND_UNAVAILABLE:task"],
    [
      { mode: "research", text: "Find sources" },
      "PROMPT_COMMAND_UNAVAILABLE:research",
    ],
    [
      { mode: "overview", text: "/verify the result" },
      "PROMPT_COMMAND_UNAVAILABLE:verify",
    ],
    [{ mode: "overview", text: "/unknown" }, "PROMPT_COMMAND_UNKNOWN"],
  ])
    await assert.rejects(client.submit(input), { message: code });
  assert.equal(authorityCalls, 0);
});

test("durable client returns a resumable wait only for a pending operator request", async () => {
  let id = 0;
  let inspectedRunId;
  const authority = {
    events: () => [],
    messages: () => [],
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
      admit: async (_authority, command) => ({
        acknowledgement: {
          actorId: "local-ipad-owner",
          commandId: command.id,
          disposition: "accepted",
          eventCount: 3,
          firstSequence: 1,
          lastSequence: 3,
        },
        run: { disposition: "accepted", revision: 1, runId: "run-1" },
        runId: "run-1",
        turnId: command.payload.turnId,
      }),
    },
    cancellation: { cancelTurn: async () => ({}) },
    createAuthority: async () => authority,
    createId: () =>
      ["thread-1", "turn-1", "assistant-1", "command-1", "user-1"][id++],
    hasPendingOperatorRequest: async (runId) => {
      inspectedRunId = runId;
      return true;
    },
    scheduler: {
      wake: async () => ({ admittedRuns: 0, drains: [], stopped: "idle" }),
    },
    status: async () => assert.fail("unexpected status"),
  });

  const turn = await client.submit({ mode: "ask", text: "Question" });

  assert.equal(inspectedRunId, "run-1");
  assert.deepEqual(turn, {
    runId: "run-1",
    status: "waiting-for-input",
    threadId: "thread-1",
    threads: [
      {
        sequence: 1,
        threadId: "thread-1",
        title: "Question",
        updatedSequence: 1,
      },
    ],
    turnId: "turn-1",
  });
});

test("durable client does not mislabel an idle stalled run as operator input", async () => {
  let id = 0;
  const authority = { events: () => [], messages: () => [], threads: () => [] };
  const client = createDurableCuriosityClient({
    admission: {
      admit: async (_authority, command) => ({
        acknowledgement: {},
        run: { disposition: "accepted", revision: 1, runId: "run-1" },
        runId: "run-1",
        turnId: command.payload.turnId,
      }),
    },
    cancellation: { cancelTurn: async () => ({}) },
    createAuthority: async () => authority,
    createId: () =>
      ["thread-1", "turn-1", "assistant-1", "command-1", "user-1"][id++],
    hasPendingOperatorRequest: async () => false,
    scheduler: {
      wake: async () => ({ admittedRuns: 0, drains: [], stopped: "idle" }),
    },
    status: async () => assert.fail("unexpected status"),
  });

  await assert.rejects(client.submit({ mode: "ask", text: "Question" }), {
    message: "AGENT_RUN_STALLED",
  });
});
