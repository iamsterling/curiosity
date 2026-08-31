import assert from "node:assert/strict";
import { test } from "bun:test";
import { createNativeAgentJournal } from "../src/native-agent-journal-port.ts";

const limits = {
  maxActions: 4,
  maxChildren: 2,
  maxDelegationDepth: 2,
  maxNoProgress: 2,
  maxSteps: 8,
};

const start = {
  capabilityCeiling: ["documents.read"],
  contributionId: "generalist-v1",
  contributionVersion: "1",
  depth: 0,
  executionId: "run-1",
  input: { goal: "summarize" },
  limits,
  pluginId: "generalist",
  runId: "run-1",
  sourceEventId: "source-1",
  startedAt: "2026-08-29T12:00:00.000Z",
  state: { phase: "start" },
  workflowName: "generalist",
};

const projection = {
  actionCount: 0,
  capabilityCeiling: ["documents.read"],
  childCount: 0,
  childKey: null,
  contributionId: "generalist-v1",
  contributionVersion: "1",
  createdAt: "2026-08-29T12:00:00.000Z",
  depth: 0,
  errorCode: null,
  executionGeneration: 0,
  executionId: "run-1",
  input: { goal: "summarize" },
  lastProgressKey: null,
  limits,
  noProgressCount: 0,
  parentRunId: null,
  pluginId: "generalist",
  providerAction: null,
  revision: 0,
  runId: "run-1",
  sourceEventId: "source-1",
  state: { phase: "start" },
  stateDigest: "1".repeat(64),
  status: "running",
  updatedAt: "2026-08-29T12:00:00.000Z",
  workflowName: "generalist",
};

const runnableToolAction = {
  actionId: "action-1",
  actionSchemaVersion: 1,
  actionType: "document.read",
  createdAt: "2026-08-29T12:00:01.000Z",
  deadlineClass: "interactive",
  executionGeneration: 0,
  executionId: "run-1",
  gateClass: "binding-human-requested",
  gateReceipt: {
    gateId: "gate:action-1:1",
    payloadDigest: "2".repeat(64),
    proposalRevision: 1,
  },
  input: {
    documentId: "notes.txt",
    maxBytes: 4096,
    rootId: "app-documents-v1",
  },
  inputDigest: "2".repeat(64),
  pluginId: "generalist",
  reactorId: "generalist-v1",
  requestedCapabilities: ["documents.read"],
  resource: "document:notes.txt",
  runId: "run-1",
  sourceEventId: "source-1",
};

test("native agent journal sends only coarse operations without storage authority", async () => {
  const requests = [];
  const journal = createNativeAgentJournal({
    agentJournalCall: async (input) => {
      const request = JSON.parse(input);
      requests.push(request);
      if (request.operation === "startRun")
        return JSON.stringify({
          disposition: "accepted",
          revision: 0,
          runId: request.run.runId,
        });
      if (request.operation === "readRunProjection")
        return JSON.stringify(projection);
      if (request.operation === "runnableRuns")
        return JSON.stringify([projection]);
      if (request.operation === "listRunProjections")
        return JSON.stringify([projection]);
      if (request.operation === "listOperatorRequests")
        return JSON.stringify({
          gates: [
            {
              actionId: "action-1",
              actionType: "document.read",
              createdAt: "2026-08-29T12:00:01.000Z",
              eligibleActorId: "local-owner",
              expiresAt: "2026-08-29T12:10:00.000Z",
              gateId: "gate:action-1:1",
              input: { documentId: "notes.txt" },
              payloadDigest: "2".repeat(64),
              proposalRevision: 1,
              requestedCapabilities: ["documents.read"],
              resource: "document:notes.txt",
              runId: "run-1",
              status: "pending",
            },
          ],
          questions: [
            {
              actionId: "question-action-1",
              allowFreeText: false,
              answer: null,
              executionId: "run-1",
              options: ["safe", "fast"],
              prompt: "Which mode?",
              questionId: "question:question-action-1:1",
              runId: "run-1",
              status: "pending",
            },
          ],
        });
      if (request.operation === "answerQuestion")
        return JSON.stringify({
          actionId: "question-action-1",
          disposition: "accepted",
          runId: "run-1",
        });
      if (request.operation === "decideGate")
        return JSON.stringify({
          actionId: "action-1",
          disposition: "accepted",
          runId: "run-1",
        });
      if (request.operation === "runnableToolActions")
        return JSON.stringify([runnableToolAction]);
      if (request.operation === "reconcileTerminalRuns")
        return JSON.stringify([{ runId: "run-1", status: "completed" }]);
      if (request.operation === "cancelRun")
        return JSON.stringify({
          disposition: "accepted",
          physicalCalls: [
            { callId: "provider-call-1", kind: "provider" },
            { callId: "tool-call-1", kind: "tool" },
          ],
          runId: request.runId,
          status: "cancelled",
        });
      throw new Error("unexpected");
    },
  });
  await journal.startRun(start);
  assert.equal((await journal.readRunProjection("run-1"))?.revision, 0);
  assert.equal((await journal.runnableRuns(8)).length, 1);
  assert.equal((await journal.listRunProjections(128)).length, 1);
  const action = (await journal.runnableToolActions(8))[0];
  assert.equal(action?.actionId, "action-1");
  assert.equal(action?.gateReceipt?.gateId, "gate:action-1:1");
  const operatorRequests = await journal.listOperatorRequests(128);
  assert.equal(operatorRequests.questions[0]?.prompt, "Which mode?");
  assert.equal(operatorRequests.gates[0]?.actionType, "document.read");
  assert.deepEqual(
    await journal.answerQuestion({
      actorId: "local-owner",
      answer: "safe",
      answeredAt: "2026-08-29T12:00:02.000Z",
      commandId: "answer-1",
      questionId: "question:question-action-1:1",
    }),
    {
      actionId: "question-action-1",
      disposition: "accepted",
      runId: "run-1",
    },
  );
  assert.deepEqual(
    await journal.decideGate({
      actorId: "local-owner",
      commandId: "gate-decision-1",
      decidedAt: "2026-08-29T12:00:02.000Z",
      decision: "approved",
      gateId: "gate:action-1:1",
      payloadDigest: "2".repeat(64),
      proposalRevision: 1,
    }),
    { actionId: "action-1", disposition: "accepted", runId: "run-1" },
  );
  assert.deepEqual(
    await journal.reconcileTerminalRuns("2026-08-29T12:00:02.000Z", 8),
    [{ runId: "run-1", status: "completed" }],
  );
  assert.deepEqual(
    await journal.cancelRun("run-1", "2026-08-29T12:00:03.000Z"),
    {
      disposition: "accepted",
      physicalCalls: [
        { callId: "provider-call-1", kind: "provider" },
        { callId: "tool-call-1", kind: "tool" },
      ],
      runId: "run-1",
      status: "cancelled",
    },
  );
  for (const request of requests) {
    assert.equal("databasePath" in request, false);
    assert.equal("catalogDigest" in request, false);
    assert.equal("abiVersion" in request, false);
  }
});

test("native agent journal rejects stale operation identities", async () => {
  const journal = createNativeAgentJournal({
    agentJournalCall: async () =>
      JSON.stringify({
        actionId: "other-action",
        attemptId: "attempt-1",
        callId: "call-1",
        disposition: "armed",
        generation: 1,
      }),
  });
  await assert.rejects(
    journal.armDispatch({
      actionId: "action-1",
      allocatedAt: "2026-08-29T12:00:01.000Z",
      attemptId: "attempt-1",
      callId: "call-1",
      dispatch: {
        kind: "provider",
        modelId: "apple:system-language-model",
        promptSnapshot: {},
        promptSnapshotDigest: "2".repeat(64),
        purpose: "agent.step",
        requestDigest: "3".repeat(64),
        sourceRevision: 0,
      },
      executionId: "run-1",
      generation: 1,
      inputDigest: "4".repeat(64),
      leaseExpiresAt: "2026-08-29T12:10:00.000Z",
      ownerId: "owner-1",
      phase: "allocate",
      snapshot: {},
      snapshotDigest: "5".repeat(64),
    }),
    ({ code }) => code === "NATIVE_AGENT_REVISION_FENCED",
  );
});

test("native agent journal maps stable v3 errors and rejects malformed output", async () => {
  const fenced = createNativeAgentJournal({
    agentJournalCall: async () => {
      throw Object.assign(new Error("fenced"), {
        code: "NATIVE_AGENT_REVISION_FENCED",
      });
    },
  });
  await assert.rejects(
    fenced.startRun(start),
    ({ code }) => code === "NATIVE_AGENT_REVISION_FENCED",
  );

  const malformed = createNativeAgentJournal({
    agentJournalCall: async () => "{}",
  });
  await assert.rejects(
    malformed.readRunProjection("run-1"),
    ({ code }) => code === "NATIVE_JOURNAL_RESPONSE_INVALID",
  );

  const missingGateReceipt = createNativeAgentJournal({
    agentJournalCall: async () =>
      JSON.stringify([{ ...runnableToolAction, gateReceipt: null }]),
  });
  await assert.rejects(
    missingGateReceipt.runnableToolActions(1),
    ({ code }) => code === "NATIVE_JOURNAL_RESPONSE_INVALID",
  );
});
