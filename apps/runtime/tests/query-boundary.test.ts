import { expect, test } from "bun:test";
import { resolve } from "node:path";
import * as query from "../src/query.js";

test("query-only package surface has no administrative capability or mutation API", () => {
  expect(Object.keys(query).sort()).toEqual(["createQueryRuntime", "queryRuntimeCapabilities"]);
  expect("createCorpusAdmin" in query).toBe(false);
  expect("AdminCapability" in query).toBe(false);
});

test("query runtime rejects non-canonical, in-package, and unbounded authority configuration before opening", () => {
  const outside = resolve(import.meta.dir, "../../../query-runtime-state");
  const workspace = resolve(import.meta.dir, "../../../../workspace");
  const valid = { stateRoot: outside, workspaceScope: workspace, queryCapability: new Uint8Array([1]) };
  for (const options of [
    { ...valid, stateRoot: "relative" },
    { ...valid, stateRoot: `${outside}/../query-runtime-state` },
    { ...valid, stateRoot: resolve(import.meta.dir, "../state") },
    { ...valid, workspaceScope: "relative" },
    { ...valid, workspaceScope: `${workspace}/../workspace` },
    { ...valid, workspaceScope: `/${"x".repeat(4096)}` },
    { ...valid, queryCapability: new Uint8Array() },
    { ...valid, queryCapability: new Uint8Array(257) },
  ]) expect(() => query.createQueryRuntime(options)).toThrow("QUERY_RUNTIME_CONFIG_INVALID");
});

test("owned retrieval mode authorizes before snapshot access and revalidates delivery", async () => {
  const outside = resolve(import.meta.dir, "../../../query-runtime-state");
  const workspace = resolve(import.meta.dir, "../../../../workspace");
  const capability = new Uint8Array([1, 2, 3, 4]);
  let reads = 0;
  const ownedSnapshot = {
    declaredCoverage: {
      corpusCellRef: "corpus:benchmark:test",
      documents: 1,
    },
    projectionSnapshotRef: "projection:test",
    search: () => {
      reads += 1;
      return {
        results: [
          {
            captureRef: "capture:test",
            documentId: "document:test",
            excerpt: "Bounded evidence",
            observedAt: "2026-08-26T12:00:00.000Z",
            receiptRef: "receipt:test",
            representationRef: "representation:test",
            sourceLocator: "https://example.com/evidence",
            spanRef: "span:test:0",
            title: "Evidence",
          },
        ],
        status: "ok" as const,
      };
    },
    snapshotRef: "snapshot:test",
  };
  const runtime = query.createQueryRuntime({
    mode: "owned-retrieval-v3",
    now: () => Date.parse("2026-08-26T12:00:00.000Z"),
    ownedSnapshot,
    queryCapability: capability,
    workspaceScope: workspace,
  });
  const request = {
    deadlineUnixMs: Date.parse("2026-08-26T12:00:10.000Z"),
    maxResults: 1,
    query: "bounded evidence",
    requestId: "owned-query-001",
  };

  await expect(
    runtime.retrieveInformation(request, {
      operation: "retrieve_information",
      queryCapability: new Uint8Array([9]),
      role: "researcher",
      workspaceScope: workspace,
    }),
  ).resolves.toMatchObject({
    diagnostic: { code: "authority_rejected" },
    status: "rejected",
  });
  expect(reads).toBe(0);

  await expect(
    runtime.retrieveInformation(request, {
      operation: "retrieve_information",
      queryCapability: capability,
      role: "researcher",
      workspaceScope: workspace,
    }),
  ).resolves.toEqual({
    partial: false,
    projectionSnapshotRef: "projection:test",
    queriedAt: "2026-08-26T12:00:00.000Z",
    residualUncertainty: [],
    results: [
      {
        canonicalUrl: "https://example.com/evidence",
        snippet: "Bounded evidence",
        title: "Evidence",
      },
    ],
    snapshotRef: "snapshot:test",
    status: "ok",
    stoppingReason: "DECLARED_LEGS_COMPLETED",
  });
  expect(reads).toBe(1);
  runtime.close();
  await expect(
    runtime.retrieveInformation(request, {
      operation: "retrieve_information",
      queryCapability: capability,
      role: "researcher",
      workspaceScope: workspace,
    }),
  ).resolves.toMatchObject({
    diagnostic: { code: "runtime_closed" },
    status: "rejected",
  });
  expect(reads).toBe(1);
});

test("owned retrieval mode suppresses delivery when authority closes during snapshot search", async () => {
  const workspace = resolve(import.meta.dir, "../../../../workspace");
  const capability = new Uint8Array([4, 3, 2, 1]);
  let runtime: ReturnType<typeof query.createQueryRuntime>;
  let reads = 0;
  runtime = query.createQueryRuntime({
    mode: "owned-retrieval-v3",
    now: () => Date.parse("2026-08-26T12:00:00.000Z"),
    ownedSnapshot: {
      declaredCoverage: { corpusCellRef: "corpus:revocation", documents: 1 },
      projectionSnapshotRef: "projection:revocation",
      search: () => {
        reads += 1;
        runtime.close();
        return {
          results: [
            {
              captureRef: "capture:revocation",
              documentId: "document:revocation",
              excerpt: "Must not be delivered",
              observedAt: "2026-08-26T12:00:00.000Z",
              receiptRef: "receipt:revocation",
              representationRef: "representation:revocation",
              sourceLocator: "https://example.com/revoked",
              spanRef: "span:revocation:0",
              title: "Revoked",
            },
          ],
          status: "ok" as const,
        };
      },
      snapshotRef: "snapshot:revocation",
    },
    queryCapability: capability,
    workspaceScope: workspace,
  });

  await expect(
    runtime.retrieveInformation(
      {
        deadlineUnixMs: Date.parse("2026-08-26T12:00:10.000Z"),
        maxResults: 1,
        query: "revocation",
        requestId: "owned-query-revocation",
      },
      {
        operation: "retrieve_information",
        queryCapability: capability,
        role: "researcher",
        workspaceScope: workspace,
      },
    ),
  ).resolves.toEqual({
    diagnostic: { code: "authority_rejected" },
    status: "rejected",
  });
  expect(reads).toBe(1);
});
