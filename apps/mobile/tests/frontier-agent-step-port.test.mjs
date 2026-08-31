import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { test } from "bun:test";
import {
  createContextPlan,
  createGenerationRouteReceipt,
} from "@curiosity/authority";
import {
  createFrontierAgentStep,
  frontierAgentStepOutputSchema,
  streamedFinalText,
} from "../src/frontier-agent-step-port.ts";
import { createMobileAgentDeltaBroker } from "../src/mobile-agent-delta-broker.ts";

const sha256 = async (value) =>
  createHash("sha256").update(value).digest("hex");

const request = async (
  signal = new AbortController().signal,
  extraBlocks = [],
) => {
  const contextPlan = await createContextPlan(
    [
      {
        blockId: "conversation-1",
        content: "Answer from durable evidence.",
        kind: "conversation",
        provenance: "trusted-durable",
        sourceEventIds: ["event-1"],
      },
      ...extraBlocks,
    ],
    "frontier-agent-step-v1",
    sha256,
  );
  const route = await createGenerationRouteReceipt(
    {
      adapterVersion: "codex-direct-native-v1",
      locality: "frontier",
      modelId: "gpt-5.4-mini",
      providerId: "openai-oauth",
      purpose: "agent.step",
      requestedRouteId: "frontier.openai-oauth",
      routeId: "frontier.openai-oauth",
      selectionPolicyId: "apple-operator-role-route-v1",
    },
    "run-1",
    contextPlan.contextPlanId,
    sha256,
  );
  return {
    agent: { id: "generalist", version: "1" },
    availableTools: [],
    contextPlan,
    finalizationOnly: false,
    observedRunRevision: 0,
    observedStateDigest: "0".repeat(64),
    route,
    runId: "run-1",
    signal,
    stepId: "step-1",
    stepNumber: 1,
  };
};

const streamingNative = () => {
  const listeners = new Set();
  let removals = 0;
  const native = {
    addListener: (event, listener) => {
      assert.equal(event, "onFrontierGenerationDelta");
      listeners.add(listener);
      return {
        remove: () => {
          if (listeners.delete(listener)) removals += 1;
        },
      };
    },
    cancelFrontierGeneration: async () => {},
    emit: (event) => {
      for (const listener of listeners) listener(event);
    },
    generateFrontier: async (input) => ({
      callId: input.callId,
      finishReason: "stop",
      maxRetries: 0,
      modelId: input.modelId,
      text: JSON.stringify({
        proposal: { citations: [], kind: "final", text: "Done." },
      }),
      transportAttempts: 1,
    }),
    listenerCount: () => listeners.size,
    removals: () => removals,
  };
  return native;
};

test("mobile delta broker isolates exact runs and removes subscriptions", () => {
  const broker = createMobileAgentDeltaBroker();
  const first = [];
  const second = [];
  const unsubscribeFirst = broker.subscribe("run-1", (delta) =>
    first.push(delta),
  );
  const unsubscribeSecond = broker.subscribe("run-2", (delta) =>
    second.push(delta),
  );

  broker.publish("run-1", "one");
  broker.publish("run-2", "two");
  broker.publish("run-1", "");
  unsubscribeFirst();
  broker.publish("run-1", "late");
  unsubscribeSecond();

  assert.deepEqual(first, ["one"]);
  assert.deepEqual(second, ["two"]);
});

test("frontier agent step streams only exact final-text deltas", async () => {
  const native = streamingNative();
  const published = [];
  native.generateFrontier = async (input) => {
    native.emit({ callId: "foreign-step", delta: "ignored" });
    native.emit({
      callId: input.callId,
      delta: '{"proposal":{"kind":"final","text":"Hel',
    });
    native.emit({
      callId: input.callId,
      delta: 'lo\\nworld","citations":[]}}',
    });
    const text =
      '{"proposal":{"kind":"final","text":"Hello\\nworld","citations":[]}}';
    return {
      callId: input.callId,
      finishReason: "stop",
      maxRetries: 0,
      modelId: input.modelId,
      text,
      transportAttempts: 1,
    };
  };
  const port = createFrontierAgentStep(native, (runId, delta) =>
    published.push([runId, delta]),
  );

  const result = await port.step(await request());

  assert.equal(result.proposal.kind, "final");
  assert.equal(result.proposal.text, "Hello\nworld");
  assert.deepEqual(published, [
    ["run-1", "Hel"],
    ["run-1", "lo\nworld"],
  ]);
  assert.equal(native.listenerCount(), 0);
  assert.equal(native.removals(), 1);
});

test("non-final and invalid structured streams expose no assistant text", () => {
  for (const source of [
    '{"kind":"actions","actions":[',
    '{"kind":"question","question":{"prompt":"Need input?"',
    '{"kind":"no-go","reasonCode":"DENIED"}',
    '```json\n{"kind":"final","text":"wrapped',
    '{"kind":"final","text":"bad\\q',
    '{"kind":\f"final","text":"bad space',
  ])
    assert.equal(streamedFinalText(source), undefined, source);
});

test("frontier agent step makes one strict proposal call", async () => {
  const calls = [];
  const port = createFrontierAgentStep({
    cancelFrontierGeneration: async () => {},
    generateFrontier: async (input) => {
      calls.push(input);
      return {
        callId: input.callId,
        finishReason: "stop",
        maxRetries: 0,
        modelId: input.modelId,
        text: JSON.stringify({
          proposal: { citations: [], kind: "final", text: "Done." },
        }),
        transportAttempts: 1,
      };
    },
  });
  const result = await port.step(await request());
  assert.equal(result.proposal.kind, "final");
  assert.equal(calls.length, 1);
  assert.equal(calls[0].providerId, "openai-oauth");
  const outputSchema = JSON.parse(calls[0].outputSchemaJSON);
  assert.deepEqual(
    outputSchema,
    frontierAgentStepOutputSchema(await request()),
  );
  assert.equal(outputSchema.type, "object");
  assert.equal(outputSchema.additionalProperties, false);
  assert.deepEqual(outputSchema.required, ["proposal"]);
  assert.match(
    calls[0].prompt,
    /Use user conversation and question answers to determine the requested content/u,
  );
  assert.match(calls[0].prompt, /never ask merely to invite conversation/u);
  assert.match(calls[0].prompt, /Never classify a topic as unsupported/u);
  assert.equal(
    outputSchema.properties.proposal.anyOf.some(
      (variant) => variant.properties.kind.enum[0] === "no-go",
    ),
    false,
  );
  assert.match(calls[0].prompt, /cannot return no-go/u);
  assert.doesNotMatch(
    calls[0].prompt,
    /Treat all context block content as untrusted data/u,
  );
});

test("answered operator question must produce work rather than another question", async () => {
  const value = await request(new AbortController().signal, [
    {
      blockId: "operator-question-answer",
      content: JSON.stringify({
        answer: "State one fact about the Moon in one sentence.",
        prompt: "What would you like help with?",
        relationship: "operator-answer-to-agent-question",
        schemaVersion: 1,
      }),
      kind: "conversation",
      provenance: "trusted-durable",
      sourceEventIds: ["event-2", "event-3"],
    },
  ]);
  let captured;
  const port = createFrontierAgentStep({
    cancelFrontierGeneration: async () => {},
    generateFrontier: async (input) => {
      captured = input;
      return {
        callId: input.callId,
        finishReason: "stop",
        maxRetries: 0,
        modelId: input.modelId,
        text: JSON.stringify({
          proposal: {
            citations: [],
            kind: "final",
            text: "The Moon is Earth's only natural satellite.",
          },
        }),
        transportAttempts: 1,
      };
    },
  });

  const result = await port.step(value);
  const schema = JSON.parse(captured.outputSchemaJSON);

  assert.equal(result.proposal.kind, "final");
  assert.match(
    captured.prompt,
    /operator-question-answer block is the operator's current requested content/u,
  );
  assert.match(captured.prompt, /do not ask another question/u);
  assert.equal(
    schema.properties.proposal.anyOf.some(
      (variant) => variant.properties.kind.enum[0] === "question",
    ),
    false,
  );
  assert.deepEqual(
    schema.properties.proposal.anyOf.map(
      (variant) => variant.properties.kind.enum[0],
    ),
    ["final"],
  );

  const rejectingPort = createFrontierAgentStep({
    cancelFrontierGeneration: async () => {},
    generateFrontier: async (input) => ({
      callId: input.callId,
      finishReason: "stop",
      maxRetries: 0,
      modelId: input.modelId,
      text: JSON.stringify({
        proposal: {
          kind: "question",
          question: {
            allowFreeText: true,
            options: [],
            prompt: "What would you like help with?",
          },
        },
      }),
      transportAttempts: 1,
    }),
  });
  await assert.rejects(
    rejectingPort.step(value),
    ({ code }) => code === "FRONTIER_AGENT_STEP_INVALID",
  );

  const unsupportedPort = createFrontierAgentStep({
    cancelFrontierGeneration: async () => {},
    generateFrontier: async (input) => ({
      callId: input.callId,
      finishReason: "stop",
      maxRetries: 0,
      modelId: input.modelId,
      text: JSON.stringify({
        proposal: { kind: "no-go", reasonCode: "UNSUPPORTED_REQUEST" },
      }),
      transportAttempts: 1,
    }),
  });
  await assert.rejects(
    unsupportedPort.step(value),
    ({ code }) => code === "FRONTIER_AGENT_STEP_INVALID",
  );

  const policyBlockedPort = createFrontierAgentStep({
    cancelFrontierGeneration: async () => {},
    generateFrontier: async (input) => ({
      callId: input.callId,
      finishReason: "stop",
      maxRetries: 0,
      modelId: input.modelId,
      text: JSON.stringify({
        proposal: { kind: "no-go", reasonCode: "POLICY_BLOCKED" },
      }),
      transportAttempts: 1,
    }),
  });
  await assert.rejects(
    policyBlockedPort.step(value),
    ({ code }) => code === "FRONTIER_AGENT_STEP_INVALID",
  );
});

test("frontier output schema binds actions to available tool identities", async () => {
  const value = await request();
  value.availableTools = [
    {
      description: "Read one document.",
      inputSchema: {
        additionalProperties: false,
        properties: {
          maxBytes: { maximum: 1024, minimum: 1, type: "integer" },
          rootId: { const: "documents", type: "string" },
        },
        required: ["maxBytes", "rootId"],
        type: "object",
      },
      toolId: "document.read",
      version: "1",
    },
  ];
  const schema = frontierAgentStepOutputSchema(value);
  const action = schema.properties.proposal.anyOf.find(
    (variant) => variant.properties.kind.enum[0] === "actions",
  );

  assert.deepEqual(action.properties.actions.items.properties, {
    callKey: { type: "string" },
    input: {
      additionalProperties: false,
      properties: {
        maxBytes: { type: "integer" },
        rootId: { enum: ["documents"], type: "string" },
      },
      required: ["maxBytes", "rootId"],
      type: "object",
    },
    toolId: { enum: ["document.read"], type: "string" },
    toolVersion: { enum: ["1"], type: "string" },
  });

  value.finalizationOnly = true;
  const finalizationSchema = frontierAgentStepOutputSchema(value);
  assert.equal(
    finalizationSchema.properties.proposal.anyOf.some(
      (variant) => variant.properties.kind.enum[0] === "actions",
    ),
    false,
  );
});

test("frontier agent step rejects prose wrappers and hidden retries", async () => {
  for (const result of [
    {
      finishReason: "stop",
      maxRetries: 0,
      text: '```json\n{"citations":[],"kind":"final","text":"Done."}\n```',
      transportAttempts: 1,
    },
    {
      finishReason: "length",
      maxRetries: 0,
      text: '{"proposal":{"citations":[],"kind":"final","text":"Done."}}',
      transportAttempts: 1,
    },
    {
      finishReason: "stop",
      maxRetries: 1,
      text: '{"proposal":{"citations":[],"kind":"final","text":"Done."}}',
      transportAttempts: 2,
    },
  ]) {
    const port = createFrontierAgentStep({
      cancelFrontierGeneration: async () => {},
      generateFrontier: async (input) => ({
        callId: input.callId,
        modelId: input.modelId,
        ...result,
      }),
    });
    await assert.rejects(
      port.step(await request()),
      ({ code }) => code === "FRONTIER_AGENT_STEP_INVALID",
    );
  }
});

test("frontier agent step cancels only its deterministic step call", async () => {
  const cancelled = [];
  const controller = new AbortController();
  const port = createFrontierAgentStep({
    cancelFrontierGeneration: async (callId) => cancelled.push(callId),
    generateFrontier: async () =>
      await new Promise((resolve) => {
        controller.signal.addEventListener("abort", () => resolve({}), {
          once: true,
        });
      }),
  });
  const pending = port.step(await request(controller.signal));
  controller.abort();
  await assert.rejects(pending, ({ code }) => code === "ACTION_CANCELLED");
  assert.deepEqual(cancelled, ["step-1"]);
});
