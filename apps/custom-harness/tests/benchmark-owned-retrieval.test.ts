import { afterEach, describe, expect, test } from "bun:test";
import {
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import type { ResearchAdapter } from "../src/research/adapter.js";
import { createBenchmarkOwnedResearchAdapter } from "../src/research/benchmark-owned-retrieval-adapter.js";

const roots: string[] = [];

const temporaryRoot = (): string => {
  const root = mkdtempSync(path.join(tmpdir(), "curiosity-owned-retrieval-"));
  roots.push(root);
  return root;
};

const discoveryAdapter = (payload: unknown): ResearchAdapter => ({
  close: () => undefined,
  fetch: async (request) => ({
    body: JSON.stringify(payload),
    canonicalUrl: request.url,
    mediaType: "application/json",
    redirectChain: [],
    retrievedAt: "2026-08-26T12:00:00.000Z",
    statusCode: 200,
  }),
  receipt: {
    adapterId: "test-discovery",
    adapterVersion: "1.0.0",
    capabilities: ["network.fetch"],
    securityProfile: "bounded-http-v1",
  },
});

afterEach(() => {
  for (const root of roots.splice(0))
    rmSync(root, { force: true, recursive: true });
});

describe("benchmark-owned retrieval adapter", () => {
  test("acquires through one fixed connector and replays through Retrieval v3", async () => {
    const stateRoot = temporaryRoot();
    const requests: string[] = [];
    let closes = 0;
    const discovery: ResearchAdapter = {
      close: () => {
        closes += 1;
      },
      fetch: async (request) => {
        requests.push(request.url);
        return {
          body: JSON.stringify({
            pages: [
              {
                excerpt:
                  '<span class="searchmatch">Pokémon</span> GO affected physical activity and public space.',
                key: "Pokémon_Go",
                title: "Pokémon Go",
              },
              {
                excerpt: "Pokémon is a Japanese media franchise.",
                key: "Pokémon",
                title: "Pokémon",
              },
            ],
          }),
          canonicalUrl: request.url,
          mediaType: "application/json",
          redirectChain: [],
          retrievedAt: "2026-08-26T12:00:00.000Z",
          statusCode: 200,
        };
      },
      receipt: {
        adapterId: "test-discovery",
        adapterVersion: "1.0.0",
        capabilities: ["network.fetch"],
        securityProfile: "bounded-http-v1",
      },
    };
    const adapter = createBenchmarkOwnedResearchAdapter({
      discovery,
      now: () => Date.parse("2026-08-26T12:00:00.000Z"),
      queryCapability: new Uint8Array([1, 2, 3, 4]),
      stateRoot,
      workspaceScope: stateRoot,
    });
    const first = await adapter.search?.({
      deadlineUnixMs: Date.parse("2026-08-26T12:00:10.000Z"),
      maxResults: 2,
      query: "Pokémon society",
      requestId: "search-owned-001",
    });

    expect(requests).toEqual([
      "https://en.wikipedia.org/w/rest.php/v1/search/page?q=Pok%C3%A9mon+society&limit=2",
    ]);
    expect(first).toEqual({
      queriedAt: "2026-08-26T12:00:00.000Z",
      results: [
        {
          canonicalUrl: "https://en.wikipedia.org/wiki/Pok%C3%A9mon_Go",
          snippet:
            "Pokémon GO affected physical activity and public space.",
          title: "Pokémon Go",
        },
        {
          canonicalUrl: "https://en.wikipedia.org/wiki/Pok%C3%A9mon",
          snippet: "Pokémon is a Japanese media franchise.",
          title: "Pokémon",
        },
      ],
    });
    const activePath = path.join(stateRoot, "ACTIVE.json");
    const active = JSON.parse(readFileSync(activePath, "utf8"));
    const snapshotRef = active.snapshotRef as string;
    expect(active).toMatchObject({
      connector: "mediawiki-rest-v1",
      projectionSnapshotRef: expect.stringMatching(/^projection:[a-f0-9]{64}$/u),
      schemaVersion: 1,
      snapshotRef: expect.stringMatching(/^snapshot:[a-f0-9]{64}$/u),
    });
    expect(readdirSync(path.join(stateRoot, "captures"))).toHaveLength(1);
    expect(readdirSync(path.join(stateRoot, "snapshots"))).toEqual([
      `${snapshotRef.slice("snapshot:".length)}.json`,
    ]);
    const snapshot = JSON.parse(
      readFileSync(
        path.join(
          stateRoot,
          "snapshots",
          `${snapshotRef.slice("snapshot:".length)}.json`,
        ),
        "utf8",
      ),
    );
    expect(snapshot).toMatchObject({
      connector: "mediawiki-rest-v1",
      documents: expect.arrayContaining([
        expect.objectContaining({
          canonicalUrl: "https://en.wikipedia.org/wiki/Pok%C3%A9mon_Go",
          captureRef: expect.stringMatching(/^capture:[a-f0-9]{64}$/u),
        }),
        expect.objectContaining({
          canonicalUrl: "https://en.wikipedia.org/wiki/Pok%C3%A9mon",
          captureRef: expect.stringMatching(/^capture:[a-f0-9]{64}$/u),
        }),
      ]),
      schemaVersion: 1,
    });
    adapter.close();
    expect(closes).toBe(1);

    const replay = createBenchmarkOwnedResearchAdapter({
      acquisitionMode: "snapshot-only",
      discovery: {
        ...discovery,
        fetch: async () => {
          throw new Error("FETCH_DNS_FAILED");
        },
      },
      now: () => Date.parse("2026-08-26T12:00:01.000Z"),
      queryCapability: new Uint8Array([1, 2, 3, 4]),
      stateRoot,
      workspaceScope: stateRoot,
    });
    await expect(
      replay.search?.({
        deadlineUnixMs: Date.parse("2026-08-26T12:00:11.000Z"),
        maxResults: 1,
        query: "physical activity Pokémon",
        requestId: "search-owned-002",
      }),
    ).resolves.toEqual({
      queriedAt: "2026-08-26T12:00:01.000Z",
      results: [
        {
          canonicalUrl: "https://en.wikipedia.org/wiki/Pok%C3%A9mon_Go",
          snippet:
            "Pokémon GO affected physical activity and public space.",
          title: "Pokémon Go",
        },
      ],
    });
    expect(JSON.parse(readFileSync(activePath, "utf8"))).toEqual(active);
    expect(readdirSync(path.join(stateRoot, "captures"))).toHaveLength(1);
    expect(readdirSync(path.join(stateRoot, "snapshots"))).toHaveLength(1);
    replay.close();

    writeFileSync(
      path.join(
        stateRoot,
        "snapshots",
        `${snapshotRef.slice("snapshot:".length)}.json`,
      ),
      "{}\n",
      { mode: 0o600 },
    );
    expect(() =>
      createBenchmarkOwnedResearchAdapter({
        acquisitionMode: "snapshot-only",
        discovery,
        now: () => Date.parse("2026-08-26T12:00:02.000Z"),
        queryCapability: new Uint8Array([1, 2, 3, 4]),
        stateRoot,
        workspaceScope: stateRoot,
      }),
    ).toThrow("SEARCH_BENCHMARK_STATE_INVALID");
  });

  test("rejects malformed discovery when no owned snapshot exists", async () => {
    const adapter = createBenchmarkOwnedResearchAdapter({
      discovery: {
        close: () => undefined,
        fetch: async (request) => ({
          body: '{"pages":"invalid"}',
          canonicalUrl: request.url,
          mediaType: "application/json",
          redirectChain: [],
          retrievedAt: "2026-08-26T12:00:00.000Z",
          statusCode: 200,
        }),
        receipt: {
          adapterId: "test-malformed-discovery",
          adapterVersion: "1.0.0",
          capabilities: ["network.fetch"],
          securityProfile: "bounded-http-v1",
        },
      },
      now: () => Date.parse("2026-08-26T12:00:00.000Z"),
      queryCapability: new Uint8Array([1]),
      stateRoot: temporaryRoot(),
      workspaceScope: "/workspace",
    });
    await expect(
      adapter.search?.({
        deadlineUnixMs: Date.parse("2026-08-26T12:00:10.000Z"),
        maxResults: 2,
        query: "Pokémon",
        requestId: "search-owned-invalid",
      }),
    ).rejects.toThrow("SEARCH_BENCHMARK_DISCOVERY_INVALID");
    adapter.close();
  });

  test("rejects discovery redirected away from the fixed MediaWiki surface", async () => {
    const adapter = createBenchmarkOwnedResearchAdapter({
      discovery: {
        ...discoveryAdapter({
          pages: [
            {
              excerpt: "Untrusted redirected response",
              key: "Pokémon",
              title: "Pokémon",
            },
          ],
        }),
        fetch: async () => ({
          body: JSON.stringify({
            pages: [
              {
                excerpt: "Untrusted redirected response",
                key: "Pokémon",
                title: "Pokémon",
              },
            ],
          }),
          canonicalUrl: "https://redirected.example/search",
          mediaType: "application/json",
          redirectChain: ["https://redirected.example/search"],
          retrievedAt: "2026-08-26T12:00:00.000Z",
          statusCode: 200,
        }),
      },
      now: () => Date.parse("2026-08-26T12:00:00.000Z"),
      queryCapability: new Uint8Array([1]),
      stateRoot: temporaryRoot(),
      workspaceScope: "/workspace",
    });
    await expect(
      adapter.search?.({
        deadlineUnixMs: Date.parse("2026-08-26T12:00:10.000Z"),
        maxResults: 2,
        query: "Pokémon",
        requestId: "search-owned-redirect",
      }),
    ).rejects.toThrow("SEARCH_BENCHMARK_STATE_INVALID");
    adapter.close();
  });

  test("retains a bounded empty discovery as restart-stable negative evidence", async () => {
    const stateRoot = temporaryRoot();
    const discovery = discoveryAdapter({ pages: [] });
    const adapter = createBenchmarkOwnedResearchAdapter({
      discovery,
      now: () => Date.parse("2026-08-26T12:00:00.000Z"),
      queryCapability: new Uint8Array([1, 2]),
      stateRoot,
      workspaceScope: stateRoot,
    });

    await expect(
      adapter.search?.({
        deadlineUnixMs: Date.parse("2026-08-26T12:00:10.000Z"),
        maxResults: 3,
        query: "no matching benchmark page",
        requestId: "benchmark-empty-001",
      }),
    ).resolves.toMatchObject({ results: [] });
    const active = readFileSync(path.join(stateRoot, "ACTIVE.json"), "utf8");
    expect(readdirSync(path.join(stateRoot, "captures"))).toHaveLength(1);
    expect(readdirSync(path.join(stateRoot, "snapshots"))).toHaveLength(1);
    adapter.close();

    const replay = createBenchmarkOwnedResearchAdapter({
      acquisitionMode: "snapshot-only",
      discovery: discoveryAdapter({ pages: [] }),
      now: () => Date.parse("2026-08-26T12:00:01.000Z"),
      queryCapability: new Uint8Array([1, 2]),
      stateRoot,
      workspaceScope: stateRoot,
    });
    await expect(
      replay.search?.({
        deadlineUnixMs: Date.parse("2026-08-26T12:00:10.000Z"),
        maxResults: 3,
        query: "no matching benchmark page",
        requestId: "benchmark-empty-002",
      }),
    ).resolves.toMatchObject({ results: [] });
    expect(readFileSync(path.join(stateRoot, "ACTIVE.json"), "utf8")).toBe(
      active,
    );
    replay.close();
  });
});
