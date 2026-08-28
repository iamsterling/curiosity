import { afterEach, describe, expect, test } from "bun:test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { createOpenAiOAuthSearchAdapter } from "../src/research/openai-oauth-search-adapter.js";
import { createRuntimeQueryResearchAdapter } from "../src/research/runtime-query-adapter.js";
import {
  resolveBenchmarkResearchReceipt,
  resolveRuntimeResearchAdapter,
} from "../src/research/runtime-config.js";

const roots: string[] = [];

afterEach(() => {
  for (const root of roots.splice(0))
    rmSync(root, { force: true, recursive: true });
});

describe("Curiosity runtime research adapter", () => {
  test("uses OAuth hosted search and bounded fetch by default with an explicit opt-out", () => {
    const adapter = resolveRuntimeResearchAdapter({}, "/workspace");
    expect(adapter?.receipt).toEqual({
      adapterId: "curiosity-openai-oauth-research",
      adapterVersion: "1.0.0",
      capabilities: ["network.fetch", "network.search"],
      securityProfile: "openai-oauth-research-v1",
    });
    expect(adapter?.search).toBeFunction();
    expect(adapter?.fetch).toBeFunction();
    adapter?.close();

    expect(
      resolveRuntimeResearchAdapter(
        { CURIOSITY_RESEARCH_ADAPTER: "none" },
        "/workspace",
      ),
    ).toBeUndefined();
  });

  test("configures the explicit bounded fetch adapter without search authority", () => {
    const adapter = resolveRuntimeResearchAdapter(
      {
        CURIOSITY_MODEL: "compatible:test",
        CURIOSITY_RESEARCH_FETCH_ADAPTER: "bounded-http",
      },
      "/workspace",
    );
    expect(adapter?.receipt).toMatchObject({
      capabilities: ["network.fetch"],
      securityProfile: "bounded-http-v1",
    });
    expect(adapter?.search).toBeUndefined();
    expect(adapter?.fetch).toBeFunction();
    adapter?.close();
    expect(() =>
      resolveRuntimeResearchAdapter(
        { CURIOSITY_RESEARCH_FETCH_ADAPTER: "unknown" },
        "/workspace",
      ),
    ).toThrow("RESEARCH_FETCH_ADAPTER_UNSUPPORTED");
  });

  test("maps OAuth hosted search URLs into bounded untrusted discovery results", async () => {
    const calls: Array<{
      readonly query: string;
      readonly timeoutMs: number;
    }> = [];
    const adapter = createOpenAiOAuthSearchAdapter({
      now: () => 1_000,
      search: async ({ abortSignal, query, timeoutMs }) => {
        expect(abortSignal.aborted).toBe(false);
        calls.push({ query, timeoutMs });
        return {
          urls: [
            "https://example.com/primary#fragment",
            "https://example.com/primary",
            "file:///private/source",
            "https://example.org/secondary",
            "https://example.net/excess",
          ],
        };
      },
    });
    await expect(
      adapter.search?.({
        deadlineUnixMs: 2_000,
        maxResults: 2,
        query: "bounded evidence",
        requestId: "call-oauth-001",
      }),
    ).resolves.toEqual({
      queriedAt: "1970-01-01T00:00:01.000Z",
      results: [
        {
          canonicalUrl: "https://example.com/primary",
          snippet:
            "Discovered by OpenAI hosted web search for query: bounded evidence",
          title: "example.com/primary",
        },
        {
          canonicalUrl: "https://example.org/secondary",
          snippet:
            "Discovered by OpenAI hosted web search for query: bounded evidence",
          title: "example.org/secondary",
        },
      ],
    });
    expect(calls).toEqual([
      { query: "bounded evidence", timeoutMs: 1_000 },
    ]);
    expect(adapter.receipt).toMatchObject({
      capabilities: ["network.search"],
      securityProfile: "openai-oauth-web-search-v1",
    });
    adapter.close();
    await expect(
      adapter.search?.({
        deadlineUnixMs: 2_000,
        maxResults: 1,
        query: "closed",
        requestId: "call-oauth-002",
      }),
    ).rejects.toThrow("SEARCH_ADAPTER_CLOSED");
  });

  test("preserves a stable OAuth authentication failure at the search boundary", async () => {
    const adapter = createOpenAiOAuthSearchAdapter({
      now: () => 1_000,
      search: () =>
        Promise.reject(new Error("OPENAI_OAUTH_AUTHENTICATION_REQUIRED")),
    });
    await expect(
      adapter.search?.({
        deadlineUnixMs: 2_000,
        maxResults: 1,
        query: "evidence",
        requestId: "call-oauth-auth",
      }),
    ).rejects.toThrow("SEARCH_OPENAI_OAUTH_AUTHENTICATION_REQUIRED");
    adapter.close();
  });

  test("requires explicit benchmark-only authority and isolated state", () => {
    expect(() =>
      resolveRuntimeResearchAdapter(
        { CURIOSITY_RESEARCH_ADAPTER: "benchmark-owned" },
        "/workspace",
      ),
    ).toThrow("RESEARCH_BENCHMARK_ACK_REQUIRED");
    expect(() =>
      resolveRuntimeResearchAdapter(
        {
          CURIOSITY_BENCHMARK_ACQUISITION_ACK:
            "development-benchmark-only",
          CURIOSITY_RESEARCH_ADAPTER: "benchmark-owned",
        },
        "/workspace",
      ),
    ).toThrow("RESEARCH_BENCHMARK_STATE_ROOT_REQUIRED");

    const stateRoot = mkdtempSync(
      path.join(tmpdir(), "curiosity-benchmark-runtime-"),
    );
    roots.push(stateRoot);
    const adapter = resolveRuntimeResearchAdapter(
      {
        CURIOSITY_BENCHMARK_ACQUISITION_ACK:
          "development-benchmark-only",
        CURIOSITY_RESEARCH_ADAPTER: "benchmark-owned",
        CURIOSITY_RESEARCH_FETCH_ADAPTER: "bounded-http",
      },
      "/workspace",
      { benchmarkStateRoot: stateRoot },
    );
    expect(adapter?.receipt).toMatchObject({
      capabilities: ["network.fetch", "network.search"],
      securityProfile: "curiosity-runtime-research-v1",
    });
    expect(adapter?.fetch).toBeFunction();
    expect(adapter?.search).toBeFunction();
    adapter?.close();

    expect(
      resolveBenchmarkResearchReceipt({
        CURIOSITY_BENCHMARK_ACQUISITION_ACK:
          "development-benchmark-only",
        CURIOSITY_RESEARCH_ADAPTER: "benchmark-owned",
        CURIOSITY_RESEARCH_FETCH_ADAPTER: "bounded-http",
      }),
    ).toEqual({
      adapterId: "curiosity-runtime-research",
      adapterVersion: "1.0.0",
      capabilities: ["network.fetch", "network.search"],
      securityProfile: "curiosity-runtime-research-v1",
    });
  });

  test("maps one governed search call and closes exactly once", async () => {
    const calls: Array<{ readonly input: unknown; readonly principal: unknown }> = [];
    let closes = 0;
    const queryCapability = Uint8Array.from([1, 2, 3, 4]);
    const adapter = createRuntimeQueryResearchAdapter({
      queryCapability,
      runtime: {
        close: () => {
          closes += 1;
        },
        webSearch: async (input, principal) => {
          calls.push({ input, principal });
          return {
            results: [
              {
                content: "Evidence excerpt",
                provenance: ["searxng-gateway"],
                title: "Evidence title",
                trust: "untrusted-search-result",
                url: "https://example.com/evidence",
              },
            ],
            status: "ok",
          };
        },
      },
      source: "searxng-gateway",
      workspaceScope: "/workspace",
    });

    await expect(
      adapter.search?.({
        deadlineUnixMs: 2_000,
        maxResults: 2,
        query: "evidence",
        requestId: "call-001",
      }),
    ).resolves.toMatchObject({
      results: [
        {
          canonicalUrl: "https://example.com/evidence",
          snippet: "Evidence excerpt",
          title: "Evidence title",
        },
      ],
    });
    expect(calls).toEqual([
      {
        input: {
          apiVersion: "curiosity.runtime/v0",
          deadlineUnixMs: 2_000,
          maxResults: 2,
          operation: "web_search",
          query: "evidence",
          requestId: "call-001",
          source: "searxng-gateway",
        },
        principal: {
          operation: "web_search",
          queryCapability: expect.any(Uint8Array),
          role: "researcher",
          workspaceScope: "/workspace",
        },
      },
    ]);
    expect(
      (calls[0]?.principal as { readonly queryCapability: Uint8Array })
        .queryCapability,
    ).not.toBe(queryCapability);
    expect(adapter.receipt.capabilities).toEqual(["network.search"]);
    expect(adapter.fetch).toBeUndefined();

    adapter.close();
    adapter.close();
    expect(closes).toBe(1);
    await expect(
      adapter.search?.({
        deadlineUnixMs: 2_000,
        maxResults: 2,
        query: "evidence",
        requestId: "call-002",
      }),
    ).rejects.toThrow("SEARCH_ADAPTER_CLOSED");
  });

  test("maps runtime denial to a stable search failure", async () => {
    const adapter = createRuntimeQueryResearchAdapter({
      queryCapability: Uint8Array.from([1]),
      runtime: {
        close: () => undefined,
        webSearch: () => ({
          diagnostic: { code: "provider_rate_limited" },
          status: "rejected",
        }),
      },
      source: "local",
      workspaceScope: "/workspace",
    });
    await expect(
      adapter.search?.({
        deadlineUnixMs: 2_000,
        maxResults: 1,
        query: "evidence",
        requestId: "call-001",
      }),
    ).rejects.toThrow("SEARCH_RUNTIME_REJECTED_PROVIDER_RATE_LIMITED");
    adapter.close();
  });
});
