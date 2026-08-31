import assert from "node:assert/strict";
import { test } from "bun:test";
import { DurableAgentControl } from "../src/durable-agent-control.ts";

test("durable operator controls bind actor and payload then wake the scheduler", async () => {
  const requests = [];
  let wakes = 0;
  let ids = 0;
  const control = new DurableAgentControl({
    actorId: "local-owner",
    createId: () => `control-${++ids}`,
    journal: {
      answerQuestion: async (input) => {
        requests.push({ input, operation: "answer" });
        return {
          actionId: "question-action-1",
          disposition: "accepted",
          runId: "run-1",
        };
      },
      decideGate: async (input) => {
        requests.push({ input, operation: "gate" });
        return {
          actionId: "action-1",
          disposition: "accepted",
          runId: "run-1",
        };
      },
      listOperatorRequests: async () => ({ gates: [], questions: [] }),
    },
    now: () => "2026-08-30T12:00:00.000Z",
    scheduler: {
      wake: async () => {
        wakes += 1;
        return { admittedRuns: 0, drains: [], stopped: "idle" };
      },
    },
  });

  assert.deepEqual(
    await control.answerQuestion("question:question-action-1:1", "safe"),
    {
      actionId: "question-action-1",
      disposition: "accepted",
      runId: "run-1",
    },
  );
  assert.deepEqual(
    await control.decideGate(
      {
        gateId: "gate:action-1:1",
        payloadDigest: "2".repeat(64),
        proposalRevision: 1,
      },
      "approved",
    ),
    { actionId: "action-1", disposition: "accepted", runId: "run-1" },
  );
  assert.equal(wakes, 2);
  assert.deepEqual(requests, [
    {
      input: {
        actorId: "local-owner",
        answer: "safe",
        answeredAt: "2026-08-30T12:00:00.000Z",
        commandId: "control-1",
        questionId: "question:question-action-1:1",
      },
      operation: "answer",
    },
    {
      input: {
        actorId: "local-owner",
        commandId: "control-2",
        decidedAt: "2026-08-30T12:00:00.000Z",
        decision: "approved",
        gateId: "gate:action-1:1",
        payloadDigest: "2".repeat(64),
        proposalRevision: 1,
      },
      operation: "gate",
    },
  ]);
});

test("durable operator controls do not wake after a rejected journal mutation", async () => {
  let wakes = 0;
  const control = new DurableAgentControl({
    actorId: "local-owner",
    createId: () => "control-rejected",
    journal: {
      answerQuestion: async () => {
        throw Object.assign(new Error("stale"), {
          code: "NATIVE_AGENT_REVISION_FENCED",
        });
      },
      decideGate: async () => assert.fail("unexpected gate"),
      listOperatorRequests: async () => ({ gates: [], questions: [] }),
    },
    now: () => "2026-08-30T12:00:00.000Z",
    scheduler: {
      wake: async () => {
        wakes += 1;
        return { admittedRuns: 0, drains: [], stopped: "idle" };
      },
    },
  });

  await assert.rejects(
    control.answerQuestion("question:question-action-1:1", "safe"),
    { code: "NATIVE_AGENT_REVISION_FENCED" },
  );
  assert.equal(wakes, 0);
});
