import { describe, expect, test } from "bun:test";

import { characterizeLegacyRecord } from "../src/retrieval/index.js";

describe("read-only legacy characterization fixtures", () => {
  test.each([
    ["M2", { documentId: "aurora", version: "1.0.0", sourceUrl: "https://m2.invalid/aurora", snapshotId: "m2-synthetic-lexical", analyzerVersion: "lexical-v1", score: 2 }, "LEGACY_PROJECTION_CANDIDATE"],
    ["M6", { documentId: "doc-01", snapshotId: "m6-owned-abc", captureId: "capture-abc", citation: { captureId: "capture-abc", url: "https://m6.invalid/a", sha256: "a".repeat(64) }, score: 1 }, "LEGACY_ACQUISITION_LOCATOR_ONLY"],
    ["EVENT_CAPTURE", { eventId: "evt-1", payloadDigest: "b".repeat(64), watermark: 4, taint: "untrusted" }, "DIGEST_ONLY_NO_PAYLOAD"],
    ["LEDGER_V1", { entityType: "evidence", id: "ev-1", outputDigest: "c".repeat(64), authority: "none" }, "TASK_EVIDENCE_NOT_RETRIEVED_TRUTH"],
    ["DEVELOPMENT_EVIDENCE", { captureId: "cap-1", representationId: "rep-1", spanId: "span-1", assertion: "ACTIVE" }, "DEVELOPMENT_ONLY_NO_PRODUCTION_CONTINUITY"],
  ] as const)("preserves %s distinctions without promotion", (sourceKind, input, finding) => {
    const result = characterizeLegacyRecord(sourceKind, input);
    expect(result).toMatchObject({ schemaVersion: 1, sourceKind, authority: "none", uncertainty: "UNVALIDATED", findings: [finding] });
    expect(Object.values(result.extensions)).toHaveLength(1);
    expect(Object.values(result.extensions)[0]).toBeDefined();
  });

  test("fails closed for unknown fields, missing payloads, and unbounded values", () => {
    expect(() => characterizeLegacyRecord("EVENT_CAPTURE", { eventId: "evt-1", payloadDigest: "a".repeat(64), payload: "invented" })).toThrow("RETRIEVAL_LEGACY_MAPPING_BLOCKED");
    expect(() => characterizeLegacyRecord("M2", { documentId: "x".repeat(300), version: "1", sourceUrl: "https://m2.invalid" })).toThrow("RETRIEVAL_LEGACY_MAPPING_BLOCKED");
  });
});
