import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, readdir, rename, rm, symlink, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import {
  assertionTransition,
  bytesDigest,
  createDevelopmentBootstrap,
  createIdentity,
  createSpanIdentity,
  decodeLayeredIdentities,
  decodeLifecycle,
  decodeRelationship,
  deterministicExtract,
  InMemoryAnchorEmulator,
  readVerifiedAnchor,
  RELATIONSHIP_TYPES,
} from "../../dist/features/evidence/index.js";

const secret = Buffer.alloc(32, 7);

test("strict domain contracts preserve orthogonal state and explicit relationships", () => {
  assert.deepEqual(decodeLifecycle({schemaVersion: 1, custody: "DURABLE", derivation: "RAW", assertion: "PENDING", queryEligibility: "SUPPRESSED", authorizationFreshness: "CURRENT", deletion: "LIVE"}).assertion, "PENDING");
  assert.equal(decodeLayeredIdentities({schemaVersion: 1, sourceObjectId: "source:1", revisionId: null, contentId: "content:1", occurrenceId: "occurrence:1", captureId: "capture:1", representationId: "representation:1", spanId: "span:1"}).revisionId, null);
  assert.throws(() => decodeLifecycle({schemaVersion: 1, custody: "DURABLE", derivation: "RAW", assertion: "ACTIVE", queryEligibility: "ELIGIBLE", authorizationFreshness: "CURRENT", deletion: "LIVE", surprise: true}), /EVIDENCE_CODEC_UNKNOWN_FIELD/);
  assert.deepEqual(RELATIONSHIP_TYPES, ["supports", "contradicts", "supersedes", "derived_from", "duplicate_of", "same_entity_as", "precedes", "decision_based_on", "invalidated_by"]);
  for (const type of RELATIONSHIP_TYPES) {
    const value = decodeRelationship({schemaVersion: 1, id: `rel:${type}`, revision: 1, type, subject: {kind: "assertion", id: "a"}, object: {kind: "assertion", id: "b"}, direction: "SUBJECT_TO_OBJECT", evidenceSpanIds: ["span:1"], producer: "fixture", producerVersion: "1", assertedAt: "2026-08-18T00:00:00.000Z", observedAt: "2026-08-18T00:00:00.000Z", assertionState: "PENDING"});
    assert.equal(value.type, type);
  }
  const relationship = decodeRelationship({schemaVersion: 1, id: "rel:optional", revision: 1, type: "supports", subject: {kind: "assertion", id: "a"}, object: {kind: "assertion", id: "b"}, direction: "SUBJECT_TO_OBJECT", evidenceSpanIds: ["span:1"], producer: "fixture", producerVersion: "1", assertedAt: "2026-08-18T00:00:00.000Z", observedAt: "2026-08-18T00:00:00.000Z", validTime: {start: "2026-08-01T00:00:00.000Z", end: "2026-08-31T00:00:00.000Z"}, validatorRef: "validator:1", policyRef: "policy:1", assertionState: "PENDING"});
  assert.deepEqual(relationship.validTime, {start: "2026-08-01T00:00:00.000Z", end: "2026-08-31T00:00:00.000Z"});
  assert.equal(relationship.validatorRef, "validator:1");
  assert.equal(relationship.policyRef, "policy:1");
  for (const malformed of [{validTime: "bad"}, {validTime: {start: 1}}, {validatorRef: 1}, {policyRef: null}]) {
    assert.throws(() => decodeRelationship({...relationship, ...malformed}), /EVIDENCE_CODEC_INVALID_RELATIONSHIP/);
  }
  assert.equal(assertionTransition("PENDING", "ACTIVE", {localCommitted: true, exactSpans: true, validatorAuthorized: true, policyCurrent: true}), "ACTIVE");
  assert.equal(assertionTransition("ACTIVE", "DISPUTED", {localCommitted: true, exactSpans: true, validatorAuthorized: true, policyCurrent: true}), "DISPUTED");
  assert.throws(() => assertionTransition("PENDING", "ACTIVE", {localCommitted: false, exactSpans: true, validatorAuthorized: true, policyCurrent: true}), /EVIDENCE_ASSERTION_ACTIVATION_BLOCKED/);
});

test("identities and fixture extraction are deterministic without collapsing layers", () => {
  const bytes = Buffer.from("Alpha fact. Beta fact.");
  const content = createIdentity("content", {bytesDigest: "sha256:x"});
  assert.equal(content, createIdentity("content", {bytesDigest: "sha256:x"}));
  assert.notEqual(createIdentity("capture", {source: "one", attempt: 1}), createIdentity("capture", {source: "two", attempt: 1}));
  assert.notEqual(createSpanIdentity("rep:1", 0, 5, bytes.subarray(0, 5), "chunks-v1"), createSpanIdentity("rep:1", 0, 5, bytes.subarray(0, 5), "chunks-v2"));
  assert.deepEqual(deterministicExtract("Alpha fact. Beta fact.", "rep:1"), deterministicExtract("Alpha fact. Beta fact.", "rep:1"));
});

test("development bootstrap is explicit and rejects production claims", () => {
  const adapter = {get: (name) => name === "EVIDENCE_HMAC_KEY" ? secret.toString("base64") : undefined};
  assert.throws(() => createDevelopmentBootstrap({environment: adapter}), /EVIDENCE_PROFILE_REQUIRED/);
  const bootstrap = createDevelopmentBootstrap({profile: "development-bootstrap", environment: adapter, disposableRoot: "/tmp/disposable"});
  assert.match(bootstrap.diagnostic, /TEST\/DEVELOPMENT ONLY/);
  for (const claim of ["production", "multiUser", "unattended", "noResurrection", "tamperEvidence"]) {
    assert.throws(() => createDevelopmentBootstrap({profile: "development-bootstrap", environment: adapter, disposableRoot: "/tmp/disposable", claims: {[claim]: true}}), /EVIDENCE_DEVELOPMENT_CLAIM_REJECTED/);
  }
});

test("anchor provides pagination, idempotency, stale conflict, restrictions, and key commitments", () => {
  const anchor = new InMemoryAnchorEmulator(secret);
  const zero = anchor.readHead("tenant:fixture");
  const first = anchor.appendCAS("tenant:fixture", zero, {schemaVersion: 1, idempotencyId: "one", kind: "KEY_GENERATION", body: {generation: "key-1", action: "CREATED"}});
  assert.deepEqual(anchor.appendCAS("tenant:fixture", zero, {schemaVersion: 1, idempotencyId: "one", kind: "KEY_GENERATION", body: {generation: "key-1", action: "CREATED"}}), first);
  assert.throws(() => anchor.appendCAS("tenant:fixture", zero, {schemaVersion: 1, idempotencyId: "two", kind: "ASSERTION_ACTIVATED", body: {id: "a"}}), /EVIDENCE_ANCHOR_STALE_HEAD/);
  assert.throws(() => anchor.appendCAS("tenant:fixture", first, {schemaVersion: 1, idempotencyId: "bad", kind: "TOMBSTONE_REVERSED", body: {id: "a"}}), /EVIDENCE_ANCHOR_RESTRICTION_REVERSAL/);
  assert.equal(anchor.readAfter("tenant:fixture", 0, 1).records.length, 1);
  assert.equal(anchor.readAfter("tenant:fixture", 0, 1).hasMore, false);

  const forged = {...zero, stream: "tenant:fixture", authentication: "forged"};
  assert.throws(() => anchor.appendCAS("tenant:fixture", forged, {schemaVersion: 1, idempotencyId: "one", kind: "KEY_GENERATION", body: {generation: "key-1", action: "CREATED"}}), /EVIDENCE_ANCHOR_AUTHENTICATION_FAILED/);
  assert.throws(() => anchor.appendCAS("other", first, {schemaVersion: 1, idempotencyId: "one", kind: "KEY_GENERATION", body: {generation: "key-1", action: "CREATED"}}), /EVIDENCE_ANCHOR_WRONG_STREAM/);

  const mutable = {schemaVersion: 1, idempotencyId: "immutable", kind: "INGEST", body: {requestDigest: "sha256:original"}};
  const immutableHead = anchor.appendCAS("tenant:fixture", first, mutable);
  mutable.body.requestDigest = "sha256:changed";
  const stored = anchor.readAfter("tenant:fixture", 1, 1).records[0];
  assert.equal(stored.intent.body.requestDigest, "sha256:original");
  assert.throws(() => { stored.intent.body.requestDigest = "sha256:changed"; }, TypeError);
  assert.deepEqual(anchor.appendCAS("tenant:fixture", first, {schemaVersion: 1, idempotencyId: "immutable", kind: "INGEST", body: {requestDigest: "sha256:original"}}), immutableHead);

  const other = new InMemoryAnchorEmulator(secret);
  const streamA = other.appendCAS("a", other.readHead("a"), {schemaVersion: 1, idempotencyId: "a-created", kind: "KEY_GENERATION", body: {generation: "shared", action: "CREATED"}});
  other.appendCAS("a", streamA, {schemaVersion: 1, idempotencyId: "a-retired", kind: "KEY_GENERATION", body: {generation: "shared", action: "RETIRED"}});
  const streamB = other.appendCAS("b", other.readHead("b"), {schemaVersion: 1, idempotencyId: "b-created", kind: "KEY_GENERATION", body: {generation: "shared", action: "CREATED"}});
  assert.equal(streamB.sequence, 1);
  assert.throws(() => readVerifiedAnchor(other, "a", 1), /EVIDENCE_ANCHOR_TOTAL_BOUND_EXCEEDED/);
});

test("AES custody uses distinct random envelopes and authenticates bound AAD", async () => {
  const root = await mkdtemp(join(tmpdir(), "evidence-crypto-"));
  const bootstrap = createDevelopmentBootstrap({profile: "development-bootstrap", environment: {get: () => secret.toString("base64")}, disposableRoot: root});
  const aad = {schemaVersion: 1, profile: "development-bootstrap", tenant: "fixture", objectId: "object:1", representationId: "representation:1", representationType: "raw", receiptId: "receipt:1", algorithm: "AES-256-GCM", keyGeneration: "key-1", plaintextSize: 5, plaintextDigest: bytesDigest(Buffer.from("hello"))};
  const one = await bootstrap.custody.publish(Buffer.from("hello"), aad);
  const retry = await bootstrap.custody.publish(Buffer.from("hello"), aad);
  assert.deepEqual(retry.receipt, one.receipt);
  assert.deepEqual(retry.envelope, one.envelope);
  const two = await bootstrap.custody.publish(Buffer.from("hello"), {...aad, objectId: "object:2", receiptId: "receipt:2"});
  assert.notEqual(one.envelope.nonce, two.envelope.nonce);
  assert.notEqual(one.envelope.wrappedDek, two.envelope.wrappedDek);
  assert.equal((await bootstrap.custody.read(one.receipt, aad)).toString(), "hello");
  await assert.rejects(() => bootstrap.custody.read(one.receipt, {...aad, tenant: "other"}), /EVIDENCE_OBJECT_AUTHENTICATION_FAILED/);
  const bytes = await readFile(one.receipt.path, "utf8");
  assert.doesNotMatch(bytes, /hello/);
  assert.doesNotMatch(JSON.stringify(one.receipt), new RegExp(secret.toString("hex")));

  const substitutions = {
    schemaVersion: 2,
    id: "receipt:other",
    objectId: "object:other",
    representationId: "representation:other",
    path: two.receipt.path,
    envelopeDigest: two.receipt.envelopeDigest,
    plaintextDigest: `${one.receipt.plaintextDigest}x`,
    plaintextSize: one.receipt.plaintextSize + 1,
    keyGeneration: "key-other",
  };
  for (const [key, value] of Object.entries(substitutions)) {
    await assert.rejects(() => bootstrap.custody.read({...one.receipt, [key]: value}, aad), /EVIDENCE_OBJECT_(AUTHENTICATION_FAILED|DIGEST_INVALID)/);
  }
});

test("custody reads fail closed on symlinks, directories, and path replacement races", async () => {
  const root = await mkdtemp(join(tmpdir(), "evidence-safe-read-"));
  const bootstrap = createDevelopmentBootstrap({profile: "development-bootstrap", environment: {get: () => secret.toString("base64")}, disposableRoot: root});
  const plaintext = Buffer.from("hello");
  const aad = {schemaVersion: 1, profile: "development-bootstrap", tenant: "fixture", objectId: "object:safe", representationId: "representation:safe", representationType: "raw", receiptId: "receipt:safe", algorithm: "AES-256-GCM", keyGeneration: "key-1", plaintextSize: plaintext.length, plaintextDigest: bytesDigest(plaintext)};
  const published = await bootstrap.custody.publish(plaintext, aad);
  const original = `${published.receipt.path}.original`;

  await rename(published.receipt.path, original);
  await symlink(original, published.receipt.path);
  await assert.rejects(() => bootstrap.custody.read(published.receipt, aad), /EVIDENCE_CUSTODY_(UNSAFE_OBJECT|NOFOLLOW_UNSUPPORTED)/);
  await rm(published.receipt.path);
  await mkdir(published.receipt.path);
  await assert.rejects(() => bootstrap.custody.read(published.receipt, aad), /EVIDENCE_CUSTODY_UNSAFE_OBJECT/);
  await rm(published.receipt.path, {recursive: true});
  await writeFile(published.receipt.path, await readFile(original));

  bootstrap.custody.faultBoundary = async (stage) => {
    if (stage !== "read-open") return;
    await rename(published.receipt.path, `${published.receipt.path}.opened`);
    await writeFile(published.receipt.path, "replacement");
  };
  assert.equal((await bootstrap.custody.read(published.receipt, aad)).toString(), "hello");
});

test("custody rejects parent-directory symlink substitution before publication or read", async () => {
  const make = async (label) => {
    const root = await mkdtemp(join(tmpdir(), `evidence-parent-${label}-`));
    const outside = await mkdtemp(join(tmpdir(), `evidence-parent-outside-${label}-`));
    const bootstrap = createDevelopmentBootstrap({profile: "development-bootstrap", environment: {get: () => secret.toString("base64")}, disposableRoot: root});
    const plaintext = Buffer.from("hello");
    const aad = {schemaVersion: 1, profile: "development-bootstrap", tenant: "fixture", objectId: `object:${label}`, representationId: `representation:${label}`, representationType: "raw", receiptId: `receipt:${label}`, algorithm: "AES-256-GCM", keyGeneration: "key-1", plaintextSize: plaintext.length, plaintextDigest: bytesDigest(plaintext)};
    return {root, outside, bootstrap, plaintext, aad};
  };

  const publication = await make("publish-parent");
  publication.bootstrap.custody.publicationBoundary = async () => {
    await rename(join(publication.root, "objects"), join(publication.root, "objects-original"));
    await symlink(publication.outside, join(publication.root, "objects"));
  };
  await assert.rejects(() => publication.bootstrap.custody.publish(publication.plaintext, publication.aad), /EVIDENCE_CUSTODY_UNSAFE_PARENT/);
  assert.deepEqual(await readdir(publication.outside), []);

  const reading = await make("read-parent");
  const published = await reading.bootstrap.custody.publish(reading.plaintext, reading.aad);
  reading.bootstrap.custody.faultBoundary = async (stage) => {
    if (stage !== "read-open") return;
    await rename(join(reading.root, "objects"), join(reading.root, "objects-original"));
    await symlink(reading.outside, join(reading.root, "objects"));
  };
  await assert.rejects(() => reading.bootstrap.custody.read(published.receipt, reading.aad), /EVIDENCE_CUSTODY_UNSAFE_PARENT/);
});

test("custody rejects a FIFO without blocking", {timeout: 2000}, async (context) => {
  const root = await mkdtemp(join(tmpdir(), "evidence-fifo-"));
  const bootstrap = createDevelopmentBootstrap({profile: "development-bootstrap", environment: {get: () => secret.toString("base64")}, disposableRoot: root});
  const plaintext = Buffer.from("hello");
  const aad = {schemaVersion: 1, profile: "development-bootstrap", tenant: "fixture", objectId: "object:fifo", representationId: "representation:fifo", representationType: "raw", receiptId: "receipt:fifo", algorithm: "AES-256-GCM", keyGeneration: "key-1", plaintextSize: plaintext.length, plaintextDigest: bytesDigest(plaintext)};
  const published = await bootstrap.custody.publish(plaintext, aad);
  await rm(published.receipt.path);
  const made = spawnSync("mkfifo", [published.receipt.path]);
  if (made.status !== 0) return context.skip("mkfifo unavailable");
  await assert.rejects(() => bootstrap.custody.read(published.receipt, aad), /EVIDENCE_CUSTODY_(UNSAFE_OBJECT|NONBLOCK_UNSUPPORTED)/);
});
