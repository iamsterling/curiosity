import { describe, expect, test } from "bun:test";
import {
  decodeProviderCatalogSnapshot,
  embeddedProviderCatalog,
  composeProviderCatalog,
} from "../src/provider-catalog.js";

describe("provider catalog", () => {
  test("exposes disconnected providers without embedding model credentials", () => {
    expect(embeddedProviderCatalog.providers.map(({ id }) => id)).toEqual([
      "openai-oauth",
      "openai",
      "anthropic",
      "google",
    ]);
    expect(
      embeddedProviderCatalog.providers.every(
        ({ connectionState, models }) =>
          connectionState === "disconnected" && models.length === 0,
      ),
    ).toBe(true);
    expect(JSON.stringify(embeddedProviderCatalog)).not.toMatch(
      /"(?:accessToken|apiKey|refreshToken|sessionToken)":/u,
    );
  });

  test("decodes only bounded public catalog fields", () => {
    const decoded = decodeProviderCatalogSnapshot({
      providers: [
        {
          authenticationMethods: ["device-code"],
          connectionState: "connected",
          experimental: true,
          id: "openai-oauth",
          models: [
            {
              contextWindow: 400_000,
              id: "gpt-5.4-mini",
              name: "GPT-5.4 mini",
              reasoning: true,
              source: "provider-api",
              toolCall: true,
            },
          ],
          name: "ChatGPT / Codex",
          sessionToken: "must-not-be-decoded",
        },
      ],
      revision: "broker:42",
      schemaVersion: 1,
    });
    expect(decoded?.providers[0]?.models[0]?.id).toBe("gpt-5.4-mini");
    expect(decoded).not.toHaveProperty("providers.0.sessionToken");
  });

  test("rejects malformed and duplicate provider entries", () => {
    const provider = embeddedProviderCatalog.providers[0];
    expect(
      decodeProviderCatalogSnapshot({
        providers: [provider, provider],
        revision: "duplicate",
        schemaVersion: 1,
      }),
    ).toBeUndefined();
    expect(
      decodeProviderCatalogSnapshot({
        providers: [],
        revision: "bad revision with spaces",
        schemaVersion: 1,
      }),
    ).toBeUndefined();
  });

  test("replaces baseline models after auth and then overlays configuration", () => {
    const model = (
      id: string,
      source: "configured" | "models.dev" | "provider-api",
    ) => ({
      id,
      name: id,
      reasoning: true,
      source,
      toolCall: true,
    });
    const catalog = composeProviderCatalog({
      authenticatedModels: {
        "openai-oauth": [model("provider-model", "provider-api")],
      },
      baseline: {
        ...embeddedProviderCatalog,
        providers: embeddedProviderCatalog.providers.map((provider) =>
          provider.id === "openai-oauth"
            ? { ...provider, models: [model("baseline-model", "models.dev")] }
            : provider,
        ),
      },
      configured: {
        providers: [
          {
            ...embeddedProviderCatalog.providers[0]!,
            models: [model("configured-model", "configured")],
          },
        ],
      },
      connectionStates: { "openai-oauth": "connected" },
      revision: "composed:1",
    });
    const openai = catalog.providers.find(({ id }) => id === "openai-oauth");
    expect(openai?.models.map(({ id }) => id)).toEqual([
      "provider-model",
      "configured-model",
    ]);
    expect(openai?.connectionState).toBe("connected");
  });
});
