import { describe, expect, test } from "bun:test";
import {
  createBoundedHttpResearchAdapter,
  isPublicResearchAddress,
} from "../src/research/bounded-http-adapter.js";

const request = (url: string, overrides: Record<string, unknown> = {}) => ({
  deadlineUnixMs: 2_000,
  maxBytes: 4_096,
  requestId: "fetch-001",
  url,
  ...overrides,
});

describe("bounded HTTP research adapter", () => {
  test("pins public DNS answers, revalidates redirects, and returns bounded UTF-8", async () => {
    const transports: string[] = [];
    const adapter = createBoundedHttpResearchAdapter({
      now: () => 1_000,
      resolveAddresses: async (hostname) =>
        hostname === "source.example"
          ? ["93.184.216.34"]
          : ["142.250.72.14"],
      transport: async (input) => {
        transports.push(`${input.url.toString()}:${input.address}`);
        if (input.url.hostname === "source.example")
          return {
            body: new Uint8Array(),
            headers: { location: "https://evidence.example/final#fragment" },
            statusCode: 302,
          };
        return {
          body: new TextEncoder().encode("Primary evidence"),
          headers: { "content-type": "text/plain; charset=utf-8" },
          statusCode: 200,
        };
      },
    });

    await expect(
      adapter.fetch?.(request("https://source.example/start")),
    ).resolves.toEqual({
      body: "Primary evidence",
      canonicalUrl: "https://evidence.example/final",
      mediaType: "text/plain",
      redirectChain: ["https://evidence.example/final"],
      retrievedAt: "1970-01-01T00:00:01.000Z",
      statusCode: 200,
    });
    expect(transports).toEqual([
      "https://source.example/start:93.184.216.34",
      "https://evidence.example/final:142.250.72.14",
    ]);
    expect(adapter.receipt).toMatchObject({
      capabilities: ["network.fetch"],
      securityProfile: "bounded-http-v1",
    });
  });

  test("denies unsafe schemes, credentials, private answers, and mixed DNS", async () => {
    let transports = 0;
    const adapter = createBoundedHttpResearchAdapter({
      now: () => 1_000,
      resolveAddresses: async (hostname) =>
        hostname === "mixed.example"
          ? ["93.184.216.34", "127.0.0.1"]
          : ["10.0.0.1"],
      transport: async () => {
        transports += 1;
        throw new Error("UNREACHABLE");
      },
    });
    await expect(
      adapter.fetch?.(request("http://public.example/")),
    ).rejects.toThrow("FETCH_URL_DENIED");
    await expect(
      adapter.fetch?.(request("https://user:secret@public.example/")),
    ).rejects.toThrow("FETCH_URL_DENIED");
    await expect(
      adapter.fetch?.(request("https://service.internal./")),
    ).rejects.toThrow("FETCH_URL_DENIED");
    await expect(
      adapter.fetch?.(request("https://public.example:444/")),
    ).rejects.toThrow("FETCH_URL_DENIED");
    await expect(
      adapter.fetch?.(request("https://private.example/")),
    ).rejects.toThrow("FETCH_ADDRESS_DENIED");
    await expect(
      adapter.fetch?.(request("https://mixed.example/")),
    ).rejects.toThrow("FETCH_ADDRESS_DENIED");
    expect(transports).toBe(0);
  });

  test("rejects special-purpose IPv4 and IPv6 destinations conservatively", () => {
    expect(isPublicResearchAddress("93.184.216.34")).toBe(true);
    expect(isPublicResearchAddress("2606:2800:220:1:248:1893:25c8:1946")).toBe(
      true,
    );
    for (const address of [
      "192.31.196.1",
      "192.52.193.1",
      "192.175.48.1",
      "2001::1",
      "2001:db8::1",
      "2002:c0a8:1::1",
      "2620:4f:8000::1",
      "3fff::1",
    ])
      expect(isPublicResearchAddress(address)).toBe(false);
  });

  test("revalidates redirect destinations before a second request", async () => {
    let transports = 0;
    const adapter = createBoundedHttpResearchAdapter({
      now: () => 1_000,
      resolveAddresses: async (hostname) =>
        hostname === "source.example" ? ["93.184.216.34"] : ["169.254.169.254"],
      transport: async () => {
        transports += 1;
        return {
          body: new Uint8Array(),
          headers: { location: "https://metadata.example/latest" },
          statusCode: 302,
        };
      },
    });
    await expect(
      adapter.fetch?.(request("https://source.example/")),
    ).rejects.toThrow("FETCH_ADDRESS_DENIED");
    expect(transports).toBe(1);
  });

  test("rejects oversized, encoded, non-text, malformed, and late responses", async () => {
    const response: {
      body: Uint8Array;
      headers: Record<string, string>;
      statusCode: number;
    } = {
      body: new TextEncoder().encode("too large"),
      headers: { "content-type": "text/plain" },
      statusCode: 200,
    };
    const adapter = createBoundedHttpResearchAdapter({
      now: () => 1_000,
      resolveAddresses: async () => ["93.184.216.34"],
      transport: async () => response,
    });
    await expect(
      adapter.fetch?.(
        request("https://source.example/", { maxBytes: 2 }),
      ),
    ).rejects.toThrow("FETCH_RESPONSE_TOO_LARGE");
    response.headers = {
      "content-encoding": "gzip",
      "content-type": "text/plain",
    };
    await expect(
      adapter.fetch?.(request("https://source.example/")),
    ).rejects.toThrow("FETCH_CONTENT_ENCODING_UNSUPPORTED");
    response.headers = { "content-type": "application/octet-stream" };
    await expect(
      adapter.fetch?.(request("https://source.example/")),
    ).rejects.toThrow("FETCH_MEDIA_TYPE_UNSUPPORTED");
    response.headers = { "content-type": "text/plain" };
    response.body = Uint8Array.from([0xff]);
    await expect(
      adapter.fetch?.(request("https://source.example/")),
    ).rejects.toThrow("FETCH_BODY_NOT_UTF8");
    await expect(
      adapter.fetch?.(
        request("https://source.example/", { deadlineUnixMs: 1_000 }),
      ),
    ).rejects.toThrow("FETCH_DEADLINE_EXCEEDED");
  });

  test("enforces the absolute deadline around the transport", async () => {
    const adapter = createBoundedHttpResearchAdapter({
      resolveAddresses: async () => ["93.184.216.34"],
      transport: () => new Promise(() => undefined),
    });
    await expect(
      adapter.fetch?.(
        request("https://source.example/", {
          deadlineUnixMs: Date.now() + 20,
        }),
      ),
    ).rejects.toThrow("FETCH_DEADLINE_EXCEEDED");
  });

  test("closes idempotently and denies later calls", async () => {
    const adapter = createBoundedHttpResearchAdapter();
    adapter.close();
    adapter.close();
    await expect(
      adapter.fetch?.(request("https://example.com/")),
    ).rejects.toThrow("FETCH_ADAPTER_CLOSED");
  });
});
