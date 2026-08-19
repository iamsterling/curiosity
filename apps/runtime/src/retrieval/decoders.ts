import { RETRIEVAL_LIMITS, type AuthorityDecisionReference, type DiscoveryCandidate, type RetrievalFrame, type RetrievalMode, type RetrievalPlan, type SourceCapabilityManifest, type SourceSurface } from "./contracts.js";
import { allowedExtensionNamespace, decodeExtensions, newExtensionBudget } from "./extension-decoder.js";
import { validProviderIdentifierArray } from "./provider-identifier.js";
import { validHttpUrl, validRfc3339 } from "./validation.js";

const fail = (code = "RETRIEVAL_CONTRACT_INVALID"): never => { throw new Error(code); };
const record = (input: unknown): Record<string, unknown> => {
  if (typeof input !== "object" || input === null || Array.isArray(input)) return fail();
  const prototype = Object.getPrototypeOf(input);
  if (prototype !== Object.prototype && prototype !== null) return fail();
  return input as Record<string, unknown>;
};
const exact = (value: Record<string, unknown>, allowed: readonly string[], required = allowed): void => {
  if (Reflect.ownKeys(value).some((key) => typeof key !== "string" || !allowed.includes(key))) fail("RETRIEVAL_CONTRACT_UNKNOWN_FIELD");
  if (required.some((key) => !(key in value))) fail();
};
const text = (value: unknown, maximum: number = RETRIEVAL_LIMITS.id): string => {
  if (typeof value !== "string" || value.length < 1 || Buffer.byteLength(value) > maximum || /[\u0000-\u001f\u007f]/u.test(value)) return fail();
  return value;
};
const inertText = (value: unknown, maximum: number): string => {
  if (typeof value !== "string" || Buffer.byteLength(value) > maximum || /[\u0000-\u001f\u007f]/u.test(value)) return fail();
  return value;
};
const integer = (value: unknown, maximum = 1_000_000): number => {
  if (!Number.isSafeInteger(value) || (value as number) < 0 || (value as number) > maximum) return fail();
  return value as number;
};
const positiveInteger = (value: unknown, maximum: number): number => {
  const result = integer(value, maximum);
  return result > 0 ? result : fail();
};
const nullableInteger = (value: unknown): number | null => value === null ? null : integer(value);
const oneOf = <T extends string>(value: unknown, values: readonly T[]): T => values.includes(value as T) ? value as T : fail();
const texts = (value: unknown, maximum: number): string[] => {
  if (!Array.isArray(value) || value.length < 1 || value.length > maximum) return fail();
  return value.map((item) => text(item));
};
const optionalTexts = (value: unknown, maximum: number): string[] => {
  if (!Array.isArray(value) || value.length > maximum) return fail();
  return value.map((item) => text(item));
};
const isoTime = (value: unknown): string => {
  const result = text(value, 64);
  if (!validRfc3339(result)) return fail();
  return result;
};

const decodeCandidate = (input: unknown, extensionBudget: ReturnType<typeof newExtensionBudget>): DiscoveryCandidate => {
  const value = record(input);
  exact(value, ["schemaVersion", "contract", "recordKind", "candidateId", "surfaceId", "sourceLocator", "title", "snippet", "observedAt", "nativeRanking", "extensions", "trust", "authority"]);
  if (value.schemaVersion !== 1 || value.contract !== "curiosity.retrieval/discovery-candidate/v1" || value.recordKind !== "discovery-candidate" || value.trust !== "untrusted-candidate" || value.authority !== "none") fail();
  const ranking = record(value.nativeRanking); exact(ranking, ["namespace", "labels"]);
  if (ranking.namespace !== "org.searxng.providers/v1" || !validProviderIdentifierArray(ranking.labels, 1, RETRIEVAL_LIMITS.labels)) fail();
  const rankingLabels = ranking.labels;
  const locator = text(value.sourceLocator, RETRIEVAL_LIMITS.locator);
  if (!validHttpUrl(locator)) fail();
  return {
    schemaVersion: 1, contract: "curiosity.retrieval/discovery-candidate/v1", recordKind: "discovery-candidate",
    candidateId: text(value.candidateId), surfaceId: text(value.surfaceId), sourceLocator: locator,
    title: inertText(value.title, RETRIEVAL_LIMITS.title), snippet: inertText(value.snippet, RETRIEVAL_LIMITS.snippet), observedAt: isoTime(value.observedAt),
    nativeRanking: { namespace: "org.searxng.providers/v1", labels: rankingLabels as string[] },
    extensions: decodeExtensions(value.extensions, extensionBudget), trust: "untrusted-candidate", authority: "none",
  };
};

export const decodeSourceSurface = (input: unknown): SourceSurface => {
  const value = record(input);
  exact(value, ["schemaVersion", "contract", "surfaceId", "sourceKind", "ownerNamespace", "collectionId", "tenantBoundary", "identityPolicyVersion", "extensions"]);
  if (value.schemaVersion !== 1 || value.contract !== "curiosity.retrieval/source-surface/v1") fail("RETRIEVAL_CONTRACT_UNSUPPORTED_VERSION");
  return { schemaVersion: 1, contract: "curiosity.retrieval/source-surface/v1", surfaceId: text(value.surfaceId), sourceKind: text(value.sourceKind), ownerNamespace: text(value.ownerNamespace), collectionId: text(value.collectionId), tenantBoundary: text(value.tenantBoundary), identityPolicyVersion: text(value.identityPolicyVersion), extensions: decodeExtensions(value.extensions, newExtensionBudget()) };
};

const decodeAuthorityReference = (input: unknown): AuthorityDecisionReference => {
  const value = record(input);
  exact(value, ["decisionId", "policyVersion", "freshnessDeadline", "bindingDigest", "authority"]);
  if (value.authority !== "reference-only") fail();
  return { decisionId: text(value.decisionId), policyVersion: text(value.policyVersion), freshnessDeadline: isoTime(value.freshnessDeadline), bindingDigest: text(value.bindingDigest), authority: "reference-only" };
};

export const decodeRetrievalPlan = (input: unknown): RetrievalPlan => {
  const value = record(input);
  exact(value, ["schemaVersion", "contract", "planId", "requestId", "authorityDecisionRef", "legs", "budget", "reasonCodes"]);
  if (value.schemaVersion !== 1 || value.contract !== "curiosity.retrieval/plan/v1") fail("RETRIEVAL_CONTRACT_UNSUPPORTED_VERSION");
  if (!Array.isArray(value.legs) || value.legs.length < 1 || value.legs.length > 16) fail();
  const legInputs = value.legs as unknown[];
  const legs = legInputs.map((input) => { const leg = record(input); exact(leg, ["legId", "surfaceId", "mode", "maxResults"]); return { legId: text(leg.legId), surfaceId: text(leg.surfaceId), mode: oneOf<RetrievalMode>(leg.mode, ["INDEXED", "LIVE", "HYBRID"]), maxResults: positiveInteger(leg.maxResults, RETRIEVAL_LIMITS.candidates) }; });
  const budget = record(value.budget); exact(budget, ["maxLegs", "maxResults", "deadlineUnixMs"]);
  const decodedBudget = { maxLegs: positiveInteger(budget.maxLegs, 16), maxResults: positiveInteger(budget.maxResults, 160), deadlineUnixMs: positiveInteger(budget.deadlineUnixMs, Number.MAX_SAFE_INTEGER) };
  if (legs.length > decodedBudget.maxLegs || legs.reduce((total, leg) => total + leg.maxResults, 0) > decodedBudget.maxResults) fail();
  return { schemaVersion: 1, contract: "curiosity.retrieval/plan/v1", planId: text(value.planId), requestId: text(value.requestId), authorityDecisionRef: decodeAuthorityReference(value.authorityDecisionRef), legs, budget: decodedBudget, reasonCodes: texts(value.reasonCodes, 16) };
};

export const decodeSourceCapabilityManifest = (input: unknown): SourceCapabilityManifest => {
  const value = record(input);
  const keys = ["schemaVersion", "contract", "manifestId", "connectorRef", "surfaceKinds", "modes", "queryOperators", "filterFields", "ordering", "pagination", "maxResults", "maxBytes", "supportsDeadline", "authorizationClass", "tenancy", "policyDependencies", "fieldSupport", "sourceCursor", "cancellation", "coverageMethod", "freshnessSemantics", "failureCodes", "contentTypes", "extensionNamespaces", "binding", "authority"];
  exact(value, keys);
  if (value.schemaVersion !== 1 || value.contract !== "curiosity.retrieval/source-capability-manifest/v1") fail("RETRIEVAL_CONTRACT_UNSUPPORTED_VERSION");
  const modes = texts(value.modes, 3).map((mode) => oneOf(mode, ["INDEXED", "LIVE", "HYBRID"] as const));
  if (new Set(modes).size !== modes.length || value.authority !== "capability-only" || (modes.includes("HYBRID") && (!modes.includes("INDEXED") || !modes.includes("LIVE")))) fail();
  if (typeof value.supportsDeadline !== "boolean") fail();
  const supportsDeadline = value.supportsDeadline as boolean;
  const binding = record(value.binding); exact(binding, ["kind", "reference"]);
  const fields = record(value.fieldSupport); exact(fields, ["revision", "capture", "validTime", "transactionTime", "deletion", "provenance"]);
  const availability = (input: unknown) => oneOf(input, ["AVAILABLE", "UNAVAILABLE", "UNKNOWN"] as const);
  const sourceCursor = record(value.sourceCursor); exact(sourceCursor, ["kind", "stableWithinSnapshot"]);
  const cursorKind = oneOf(sourceCursor.kind, ["NONE", "OPAQUE"] as const);
  if (typeof sourceCursor.stableWithinSnapshot !== "boolean" || (cursorKind === "NONE" && sourceCursor.stableWithinSnapshot) || (value.pagination === "CURSOR" && cursorKind !== "OPAQUE") || (value.pagination === "NONE" && cursorKind !== "NONE")) fail();
  const cancellation = record(value.cancellation); exact(cancellation, ["supported", "guarantee"]);
  if (typeof cancellation.supported !== "boolean") fail();
  const cancellationGuarantee = oneOf(cancellation.guarantee, ["BEST_EFFORT", "ACKNOWLEDGED", "UNSUPPORTED"] as const);
  if (cancellation.supported === (cancellationGuarantee === "UNSUPPORTED")) fail();
  const extensionNamespaces = optionalTexts(value.extensionNamespaces, RETRIEVAL_LIMITS.extensions);
  if (extensionNamespaces.some((namespace) => !allowedExtensionNamespace(namespace))) fail();
  return {
    schemaVersion: 1, contract: "curiosity.retrieval/source-capability-manifest/v1",
    manifestId: text(value.manifestId), connectorRef: text(value.connectorRef), surfaceKinds: texts(value.surfaceKinds, 16), modes,
    queryOperators: texts(value.queryOperators, 16), filterFields: optionalTexts(value.filterFields, 32),
    ordering: oneOf(value.ordering, ["SOURCE_NATIVE", "STABLE", "UNSPECIFIED"] as const), pagination: oneOf(value.pagination, ["NONE", "CURSOR", "PAGE"] as const),
    maxResults: positiveInteger(value.maxResults, 100), maxBytes: positiveInteger(value.maxBytes, 10_000_000), supportsDeadline,
    authorizationClass: text(value.authorizationClass), tenancy: oneOf(value.tenancy, ["SINGLE_TENANT", "TENANT_SCOPED"] as const), policyDependencies: texts(value.policyDependencies, 16),
    fieldSupport: { revision: availability(fields.revision), capture: availability(fields.capture), validTime: availability(fields.validTime), transactionTime: availability(fields.transactionTime), deletion: availability(fields.deletion), provenance: availability(fields.provenance) },
    sourceCursor: { kind: cursorKind, stableWithinSnapshot: sourceCursor.stableWithinSnapshot as boolean }, cancellation: { supported: cancellation.supported as boolean, guarantee: cancellationGuarantee },
    coverageMethod: text(value.coverageMethod), freshnessSemantics: text(value.freshnessSemantics),
    failureCodes: texts(value.failureCodes, 32), contentTypes: texts(value.contentTypes, 32), extensionNamespaces,
    binding: { kind: oneOf(binding.kind, ["CONFIGURATION", "SIGNATURE"] as const), reference: text(binding.reference) }, authority: "capability-only",
  };
};

const decodeFreshness = (input: unknown) => {
  const value = record(input);
  exact(value, ["state", "observedAt", "watermark"], ["state"]);
  const state = oneOf(value.state, ["CURRENT", "STALE", "UNKNOWN"] as const);
  if (state === "CURRENT" && !("observedAt" in value)) fail();
  return { state, ...(value.observedAt === undefined ? {} : { observedAt: isoTime(value.observedAt) }), ...(value.watermark === undefined ? {} : { watermark: text(value.watermark) }) };
};

export const decodeRetrievalFrame = (input: unknown): RetrievalFrame => {
  const value = record(input);
  exact(value, ["schemaVersion", "contract", "requestId", "planRef", "candidates", "attempts", "coverage", "failures", "partial", "asOf"]);
  if (value.schemaVersion !== 1 || value.contract !== "curiosity.retrieval/frame/v1") fail("RETRIEVAL_CONTRACT_UNSUPPORTED_VERSION");
  if (!Array.isArray(value.candidates) || value.candidates.length > RETRIEVAL_LIMITS.candidates) fail();
  if (!Array.isArray(value.attempts) || value.attempts.length > RETRIEVAL_LIMITS.attempts) fail();
  if (!Array.isArray(value.failures) || value.failures.length > RETRIEVAL_LIMITS.failures || typeof value.partial !== "boolean") fail();
  const candidateInputs = value.candidates as unknown[];
  const attemptInputs = value.attempts as unknown[];
  const failureInputs = value.failures as unknown[];
  const partial = value.partial as boolean;
  const asOf = isoTime(value.asOf);
  const attempts = attemptInputs.map((input) => {
    const attempt = record(input); exact(attempt, ["surfaceId", "mode", "outcome", "freshness", "observedItems"]);
    return { surfaceId: text(attempt.surfaceId), mode: oneOf<RetrievalMode>(attempt.mode, ["INDEXED", "LIVE", "HYBRID"]), outcome: oneOf(attempt.outcome, ["NOT_ATTEMPTED", "SUCCEEDED", "FAILED", "UNSUPPORTED"] as const), freshness: decodeFreshness(attempt.freshness), observedItems: integer(attempt.observedItems) };
  });
  const coverageValue = record(value.coverage); exact(coverageValue, ["measurement", "completeness", "requestedScope", "attemptedScope", "eligibleScope", "observedItems"]);
  const coverage = { measurement: oneOf(coverageValue.measurement, ["MEASURED", "ESTIMATED", "UNKNOWN"] as const), completeness: oneOf(coverageValue.completeness, ["COMPLETE", "PARTIAL", "UNKNOWN"] as const), requestedScope: nullableInteger(coverageValue.requestedScope), attemptedScope: nullableInteger(coverageValue.attemptedScope), eligibleScope: nullableInteger(coverageValue.eligibleScope), observedItems: integer(coverageValue.observedItems) };
  const failures = failureInputs.map((input) => { const item = record(input); exact(item, ["surfaceId", "code", "detail"]); return { surfaceId: text(item.surfaceId), code: text(item.code), detail: text(item.detail, RETRIEVAL_LIMITS.reason) }; });
  const extensionBudget = newExtensionBudget();
  const candidates = candidateInputs.map((candidate) => decodeCandidate(candidate, extensionBudget));
  if (candidates.some((candidate) => Date.parse(candidate.observedAt) > Date.parse(asOf))) fail();
  const observedByAttempts = attempts.reduce((total, attempt) => total + attempt.observedItems, 0);
  const attemptSurfaces = new Set(attempts.map((attempt) => attempt.surfaceId));
  if (new Set(candidates.map((candidate) => candidate.candidateId)).size !== candidates.length || candidates.some((candidate) => !attemptSurfaces.has(candidate.surfaceId))) fail();
  if ((coverage.completeness !== "COMPLETE") !== partial || coverage.observedItems !== candidates.length || observedByAttempts < candidates.length) fail();
  if (coverage.completeness === "COMPLETE") {
    const { requestedScope, attemptedScope, eligibleScope } = coverage;
    const scopesConsistent = requestedScope !== null && attemptedScope !== null && eligibleScope !== null && requestedScope === attemptedScope && eligibleScope <= attemptedScope && coverage.observedItems <= eligibleScope;
    const attemptsComplete = attempts.length > 0 && attempts.every((attempt) => attempt.outcome === "SUCCEEDED" && attempt.freshness.state === "CURRENT" && attempt.freshness.observedAt !== undefined && Date.parse(attempt.freshness.observedAt) <= Date.parse(asOf));
    if (coverage.measurement !== "MEASURED" || !scopesConsistent || !attemptsComplete || failures.length > 0 || observedByAttempts !== coverage.observedItems) fail();
  }
  return { schemaVersion: 1, contract: "curiosity.retrieval/frame/v1", requestId: text(value.requestId), planRef: text(value.planRef), candidates, attempts, coverage, failures, partial, asOf };
};
