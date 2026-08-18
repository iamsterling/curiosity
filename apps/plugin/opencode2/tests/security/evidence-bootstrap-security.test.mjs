import assert from "node:assert/strict";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { bytesDigest, createDevelopmentBootstrap } from "../../dist/features/evidence/index.js";

test("development secrets are redacted and cannot imply activation or claims", () => {
  const sentinel = Buffer.from("sentinel-secret-material-32-bytes!!");
  const environment = {get: () => sentinel.toString("base64")};
  assert.throws(() => createDevelopmentBootstrap({environment, disposableRoot: "/tmp/disposable"}), /EVIDENCE_PROFILE_REQUIRED/);
  const bootstrap = createDevelopmentBootstrap({profile: "development-bootstrap", environment, disposableRoot: "/tmp/disposable"});
  assert.doesNotMatch(bootstrap.diagnostic, /sentinel|EVIDENCE_HMAC_KEY/i);
  assert.match(bootstrap.diagnostic, /no production cryptography|no-resurrection claim/i);
});

test("every AAD substitution and unknown version fails closed", async () => {
  const root = await mkdtemp(join(tmpdir(), "evidence-aad-"));
  const bootstrap = createDevelopmentBootstrap({profile: "development-bootstrap", environment: {get: () => Buffer.alloc(32, 11).toString("base64")}, disposableRoot: root});
  const plaintext = Buffer.from("fixture");
  const aad = {schemaVersion: 1, profile: "development-bootstrap", tenant: "fixture", objectId: "object:a", representationId: "representation:a", representationType: "raw", receiptId: "receipt:a", algorithm: "AES-256-GCM", keyGeneration: "key-a", plaintextSize: plaintext.length, plaintextDigest: bytesDigest(plaintext)};
  const published = await bootstrap.custody.publish(plaintext, aad);
  for (const key of ["tenant", "objectId", "representationId", "representationType", "receiptId", "keyGeneration", "plaintextDigest"]) {
    await assert.rejects(() => bootstrap.custody.read(published.receipt, {...aad, [key]: `${aad[key]}-changed`}), /EVIDENCE_OBJECT_AUTHENTICATION_FAILED/);
  }
  for (const [key, value] of Object.entries({schemaVersion: 2, id: "receipt:b", objectId: "object:b", representationId: "representation:b", path: `${published.receipt.path}.swap`, envelopeDigest: `${published.receipt.envelopeDigest}x`, plaintextDigest: `${published.receipt.plaintextDigest}x`, plaintextSize: published.receipt.plaintextSize + 1, keyGeneration: "key-b"})) {
    await assert.rejects(() => bootstrap.custody.read({...published.receipt, [key]: value}, aad), /EVIDENCE_OBJECT_(AUTHENTICATION_FAILED|DIGEST_INVALID|MISSING)/);
  }
  await assert.rejects(() => bootstrap.custody.read(published.receipt, {...aad, schemaVersion: 2}), /EVIDENCE_OBJECT_AAD_INVALID/);
  await assert.rejects(() => bootstrap.custody.read(published.receipt, {...aad, unrecognized: true}), /EVIDENCE_OBJECT_AAD_INVALID/);
});
