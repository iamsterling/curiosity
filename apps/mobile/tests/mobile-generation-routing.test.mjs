import assert from "node:assert/strict";
import { test } from "bun:test";
import {
  createMobileGenerationSelection,
  createRoutedGeneration,
} from "../src/mobile-generation-routing.ts";

const native = (selection) => ({
  authenticateProvider: async () => {
    throw new Error("unused");
  },
  disconnectProvider: async () => {
    throw new Error("unused");
  },
  providerConnectionStatus: async () => ({ hasSession: true }),
  providerCatalogSnapshot: async () => assert.fail("unused"),
  providerRoutePreferences: async () => ({ preferences: [] }),
  providerRouteSelection: async (agentId) => {
    if (!selection) throw new Error("CODEX_GENERATION_ROUTE_UNAVAILABLE");
    return { ...selection, agentId };
  },
  setProviderRoutePreference: async () => ({ preferences: [] }),
});

const configured = {
  modelId: "gpt-5.4-mini",
  providerId: "openai-oauth",
  routeId: "frontier.openai-oauth",
  selectionPolicyId: "apple-operator-role-route-v1",
};

test("operator role preference selects one exact frontier route", async () => {
  const selection = await createMobileGenerationSelection(
    native(configured),
  ).select({
    agentId: "generalist",
    contextPlanId: "b".repeat(64),
    purpose: "turn.answer",
    turnId: "turn-1",
  });
  assert.deepEqual(selection, {
    adapterVersion: "codex-direct-native-v1",
    locality: "frontier",
    modelId: "gpt-5.4-mini",
    providerId: "openai-oauth",
    purpose: "turn.answer",
    requestedRouteId: "frontier.openai-oauth",
    routeId: "frontier.openai-oauth",
    selectionPolicyId: "apple-operator-role-route-v1",
  });
});

test("each primary role resolves its configured frontier model", async () => {
  const selection = await createMobileGenerationSelection(
    native(configured),
  ).select({
    agentId: "orchestrator",
    contextPlanId: "b".repeat(64),
    purpose: "agent.step",
    turnId: "run-1",
  });
  assert.equal(selection.locality, "frontier");
  assert.equal(selection.purpose, "agent.step");
});

test("missing and malformed role selections never promote Apple to primary", async () => {
  for (const module of [
    native(undefined),
    native({ ...configured, modelId: "wrong model" }),
  ]) {
    await assert.rejects(
      createMobileGenerationSelection(module).select({
        agentId: "generalist",
        contextPlanId: "b".repeat(64),
        purpose: "turn.answer",
        turnId: "turn-1",
      }),
      ({ code }) => code === "PROVIDER_ROUTE_UNAVAILABLE",
    );
  }
});

test("role selection is required before native route resolution", async () => {
  let nativeCalls = 0;
  const module = native(configured);
  module.providerRouteSelection = async () => {
    nativeCalls += 1;
    return configured;
  };
  await assert.rejects(
    createMobileGenerationSelection(module).select({
      contextPlanId: "b".repeat(64),
      purpose: "agent.step",
      turnId: "run-1",
    }),
    ({ code }) => code === "GENERATION_SELECTION_INVALID",
  );
  assert.equal(nativeCalls, 0);
});

test("routed generation never falls back after frontier dispatch", async () => {
  let deviceCalls = 0;
  let frontierCalls = 0;
  const router = createRoutedGeneration(
    {
      generate: async () => {
        deviceCalls += 1;
        throw new Error("unexpected fallback");
      },
    },
    {
      generate: async () => {
        frontierCalls += 1;
        throw new Error("frontier failed");
      },
    },
  );
  await assert.rejects(
    router.generate({ route: { locality: "frontier" } }),
    /frontier failed/,
  );
  assert.equal(frontierCalls, 1);
  assert.equal(deviceCalls, 0);
});
