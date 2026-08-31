import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { test } from "bun:test";
import { PortableAuthority } from "@curiosity/authority";
import { DurableAgentAdmission } from "../src/durable-agent-admission.ts";

const sha256 = async (value) =>
  createHash("sha256").update(value).digest("hex");

const authority = () =>
  new PortableAuthority({
    actorId: "local-ipad-owner",
    catalogDigest: "0".repeat(64),
    createId: () => "unused",
    now: () => "2026-08-30T12:00:00.000Z",
    sha256,
  });

const command = {
  id: "command-1",
  kind: "chat.turn",
  payload: {
    assistantMessageId: "assistant-1",
    projectId: "project-1",
    text: "Read the project note",
    threadId: "thread-1",
    turnId: "turn-1",
    userMessageId: "user-1",
  },
  schemaVersion: 1,
};

test("chat admission atomically follows the durable turn source with a run", async () => {
  const starts = [];
  const admission = new DurableAgentAdmission({
    journal: {
      startRun: async (input) => {
        starts.push(input);
        return { disposition: "accepted", revision: 0, runId: input.runId };
      },
    },
    now: () => "2026-08-30T12:00:01.000Z",
    platformProfileId: "ipad",
  });

  const result = await admission.admit(authority(), command);

  assert.equal(result.runId, "agent-run:turn-1");
  assert.equal(starts.length, 1);
  assert.deepEqual(starts[0].capabilityCeiling, [
    "documents.read",
    "provider.generate",
  ]);
  assert.equal(starts[0].contributionVersion, "2");
  assert.equal(starts[0].input.projectId, "project-1");
  assert.equal(starts[0].input.platformProfileId, "ipad");
  assert.equal(starts[0].input.text, "Read the project note");
  assert.equal(starts[0].limits.maxChildren, 2);
  assert.equal(starts[0].limits.maxDelegationDepth, 1);
  assert.match(starts[0].sourceEventId, /^[a-f0-9]{64}$/u);
});

test("relaunch reconciliation idempotently creates a run for an orphan turn", async () => {
  const runtime = authority();
  await runtime.submit(command);
  const starts = [];
  const admission = new DurableAgentAdmission({
    journal: {
      startRun: async (input) => {
        starts.push(input);
        return {
          disposition: starts.length === 1 ? "accepted" : "duplicate",
          revision: 0,
          runId: input.runId,
        };
      },
    },
    now: () => "2026-08-30T12:00:01.000Z",
    platformProfileId: "iphone",
  });

  assert.equal((await admission.reconcile(runtime)).length, 1);
  assert.equal((await admission.reconcile(runtime)).length, 1);
  assert.deepEqual(
    starts.map(({ runId, sourceEventId }) => ({ runId, sourceEventId })),
    [
      {
        runId: "agent-run:turn-1",
        sourceEventId: starts[0].sourceEventId,
      },
      {
        runId: "agent-run:turn-1",
        sourceEventId: starts[0].sourceEventId,
      },
    ],
  );
  assert.deepEqual(
    starts.map(({ capabilityCeiling, input }) => ({
      capabilityCeiling,
      platformProfileId: input.platformProfileId,
    })),
    [
      {
        capabilityCeiling: ["documents.read", "provider.generate"],
        platformProfileId: "iphone",
      },
      {
        capabilityCeiling: ["documents.read", "provider.generate"],
        platformProfileId: "iphone",
      },
    ],
  );
});

test("mobile admission rejects a macOS profile before journal access", () => {
  assert.throws(
    () =>
      new DurableAgentAdmission({
        journal: {
          startRun: async () => {
            throw new Error("must not run");
          },
        },
        now: () => "2026-08-30T12:00:01.000Z",
        platformProfileId: "macos-sandboxed",
      }),
    /APPLE_MOBILE_PLATFORM_UNSUPPORTED/u,
  );
});
