import assert from "node:assert/strict";
import { test } from "bun:test";
import { createMobileAgentCancellation } from "../src/mobile-agent-cancellation.ts";

test("cancellation forwards only journal-returned physical call identities", async () => {
  const journalCalls = [];
  const physicalCalls = [];
  const cancellation = createMobileAgentCancellation({
    journal: {
      cancelRun: async (runId, cancelledAt) => {
        journalCalls.push({ cancelledAt, runId });
        return {
          disposition: journalCalls.length === 1 ? "accepted" : "duplicate",
          physicalCalls: [
            { callId: "provider-step-1", kind: "provider" },
            { callId: "document-call-1", kind: "tool" },
          ],
          runId,
          status: "cancelled",
        };
      },
    },
    native: {
      cancelDocumentTool: async (callId) => {
        physicalCalls.push({ callId, kind: "tool" });
      },
      cancelFrontierGeneration: async (callId) => {
        physicalCalls.push({ callId, kind: "provider" });
      },
    },
    now: () => "2026-08-30T13:00:00.000Z",
  });

  assert.equal(
    (await cancellation.cancelTurn("turn-1")).disposition,
    "accepted",
  );
  assert.equal(
    (await cancellation.cancelTurn("turn-1")).disposition,
    "duplicate",
  );
  assert.deepEqual(journalCalls, [
    {
      cancelledAt: "2026-08-30T13:00:00.000Z",
      runId: "agent-run:turn-1",
    },
    {
      cancelledAt: "2026-08-30T13:00:00.000Z",
      runId: "agent-run:turn-1",
    },
  ]);
  assert.deepEqual(physicalCalls, [
    { callId: "provider-step-1", kind: "provider" },
    { callId: "document-call-1", kind: "tool" },
    { callId: "provider-step-1", kind: "provider" },
    { callId: "document-call-1", kind: "tool" },
  ]);
});

test("a physical cancellation failure remains retryable through durable replay", async () => {
  let attempts = 0;
  const cancellation = createMobileAgentCancellation({
    journal: {
      cancelRun: async (runId) => ({
        disposition: attempts === 0 ? "accepted" : "duplicate",
        physicalCalls: [{ callId: "provider-step-1", kind: "provider" }],
        runId,
        status: "cancelled",
      }),
    },
    native: {
      cancelDocumentTool: async () => undefined,
      cancelFrontierGeneration: async () => {
        attempts += 1;
        if (attempts === 1) throw new Error("transient");
      },
    },
    now: () => "2026-08-30T13:00:00.000Z",
  });

  await assert.rejects(
    cancellation.cancelTurn("turn-1"),
    ({ code }) => code === "AGENT_PHYSICAL_CANCELLATION_FAILED",
  );
  assert.equal((await cancellation.cancelTurn("turn-1")).status, "cancelled");
  assert.equal(attempts, 2);
});
