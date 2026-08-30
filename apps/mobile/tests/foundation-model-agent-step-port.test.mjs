import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { test } from "bun:test";
import {
  appleOnDeviceGenerationSelection,
  createContextPlan,
  createGenerationRouteReceipt,
} from "@curiosity/authority";
import { createFoundationModelAgentStep } from "../src/foundation-model-agent-step-port.ts";

const sha256 = async (value) =>
  createHash("sha256").update(value).digest("hex");

const fixture = async (native, content = "Summarize the document.") => {
  const contextPlan = await createContextPlan(
    [
      {
        blockId: "conversation-1",
        content,
        kind: "conversation",
        provenance: "untrusted-evidence",
        sourceEventIds: ["event-1"],
      },
    ],
    "agent-step-v1",
    sha256,
  );
  const route = await createGenerationRouteReceipt(
    appleOnDeviceGenerationSelection("agent.step"),
    "step-1",
    contextPlan.contextPlanId,
    sha256,
  );
  const controller = new AbortController();
  return {
    controller,
    port: createFoundationModelAgentStep(native),
    request: {
      agent: { id: "generalist", version: "1" },
      availableTools: [
        {
          description: "Read one governed document.",
          inputSchema: {
            additionalProperties: false,
            properties: { documentId: { type: "string" } },
            required: ["documentId"],
            type: "object",
          },
          toolId: "document.read",
          version: "1",
        },
      ],
      contextPlan,
      finalizationOnly: false,
      observedRunRevision: 3,
      observedStateDigest: "a".repeat(64),
      route,
      runId: "run-1",
      signal: controller.signal,
      stepId: "step-1",
      stepNumber: 4,
    },
  };
};

const result = (request, proposal) => ({
  contextPlanId: request.contextPlan.contextPlanId,
  durationMs: 12,
  modelId: request.route.modelId,
  observedRunRevision: request.observedRunRevision,
  observedStateDigest: request.observedStateDigest,
  proposal,
  runId: request.runId,
  selectionId: request.route.selectionId,
  stepId: request.stepId,
  stepNumber: request.stepNumber,
});

test("agent step performs exactly one structured native call", async () => {
  const requests = [];
  let fixtureValue;
  const native = {
    agentStep: async (request) => {
      requests.push(request);
      return result(fixtureValue.request, {
        actions: [
          {
            callKey: "read-1",
            input: { documentId: "document-1" },
            toolId: "document.read",
            toolVersion: "1",
          },
        ],
        kind: "actions",
      });
    },
    cancelAgentStep: async () => {},
  };
  fixtureValue = await fixture(native);
  const output = await fixtureValue.port.step(fixtureValue.request);
  assert.equal(output.proposal.kind, "actions");
  assert.equal(requests.length, 1);
  assert.equal(requests[0].maximumResponseTokens, 768);
  assert.equal(requests[0].route.purpose, "agent.step");
  assert.match(requests[0].availableTools[0].inputSchemaJSON, /documentId/u);
});

test("agent step rejects stale identity and malformed proposals without retry", async () => {
  let calls = 0;
  let fixtureValue;
  const native = {
    agentStep: async () => {
      calls += 1;
      return {
        ...result(fixtureValue.request, { kind: "unknown" }),
        stepNumber: 99,
      };
    },
    cancelAgentStep: async () => {},
  };
  fixtureValue = await fixture(native);
  await assert.rejects(
    fixtureValue.port.step(fixtureValue.request),
    ({ code }) => code === "AGENT_STEP_RESULT_STALE",
  );
  assert.equal(calls, 1);

  const malformed = {
    agentStep: async () => {
      calls += 1;
      return result(fixtureValue.request, { kind: "unknown" });
    },
    cancelAgentStep: async () => {},
  };
  fixtureValue.port = createFoundationModelAgentStep(malformed);
  await assert.rejects(
    fixtureValue.port.step(fixtureValue.request),
    ({ code }) => code === "AGENT_STEP_PROPOSAL_INVALID",
  );
  assert.equal(calls, 2);
});

test("agent step fails route and context preflight before native dispatch", async () => {
  let calls = 0;
  const native = {
    agentStep: async () => {
      calls += 1;
      throw new Error("unexpected");
    },
    cancelAgentStep: async () => {},
  };
  const normal = await fixture(native);
  await assert.rejects(
    normal.port.step({
      ...normal.request,
      route: { ...normal.request.route, routeId: "frontier.other" },
    }),
    ({ code }) => code === "GENERATION_ROUTE_MISMATCH",
  );
  const oversized = await fixture(native, "x".repeat(8_000));
  await assert.rejects(
    oversized.port.step(oversized.request),
    ({ code }) => code === "FOUNDATION_MODEL_CONTEXT_EXCEEDED",
  );
  assert.equal(calls, 0);
});

test("agent step forwards cancellation by exact step identity", async () => {
  const cancelled = [];
  let resolve;
  let fixtureValue;
  const native = {
    agentStep: () => new Promise((next) => (resolve = next)),
    cancelAgentStep: async (stepId) => cancelled.push(stepId),
  };
  fixtureValue = await fixture(native);
  const pending = fixtureValue.port.step(fixtureValue.request);
  fixtureValue.controller.abort();
  resolve(
    result(fixtureValue.request, {
      citations: [],
      kind: "final",
      text: "Done",
    }),
  );
  await assert.rejects(pending, ({ code }) => code === "ACTION_CANCELLED");
  assert.deepEqual(cancelled, ["step-1"]);
});
