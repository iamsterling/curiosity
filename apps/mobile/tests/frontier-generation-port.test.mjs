import assert from "node:assert/strict";
import { test } from "bun:test";
import { createFrontierGeneration } from "../src/frontier-generation-port.ts";

const generationRequest = (signal) => ({
  agentId: "generalist",
  contextPlan: {
    blocks: [
      {
        blockId: "message:1",
        content: "user: Hello frontier",
        contentDigest: "c".repeat(64),
        kind: "conversation",
        provenance: "trusted-durable",
        sourceEventIds: [],
      },
    ],
    contextPlanId: "b".repeat(64),
    estimatedTokens: 7,
    policyId: "ipados-chat-context-v1",
    schemaVersion: 1,
    utf8Bytes: 20,
  },
  messages: [{ content: "Hello frontier", role: "user" }],
  route: {
    adapterVersion: "codex-direct-native-v1",
    contextPlanId: "b".repeat(64),
    locality: "frontier",
    modelId: "gpt-5.4-mini",
    providerId: "openai-oauth",
    purpose: "turn.answer",
    requestedRouteId: "frontier.openai-oauth",
    routeId: "frontier.openai-oauth",
    selectionId: "a".repeat(64),
    selectionPolicyId: "ipados-frontier-connected-v1",
  },
  signal,
  tools: [],
  turnId: "turn-1",
});

test("frontier generation sends one bounded call to the direct native client", async () => {
  const calls = [];
  const native = {
    cancelFrontierGeneration: async () => {},
    generateFrontier: async (request) => {
      calls.push(request);
      return {
        callId: request.callId,
        finishReason: "stop",
        maxRetries: 0,
        modelId: request.modelId,
        text: "Hello from Codex",
        transportAttempts: 1,
      };
    },
  };
  const result = await createFrontierGeneration(native).generate(
    generationRequest(new AbortController().signal),
  );

  assert.equal(calls.length, 1);
  assert.deepEqual(calls[0], {
    callId: "turn-1",
    maximumOutputTokens: 2048,
    modelId: "gpt-5.4-mini",
    prompt:
      "Answer the final user message using the durable conversation below.\nReturn only the assistant response.\n\nuser: Hello frontier",
    providerId: "openai-oauth",
  });
  assert.equal(result.modelId, "gpt-5.4-mini");
  assert.equal(result.text, "Hello from Codex");
  assert.deepEqual(result.transportReceipt, {
    callId: "turn-1",
    maxRetries: 0,
    transportAttempts: 1,
  });
});

test("frontier generation fails closed on a route mismatch", async () => {
  let generated = false;
  const request = generationRequest(new AbortController().signal);
  request.route = { ...request.route, modelId: "gpt model with spaces" };
  await assert.rejects(
    createFrontierGeneration({
      cancelFrontierGeneration: async () => {},
      generateFrontier: async () => {
        generated = true;
      },
    }).generate(request),
    ({ code }) => code === "GENERATION_ROUTE_MISMATCH",
  );
  assert.equal(generated, false);
});

test("frontier cancellation cancels only the matching durable call", async () => {
  const controller = new AbortController();
  const cancelled = [];
  const result = createFrontierGeneration({
    cancelFrontierGeneration: async (callId) => cancelled.push(callId),
    generateFrontier: () => new Promise(() => {}),
  }).generate(generationRequest(controller.signal));

  controller.abort();
  await assert.rejects(result, ({ code }) => code === "ACTION_CANCELLED");
  assert.deepEqual(cancelled, ["turn-1"]);
});
