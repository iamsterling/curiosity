import assert from "node:assert/strict";
import { test } from "bun:test";
import { createFoundationModelGeneration } from "../src/foundation-model-generation-port.ts";

const request = (signal, turnId = "turn-1") => ({
  agentId: "agent-1",
  contextPlan: {
    blocks: [],
    contextPlanId: "b".repeat(64),
    estimatedTokens: 0,
    policyId: "ipados-chat-context-v1",
    schemaVersion: 1,
    utf8Bytes: 0,
  },
  messages: [{ content: "Hello", role: "user" }],
  route: {
    adapterVersion: "foundation-models-v1",
    contextPlanId: "b".repeat(64),
    locality: "device",
    modelId: "apple:system-language-model",
    providerId: "apple",
    purpose: "turn.answer",
    requestedRouteId: "on-device.apple",
    routeId: "on-device.apple",
    selectionId: "a".repeat(64),
    selectionPolicyId: "ipados-local-v1",
  },
  signal,
  tools: [],
  turnId,
});

const nativeFixture = (generate) => {
  let listener;
  let removed = false;
  const cancelled = [];
  return {
    cancelled,
    emit: (event) => listener?.(event),
    module: {
      addListener: (_event, nextListener) => {
        listener = nextListener;
        return { remove: () => (removed = true) };
      },
      cancelGeneration: async (turnId) => {
        cancelled.push(turnId);
      },
      generate,
    },
    removed: () => removed,
  };
};

test("generation rejects an already-aborted turn without entering native code", async () => {
  const controller = new AbortController();
  controller.abort();
  let generated = false;
  const fixture = nativeFixture(async () => {
    generated = true;
    throw new Error("unexpected");
  });

  await assert.rejects(
    createFoundationModelGeneration(fixture.module).generate(
      request(controller.signal),
    ),
    ({ code }) => code === "ACTION_CANCELLED",
  );
  assert.equal(generated, false);
});

test("generation rejects a mismatched route without entering native code", async () => {
  const controller = new AbortController();
  let generated = false;
  const fixture = nativeFixture(async () => {
    generated = true;
    throw new Error("unexpected");
  });
  const mismatched = request(controller.signal);
  mismatched.route = {
    ...mismatched.route,
    locality: "frontier",
    providerId: "other",
    requestedRouteId: "frontier.other",
    routeId: "frontier.other",
  };

  await assert.rejects(
    createFoundationModelGeneration(fixture.module).generate(mismatched),
    ({ code }) => code === "GENERATION_ROUTE_MISMATCH",
  );
  assert.equal(generated, false);
});

test("generation emits deltas only for its matching turn", async () => {
  const controller = new AbortController();
  const deltas = [];
  let fixture;
  fixture = nativeFixture(async () => {
    fixture.emit({ delta: "foreign", turnId: "turn-2" });
    fixture.emit({ delta: "Hello", turnId: "turn-1" });
    return {
      durationMs: 3,
      effort: "bounded",
      modelId: "apple:system-language-model",
      text: "Hello",
    };
  });

  const result = await createFoundationModelGeneration(fixture.module).generate(
    request(controller.signal),
    (delta) => deltas.push(delta),
  );

  assert.equal(result.text, "Hello");
  assert.deepEqual(deltas, ["Hello"]);
  assert.equal(fixture.removed(), true);
});

test("generation fails closed when an active turn is aborted", async () => {
  const controller = new AbortController();
  const fixture = nativeFixture(() => new Promise(() => {}));
  const generation = createFoundationModelGeneration(fixture.module).generate(
    request(controller.signal),
  );

  controller.abort();

  await assert.rejects(generation, ({ code }) => code === "ACTION_CANCELLED");
  assert.deepEqual(fixture.cancelled, ["turn-1"]);
  assert.equal(fixture.removed(), true);
});
