import { afterEach, describe, expect, test } from "bun:test";
import { existsSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync, mkdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { createOwnedCrawlAdmin, evaluateRobots, type OwnedCrawlTransport } from "../src/admin.js";
import { createOwnedSnapshotQuery } from "../src/owned-query.js";

const ADMIN = Buffer.from("m4-m6-admin-capability");
const fixtureRoot = resolve(import.meta.dir, "../fixtures/m6-owned/v1.0.0");
const roots: string[] = [];
const digest = (value: Uint8Array) => new Bun.CryptoHasher("sha256").update(value).digest("hex");
const root = () => { const value = mkdtempSync(join(realpathSync(tmpdir()), "curiosity-m6-")); roots.push(value); mkdirSync(join(value, "authority")); writeFileSync(join(value, "authority/admin.sha256"), `${digest(ADMIN)}\n`); return value; };
afterEach(() => { for (const path of roots.splice(0)) rmSync(path, { recursive: true, force: true }); });

const fixtureTransport = (mutate?: (url: URL, response: { status: number; headers: Record<string, string>; body: Uint8Array }) => void): OwnedCrawlTransport => async (url) => {
  const route = url.pathname === "/robots.txt" ? "robots.txt" : `site${url.pathname === "/" ? "/index.html" : url.pathname}`;
  const body = new Uint8Array(readFileSync(join(fixtureRoot, route)));
  const response = { status: 200, headers: { "content-type": route.endsWith(".txt") ? "text/plain; charset=utf-8" : "text/html; charset=utf-8", "content-encoding": "identity" }, body };
  mutate?.(url, response);
  return response;
};

describe("M4 durable owned-crawl jobs", () => {
  test("enforces operation, digest idempotency, immutable settlement, bounded replay, and cancellation", async () => {
    const stateRoot = root();
    const admin = createOwnedCrawlAdmin({ stateRoot, adminCapability: ADMIN, transport: fixtureTransport(), safeguard: async () => true });
    expect(admin.enqueue({ operation: "other" as never, idempotencyKey: "a", seed: "https://docs.m6-owned.test/" })).toMatchObject({ status: "rejected" });
    const first = admin.enqueue({ operation: "build_owned_crawl_snapshot", idempotencyKey: "same", seed: "https://docs.m6-owned.test/" });
    expect(first).toMatchObject({ status: "ok", job: { state: "queued" } });
    expect(admin.enqueue({ operation: "build_owned_crawl_snapshot", idempotencyKey: "same", seed: "https://docs.m6-owned.test/" })).toEqual(first);
    expect(admin.enqueue({ operation: "build_owned_crawl_snapshot", idempotencyKey: "same", seed: "https://docs.m6-owned.test/guide.html" })).toMatchObject({ status: "rejected", diagnostic: { code: "idempotency_conflict" } });
    expect(admin.enqueue({ operation: "build_owned_crawl_snapshot", idempotencyKey: "query", seed: "https://docs.m6-owned.test/?crawl=all" })).toMatchObject({ status: "rejected" });
    expect(admin.enqueue({ operation: "build_owned_crawl_snapshot", idempotencyKey: "userinfo", seed: "https://owner@docs.m6-owned.test/" })).toMatchObject({ status: "rejected" });
    expect(admin.cancel(first.job!.id)).toMatchObject({ status: "ok", job: { state: "cancelled" } });
    expect(admin.cancel(first.job!.id)).toMatchObject({ status: "ok", job: { state: "cancelled" } });
    const events = admin.readEvents({ jobId: first.job!.id, cursor: 1, limit: 2 });
    expect(events.status).toBe("ok"); expect(events.events!.length).toBeLessThanOrEqual(2);
    expect(events.events!.every((event: { sequence: number }, index: number, values: Array<{ sequence: number }>) => index === 0 || event.sequence > values[index - 1]!.sequence)).toBe(true);
    expect(admin.readEvents({ jobId: first.job!.id, cursor: 1, limit: 2 }).events).toEqual(events.events);
  });

  test("runs cooperatively to an inactive candidate with immutable capture/citation lineage", async () => {
    const stateRoot = root();
    const admin = createOwnedCrawlAdmin({ stateRoot, adminCapability: ADMIN, transport: fixtureTransport(), safeguard: async () => true });
    const queued = admin.enqueue({ operation: "build_owned_crawl_snapshot", idempotencyKey: "success", seed: "https://docs.m6-owned.test/" });
    const outcome = await admin.runNext();
    expect(outcome).toMatchObject({ status: "ok", job: { id: queued.job!.id, state: "succeeded" }, snapshot: { state: "inactive_candidate", language: "en-US", region: "US" } });
    expect(outcome.snapshot!.documents).toHaveLength(8);
    expect(outcome.snapshot!.documents.every((document: { captureId: string; citation: { captureId: string }; url: string }) => document.captureId && document.citation.captureId === document.captureId && document.url.startsWith("https://docs.m6-owned.test/"))).toBe(true);
    expect(admin.getJob(queued.job!.id)).toMatchObject({ status: "ok", job: { state: "succeeded" } });
    expect(existsSync(join(stateRoot, "snapshots", `${outcome.snapshot!.id}.json`))).toBe(true);
    mkdirSync(join(stateRoot, "authority"), { recursive: true });
    const queryCapability = Buffer.from("m6-query-capability"); writeFileSync(join(stateRoot, "authority/query.sha256"), `${digest(queryCapability)}\n`);
    const query = createOwnedSnapshotQuery({ stateRoot, queryCapability });
    const ranked: any = query.search({ snapshotId: outcome.snapshot!.id, query: "Starweave calibration", maxResults: 2 });
    expect(ranked).toMatchObject({ status: "ok", analyzerVersion: "lexical-v1" });
    expect(ranked.results[0]).toMatchObject({ score: 2 }); expect(typeof ranked.results[0].citation.captureId).toBe("string");
    expect(query.search({ snapshotId: outcome.snapshot!.id, query: "token-not-present", maxResults: 2 })).toEqual({ status: "no_answer", analyzerVersion: "lexical-v1", results: [] });
    const qrels = JSON.parse(readFileSync(join(fixtureRoot, "qrels.json"), "utf8")); const held = qrels.judgments.filter((judgment: { split: string }) => judgment.split === "held-out");
    expect(qrels.judgments.filter((judgment: { split: string }) => judgment.split === "development")).toHaveLength(6); expect(held).toHaveLength(6);
    for (const judgment of held) {
      const evaluated: any = query.search({ snapshotId: outcome.snapshot!.id, query: judgment.query, maxResults: Math.max(1, judgment.expectedOrder.length) });
      expect(evaluated.status).toBe(judgment.noAnswer ? "no_answer" : "ok");
      expect(evaluated.results.map((result: { documentId: string }) => result.documentId)).toEqual(judgment.expectedOrder);
    }
    const snapshotPath = join(stateRoot, "snapshots", `${outcome.snapshot!.id}.json`); const projectionPath = join(stateRoot, "projections/m6", `${outcome.snapshot!.id}.json`);
    const snapshotBackup = readFileSync(snapshotPath); const projectionBackup = readFileSync(projectionPath);
    writeFileSync(projectionPath, "[]\n");
    expect(query.search({ snapshotId: outcome.snapshot!.id, query: "Starweave", maxResults: 2 })).toMatchObject({ status: "rejected", diagnostic: { code: "projection_corrupt" } });
    expect(admin.rebuildProjection(outcome.snapshot!.id)).toMatchObject({ status: "ok" });
    expect(query.search({ snapshotId: outcome.snapshot!.id, query: "Starweave", maxResults: 2 })).toMatchObject({ status: "ok" });
    expect(admin.withdrawSnapshot(outcome.snapshot!.id)).toMatchObject({ status: "ok", state: "withdrawn" });
    expect(query.search({ snapshotId: outcome.snapshot!.id, query: "Starweave", maxResults: 2 })).toEqual({ status: "no_answer", analyzerVersion: "lexical-v1", results: [] });
    expect(admin.rebuildProjection(outcome.snapshot!.id)).toMatchObject({ status: "rejected", diagnostic: { code: "snapshot_withdrawn" } });
    expect(admin.deleteSnapshot(outcome.snapshot!.id)).toMatchObject({ status: "ok", state: "deleted" });
    writeFileSync(snapshotPath, snapshotBackup); writeFileSync(projectionPath, projectionBackup);
    expect(query.search({ snapshotId: outcome.snapshot!.id, query: "Starweave", maxResults: 2 })).toEqual({ status: "no_answer", analyzerVersion: "lexical-v1", results: [] });
    query.close();
    admin.close();
  });

  test("persists zero capture bytes when the synthetic safeguard is unavailable", async () => {
    const stateRoot = root();
    const admin = createOwnedCrawlAdmin({ stateRoot, adminCapability: ADMIN, transport: fixtureTransport(), safeguard: async () => { throw new Error("unavailable"); } });
    admin.enqueue({ operation: "build_owned_crawl_snapshot", idempotencyKey: "blocked", seed: "https://docs.m6-owned.test/" });
    expect(await admin.runNext()).toMatchObject({ status: "ok", job: { state: "failed", diagnostic: "safeguard_unavailable" } });
    expect(existsSync(join(stateRoot, "snapshots"))).toBe(false);
    expect(existsSync(join(stateRoot, "captures"))).toBe(false);
  });

  test("recovers attempt_started without settlement as abandoned and refetches once", async () => {
    const stateRoot = root(); let exchanges = 0;
    const admin = createOwnedCrawlAdmin({ stateRoot, adminCapability: ADMIN, transport: async (...args) => { exchanges += 1; return fixtureTransport()(...args); }, safeguard: async () => true });
    const queued = admin.enqueue({ operation: "build_owned_crawl_snapshot", idempotencyKey: "recover", seed: "https://docs.m6-owned.test/" });
    const path = join(stateRoot, "jobs", `${queued.job!.id}.json`);
    const record = JSON.parse(readFileSync(path, "utf8")); record.state = "running"; record.attempt = 1; writeFileSync(path, `${JSON.stringify(record)}\n`);
    expect(await admin.runNext()).toMatchObject({ status: "ok", job: { state: "succeeded", attempt: 2 } });
    expect(exchanges).toBeLessThanOrEqual(16);
    expect(admin.readEvents({ jobId: queued.job!.id, cursor: 1, limit: 100 }).events!.map((event: { type: string }) => event.type)).toContain("attempt_abandoned");
  });

  test("cancellation requested during final safeguard wins over stale successful settlement", async () => {
    const stateRoot = root(); let release!: (value: boolean) => void;
    const safeguard = new Promise<boolean>((resolve) => { release = resolve; });
    const admin = createOwnedCrawlAdmin({ stateRoot, adminCapability: ADMIN, transport: fixtureTransport(), safeguard: async () => safeguard });
    const queued = admin.enqueue({ operation: "build_owned_crawl_snapshot", idempotencyKey: "cancel-race", seed: "https://docs.m6-owned.test/" });
    const running = admin.runNext();
    while (admin.getJob(queued.job!.id).job!.state !== "running") await Bun.sleep(1);
    expect(admin.cancel(queued.job!.id)).toMatchObject({ status: "ok", job: { state: "cancel_requested" } });
    release(true);
    expect(await running).toMatchObject({ status: "ok", job: { state: "cancelled" } });
    expect(existsSync(join(stateRoot, "snapshots"))).toBe(false);
  });

  test("repairs deterministic idempotency orphans after interrupted submission", () => {
    for (const faultPoint of ["after-job-write", "after-idempotency-write"] as const) {
      const stateRoot = root(); let faulted = false;
      const admin = createOwnedCrawlAdmin({ stateRoot, adminCapability: ADMIN, transport: fixtureTransport(), safeguard: async () => true,
        submissionFault(point) { if (!faulted && point === faultPoint) { faulted = true; throw new Error("fault"); } } });
      expect(() => admin.enqueue({ operation: "build_owned_crawl_snapshot", idempotencyKey: faultPoint, seed: "https://docs.m6-owned.test/" })).toThrow("fault");
      const repaired = admin.enqueue({ operation: "build_owned_crawl_snapshot", idempotencyKey: faultPoint, seed: "https://docs.m6-owned.test/" });
      expect(repaired).toMatchObject({ status: "ok", job: { state: "queued" } });
      expect(admin.enqueue({ operation: "build_owned_crawl_snapshot", idempotencyKey: faultPoint, seed: "https://docs.m6-owned.test/" })).toEqual(repaired);
      expect(admin.readEvents({ jobId: repaired.job!.id }).events).toHaveLength(1);
    }
  });

  test("recovers a dead writer owner but fails closed for malformed lock identity", () => {
    const stateRoot = root(); writeFileSync(join(stateRoot, "writer.lock"), "99999999\n");
    const admin = createOwnedCrawlAdmin({ stateRoot, adminCapability: ADMIN, transport: fixtureTransport(), safeguard: async () => true });
    expect(admin.enqueue({ operation: "build_owned_crawl_snapshot", idempotencyKey: "dead-lock", seed: "https://docs.m6-owned.test/" })).toMatchObject({ status: "ok" });
    writeFileSync(join(stateRoot, "writer.lock"), "not-a-pid\n");
    expect(() => admin.enqueue({ operation: "build_owned_crawl_snapshot", idempotencyKey: "bad-lock", seed: "https://docs.m6-owned.test/" })).toThrow();
  });

  test("Rust authority rejects incomplete and conflicting canonical job records", () => {
    const mutations: Array<(record: any) => string> = [
      (record) => { delete record.attempt; return JSON.stringify(record); },
      (record) => { record.schemaVersion = "2.0.0"; return JSON.stringify(record); },
      (record) => { record.id = "job-000000000000000000000000"; return JSON.stringify(record); },
      (record) => { record.operation = "other"; return JSON.stringify(record); },
      (record) => JSON.stringify(record).replace(/}$/, `,"state":"running"}`),
    ];
    for (const [index, mutate] of mutations.entries()) {
      const stateRoot = root();
      const admin = createOwnedCrawlAdmin({ stateRoot, adminCapability: ADMIN, transport: fixtureTransport(), safeguard: async () => true });
      const queued = admin.enqueue({ operation: "build_owned_crawl_snapshot", idempotencyKey: `authority-${index}`, seed: "https://docs.m6-owned.test/" });
      const path = join(stateRoot, "jobs", `${queued.job!.id}.json`); const record = JSON.parse(readFileSync(path, "utf8"));
      const corrupted = `${mutate(record)}\n`; writeFileSync(path, corrupted);
      expect(admin.cancel(queued.job!.id)).toMatchObject({ status: "rejected" });
      expect(readFileSync(path, "utf8")).toBe(corrupted);
      admin.close();
    }
  });
});

describe("M6 policy", () => {
  test("pins the exact eight project-authored fixture documents and aggregate digest", () => {
    const manifest = JSON.parse(readFileSync(join(fixtureRoot, "manifest.json"), "utf8")); const lines: Buffer[] = [];
    expect(manifest.documentCount).toBe(8); expect(manifest.documents).toHaveLength(8);
    expect(manifest.authorization.productionPublicCrawl).toBe("NO-GO");
    for (const document of manifest.documents) { const bytes = readFileSync(join(fixtureRoot, document.path)); expect(bytes.byteLength).toBe(document.byteLength); expect(digest(bytes)).toBe(document.sha256); lines.push(Buffer.from(`${document.path}\0${document.sha256}\n`)); }
    expect(digest(Buffer.concat(lines))).toBe(manifest.aggregateSha256);
  });

  test("implements conservative RFC 9309 matching vectors", () => {
    const robots = "User-agent: *\nDisallow: /private/*\nAllow: /private/public$\nDisallow: /same\nAllow: /same\n";
    expect(evaluateRobots(robots, "CuriosityM6", "/private/a")).toBe(false);
    expect(evaluateRobots(robots, "CuriosityM6", "/private/public")).toBe(true);
    expect(evaluateRobots(robots, "CuriosityM6", "/same")).toBe(true);
    expect(evaluateRobots("User-agent: *\nDisallow: /a%2Fb\n", "CuriosityM6", "/a/b")).toBe(true);
    expect(evaluateRobots("User-agent: *\nDisallow: /a%2fb\n", "CuriosityM6", "/a%2Fb")).toBe(false);
    expect(evaluateRobots("User-agent: *\nDisallow: /%7Eowner\n", "CuriosityM6", "/~owner")).toBe(false);
    expect(evaluateRobots("User-agent: Curiosity\nDisallow: /specific\n\nUser-agent: CuriosityM6\nAllow: /specific\n", "CuriosityM6", "/specific")).toBe(true);
    expect(evaluateRobots("User-agent: CuriosityM6\nDisallow: /shared\n\nUser-agent: curiositym6\nAllow: /shared\n", "CURIOSITYM6", "/shared")).toBe(true);
    expect(evaluateRobots("User-agent: *\nDisallow: /wild\n\nUser-agent: Curiosity\nAllow: /wild\n", "CuriosityM6", "/wild")).toBe(false);
  });

  test("allows a missing robots file but fails closed for other robots errors", async () => {
    const missingRoot = root();
    const missing = createOwnedCrawlAdmin({ stateRoot: missingRoot, adminCapability: ADMIN, transport: fixtureTransport((url, response) => {
      if (url.pathname === "/robots.txt") { response.status = 404; response.headers["content-type"] = "application/octet-stream"; response.headers["content-encoding"] = "gzip"; response.body = Buffer.from("not the manifest robots body"); }
    }), safeguard: async () => true });
    missing.enqueue({ operation: "build_owned_crawl_snapshot", idempotencyKey: "robots-404", seed: "https://docs.m6-owned.test/" });
    expect(await missing.runNext()).toMatchObject({ status: "ok", job: { state: "succeeded" } });

    for (const status of [0, 500]) {
      const stateRoot = root(); const admin = createOwnedCrawlAdmin({ stateRoot, adminCapability: ADMIN, transport: fixtureTransport((url, response) => { if (url.pathname === "/robots.txt") response.status = status; }), safeguard: async () => true });
      admin.enqueue({ operation: "build_owned_crawl_snapshot", idempotencyKey: `robots-${status}`, seed: "https://docs.m6-owned.test/" });
      expect(await admin.runNext()).toMatchObject({ status: "ok", job: { state: "failed", diagnostic: "robots_unavailable" } });
    }
  });

  test("rejects a robots-disallowed page redirect before fetching its destination", async () => {
    const stateRoot = root(); const observed: string[] = [];
    const transport: OwnedCrawlTransport = async (...args) => {
      const [url] = args; observed.push(url.href);
      return fixtureTransport((current, response) => {
        if (current.pathname === "/") { response.status = 302; response.headers.location = "/controlled/denied"; }
      })(...args);
    };
    const admin = createOwnedCrawlAdmin({ stateRoot, adminCapability: ADMIN, transport, safeguard: async () => true });
    admin.enqueue({ operation: "build_owned_crawl_snapshot", idempotencyKey: "redirect-robots-denied", seed: "https://docs.m6-owned.test/" });

    expect(await admin.runNext()).toMatchObject({ status: "ok", job: { state: "failed", diagnostic: "robots_denied" } });
    expect(observed).not.toContain("https://docs.m6-owned.test/controlled/denied");
    expect(existsSync(join(stateRoot, "snapshots"))).toBe(false);
    expect(existsSync(join(stateRoot, "captures"))).toBe(false);
  });

  test("follows a policy-valid robots redirect without circular robots evaluation", async () => {
    const stateRoot = root(); const observed: string[] = [];
    const transport: OwnedCrawlTransport = async (url, options) => {
      observed.push(url.href);
      if (url.pathname === "/robots.txt") return { status: 302, headers: { location: "/controlled/denied" }, body: new Uint8Array() };
      if (options.kind === "robots") return fixtureTransport()(new URL("https://docs.m6-owned.test/robots.txt"), options);
      return fixtureTransport()(url, options);
    };
    const admin = createOwnedCrawlAdmin({ stateRoot, adminCapability: ADMIN, transport, safeguard: async () => true });
    admin.enqueue({ operation: "build_owned_crawl_snapshot", idempotencyKey: "robots-redirect", seed: "https://docs.m6-owned.test/" });

    expect(await admin.runNext()).toMatchObject({ status: "ok", job: { state: "succeeded" } });
    expect(observed).toContain("https://docs.m6-owned.test/controlled/denied");
  });

  test("rejects query, userinfo, cross-origin redirects, unsafe media, encoding and size before persistence", async () => {
    const cases: Array<(url: URL, response: { status: number; headers: Record<string, string>; body: Uint8Array }) => void> = [
      (url, response) => { if (url.pathname === "/robots.txt") response.body = Buffer.from("User-agent: *\nAllow: /\n"); else response.headers.location = "https://other.test/"; if (url.pathname !== "/robots.txt") response.status = 302; },
      (url, response) => { if (url.pathname !== "/robots.txt") response.headers["content-type"] = "application/pdf"; },
      (url, response) => { if (url.pathname !== "/robots.txt") response.headers["content-encoding"] = "gzip"; },
      (url, response) => { if (url.pathname !== "/robots.txt") response.body = new Uint8Array(131_073); },
      (url, response) => { if (url.pathname === "/robots.txt") response.body = Buffer.from("User-agent: CuriosityM6\nAllow: /\n# mutation\n"); },
      (url, response) => { if (url.pathname === "/alerts.html") response.body = Buffer.from(response.body.map((byte, index) => index === 20 ? byte ^ 1 : byte)); },
      (url, response) => { if (url.pathname === "/network.html") response.status = 404; },
    ];
    for (const mutate of cases) {
      const stateRoot = root(); const admin = createOwnedCrawlAdmin({ stateRoot, adminCapability: ADMIN, transport: fixtureTransport(mutate), safeguard: async () => true });
      admin.enqueue({ operation: "build_owned_crawl_snapshot", idempotencyKey: digest(Buffer.from(String(cases.indexOf(mutate)))), seed: "https://docs.m6-owned.test/" });
      expect(await admin.runNext()).toMatchObject({ status: "ok", job: { state: "failed" } });
      expect(existsSync(join(stateRoot, "snapshots"))).toBe(false);
      expect(existsSync(join(stateRoot, "captures"))).toBe(false);
    }
  });
});
