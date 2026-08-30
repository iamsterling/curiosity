import assert from "node:assert/strict";
import { test } from "bun:test";
import {
  createMobileGenerationSelection,
  createRoutedGeneration,
} from "../src/mobile-generation-routing.ts";

const providerCatalog = (source = "provider-api") => ({
  providers: [
    {
      authenticationMethods: ["oauth-pkce"],
      connectionState: "connected",
      experimental: true,
      id: "openai-oauth",
      models: [
        {
          id: "gpt-5.4-mini",
          name: "GPT-5.4 mini",
          reasoning: true,
          source,
          toolCall: true,
        },
      ],
      name: "ChatGPT / Codex",
    },
  ],
  revision: "native-codex:1",
  schemaVersion: 1,
});

const native = (snapshot, hasSession = true) => ({
  authenticateProvider: async () => {
    throw new Error("unused");
  },
  disconnectProvider: async () => {
    throw new Error("unused");
  },
  providerConnectionStatus: async () => ({ hasSession }),
  providerCatalogSnapshot: async () => ({
    snapshotJson: JSON.stringify(snapshot),
    source: "provider-api",
  }),
});

test("connected provider-api discovery selects one explicit frontier route", async () => {
  const selection = await createMobileGenerationSelection(
    native(providerCatalog()),
  ).select({
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
    selectionPolicyId: "ipados-frontier-connected-v1",
  });
});

test("connected provider discovery selects the frontier for primary agent steps", async () => {
  const selection = await createMobileGenerationSelection(
    native(providerCatalog()),
  ).select({
    contextPlanId: "b".repeat(64),
    purpose: "agent.step",
    turnId: "run-1",
  });
  assert.equal(selection.locality, "frontier");
  assert.equal(selection.purpose, "agent.step");
});

test("unqualified or unauthenticated catalogs never promote Apple to primary", async () => {
  for (const module of [
    native(providerCatalog("models.dev")),
    native(providerCatalog(), false),
  ]) {
    await assert.rejects(
      createMobileGenerationSelection(module).select({
        contextPlanId: "b".repeat(64),
        purpose: "turn.answer",
        turnId: "turn-1",
      }),
      ({ code }) => code === "PROVIDER_ROUTE_UNAVAILABLE",
    );
  }
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
