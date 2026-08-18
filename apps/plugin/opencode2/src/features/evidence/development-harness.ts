import { unlinkSync, writeFileSync } from "node:fs";
import { createDevelopmentBootstrap } from "./configuration.js";
import { createIdentity } from "./identity.js";
import {
  InMemoryTransactionalAuthority,
  SynchronousIngest,
  isEligibleRecord,
  type FixtureIngest,
  type IngestRecord,
} from "./ingest.js";
import { InMemoryLexicalProjection, createExactQuery, createQuery } from "./query.js";
import { BlockingReconciler } from "./reconciliation.js";

export const developmentFixture: FixtureIngest & { readonly rightsClearance: "PROJECT_AUTHORED_CC0_FIXTURE" } = {
  schemaVersion: 1,
  ingestId: createIdentity("ingest", { fixture: "rights-cleared-alpha", source: "fixture://alpha", occurrence: 1 }),
  tenant: "fixture",
  sourceLocator: "fixture://alpha",
  text: "Fixture evidence is rights-cleared. Alpha supports deterministic testing.",
  mediaType: "text/plain",
  capturedAt: "2026-08-18T00:00:00.000Z",
  assertionState: "ACTIVE",
  rightsClearance: "PROJECT_AUTHORED_CC0_FIXTURE",
};

export const createDevelopmentHarness = (root: string, secret: Uint8Array) => {
  const bootstrap = createDevelopmentBootstrap({
    profile: "development-bootstrap",
    environment: { get: () => Buffer.from(secret).toString("base64") },
    disposableRoot: root,
  });
  const authority = new InMemoryTransactionalAuthority();
  const ingest = new SynchronousIngest(authority, bootstrap.anchor, bootstrap.custody);
  const projection = new InMemoryLexicalProjection(authority);
  const reconciler = new BlockingReconciler(authority, bootstrap.custody, bootstrap.anchor, projection);
  const tombstone = (ingestId: string): Promise<IngestRecord> =>
    authority.transaction(async () => {
      const record = ingest.required(ingestId);
      if (record.state === "TOMBSTONED") return record;
      record.tombstone = true;
      record.state = "TOMBSTONE_PENDING_ANCHOR";
      const expected = bootstrap.anchor.readHead(record.request.tenant);
      bootstrap.anchor.appendCAS(record.request.tenant, expected, {
        schemaVersion: 1,
        idempotencyId: `tombstone:${ingestId}`,
        kind: "TOMBSTONE",
        body: { ingestId },
      });
      record.state = "TOMBSTONED";
      record.revision += 1;
      projection.remove(ingestId);
      return record;
    });
  const seedFaults = (ingestId: string): void => {
    const record = ingest.required(ingestId);
    if (record.rawReceipt) unlinkSync(record.rawReceipt.path);
    if (record.derivedReceipt) writeFileSync(record.derivedReceipt.path, "digest-invalid-fixture");
    reconciler.danglingSpans.add("span:missing");
    reconciler.danglingRelationships.add("relationship:missing-subject");
    projection.stale = true;
    projection.tombstoneGap = true;
    const head = bootstrap.anchor.readHead("fixture");
    bootstrap.anchor.appendCAS("fixture", head, {
      schemaVersion: 1,
      idempotencyId: "orphan:tombstone",
      kind: "TOMBSTONE",
      body: { ingestId: "unknown:orphan" },
    });
    const stuckRequest = {
      ...developmentFixture,
      ingestId: createIdentity("ingest", { fixture: "stuck" }),
      sourceLocator: "fixture://stuck",
    };
    authority.put({
      ingestId: stuckRequest.ingestId,
      requestDigest: "sha256:stuck",
      request: stuckRequest,
      state: "LOCAL_PREPARED",
      expectedHead: bootstrap.anchor.readHead("fixture"),
      spans: [],
      tombstone: false,
      revision: 1,
    });
  };
  return {
    bootstrap,
    authority,
    ingest,
    projection,
    query: createQuery(authority, projection, bootstrap.anchor, bootstrap.custody),
    exact: createExactQuery(authority, projection, bootstrap.anchor, bootstrap.custody),
    eligibility: (id: string, operation?: Parameters<typeof isEligibleRecord>[1]) =>
      isEligibleRecord(authority.get(id), operation),
    tombstone,
    reconcile: () => reconciler.run(),
    seedFaults,
  };
};
