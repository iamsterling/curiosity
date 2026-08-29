import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { test } from "bun:test";
import {
  appleOnDeviceGenerationSelection,
  createGenerationRouteReceipt,
  createMemoryCurationJob,
} from "@curiosity/authority";
import { createFoundationModelMemoryCurator } from "../src/foundation-model-memory-curator-port.ts";

const sha256 = async (value) =>
  createHash("sha256").update(value).digest("hex");

const fixture = async (native) => {
  const job = await createMemoryCurationJob(
    {
      policyId: "memory-policy-v1",
      sourceDigest: "a".repeat(64),
      sourceMessageIds: ["message-001"],
      sourceTurnId: "turn-001",
    },
    sha256,
  );
  const route = await createGenerationRouteReceipt(
    appleOnDeviceGenerationSelection("memory.curate"),
    job.jobId,
    "b".repeat(64),
    sha256,
  );
  return {
    curator: createFoundationModelMemoryCurator(native),
    job,
    request: (signal, overrides = {}) => ({
      activeMemories: [],
      job,
      messages: [
        {
          content: "The launch date is September 5.",
          messageId: "message-001",
          role: "assistant",
        },
      ],
      route,
      signal,
      ...overrides,
    }),
    route,
  };
};

test("memory curator rejects cancellation and route mismatch before native dispatch", async () => {
  let calls = 0;
  const native = {
    cancelMemoryCuration: async () => {},
    curateMemory: async () => {
      calls += 1;
      throw new Error("unexpected");
    },
  };
  const value = await fixture(native);
  const aborted = new AbortController();
  aborted.abort();
  await assert.rejects(
    value.curator.curate(value.request(aborted.signal)),
    ({ code }) => code === "ACTION_CANCELLED",
  );
  const active = new AbortController();
  await assert.rejects(
    value.curator.curate(
      value.request(active.signal, {
        route: { ...value.route, routeId: "frontier.other" },
      }),
    ),
    ({ code }) => code === "GENERATION_ROUTE_MISMATCH",
  );
  assert.equal(calls, 0);
});

test("memory curator validates native identity and proposal structure", async () => {
  let received;
  const native = {
    cancelMemoryCuration: async () => {},
    curateMemory: async (request) => {
      received = request;
      return {
        durationMs: 4,
        jobId: request.jobId,
        modelId: request.route.modelId,
        policyId: request.policyId,
        proposals: [
          {
            confidence: 0.9,
            content: "The launch date is September 5",
            kind: "fact",
            operation: "create",
            proposedRetention: "bounded",
            proposedSensitivity: "ordinary",
            sourceMessageIds: ["message-001"],
          },
        ],
        selectionId: request.route.selectionId,
        sourceDigest: request.sourceDigest,
      };
    },
  };
  const value = await fixture(native);
  const result = await value.curator.curate(
    value.request(new AbortController().signal),
  );
  assert.equal(received.route.purpose, "memory.curate");
  assert.equal(received.maximumResponseTokens, 768);
  assert.equal(result.proposals[0]?.content, "The launch date is September 5");
});

test("memory curator rejects stale native results", async () => {
  const native = {
    cancelMemoryCuration: async () => {},
    curateMemory: async (request) => ({
      durationMs: 4,
      jobId: request.jobId,
      modelId: request.route.modelId,
      policyId: request.policyId,
      proposals: [],
      selectionId: "c".repeat(64),
      sourceDigest: request.sourceDigest,
    }),
  };
  const value = await fixture(native);
  await assert.rejects(
    value.curator.curate(value.request(new AbortController().signal)),
    ({ code }) => code === "MEMORY_CURATION_RESULT_STALE",
  );
});

test("memory curator forwards active cancellation by exact job id", async () => {
  let resolve;
  const cancelled = [];
  const native = {
    cancelMemoryCuration: async (jobId) => cancelled.push(jobId),
    curateMemory: () => new Promise((next) => (resolve = next)),
  };
  const value = await fixture(native);
  const controller = new AbortController();
  const pending = value.curator.curate(value.request(controller.signal));
  controller.abort();
  resolve({});
  await assert.rejects(pending, ({ code }) => code === "ACTION_CANCELLED");
  assert.deepEqual(cancelled, [value.job.jobId]);
});
