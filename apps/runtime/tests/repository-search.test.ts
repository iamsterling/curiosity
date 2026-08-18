import { afterEach, describe, expect, test } from "bun:test";

import {
  createRuntime,
  SPECIAL_PURPOSE_CIDRS,
  isGlobalUnicastAddress,
  resolvePinnedAddresses,
  type RepositoryTransport,
} from "../src/index.js";

const NOW = 1_700_000_000_000;
const TOKEN = "bootstrap-test-token-never-returned";
const request = (overrides: Record<string, unknown> = {}) => ({
  apiVersion: "curiosity.runtime/v0",
  operation: "web_search",
  requestId: "m5-test",
  query: "bounded query",
  maxResults: 3,
  deadlineUnixMs: NOW + 15_000,
  source: "searxng-gateway",
  ...overrides,
});

const open: Array<ReturnType<typeof createRuntime>> = [];
const response = (body: unknown, overrides: Partial<Awaited<ReturnType<RepositoryTransport>>> = {}) => ({
  status: 200,
  headers: { "content-type": "application/json" },
  body: Buffer.from(JSON.stringify(body)),
  ...overrides,
});
const runtime = (transport: RepositoryTransport, now = () => NOW) => {
  const value = createRuntime({ repository: { source: "searxng-gateway", bearerToken: TOKEN }, repositoryTransport: transport, now, nativeProfile: "development" });
  open.push(value);
  return value;
};

afterEach(() => {
  for (const value of open.splice(0)) value.close();
});

describe("M5 repository search", () => {
  test("omitted source remains local and performs no transport", async () => {
    let calls = 0;
    const value = runtime(async () => { calls += 1; return response({ results: [] }); });
    expect((await value.webSearch(request({ source: undefined }))).status).toBe("unavailable");
    expect(calls).toBe(0);
  });

  test("validates before transport and requires explicit configured source", async () => {
    let calls = 0;
    const value = runtime(async () => { calls += 1; return response({ results: [] }); });
    expect((await value.webSearch(request({ query: "" }))).diagnostic.code).toBe("invalid_request");
    expect((await value.webSearch(request({ source: "other" }))).diagnostic.code).toBe("invalid_request");
    expect(calls).toBe(0);
  });

  test("uses one fixed token-protected provider-neutral POST and normalizes bounded evidence", async () => {
    const calls: unknown[] = [];
    const value = runtime(async (call) => {
      calls.push(call);
      return response({
        results: [
          { title: " First ", url: "https://example.com/a", content: "evidence", engines: ["alpha", "beta"] },
          { title: "duplicate", url: "https://example.com/a", content: "duplicate" },
          { title: "bad", url: "javascript:alert(1)", content: "bad" },
          { title: "Second", url: "https://example.org/b", content: "x".repeat(3_000), engine: "gamma" },
        ],
        unresponsive_engines: [["slow", "timeout"], ["bad"], ...Array.from({ length: 20 }, (_, index) => [`e${index}`, "failure"])],
      });
    });
    const outcome = await value.webSearch(request({ maxResults: 2 }));
    expect(calls).toHaveLength(1);
    expect(calls[0]).toMatchObject({
      url: "https://search.formerhuman.com/agent-search",
      method: "POST",
      headers: { accept: "application/json", authorization: `Bearer ${TOKEN}`, "content-type": "application/json" },
    });
    expect(JSON.parse((calls[0] as { body: string }).body)).toEqual({ query: "bounded query", maxResults: 2 });
    expect(outcome.status).toBe("ok");
    expect(outcome.results).toHaveLength(2);
    expect(outcome.results[0]).toMatchObject({ url: "https://example.com/a", trust: "untrusted-search-result", provenance: ["searxng-gateway", "alpha", "beta"] });
    expect(outcome.results[1].content).toHaveLength(2_000);
    expect(outcome.partialFailures).toHaveLength(16);
    expect(JSON.stringify(outcome)).not.toContain(TOKEN);
  });

  test.each([
    [response({}, { status: 302, headers: { location: "https://elsewhere.invalid" } }), "provider_redirect_rejected"],
    [response({}, { headers: { "content-type": "text/html" } }), "provider_response_invalid"],
    [response({}, { headers: { "content-type": "application/json", "content-encoding": "gzip" } }), "provider_response_invalid"],
    [response({ nope: [] }), "provider_response_invalid"],
    [response({ results: [] }, { body: Buffer.alloc(256_001) }), "provider_response_too_large"],
    [response({}, { status: 401 }), "provider_auth_rejected"],
    [response({}, { status: 429 }), "provider_rate_limited"],
  ])("maps malformed/failed response to stable redacted outcome", async (providerResponse, code) => {
    const outcome = await runtime(async () => providerResponse).webSearch(request());
    expect(outcome).toEqual({ status: "rejected", diagnostic: { code, message: expect.any(String) } });
    expect(JSON.stringify(outcome)).not.toContain(TOKEN);
  });

  test("never retries or falls back after provider failure", async () => {
    let calls = 0;
    const outcome = await runtime(async () => { calls += 1; throw new Error(TOKEN); }).webSearch(request());
    expect(outcome.diagnostic.code).toBe("provider_unavailable");
    expect(calls).toBe(1);
  });

  test("rejects credential reflection anywhere in raw provider bytes", async () => {
    const publicFields = [
      { results: [{ title: TOKEN, url: "https://example.com", content: "ok" }] },
      { results: [{ title: "ok", url: `https://example.com/${TOKEN}`, content: "ok" }] },
      { results: [{ title: "ok", url: "https://example.com", content: TOKEN }] },
      { results: [{ title: "ok", url: "https://example.com", content: "ok", engines: [TOKEN] }] },
      { results: [], unresponsive_engines: [[TOKEN, "reason"]] },
      { results: [], unresponsive_engines: [["source", TOKEN]] },
      { results: [], ignored: { deeply: ["unrecognized", `Bearer ${TOKEN}`] } },
    ];
    for (const body of publicFields) {
      const outcome = await runtime(async () => response(body)).webSearch(request());
      expect(outcome).toEqual({
        status: "rejected",
        diagnostic: { code: "provider_response_invalid", message: "The repository provider response is invalid." },
      });
      expect(JSON.stringify(outcome)).not.toContain(TOKEN);
    }
  });

  test("enforces eight process-wide provider calls", async () => {
    let release!: () => void;
    const blocked = new Promise<void>((resolve) => { release = resolve; });
    const instances = Array.from({ length: 9 }, () => runtime(async () => { await blocked; return response({ results: [] }); }));
    const pending = instances.map((value) => value.webSearch(request()));
    await Bun.sleep(5);
    expect((await pending[8]!).diagnostic.code).toBe("runtime_busy");
    release();
    expect((await Promise.all(pending.slice(0, 8))).every((outcome) => outcome.status === "ok")).toBe(true);
  });

  test("absolute deadline aborts and close suppresses late results", async () => {
    let clock = NOW;
    const deadline = runtime((_call, signal) => new Promise((_resolve, reject) => signal.addEventListener("abort", () => reject(new Error("late")), { once: true })), () => clock);
    const timed = deadline.webSearch(request({ deadlineUnixMs: NOW + 10 }));
    clock += 10;
    expect((await timed).diagnostic.code).toBe("deadline_expired");

    let finish!: (value: Awaited<ReturnType<RepositoryTransport>>) => void;
    const closing = runtime(() => new Promise((resolve) => { finish = resolve; }));
    const pending = closing.webSearch(request());
    closing.close();
    finish(response({ results: [] }));
    expect((await pending).diagnostic.code).toBe("runtime_failure");
  });
});

test("egress policy accepts only global destinations and rejects every special-purpose range boundary", () => {
  for (const address of ["8.8.8.8", "1.1.1.1", "2606:4700:4700::1111", "2001:4860:4860::8888"])
    expect(isGlobalUnicastAddress(address), address).toBe(true);
  for (const { first, last } of SPECIAL_PURPOSE_CIDRS)
    for (const address of [first, last]) expect(isGlobalUnicastAddress(address), address).toBe(false);
  for (const address of ["192.88.99.1", "::ffff:8.8.8.8", "::ffff:0:8.8.8.8", "64:ff9b::808:808", "2002:0808:0808::", "fe80::1%eth0", "fe80::1%bad%zone"])
    expect(isGlobalUnicastAddress(address), address).toBe(false);
});

test("DNS resolution rejects mixed-family or any special answer and returns only validated pins", async () => {
  expect(await resolvePinnedAddresses("search.formerhuman.com", async () => [
    { address: "8.8.8.8", family: 4 }, { address: "1.1.1.1", family: 4 },
  ])).toEqual([{ address: "8.8.8.8", family: 4 }, { address: "1.1.1.1", family: 4 }]);
  for (const answers of [
    [{ address: "8.8.8.8", family: 4 as const }, { address: "2606:4700:4700::1111", family: 6 as const }],
    [{ address: "8.8.8.8", family: 4 as const }, { address: "127.0.0.1", family: 4 as const }],
    [],
  ]) await expect(resolvePinnedAddresses("search.formerhuman.com", async () => answers)).rejects.toMatchObject({ code: "provider_unavailable" });
});
