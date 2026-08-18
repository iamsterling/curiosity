import { afterEach, describe, expect, test } from "bun:test";

import { createRuntime, runtimeCapabilities } from "../src/index.js";

const NOW = 1_700_000_000_000;
const valid = (overrides: Record<string, unknown> = {}) => ({
  apiVersion: "curiosity.runtime/v0",
  operation: "web_search",
  requestId: "request-1",
  query: "bounded query",
  deadlineUnixMs: NOW + 1_000,
  ...overrides,
});

const open: Array<ReturnType<typeof createRuntime>> = [];
const runtime = () => {
  const instance = createRuntime({ now: () => NOW, nativeProfile: "development" });
  open.push(instance);
  return instance;
};

afterEach(() => {
  for (const instance of open.splice(0)) instance.close();
});

describe("M1 native runtime", () => {
  test("returns the deterministic bounded no-corpus envelope", async () => {
    const instance = runtime();
    const first = await instance.webSearch(valid());
    const second = await instance.webSearch(valid());

    expect(first).toEqual({
      apiVersion: "curiosity.runtime/v0",
      operation: "web_search",
      requestId: "request-1",
      status: "unavailable",
      diagnostic: { code: "corpus_absent", message: "No corpus is available." },
      results: [],
    });
    expect(second).toEqual(first);
    expect(Buffer.byteLength(JSON.stringify(first))).toBeLessThanOrEqual(512);
    expect(first).not.toHaveProperty("result");
    expect(first).not.toHaveProperty("content");
    expect(first).not.toHaveProperty("authority");
  });

  test.each([
    ["invalid_request", "The request is invalid.", null],
    ["invalid_request", "The request is invalid.", valid({ requestId: "bad id" })],
    ["unsupported_version", "The API version is unsupported.", valid({ apiVersion: "v1" })],
    ["unsupported_operation", "The operation is unsupported.", valid({ operation: "fetch" })],
    ["deadline_expired", "The request deadline has expired.", valid({ deadlineUnixMs: NOW })],
    ["limit_exceeded", "A request limit was exceeded.", valid({ maxResults: 11 })],
    ["limit_exceeded", "A request limit was exceeded.", valid({ deadlineUnixMs: NOW + 15_001 })],
  ])("maps %s without reflecting input", async (code, message, request) => {
    expect(await runtime().webSearch(request)).toEqual({
      status: "rejected",
      diagnostic: { code: code as "invalid_request" | "unsupported_version" | "unsupported_operation" | "deadline_expired" | "limit_exceeded", message },
    });
  });

  test("rejects unknown fields before unsupported values", async () => {
    expect(await runtime().webSearch(valid({ apiVersion: "v1", extra: true }))).toEqual({
      status: "rejected",
      diagnostic: { code: "invalid_request", message: "The request is invalid." },
    });
  });

  test("rejects hostile request shapes with a stable diagnostic", async () => {
    const hostile = new Proxy({}, { getPrototypeOf: () => { throw new Error("secret"); } });
    expect(await runtime().webSearch(hostile)).toEqual({
      status: "rejected",
      diagnostic: { code: "invalid_request", message: "The request is invalid." },
    });
  });

  test("enforces request id, query, integer and deadline representation", async () => {
    const instance = runtime();
    for (const request of [
      valid({ requestId: "" }),
      valid({ requestId: "a".repeat(65) }),
      valid({ query: " \n\t" }),
      valid({ maxResults: 1.5 }),
      valid({ deadlineUnixMs: Number.MAX_SAFE_INTEGER + 1 }),
    ]) {
      expect(await instance.webSearch(request)).toEqual({
        status: "rejected",
        diagnostic: { code: "invalid_request", message: "The request is invalid." },
      });
    }
  });

  test("enforces UTF-16 and UTF-8 query limits independently", async () => {
    const instance = runtime();
    expect((await instance.webSearch(valid({ query: "a".repeat(500) }))).status).toBe("unavailable");
    expect((await instance.webSearch(valid({ query: "a".repeat(501) }))).diagnostic.code).toBe("limit_exceeded");
    expect((await instance.webSearch(valid({ query: "😀".repeat(250) }))).status).toBe("unavailable");
    expect((await instance.webSearch(valid({ query: "é".repeat(500) }))).status).toBe("unavailable");
  });

  test("uses ECMAScript trim whitespace semantics", async () => {
    const instance = runtime();
    for (const query of ["\uFEFF", "\u2003", "\u2028"]) {
      expect((await instance.webSearch(valid({ query }))).diagnostic.code).toBe("invalid_request");
    }
    expect((await instance.webSearch(valid({ query: "\u200B" }))).status).toBe("unavailable");
    expect((await instance.webSearch(valid({ query: "\uFEFF".repeat(501) }))).diagnostic.code).toBe("limit_exceeded");
  });

  test("defaults maxResults and accepts its inclusive bounds", async () => {
    const instance = runtime();
    expect((await instance.webSearch(valid())).status).toBe("unavailable");
    expect((await instance.webSearch(valid({ maxResults: 1 }))).status).toBe("unavailable");
    expect((await instance.webSearch(valid({ maxResults: 10 }))).status).toBe("unavailable");
  });

  test("closes idempotently and fails closed afterwards", async () => {
    const instance = runtime();
    instance.close();
    instance.close();
    expect(await instance.webSearch(valid())).toEqual({
      status: "rejected",
      diagnostic: { code: "runtime_failure", message: "The runtime failed." },
    });
  });

  test("discovers only the static M1 capability", () => {
    expect(runtimeCapabilities()).toEqual({
      apiVersions: ["curiosity.runtime/v0"],
      operations: ["web_search"],
      limits: { maxQueryUtf16: 500, maxQueryUtf8: 2000, maxResults: 10, maxDeadlineAheadMs: 15_000, maxConcurrency: 8 },
      network: false,
      corpus: false,
      persistence: false,
    });
  });
});
