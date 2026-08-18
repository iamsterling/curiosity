import assert from "node:assert/strict";
import { mkdtemp, readFile, truncate, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { createDevelopmentHarness, createIdentity, developmentFixture } from "../../dist/features/evidence/index.js";

test("ingest crash boundaries converge and pre-commit work is universally ineligible", async () => {
  const root = await mkdtemp(join(tmpdir(), "evidence-ingest-"));
  const harness = createDevelopmentHarness(root, Buffer.alloc(32, 9));
  const prepared = await harness.ingest.prepare(developmentFixture);
  const preparedInput = {...developmentFixture, ingestId: `${developmentFixture.ingestId}:immutable`, text: "Prepared immutable text."};
  const immutable = await harness.ingest.prepare(preparedInput);
  preparedInput.text = "mutated after prepare";
  assert.equal(immutable.request.text, "Prepared immutable text.");
  assert.throws(() => { immutable.request.text = "mutated through record"; }, TypeError);
  assert.equal(prepared.state, "LOCAL_PREPARED");
  for (const operation of ["extraction", "validation", "projection", "candidate", "direct-retrieval", "hydration", "serialization"]) {
    assert.equal(harness.eligibility(prepared.ingestId, operation).eligible, false);
  }
  await assert.rejects(() => harness.ingest.prepare({...developmentFixture, text: "changed"}), /EVIDENCE_INGEST_ID_CONFLICT/);
  const appended = await harness.ingest.append(prepared.ingestId);
  assert.equal(appended.state, "EXTERNAL_APPENDED");
  assert.equal(harness.eligibility(prepared.ingestId).eligible, false);
  const committed = await harness.ingest.commit(prepared.ingestId);
  assert.equal(committed.state, "LOCAL_COMMITTED");
  assert.notEqual(committed.rawReceipt.id, committed.derivedReceipt.id);
  assert.notEqual(committed.rawReceipt.objectId, committed.derivedReceipt.objectId);
  assert.notEqual(committed.rawReceipt.representationId, committed.derivedReceipt.representationId);
  assert.deepEqual(await harness.ingest.commit(prepared.ingestId), committed);
  assert.equal(harness.eligibility(prepared.ingestId).eligible, true);

  for (const fault of ["AFTER_RAW_PUBLICATION", "AFTER_DERIVED_PUBLICATION", "BEFORE_LOCAL_COMMIT", "AFTER_LOCAL_COMMIT"]) {
    const request = {...developmentFixture, ingestId: `${developmentFixture.ingestId}:${fault}`, sourceLocator: `fixture://${fault}`};
    const next = await harness.ingest.prepare(request);
    await harness.ingest.append(next.ingestId);
    await assert.rejects(() => harness.ingest.commit(next.ingestId, fault), /EVIDENCE_INGEST_FAULT_INJECTED/);
    const recovered = await harness.ingest.commit(next.ingestId);
    assert.equal(recovered.state, "LOCAL_COMMITTED");
    assert.equal(harness.eligibility(next.ingestId).eligible, true);
  }
});

test("commit rejects a forged exact anchor record before publication", async () => {
  const root = await mkdtemp(join(tmpdir(), "evidence-forged-anchor-"));
  const harness = createDevelopmentHarness(root, Buffer.alloc(32, 8));
  const prepared = await harness.ingest.prepare(developmentFixture);
  await harness.ingest.append(prepared.ingestId);
  const original = harness.bootstrap.anchor.readAfter.bind(harness.bootstrap.anchor);
  harness.bootstrap.anchor.readAfter = (stream, cursor, limit) => {
    const page = original(stream, cursor, limit);
    return {...page, records: page.records.map((record) => record.sequence === prepared.anchorHead.sequence ? {...record, intent: {...record.intent, body: {requestDigest: "sha256:forged"}}} : record)};
  };
  await assert.rejects(() => harness.ingest.commit(prepared.ingestId), /EVIDENCE_INGEST_ANCHOR_UNPROVEN|EVIDENCE_ANCHOR_AUTHENTICATION_FAILED/);
  assert.equal(prepared.rawReceipt, undefined);
});

test("authorization is first and final recheck defeats tombstone race", async () => {
  const root = await mkdtemp(join(tmpdir(), "evidence-query-"));
  const harness = createDevelopmentHarness(root, Buffer.alloc(32, 3));
  const committed = await harness.ingest.all(developmentFixture);
  harness.projection.rebuild();
  const before = harness.projection.readCount;
  const denied = await harness.query({principal: "denied", purpose: "test", text: "fixture"});
  assert.equal(denied.diagnostic, "EVIDENCE_QUERY_DENIED");
  assert.equal(harness.projection.readCount, before);
  const response = await harness.query({principal: "fixture-user", purpose: "test", text: "fixture"});
  assert.equal(response.items.length, 1);
  assert.equal(response.coverage.kind, "MEASURED");
  harness.projection.stale = true;
  const stale = await harness.query({principal: "fixture-user", purpose: "test", text: "fixture"});
  assert.equal(stale.coverage.kind, "UNKNOWN");
  assert.deepEqual(stale.partialFailures, [{stage: "projection", code: "EVIDENCE_PROJECTION_STALE"}]);
  const raced = await harness.query({principal: "fixture-user", purpose: "test", text: "fixture", beforeFinalCheck: () => harness.tombstone(committed.ingestId)});
  assert.equal(raced.items.length, 0);
  assert.equal(raced.partial, true);
});

test("exact and lexical revocation after the final-check hook performs no evidence reads or mutation", async () => {
  for (const kind of ["exact", "lexical"]) {
    const root = await mkdtemp(join(tmpdir(), `evidence-query-revoked-${kind}-`));
    const harness = createDevelopmentHarness(root, Buffer.alloc(32, 41));
    const committed = await harness.ingest.all({...developmentFixture, ingestId: createIdentity("ingest", {kind, revoked: true})});
    harness.projection.rebuild();
    const request = {principal: "fixture-user", purpose: "test", text: "fixture"};
    const projectionReads = harness.projection.readCount;
    let custodyReads = 0;
    harness.bootstrap.custody.faultBoundary = (stage) => { if (stage === "read-open") custodyReads += 1; };
    request.beforeFinalCheck = () => { request.principal = "denied"; };
    const response = kind === "exact" ? await harness.exact(request, committed.ingestId) : await harness.query(request);
    assert.equal(response.diagnostic, "EVIDENCE_QUERY_DENIED", kind);
    assert.equal(harness.projection.readCount, projectionReads, kind);
    assert.equal(custodyReads, 0, kind);
    assert.equal(committed.state, "LOCAL_COMMITTED", kind);
    assert.equal(committed.revision, 2, kind);
    assert.equal(harness.projection.candidates("fixture").includes(committed.ingestId), true, kind);
  }
});

test("per-item finalization suppresses a raced restriction without quarantining healthy evidence", async () => {
  for (const kind of ["HOLD", "TOMBSTONE"]) {
    const root = await mkdtemp(join(tmpdir(), `evidence-query-per-item-${kind}-`));
    const harness = createDevelopmentHarness(root, Buffer.alloc(32, 42));
    const records = [];
    for (const suffix of ["a", "b"]) {
      records.push(await harness.ingest.all({...developmentFixture, ingestId: createIdentity("ingest", {kind, suffix}), sourceLocator: `fixture://${suffix}`}));
    }
    harness.projection.rebuild();
    const [restricted, healthy] = [...records].sort((left, right) => left.ingestId.localeCompare(right.ingestId));
    let reads = 0;
    harness.bootstrap.custody.faultBoundary = async (stage) => {
      if (stage !== "read-verify" || ++reads !== 2) return;
      if (kind === "TOMBSTONE") await harness.tombstone(restricted.ingestId);
      else {
        const head = harness.bootstrap.anchor.readHead("fixture");
        harness.bootstrap.anchor.appendCAS("fixture", head, {schemaVersion: 1, idempotencyId: `race:${kind}`, kind, body: {ingestId: restricted.ingestId}});
      }
    };
    const response = await harness.query({principal: "fixture-user", purpose: "test", text: "fixture"});
    assert.equal(response.items.length, 1, kind);
    assert.equal(response.items[0].sourceLocator, healthy.request.sourceLocator, kind);
    assert.equal(healthy.state, "LOCAL_COMMITTED", kind);
    assert.notEqual(restricted.state, "QUARANTINED", kind);
    assert.equal(harness.projection.candidates("fixture").includes(restricted.ingestId), false, kind);
    assert.equal(harness.projection.candidates("fixture").includes(healthy.ingestId), true, kind);
  }
});

test("fresh post-custody authority check defeats a restriction during the second custody read", async () => {
  for (const kind of ["HOLD", "TOMBSTONE"]) {
    const root = await mkdtemp(join(tmpdir(), `evidence-query-second-read-${kind}-`));
    const harness = createDevelopmentHarness(root, Buffer.alloc(32, 31));
    const committed = await harness.ingest.all({...developmentFixture, ingestId: createIdentity("ingest", {kind})});
    harness.projection.rebuild();
    let reads = 0;
    harness.bootstrap.custody.faultBoundary = async (stage) => {
      if (stage !== "read-verify" || ++reads !== 2) return;
      const head = harness.bootstrap.anchor.readHead("fixture");
      harness.bootstrap.anchor.appendCAS("fixture", head, {
        schemaVersion: 1,
        idempotencyId: `race:${kind}`,
        kind,
        body: {ingestId: committed.ingestId},
      });
    };
    const response = await harness.query({principal: "fixture-user", purpose: "test", text: "fixture"});
    assert.equal(response.items.length, 0, kind);
    assert.notEqual(committed.state, "QUARANTINED", kind);
    assert.equal(harness.projection.candidates("fixture").includes(committed.ingestId), false, kind);
  }
});

test("exact-ID retrieval independently enforces authorization and committed eligibility", async () => {
  const root = await mkdtemp(join(tmpdir(), "evidence-exact-"));
  const harness = createDevelopmentHarness(root, Buffer.alloc(32, 32));
  const prepared = await harness.ingest.prepare(developmentFixture);
  assert.equal((await harness.exact({principal: "fixture-user", purpose: "test", text: "ignored"}, prepared.ingestId)).items.length, 0);
  await harness.ingest.append(prepared.ingestId);
  assert.equal((await harness.exact({principal: "fixture-user", purpose: "test", text: "ignored"}, prepared.ingestId)).items.length, 0);
  await harness.ingest.commit(prepared.ingestId);
  assert.equal((await harness.exact({principal: "denied", purpose: "test", text: "ignored"}, prepared.ingestId)).diagnostic, "EVIDENCE_QUERY_DENIED");
  assert.equal((await harness.exact({principal: "fixture-user", purpose: "test", text: "ignored"}, prepared.ingestId)).items.length, 1);

  for (const condition of ["quarantined", "tombstoned", "orphan"]) {
    const isolated = createDevelopmentHarness(await mkdtemp(join(tmpdir(), `evidence-exact-${condition}-`)), Buffer.alloc(32, 33));
    const record = await isolated.ingest.all({...developmentFixture, ingestId: createIdentity("ingest", {condition})});
    isolated.projection.rebuild();
    if (condition === "quarantined") record.state = "QUARANTINED";
    if (condition === "tombstoned") await isolated.tombstone(record.ingestId);
    if (condition === "orphan") record.anchorHead = {...record.anchorHead, recordCommitment: "sha256:orphan"};
    assert.equal((await isolated.exact({principal: "fixture-user", purpose: "test", text: "ignored"}, record.ingestId)).items.length, 0, condition);
    assert.equal(isolated.projection.candidates("fixture").includes(record.ingestId), false, condition);
  }
});

test("final query authentication quarantines missing, truncated, bit-flipped, and path-swapped custody objects", async () => {
  for (const objectKind of ["raw", "derived"]) {
    for (const fault of ["missing", "truncated", "bit-flipped", "path-swapped"]) {
      const root = await mkdtemp(join(tmpdir(), `evidence-query-${objectKind}-${fault}-`));
      const harness = createDevelopmentHarness(root, Buffer.alloc(32, 12));
      const committed = await harness.ingest.all({...developmentFixture, ingestId: `${developmentFixture.ingestId}:${objectKind}:${fault}`});
      harness.projection.rebuild();
      const receiptKey = `${objectKind}Receipt`;
      const otherKey = objectKind === "raw" ? "derivedReceipt" : "rawReceipt";
      if (fault === "missing") await import("node:fs/promises").then(({rm}) => rm(committed[receiptKey].path));
      if (fault === "truncated") await truncate(committed[receiptKey].path, 8);
      if (fault === "bit-flipped") {
        const bytes = await readFile(committed[receiptKey].path);
        bytes[Math.floor(bytes.length / 2)] ^= 1;
        await writeFile(committed[receiptKey].path, bytes);
      }
      if (fault === "path-swapped") committed[receiptKey] = {...committed[receiptKey], path: committed[otherKey].path};
      const response = await harness.query({principal: "fixture-user", purpose: "test", text: "fixture"});
      assert.equal(response.items.length, 0, `${objectKind}:${fault}`);
      assert.equal(committed.state, "QUARANTINED", `${objectKind}:${fault}`);
      assert.equal(harness.projection.candidates("fixture").includes(committed.ingestId), false, `${objectKind}:${fault}`);
    }
  }
});

test("lexical query isolates corrupt custody while returning healthy evidence from the same batch", async () => {
  const root = await mkdtemp(join(tmpdir(), "evidence-query-isolated-corruption-"));
  const harness = createDevelopmentHarness(root, Buffer.alloc(32, 43));
  const records = [];
  for (const suffix of ["a", "b"]) {
    records.push(await harness.ingest.all({...developmentFixture, ingestId: createIdentity("ingest", {corruption: "isolated", suffix}), sourceLocator: `fixture://${suffix}`}));
  }
  harness.projection.rebuild();
  const [corrupt, healthy] = [...records].sort((left, right) => left.ingestId.localeCompare(right.ingestId));
  for (const record of records) {
    assert.equal(record.request.assertionState, "ACTIVE");
    assert.equal(harness.eligibility(record.ingestId).eligible, true);
    assert.equal(harness.projection.candidates("fixture").includes(record.ingestId), true);
  }

  await truncate(corrupt.rawReceipt.path, 8);
  const response = await harness.query({principal: "fixture-user", purpose: "test", text: "fixture"});

  assert.equal(response.items.length, 1);
  assert.equal(response.items[0].sourceLocator, healthy.request.sourceLocator);
  assert.equal(corrupt.state, "QUARANTINED");
  assert.equal(harness.eligibility(corrupt.ingestId).eligible, false);
  assert.equal(harness.projection.candidates("fixture").includes(corrupt.ingestId), false);
  assert.equal(healthy.state, "LOCAL_COMMITTED");
  assert.equal(healthy.request.assertionState, "ACTIVE");
  assert.equal(harness.eligibility(healthy.ingestId).eligible, true);
  assert.equal(harness.projection.candidates("fixture").includes(healthy.ingestId), true);
});

test("exact rebuild and reconciliation detect seeded faults without promotion", async () => {
  const root = await mkdtemp(join(tmpdir(), "evidence-reconcile-"));
  const harness = createDevelopmentHarness(root, Buffer.alloc(32, 4));
  const committed = await harness.ingest.all(developmentFixture);
  const first = harness.projection.rebuild();
  harness.projection.clear();
  assert.deepEqual(harness.projection.rebuild(), first);
  harness.seedFaults(committed.ingestId);
  const report = await harness.reconcile();
  assert.deepEqual(new Set(report.findings.map((item) => item.code)), new Set(["EVIDENCE_RECEIPT_OBJECT_MISSING", "EVIDENCE_RECEIPT_OBJECT_DIGEST_INVALID", "EVIDENCE_DANGLING_SPAN", "EVIDENCE_DANGLING_RELATIONSHIP", "EVIDENCE_PROJECTION_STALE", "EVIDENCE_TOMBSTONE_UNPROPAGATED", "EVIDENCE_ANCHOR_ORPHAN_RESTRICTIVE", "EVIDENCE_PREPARATION_STUCK"]));
  assert.equal(report.promoted, 0);
  assert.equal(committed.state, "QUARANTINED");
  assert.equal(harness.projection.candidates("fixture").includes(committed.ingestId), false);
});

test("reconciliation paginates restrictions beyond 100 and suppresses known ingests", async () => {
  const root = await mkdtemp(join(tmpdir(), "evidence-restriction-pages-"));
  const harness = createDevelopmentHarness(root, Buffer.alloc(32, 14));
  const committed = await harness.ingest.all(developmentFixture);
  harness.projection.rebuild();
  for (let index = 0; index < 100; index += 1) {
    const head = harness.bootstrap.anchor.readHead("fixture");
    harness.bootstrap.anchor.appendCAS("fixture", head, {schemaVersion: 1, idempotencyId: `filler:${index}`, kind: "INGEST", body: {requestDigest: `sha256:${index}`}});
  }
  const head = harness.bootstrap.anchor.readHead("fixture");
  harness.bootstrap.anchor.appendCAS("fixture", head, {schemaVersion: 1, idempotencyId: "late:hold", kind: "HOLD", body: {ingestId: committed.ingestId}});
  const report = await harness.reconcile();
  assert.equal(report.findings.some((finding) => finding.code === "EVIDENCE_ANCHOR_RESTRICTIVE" && finding.identity === committed.ingestId), true);
  assert.equal(committed.state, "QUARANTINED");
  assert.equal((await harness.query({principal: "fixture-user", purpose: "test", text: "fixture"})).items.length, 0);
});

test("tombstone and publication share one transaction barrier at raw and derived boundaries", async () => {
  for (const representationType of ["raw", "fixture-lexical"]) {
    const root = await mkdtemp(join(tmpdir(), `evidence-tombstone-${representationType}-`));
    const harness = createDevelopmentHarness(root, Buffer.alloc(32, 15));
    const request = {...developmentFixture, ingestId: createIdentity("ingest", {representationType})};
    const prepared = await harness.ingest.prepare(request);
    await harness.ingest.append(prepared.ingestId);
    let tombstonePromise;
    harness.bootstrap.custody.publicationBoundary = (aad) => {
      if (aad.representationType === representationType && !tombstonePromise) tombstonePromise = harness.tombstone(prepared.ingestId);
    };
    await harness.ingest.commit(prepared.ingestId);
    await tombstonePromise;
    assert.equal(prepared.state, "TOMBSTONED");
    assert.equal(prepared.tombstone, true);
  }
  const root = await mkdtemp(join(tmpdir(), "evidence-tombstone-wins-"));
  const harness = createDevelopmentHarness(root, Buffer.alloc(32, 16));
  const request = {...developmentFixture, ingestId: createIdentity("ingest", {tombstoneFirst: true})};
  const prepared = await harness.ingest.prepare(request);
  await harness.ingest.append(prepared.ingestId);
  await harness.tombstone(prepared.ingestId);
  await assert.rejects(() => harness.ingest.commit(prepared.ingestId), /EVIDENCE_INGEST_STATE_INVALID/);
  assert.equal(prepared.state, "TOMBSTONED");
});

test("restriction barriers at development custody await boundaries prevent local commit and serving", async () => {
  const stages = ["stage-create", "stage-write", "stage-sync", "pre-link", "link", "post-link", "directory-sync", "cleanup", "existing-open", "existing-read", "existing-verify", "read-open", "read-read", "read-verify", "pre-local-commit"];
  for (const stage of stages) {
    const root = await mkdtemp(join(tmpdir(), `evidence-barrier-${stage}-`));
    const harness = createDevelopmentHarness(root, Buffer.alloc(32, 34));
    const request = {...developmentFixture, ingestId: createIdentity("ingest", {stage})};
    const record = await harness.ingest.prepare(request);
    await harness.ingest.append(record.ingestId);
    if (stage.startsWith("existing-") || stage.startsWith("read-")) {
      await assert.rejects(() => harness.ingest.commit(record.ingestId, "AFTER_RAW_PUBLICATION"), /EVIDENCE_INGEST_FAULT_INJECTED/);
      if (stage.startsWith("existing-")) {
        record.rawReceipt = undefined;
        record.rawAad = undefined;
      }
    }
    let injected = false;
    const restrict = () => {
      if (injected) return;
      injected = true;
      const head = harness.bootstrap.anchor.readHead("fixture");
      harness.bootstrap.anchor.appendCAS("fixture", head, {schemaVersion: 1, idempotencyId: `barrier:${stage}`, kind: "HOLD", body: {ingestId: record.ingestId}});
    };
    if (stage === "pre-local-commit") harness.ingest.faultBoundary = (seen) => { if (seen === stage) restrict(); };
    else harness.bootstrap.custody.faultBoundary = (seen) => { if (seen === stage) restrict(); };
    await assert.rejects(() => harness.ingest.commit(record.ingestId), /EVIDENCE_INGEST_RESTRICTED/, stage);
    assert.notEqual(record.state, "LOCAL_COMMITTED", stage);
    harness.projection.rebuild();
    assert.equal((await harness.exact({principal: "fixture-user", purpose: "test", text: "ignored"}, record.ingestId)).items.length, 0, stage);
  }
});
