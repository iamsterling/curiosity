import assert from "node:assert/strict";
import { test } from "bun:test";
import { createNativeProviderConnections } from "../src/provider-connections-port.ts";

const nativeCatalog = JSON.stringify({
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
          source: "provider-api",
          toolCall: true,
        },
      ],
      name: "ChatGPT / Codex",
    },
  ],
  revision: "native-codex:1",
  schemaVersion: 1,
});

const noRoutePreferences = async () => ({ preferences: [] });
const unusedRouteSelection = async () => assert.fail("unused");
const unusedSetRoute = async () => assert.fail("unused");

test("direct native responses expose metadata but never credentials", async () => {
  const connections = createNativeProviderConnections({
    authenticateProvider: async () => ({
      snapshotJson: nativeCatalog,
      source: "provider-api",
    }),
    disconnectProvider: async () => ({
      snapshotJson: nativeCatalog,
      source: "provider-api",
    }),
    providerConnectionStatus: async () => ({ hasSession: true }),
    providerCatalogSnapshot: async () => ({
      snapshotJson: nativeCatalog,
      source: "provider-api",
    }),
    providerRoutePreferences: noRoutePreferences,
    providerRouteSelection: unusedRouteSelection,
    setProviderRoutePreference: unusedSetRoute,
  });
  const view = await connections.authenticate("openai-oauth");
  assert.equal(view.providerSession, true);
  assert.equal(view.catalog.providers[0]?.models[0]?.id, "gpt-5.4-mini");
  assert.doesNotMatch(
    JSON.stringify(view),
    /sessionToken|accessToken|refreshToken/u,
  );
});

test("native catalog failure falls back to the credential-free chooser", async () => {
  const connections = createNativeProviderConnections({
    authenticateProvider: async () => assert.fail("unused"),
    disconnectProvider: async () => assert.fail("unused"),
    providerConnectionStatus: async () => ({ hasSession: false }),
    providerCatalogSnapshot: async () => {
      throw new Error("CODEX_REQUEST_FAILED");
    },
    providerRoutePreferences: noRoutePreferences,
    providerRouteSelection: unusedRouteSelection,
    setProviderRoutePreference: unusedSetRoute,
  });
  const view = await connections.refresh();
  assert.equal(view.providerSession, false);
  assert.equal(view.source, "embedded");
  assert.deepEqual(
    view.catalog.providers.map(({ id }) => id),
    ["openai-oauth", "openai", "anthropic", "google"],
  );
});

test("invalid native catalogs fail closed", async () => {
  const connections = createNativeProviderConnections({
    authenticateProvider: async () => assert.fail("unused"),
    disconnectProvider: async () => assert.fail("unused"),
    providerConnectionStatus: async () => ({ hasSession: false }),
    providerCatalogSnapshot: async () => ({
      snapshotJson: JSON.stringify({ accessToken: "secret", schemaVersion: 1 }),
      source: "cache",
    }),
    providerRoutePreferences: noRoutePreferences,
    providerRouteSelection: unusedRouteSelection,
    setProviderRoutePreference: unusedSetRoute,
  });
  const view = await connections.refresh();
  assert.equal(view.source, "embedded");
  assert.equal(view.catalog.revision, "embedded-v1");
  assert.doesNotMatch(JSON.stringify(view), /secret/u);
});

test("operator role routes persist through the native preference boundary", async () => {
  let selected;
  const preference = {
    agentId: "generalist",
    modelId: "gpt-5.4-mini",
    providerId: "openai-oauth",
    routeId: "frontier.openai-oauth",
    selectionPolicyId: "apple-operator-role-route-v1",
  };
  const connections = createNativeProviderConnections({
    authenticateProvider: async () => assert.fail("unused"),
    disconnectProvider: async () => assert.fail("unused"),
    providerConnectionStatus: async () => ({ hasSession: true }),
    providerCatalogSnapshot: async () => ({
      snapshotJson: nativeCatalog,
      source: "provider-api",
    }),
    providerRoutePreferences: async () => ({
      preferences: selected ? [preference] : [],
    }),
    providerRouteSelection: unusedRouteSelection,
    setProviderRoutePreference: async (agentId, providerId, modelId) => {
      selected = { agentId, modelId, providerId };
      return { preferences: [preference] };
    },
  });
  const view = await connections.selectRoute(
    "generalist",
    "openai-oauth",
    "gpt-5.4-mini",
  );
  assert.deepEqual(selected, {
    agentId: "generalist",
    modelId: "gpt-5.4-mini",
    providerId: "openai-oauth",
  });
  assert.deepEqual(view.routePreferences.generalist, preference);
});
