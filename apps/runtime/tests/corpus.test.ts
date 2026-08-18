import { afterEach, describe, expect, test } from "bun:test";
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, realpathSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { createCorpusAdmin, createRuntime, runtimeCapabilities } from "../src/index.js";
import { createQueryRuntime } from "../src/query.js";

const NOW = 1_700_000_000_000;
const fixture = resolve(import.meta.dir, "../fixtures/m2-synthetic/v1.0.0");
const roots: string[] = [];
const handles: Array<{ close(): void }> = [];
const root = () => { const value = mkdtempSync(join(realpathSync(tmpdir()), "curiosity-m2-")); roots.push(value); return value; };
const ADMIN = Buffer.from("operator-admin-capability-for-m2-tests");
const QUERY = Buffer.from("operator-query-capability-for-m2-tests");
const digest = (value: Uint8Array) => new Bun.CryptoHasher("sha256").update(value).digest("hex");
const bootstrap = (stateRoot: string) => { mkdirSync(join(stateRoot, "authority"), { recursive: true }); writeFileSync(join(stateRoot, "authority/admin.sha256"), `${digest(ADMIN)}\n`); writeFileSync(join(stateRoot, "authority/query.sha256"), `${digest(QUERY)}\n`); };
const request = (query: string, maxResults = 5) => ({ apiVersion: "curiosity.runtime/v0", operation: "web_search", requestId: "m2-test", query, maxResults, deadlineUnixMs: NOW + 1000 });
const principal = (workspaceScope: string, capability: Uint8Array = QUERY) => ({ role: "researcher", workspaceScope, operation: "web_search", queryCapability: capability });
const admin = (stateRoot: string) => { if (!existsSync(join(stateRoot, "authority"))) bootstrap(stateRoot); const value = createCorpusAdmin({ stateRoot, adminCapability: ADMIN, nativeProfile: "development" }); handles.push(value); return value; };
const query = (stateRoot: string) => { const value = createRuntime({ stateRoot, queryCapability: QUERY, now: () => NOW, nativeProfile: "development" }); handles.push(value); return value; };

afterEach(() => { for (const handle of handles.splice(0)) handle.close(); for (const path of roots.splice(0)) rmSync(path, { recursive: true, force: true }); });

describe("M2 canonical corpus", () => {
  test("fixture manifest and aggregate digest match exact immutable bytes", async () => {
    const manifest = JSON.parse(readFileSync(join(fixture, "manifest.json"), "utf8"));
    expect(Object.keys(manifest).sort()).toEqual(["accountableOwner", "activationEligible", "approvals", "candidateId", "candidateVersion", "classification", "creationAuthorization", "custody", "documents", "governanceGates", "provenance", "purpose", "rights", "schemaVersion", "sha256", "status"].sort());
    expect(manifest.schemaVersion).toBe("1.0.0");
    expect(manifest.status).toBe("approved-candidate");
    expect(manifest.activationEligible).toBe(true);
    expect(manifest.candidateId).toMatch(/^[a-z0-9](?:[a-z0-9._-]{0,62}[a-z0-9])?$/);
    expect(manifest.candidateVersion).toMatch(/^[0-9]+\.[0-9]+\.[0-9]+$/);
    expect(manifest.provenance).toMatchObject({ authorType: "ai", sourceReview: { status: "passed" } });
    expect(manifest.creationAuthorization.rightsDisclaimerAccepted).toBe(true);
    expect(manifest.rights).toMatchObject({ ownershipStatus: "cleared", rightsholderAuthority: "confirmed", licenseGrant: "granted", distributionPermitted: true });
    expect(manifest.rights.intendedUses.sort()).toEqual(["copy", "test", "index", "display", "modify", "distribute", "commit"].sort());
    expect(manifest.classification).toEqual({ reviewStatus: "passed", level: "public-synthetic", personalData: "absent", secrets: "absent", regulatedData: "absent", productionIdentifiers: "absent", prohibitedContent: "absent" });
    expect(manifest.custody).toMatchObject({ repositoryPath: "fixtures/m2-synthetic/v1.0.0", permittedEnvironment: "repository-quarantine" });
    expect(Object.values(manifest.approvals).every((approval: any) => approval.status === "approved" && approval.approvalId && approval.approvedBy && approval.decidedAt)).toBe(true);
    expect(manifest.governanceGates).toEqual({ d4: { status: "accepted", decisionReference: "docs/decisions/0025-m2-initial-local-test-snapshot.md" }, d5: { status: "accepted", decisionReference: "docs/decisions/0026-m2-foundational-durable-state-boundary.md" }, dependencyDesign: "dependency-free", d8: { status: "not-required" } });
    const lines: Buffer[] = [];
    for (const document of [...manifest.documents].sort((a, b) => a.path.localeCompare(b.path))) {
      const bytes = readFileSync(join(fixture, document.path));
      const digest = new Bun.CryptoHasher("sha256").update(bytes).digest("hex");
      expect(bytes.length).toBe(document.byteLength);
      expect(digest).toBe(document.sha256);
      lines.push(Buffer.from(`${document.path}\0${document.sha256}\n`));
    }
    expect(new Bun.CryptoHasher("sha256").update(Buffer.concat(lines)).digest("hex")).toBe(manifest.sha256);
    expect(readFileSync(join(fixture, "CC0-1.0.txt"), "utf8")).toContain("rights controlled by an AI provider");
  });

  test("imports atomically, activates, and returns bounded deterministic lexical results", async () => {
    const stateRoot = root(); const writer = admin(stateRoot); const reader = query(stateRoot);
    expect(writer.initialize()).toEqual({ status: "ok" });
    expect(await reader.webSearch(request("starweave"))).toMatchObject({ status: "unavailable", results: [] });
    expect(writer.importFixture(fixture)).toEqual({ status: "ok" });
    expect(await reader.webSearch(request("starweave"))).toMatchObject({ status: "unavailable", results: [] });
    expect(writer.activate()).toEqual({ status: "ok" });
    const first = await reader.webSearch(request("observatory starweave", 1));
    expect(first).toMatchObject({ status: "ok", results: [{ documentId: "aurora", version: "1.0.0", snapshotId: "m2-synthetic-lexical", snapshotVersion: "1.0.0", score: 2 }] });
    expect(await reader.webSearch(request("observatory starweave", 1))).toEqual(first);
    expect(Buffer.byteLength(JSON.stringify(first))).toBeLessThan(32_768);
    expect(await reader.webSearch(request("nonexistent-token"))).toMatchObject({ status: "ok", results: [] });
    expect((await reader.webSearch(request("lantern starweave", 2))).results).toHaveLength(2);
  });

  test("query-only package validates principal authority independently and returns canonical fixture URLs", async () => {
    const stateRoot = root(); const workspaceScope = root(); const writer = admin(stateRoot);
    expect(writer.importFixture(fixture).status).toBe("ok"); expect(writer.activate().status).toBe("ok");
    const reader = createQueryRuntime({ stateRoot, queryCapability: QUERY, workspaceScope, now: () => NOW, nativeProfile: "development" }); handles.push(reader);
    const allowed = await reader.webSearch(request("starweave"), principal(workspaceScope));
    expect(allowed).toMatchObject({ status: "ok", results: [{ sourceUrl: "https://m2-synthetic.invalid/documents/aurora" }] });
    for (const denied of [
      principal(workspaceScope, ADMIN),
      { ...principal(workspaceScope), role: "analyst" },
      { ...principal(workspaceScope), workspaceScope: root() },
      { ...principal(workspaceScope), operation: "corpus_admin" },
    ]) expect(await reader.webSearch(request("starweave"), denied)).toMatchObject({ status: "rejected", diagnostic: { code: "authority_rejected" } });
    expect(allowed.results.every((result: { sourceUrl: string }) => {
      const url = new URL(result.sourceUrl); return url.protocol === "https:" && url.hostname.endsWith(".invalid") && !result.sourceUrl.includes(stateRoot);
    })).toBe(true);
  });

  test("keeps query and administrative capabilities non-interchangeable", async () => {
    const stateRoot = root(); bootstrap(stateRoot);
    const denied = createCorpusAdmin({ stateRoot, adminCapability: Buffer.from("wrong"), nativeProfile: "development" }); handles.push(denied);
    expect(denied.initialize()).toMatchObject({ status: "rejected" });
    const missing = createCorpusAdmin({ stateRoot, adminCapability: new Uint8Array(), nativeProfile: "development" }); handles.push(missing);
    expect(missing.initialize()).toMatchObject({ status: "rejected" });
    const queryAsAdmin = createCorpusAdmin({ stateRoot, adminCapability: QUERY, nativeProfile: "development" }); handles.push(queryAsAdmin);
    expect(queryAsAdmin.initialize()).toMatchObject({ status: "rejected" });
    const noQueryAuthority = createRuntime({ stateRoot, queryCapability: ADMIN, now: () => NOW, nativeProfile: "development" }); handles.push(noQueryAuthority);
    expect(await noQueryAuthority.webSearch(request("starweave"))).toEqual({ status: "rejected", diagnostic: { code: "authority_denied", message: "Corpus query authority was denied." } });
    const workspaceScope = root();
    const packageReader = createQueryRuntime({ stateRoot, queryCapability: ADMIN, workspaceScope, now: () => NOW, nativeProfile: "development" }); handles.push(packageReader);
    expect(await packageReader.webSearch(request("starweave"), principal(workspaceScope, ADMIN))).toEqual({ status: "rejected", diagnostic: { code: "authority_denied", message: "Corpus query authority was denied." } });
    expect(existsSync(join(stateRoot, "format.json"))).toBe(false);
    expect(runtimeCapabilities({ stateRoot, queryCapability: QUERY })).toMatchObject({ corpus: true, persistence: true, network: false });
  });

  test("authorizes only the exact accepted fixture manifest", () => {
    const mutations: Array<[string, string, string]> = [
      ["candidate identity", "m2-synthetic-lexical", "m2-synthetic-altered"],
      ["candidate version", "\"candidateVersion\": \"1.0.0\"", "\"candidateVersion\": \"1.0.1\""],
      ["candidate status", "\"status\": \"approved-candidate\"", "\"status\": \"rejected-candidate\""],
      ["activation gate", "\"activationEligible\": true", "\"activationEligible\": false"],
      ["rights", "\"ownershipStatus\": \"cleared\"", "\"ownershipStatus\": \"rejected\""],
      ["classification", "\"personalData\": \"absent\"", "\"personalData\": \"present\""],
      ["approval", "\"status\": \"approved\", \"approvalId\": \"M2-LEGAL", "\"status\": \"rejected\", \"approvalId\": \"M2-LEGAL"],
      ["gate", "\"status\": \"accepted\", \"decisionReference\": \"docs/decisions/0025", "\"status\": \"rejected\", \"decisionReference\": \"docs/decisions/0025"],
      ["document digest", "27f8fb8019ed8359633a9c043af440120833fc6036dc4dfd4480d88672d595e6", "37f8fb8019ed8359633a9c043af440120833fc6036dc4dfd4480d88672d595e6"],
      ["exact manifest bytes", "{\n  \"schemaVersion\"", "{\n   \"schemaVersion\""],
    ];
    for (const [name, before, after] of mutations) {
      const stateRoot = root(); const copy = root(); cpSync(fixture, copy, { recursive: true });
      const manifestPath = join(copy, "manifest.json"); const source = readFileSync(manifestPath, "utf8");
      expect(source, name).toContain(before); writeFileSync(manifestPath, source.replace(before, after));
      expect(admin(stateRoot).importFixture(copy), name).toMatchObject({ status: "rejected" });
    }
  });

  test("fails closed on fixture digest corruption and symlink input", () => {
    for (const mode of ["digest", "symlink", "intermediate-symlink"] as const) {
      const stateRoot = root(); const fixtureCopy = root(); cpSync(fixture, fixtureCopy, { recursive: true });
      if (mode === "digest") writeFileSync(join(fixtureCopy, "documents/aurora.txt"), "tampered\n");
      else if (mode === "symlink") { rmSync(join(fixtureCopy, "documents/aurora.txt")); symlinkSync(join(fixture, "documents/aurora.txt"), join(fixtureCopy, "documents/aurora.txt")); }
      else { rmSync(join(fixtureCopy, "documents"), { recursive: true }); symlinkSync(join(fixture, "documents"), join(fixtureCopy, "documents")); }
      expect(admin(stateRoot).importFixture(fixtureCopy)).toMatchObject({ status: "rejected" });
      expect(existsSync(join(stateRoot, "refs/visible.json"))).toBe(false);
    }
  });

  test("fails closed on symlinked authoritative state directories", () => {
    const stateRoot = root(); const outside = root(); const writer = admin(stateRoot);
    expect(writer.initialize().status).toBe("ok");
    rmSync(join(stateRoot, "objects/sha256"), { recursive: true });
    symlinkSync(outside, join(stateRoot, "objects/sha256"));
    expect(writer.importFixture(fixture)).toMatchObject({ status: "rejected" });
    expect(readdirSync(outside)).toEqual([]);
  });

  test("fails closed on a symlinked object digest prefix", () => {
    const stateRoot = root(); const outside = root(); const writer = admin(stateRoot);
    expect(writer.initialize().status).toBe("ok"); mkdirSync(join(stateRoot, "objects/sha256/27"));
    rmSync(join(stateRoot, "objects/sha256/27"), { recursive: true }); symlinkSync(outside, join(stateRoot, "objects/sha256/27"));
    expect(writer.importFixture(fixture)).toMatchObject({ status: "rejected" }); expect(readdirSync(outside)).toEqual([]);
  });

  test("stale writer lock rejects every mutation while queries remain read-only", async () => {
    const stateRoot = root(); const writer = admin(stateRoot); const reader = query(stateRoot);
    expect(writer.importFixture(fixture).status).toBe("ok"); expect(writer.activate().status).toBe("ok");
    writeFileSync(join(stateRoot, "writer.lock"), "stale\n");
    for (const mutate of [() => writer.initialize(), () => writer.importFixture(fixture), () => writer.activate(), () => writer.withdraw(), () => writer.delete(), () => writer.rebuild()]) {
      expect(mutate()).toMatchObject({ status: "rejected" });
    }
    expect(await reader.webSearch(request("starweave"))).toMatchObject({ status: "ok" });
  });

  test("fails closed across lifecycle ordering boundaries", async () => {
    const stateRoot = root(); const writer = admin(stateRoot); const reader = query(stateRoot);
    expect(writer.importFixture(fixture).status).toBe("ok");
    writeFileSync(join(stateRoot, "commits/00000000000000000002.json"), '{"commit":2,"id":"m2-synthetic-lexical","operation":"activate","version":"1.0.0"}\n');
    expect(await reader.webSearch(request("starweave"))).toMatchObject({ status: "unavailable" });
    rmSync(join(stateRoot, "commits/00000000000000000002.json")); expect(writer.activate().status).toBe("ok");
    writeFileSync(join(stateRoot, "tombstones/snapshots/m2-synthetic-lexical-1.0.0.json"), '{"id":"m2-synthetic-lexical","reason":"owner-withdrawal","version":"1.0.0"}\n');
    expect(await reader.webSearch(request("starweave"))).toMatchObject({ status: "unavailable" });
    expect(writer.rebuild()).toMatchObject({ status: "rejected" });
  });

  test("recovers an incomplete invisible staging file under the writer lock", () => {
    const stateRoot = root(); const writer = admin(stateRoot);
    expect(writer.initialize().status).toBe("ok");
    const staged = join(stateRoot, "commits/.stage-crashed-writer");
    writeFileSync(staged, "partial");
    expect(writer.importFixture(fixture).status).toBe("ok");
    expect(existsSync(staged)).toBe(false);
    expect(existsSync(join(stateRoot, "refs/visible.json"))).toBe(false);
  });

  test("rebuilds deterministically and tombstones prevent resurrection after withdrawal/delete", async () => {
    const stateRoot = root(); const writer = admin(stateRoot); const reader = query(stateRoot);
    expect(writer.importFixture(fixture).status).toBe("ok"); expect(writer.activate().status).toBe("ok");
    const projection = join(stateRoot, "projections/lexical/current.json"); const before = readFileSync(projection);
    rmSync(projection); expect(writer.rebuild().status).toBe("ok"); expect(readFileSync(projection)).toEqual(before);
    expect(writer.withdraw().status).toBe("ok"); expect(await reader.webSearch(request("starweave"))).toMatchObject({ status: "unavailable" });
    expect(writer.rebuild()).toMatchObject({ status: "rejected" }); expect(writer.activate()).toMatchObject({ status: "rejected" });
    expect(writer.delete().status).toBe("ok"); expect(writer.importFixture(fixture)).toMatchObject({ status: "rejected" });
  });

  test("detects authoritative corruption without reflecting paths or content", async () => {
    const stateRoot = root(); const writer = admin(stateRoot); const reader = query(stateRoot);
    writer.importFixture(fixture); writer.activate();
    const object = join(stateRoot, "objects/sha256/27/f8fb8019ed8359633a9c043af440120833fc6036dc4dfd4480d88672d595e6");
    writeFileSync(object, "corrupt");
    expect(await reader.webSearch(request("starweave"))).toEqual({ status: "rejected", diagnostic: { code: "corpus_corrupt", message: "The configured corpus failed integrity checks." } });
  });

  test("distinguishes disposable projection corruption and recovers by rebuild", async () => {
    const stateRoot = root(); const writer = admin(stateRoot); const reader = query(stateRoot);
    writer.importFixture(fixture); writer.activate();
    writeFileSync(join(stateRoot, "projections/lexical/current.json"), "{}\n");
    expect(await reader.webSearch(request("starweave"))).toMatchObject({ status: "rejected", diagnostic: { code: "projection_corrupt" } });
    expect(writer.rebuild().status).toBe("ok");
    expect(await reader.webSearch(request("starweave"))).toMatchObject({ status: "ok" });
  });
});
