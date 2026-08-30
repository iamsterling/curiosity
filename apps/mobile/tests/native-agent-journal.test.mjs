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
      throw new Error("unexpected");
    },
  });
  await journal.startRun(start);
  assert.equal((await journal.readRunProjection("run-1"))?.revision, 0);
  assert.equal((await journal.runnableRuns(8)).length, 1);
  assert.equal((await journal.listRunProjections(128)).length, 1);
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

test("native agent journal maps stable v2 errors and rejects malformed output", async () => {
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
});
