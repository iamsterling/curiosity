import { describe, expect, test } from "bun:test";

import {
  decodeRetrievalFrame,
  decodeSourceCapabilityManifest,
  mapRepositoryOutcomeToRetrievalFrame,
  RETRIEVAL_LIMITS,
  type DiscoveryCandidate,
  type EvidenceEnvelope,
} from "../src/retrieval/index.js";
import type { RepositoryOutcome } from "../src/repository-search.js";

const NOW = "2026-08-18T12:00:00.000Z";

const candidate = (extensions: Record<string, unknown> = {}) => ({
  schemaVersion: 1, contract: "curiosity.retrieval/discovery-candidate/v1", recordKind: "discovery-candidate",
  candidateId: "candidate-1", surfaceId: "surface-1", sourceLocator: "https://example.org/a", title: "title", snippet: "snippet",
  observedAt: NOW, nativeRanking: { namespace: "org.searxng.providers/v1", labels: ["provider"] }, extensions,
  trust: "untrusted-candidate", authority: "none",
});

const completeFrame = () => ({
  schemaVersion: 1, contract: "curiosity.retrieval/frame/v1", requestId: "complete", planRef: "plan-1",
  candidates: [], attempts: [{ surfaceId: "surface-1", mode: "INDEXED", outcome: "SUCCEEDED", freshness: { state: "CURRENT", observedAt: NOW }, observedItems: 0 }],
  coverage: { measurement: "MEASURED", completeness: "COMPLETE", requestedScope: 0, attemptedScope: 0, eligibleScope: 0, observedItems: 0 },
  failures: [], partial: false, asOf: NOW,
});

const manifestInput = () => ({
  schemaVersion: 1, contract: "curiosity.retrieval/source-capability-manifest/v1", manifestId: "manifest-1",
  connectorRef: "runtime/searxng-gateway", surfaceKinds: ["public-web"], modes: ["INDEXED", "LIVE", "HYBRID"],
  queryOperators: ["text"], filterFields: [], ordering: "SOURCE_NATIVE", pagination: "NONE",
  maxResults: 10, maxBytes: 256000, supportsDeadline: true, authorizationClass: "brokered-service-credential",
  tenancy: "TENANT_SCOPED", policyDependencies: ["authorization-snapshot", "freshness-policy"],
  fieldSupport: { revision: "UNKNOWN", capture: "UNAVAILABLE", validTime: "UNAVAILABLE", transactionTime: "UNAVAILABLE", deletion: "UNAVAILABLE", provenance: "AVAILABLE" },
  sourceCursor: { kind: "NONE", stableWithinSnapshot: false }, cancellation: { supported: true, guarantee: "BEST_EFFORT" },
  coverageMethod: "provider-disclosed", freshnessSemantics: "live-observation-time", failureCodes: ["SOURCE_PARTIAL_FAILURE"],
  contentTypes: ["text/plain"], extensionNamespaces: [], binding: { kind: "CONFIGURATION", reference: "runtime-config-v1" },
  authority: "capability-only",
});

const repositoryOutcome: RepositoryOutcome = {
  results: [
    { title: "Second", url: "https://example.org/b", content: "beta", provenance: ["searxng-gateway", "zeta"], trust: "untrusted-search-result" },
    { title: "First", url: "https://example.org/a", content: "alpha", provenance: ["searxng-gateway", "alpha"], trust: "untrusted-search-result" },
  ],
  partialFailures: [{ source: "slow-engine", reason: "timeout" }],
};

describe("Curiosity Retrieval v1 contracts", () => {
  test("candidate is structurally and semantically distinct from evidence", () => {
    const frame = mapRepositoryOutcomeToRetrievalFrame({ requestId: "request-1", outcome: repositoryOutcome, observedAt: NOW });
    const candidate: DiscoveryCandidate = frame.candidates[0]!;
    // @ts-expect-error a transient candidate cannot be assigned to immutable evidence
    const evidence: EvidenceEnvelope = candidate;
    expect(candidate.recordKind).toBe("discovery-candidate");
    expect((evidence as unknown as { recordKind: string }).recordKind).not.toBe("evidence-envelope");
    expect(candidate.authority).toBe("none");
  });

  test("repository mapping is deterministic, bounded, partial, and preserves native labels as opaque metadata", () => {
    const input = { requestId: "request-1", outcome: repositoryOutcome, observedAt: NOW } as const;
    const first = mapRepositoryOutcomeToRetrievalFrame(input);
    const second = mapRepositoryOutcomeToRetrievalFrame(input);
    expect(first).toEqual(second);
    expect(decodeRetrievalFrame(first)).toEqual(first);
    expect(first.partial).toBe(true);
    expect(first.coverage).toMatchObject({ measurement: "UNKNOWN", completeness: "PARTIAL", observedItems: 2 });
    expect(first.attempts).toEqual([
      expect.objectContaining({ surfaceId: "public-web/searxng-gateway", outcome: "FAILED", freshness: { state: "UNKNOWN" } }),
    ]);
    expect(first.candidates[0]!.nativeRanking).toEqual({ namespace: "org.searxng.providers/v1", labels: ["searxng-gateway", "zeta"] });
    expect(first.candidates[0]!.extensions).toEqual({});
    expect(first.candidates[0]!.nativeRanking).not.toHaveProperty("confidence");

    const oversized: RepositoryOutcome = {
      results: Array.from({ length: 40 }, (_, index) => ({
        title: "t".repeat(500), url: `https://example.org/${index}`, content: "c".repeat(4_000),
        provenance: Array.from({ length: 20 }, () => "provider"), trust: "untrusted-search-result" as const,
      })),
      partialFailures: [],
    };
    const bounded = mapRepositoryOutcomeToRetrievalFrame({ requestId: "bounded", outcome: oversized, observedAt: NOW });
    expect(bounded.candidates).toHaveLength(10);
    expect(bounded.candidates[0]!.title).toHaveLength(300);
    expect(bounded.candidates[0]!.snippet).toHaveLength(2_000);
    expect(bounded.candidates[0]!.nativeRanking.labels).toHaveLength(8);
  });

  test("repository mapping is UTF-8 safe, validates ingress, and handles absent labels explicitly", () => {
    const multibyte: RepositoryOutcome = { results: [{ title: "😀".repeat(100), url: "https://example.org/a", content: "é".repeat(2_000), provenance: [], trust: "untrusted-search-result" }], partialFailures: [] };
    const frame = mapRepositoryOutcomeToRetrievalFrame({ requestId: "utf8", outcome: multibyte, observedAt: NOW });
    expect(Buffer.byteLength(frame.candidates[0]!.title)).toBeLessThanOrEqual(RETRIEVAL_LIMITS.title);
    expect(Buffer.byteLength(frame.candidates[0]!.snippet)).toBeLessThanOrEqual(RETRIEVAL_LIMITS.snippet);
    expect(frame.candidates[0]!.title).not.toContain("�");
    expect(frame.candidates[0]!.nativeRanking.labels).toEqual(["source-labels-unavailable"]);
    expect(decodeRetrievalFrame(frame)).toEqual(frame);

    const outcome = (overrides: Partial<RepositoryOutcome["results"][number]>): RepositoryOutcome => ({ results: [{ title: "ok", url: "https://example.org", content: "ok", provenance: ["source"], trust: "untrusted-search-result", ...overrides }], partialFailures: [] });
    for (const [bad, observedAt] of [
      [outcome({ url: "not-a-url" }), NOW],
      [outcome({ title: "bad\u0000title" }), NOW],
      [outcome({ provenance: [""] }), NOW],
      [outcome({ provenance: ["Bearer eyJhbGciOiJIUzI1NiJ9.payload.signature"] }), NOW],
      [outcome({ provenance: ["ghp_abcdefghijklmnopqrstuvwxyz1234567890"] }), NOW],
      [outcome({ provenance: ["secret-sentinel"] }), NOW],
      [outcome({}), "not-a-time"],
    ] as const) expect(() => mapRepositoryOutcomeToRetrievalFrame({ requestId: "invalid", outcome: bad, observedAt })).toThrow("RETRIEVAL_REPOSITORY_MAPPING_INVALID");
    const symbolProvenance = ["provider"] as unknown as Record<PropertyKey, unknown>; symbolProvenance[Symbol("metadata")] = "hidden";
    expect(() => mapRepositoryOutcomeToRetrievalFrame({ requestId: "invalid", outcome: outcome({ provenance: symbolProvenance as unknown as string[] }), observedAt: NOW })).toThrow("RETRIEVAL_REPOSITORY_MAPPING_INVALID");
    expect(() => mapRepositoryOutcomeToRetrievalFrame({ requestId: "bad id", outcome: outcome({}), observedAt: NOW })).toThrow("RETRIEVAL_REPOSITORY_MAPPING_INVALID");
  });

  test("unknown, failed, and empty complete surfaces remain distinguishable", () => {
    const unknown = decodeRetrievalFrame({
      schemaVersion: 1, contract: "curiosity.retrieval/frame/v1", requestId: "unknown", planRef: "plan-1",
      candidates: [], attempts: [{ surfaceId: "surface-1", mode: "INDEXED", outcome: "NOT_ATTEMPTED", freshness: { state: "UNKNOWN" }, observedItems: 0 }],
      coverage: { measurement: "UNKNOWN", completeness: "UNKNOWN", requestedScope: null, attemptedScope: null, eligibleScope: null, observedItems: 0 },
      failures: [], partial: true, asOf: NOW,
    });
    const complete = decodeRetrievalFrame(completeFrame());
    expect(unknown.coverage.completeness).toBe("UNKNOWN");
    expect(complete.coverage.completeness).toBe("COMPLETE");
    expect(() => decodeRetrievalFrame({ ...complete, partial: true })).toThrow("RETRIEVAL_CONTRACT_INVALID");
  });

  test("complete coverage fails closed for every incomplete or inconsistent condition", () => {
    const base = completeFrame();
    const invalid = [
      { ...base, coverage: { ...base.coverage, measurement: "ESTIMATED" } },
      { ...base, coverage: { ...base.coverage, requestedScope: null } },
      { ...base, coverage: { ...base.coverage, requestedScope: 1, attemptedScope: 0 } },
      { ...base, coverage: { ...base.coverage, attemptedScope: 0, eligibleScope: 1 } },
      { ...base, coverage: { ...base.coverage, eligibleScope: 0, observedItems: 1 } },
      { ...base, attempts: [{ ...base.attempts[0]!, outcome: "FAILED" }] },
      { ...base, attempts: [{ ...base.attempts[0]!, freshness: { state: "UNKNOWN" } }] },
      { ...base, failures: [{ surfaceId: "surface-1", code: "FAILED", detail: "failure" }] },
      { ...base, attempts: [{ ...base.attempts[0]!, observedItems: 1 }] },
    ];
    for (const frame of invalid) expect(() => decodeRetrievalFrame(frame)).toThrow("RETRIEVAL_CONTRACT_INVALID");
    expect(decodeRetrievalFrame({ ...invalid[1], coverage: { ...invalid[1]!.coverage, completeness: "PARTIAL" }, partial: true }).partial).toBe(true);
  });

  test("candidate observation time never exceeds frame as-of, including partial frames", () => {
    const frame = {
      ...completeFrame(), candidates: [candidate()],
      attempts: [{ ...completeFrame().attempts[0]!, observedItems: 1 }],
      coverage: { measurement: "UNKNOWN", completeness: "UNKNOWN", requestedScope: null, attemptedScope: null, eligibleScope: null, observedItems: 1 },
      partial: true,
    };
    expect(decodeRetrievalFrame(frame).candidates[0]!.observedAt).toBe(NOW);
    const future = structuredClone(frame); future.candidates[0]!.observedAt = "2026-08-18T12:00:00.001Z";
    expect(() => decodeRetrievalFrame(future)).toThrow("RETRIEVAL_CONTRACT_INVALID");
  });

  test("closed legacy extensions preserve aggregate budgets and reject prototype/symbol/nested bypasses", () => {
    const namespace = "org.curiosity.legacy.m2/v1";
    const frameFor = (candidates: ReturnType<typeof candidate>[]) => ({
      ...completeFrame(), requestId: "extensions", candidates,
      attempts: [{ ...completeFrame().attempts[0]!, observedItems: candidates.length }],
      coverage: { ...completeFrame().coverage, requestedScope: candidates.length, attemptedScope: candidates.length, eligibleScope: candidates.length, observedItems: candidates.length },
    });
    const urlPrefix = "https://example.org/";
    const fixedBytes = Buffer.byteLength(namespace) + Buffer.byteLength("documentIdversion sourceUrl".replace(" ", "")) + 2 + Buffer.byteLength(urlPrefix);
    const atByteLimit = frameFor([candidate({ [namespace]: { documentId: "d", version: "v", sourceUrl: `${urlPrefix}${"x".repeat(RETRIEVAL_LIMITS.extensionBytes - fixedBytes)}` } })]);
    expect(decodeRetrievalFrame(atByteLimit).candidates).toHaveLength(1);
    const overBytes = structuredClone(atByteLimit);
    (overBytes.candidates[0]!.extensions[namespace] as { sourceUrl: string }).sourceUrl += "x";
    expect(() => decodeRetrievalFrame(overBytes)).toThrow("RETRIEVAL_CONTRACT_INVALID");

    const fullM2 = { documentId: "d", version: "v", sourceUrl: "https://example.org", snapshotId: "s", analyzerVersion: "a", score: 1 };
    const nodeCandidates = Array.from({ length: 8 }, (_, index) => ({ ...candidate({ [namespace]: fullM2 }), candidateId: `candidate-node-${index}` }));
    expect(decodeRetrievalFrame(frameFor(nodeCandidates)).candidates).toHaveLength(8);
    nodeCandidates.push({ ...candidate({ [namespace]: fullM2 }), candidateId: "candidate-node-8" });
    expect(() => decodeRetrievalFrame(frameFor(nodeCandidates))).toThrow("RETRIEVAL_CONTRACT_INVALID");

    for (const dangerous of ["constructor", "toString", "__proto__"])
      expect(() => decodeRetrievalFrame(frameFor([candidate(Object.fromEntries([[dangerous, {}]]))]))).toThrow("RETRIEVAL_CONTRACT_INVALID");
    const symbolRoot: Record<PropertyKey, unknown> = {}; symbolRoot[Symbol("root")] = "hidden";
    const symbolSchema = { ...fullM2 } as Record<PropertyKey, unknown>; symbolSchema[Symbol("schema")] = "hidden";
    const nestedCitation: Record<PropertyKey, unknown> = { captureId: "capture-1", url: "https://example.org", sha256: "a".repeat(64) }; nestedCitation[Symbol("citation")] = "hidden";
    const symbolNested = { "org.curiosity.legacy.m6/v1": { documentId: "d", snapshotId: "s", captureId: "capture-1", citation: nestedCitation } };
    const oversizedNested = { documentId: "d", version: "v", sourceUrl: { padding: "x".repeat(100_000) } };
    for (const extensions of [symbolRoot, { [namespace]: symbolSchema }, symbolNested, { [namespace]: oversizedNested }, { [namespace]: { ...fullM2, extra: "unknown" } }])
      expect(() => decodeRetrievalFrame(frameFor([candidate(extensions as Record<string, unknown>)]))).toThrow("RETRIEVAL_CONTRACT_INVALID");
  });

  test("native provider metadata is identifier-only and rejects credential-shaped values", () => {
    const frame = completeFrame();
    const frameWithLabel = (label: string) => ({ ...frame, candidates: [{ ...candidate(), nativeRanking: { namespace: "org.searxng.providers/v1", labels: [label] } }], attempts: [{ ...frame.attempts[0]!, observedItems: 1 }], coverage: { ...frame.coverage, requestedScope: 1, attemptedScope: 1, eligibleScope: 1, observedItems: 1 } });
    expect(decodeRetrievalFrame(frameWithLabel("brave-search")).candidates[0]!.nativeRanking.labels).toEqual(["brave-search"]);
    const symbolLabels = frameWithLabel("brave-search"); (symbolLabels.candidates[0]!.nativeRanking.labels as unknown as Record<PropertyKey, unknown>)[Symbol("labels")] = "hidden";
    expect(() => decodeRetrievalFrame(symbolLabels)).toThrow("RETRIEVAL_CONTRACT_INVALID");
    for (const label of [
      "Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.signature",
      "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.signature",
      "ghp_abcdefghijklmnopqrstuvwxyz1234567890",
      "api_key_abcd1234efgh5678",
      "a9f3k2m8q7w4z6x1c5v0b2n8",
      "secret-sentinel",
    ]) expect(() => decodeRetrievalFrame(frameWithLabel(label))).toThrow("RETRIEVAL_CONTRACT_INVALID");
  });

  test("manifest decoder is closed and supports indexed, live, and hybrid modes without granting authority", () => {
    const manifest = decodeSourceCapabilityManifest(manifestInput());
    expect(manifest.modes).toEqual(["INDEXED", "LIVE", "HYBRID"]);
    expect(manifest.authority).toBe("capability-only");
    expect(() => decodeSourceCapabilityManifest({ ...manifest, token: "secret" })).toThrow("RETRIEVAL_CONTRACT_UNKNOWN_FIELD");
    expect(() => decodeSourceCapabilityManifest({ ...manifest, schemaVersion: 2 })).toThrow("RETRIEVAL_CONTRACT_UNSUPPORTED_VERSION");
  });

  test("manifest requires closed tenancy, policy, field, cursor, and cancellation declarations", () => {
    const manifest = manifestInput();
    const { tenancy: _omitted, ...withoutTenancy } = manifest;
    expect(() => decodeSourceCapabilityManifest(withoutTenancy)).toThrow("RETRIEVAL_CONTRACT_INVALID");
    expect(() => decodeSourceCapabilityManifest({ ...manifest, sourceCursor: { kind: "NONE", stableWithinSnapshot: true } })).toThrow("RETRIEVAL_CONTRACT_INVALID");
    expect(() => decodeSourceCapabilityManifest({ ...manifest, pagination: "CURSOR" })).toThrow("RETRIEVAL_CONTRACT_INVALID");
    expect(() => decodeSourceCapabilityManifest({ ...manifest, cancellation: { supported: false, guarantee: "BEST_EFFORT" } })).toThrow("RETRIEVAL_CONTRACT_INVALID");
    expect(() => decodeSourceCapabilityManifest({ ...manifest, modes: ["HYBRID", "LIVE"] })).toThrow("RETRIEVAL_CONTRACT_INVALID");
    expect(() => decodeSourceCapabilityManifest({ ...manifest, extensionNamespaces: ["org.unknown/v1"] })).toThrow("RETRIEVAL_CONTRACT_INVALID");
  });
});
