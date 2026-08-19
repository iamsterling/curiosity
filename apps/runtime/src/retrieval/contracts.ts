export const RETRIEVAL_LIMITS = {
  candidates: 10,
  attempts: 16,
  failures: 16,
  labels: 8,
  extensions: 16,
  extensionBytes: 2_048,
  extensionNodes: 64,
  id: 128,
  namespace: 128,
  title: 300,
  snippet: 2_000,
  locator: 2_048,
  reason: 160,
} as const;

export type RetrievalMode = "INDEXED" | "LIVE" | "HYBRID";
export type ExtensionValue = null | boolean | number | string | readonly ExtensionValue[] | { readonly [key: string]: ExtensionValue };
export type NamespacedExtensions = Readonly<{
  "org.curiosity.legacy.m2/v1"?: { readonly documentId: string; readonly version: string; readonly sourceUrl: string; readonly snapshotId?: string; readonly analyzerVersion?: string; readonly score?: number };
  "org.curiosity.legacy.m6/v1"?: { readonly documentId: string; readonly snapshotId: string; readonly captureId: string; readonly citation: { readonly captureId: string; readonly url: string; readonly sha256: string }; readonly score?: number };
  "org.curiosity.legacy.event_capture/v1"?: { readonly eventId: string; readonly payloadDigest: string; readonly watermark?: number; readonly taint?: string };
  "org.curiosity.legacy.ledger_v1/v1"?: { readonly entityType: string; readonly id: string; readonly outputDigest: string };
  "org.curiosity.legacy.development_evidence/v1"?: { readonly captureId: string; readonly representationId: string; readonly spanId: string };
}>;

export interface SourceSurface {
  readonly schemaVersion: 1;
  readonly contract: "curiosity.retrieval/source-surface/v1";
  readonly surfaceId: string;
  readonly sourceKind: string;
  readonly ownerNamespace: string;
  readonly collectionId: string;
  readonly tenantBoundary: string;
  readonly identityPolicyVersion: string;
  readonly extensions: NamespacedExtensions;
}

export interface SourceCapabilityManifest {
  readonly schemaVersion: 1;
  readonly contract: "curiosity.retrieval/source-capability-manifest/v1";
  readonly manifestId: string;
  readonly connectorRef: string;
  readonly surfaceKinds: readonly string[];
  readonly modes: readonly RetrievalMode[];
  readonly queryOperators: readonly string[];
  readonly filterFields: readonly string[];
  readonly ordering: "SOURCE_NATIVE" | "STABLE" | "UNSPECIFIED";
  readonly pagination: "NONE" | "CURSOR" | "PAGE";
  readonly maxResults: number;
  readonly maxBytes: number;
  readonly supportsDeadline: boolean;
  readonly authorizationClass: string;
  readonly tenancy: "SINGLE_TENANT" | "TENANT_SCOPED";
  readonly policyDependencies: readonly string[];
  readonly fieldSupport: {
    readonly revision: "AVAILABLE" | "UNAVAILABLE" | "UNKNOWN";
    readonly capture: "AVAILABLE" | "UNAVAILABLE" | "UNKNOWN";
    readonly validTime: "AVAILABLE" | "UNAVAILABLE" | "UNKNOWN";
    readonly transactionTime: "AVAILABLE" | "UNAVAILABLE" | "UNKNOWN";
    readonly deletion: "AVAILABLE" | "UNAVAILABLE" | "UNKNOWN";
    readonly provenance: "AVAILABLE" | "UNAVAILABLE" | "UNKNOWN";
  };
  readonly sourceCursor: { readonly kind: "NONE" | "OPAQUE"; readonly stableWithinSnapshot: boolean };
  readonly cancellation: { readonly supported: boolean; readonly guarantee: "BEST_EFFORT" | "ACKNOWLEDGED" | "UNSUPPORTED" };
  readonly coverageMethod: string;
  readonly freshnessSemantics: string;
  readonly failureCodes: readonly string[];
  readonly contentTypes: readonly string[];
  readonly extensionNamespaces: readonly string[];
  readonly binding: { readonly kind: "CONFIGURATION" | "SIGNATURE"; readonly reference: string };
  /** Descriptive metadata only; never an authorization grant. */
  readonly authority: "capability-only";
}

export interface DiscoveryCandidate {
  readonly schemaVersion: 1;
  readonly contract: "curiosity.retrieval/discovery-candidate/v1";
  readonly recordKind: "discovery-candidate";
  readonly candidateId: string;
  readonly surfaceId: string;
  readonly sourceLocator: string;
  readonly title: string;
  readonly snippet: string;
  readonly observedAt: string;
  readonly nativeRanking: { readonly namespace: string; readonly labels: readonly string[] };
  readonly extensions: NamespacedExtensions;
  readonly trust: "untrusted-candidate";
  readonly authority: "none";
}

export interface Coverage {
  readonly measurement: "MEASURED" | "ESTIMATED" | "UNKNOWN";
  readonly completeness: "COMPLETE" | "PARTIAL" | "UNKNOWN";
  readonly requestedScope: number | null;
  readonly attemptedScope: number | null;
  readonly eligibleScope: number | null;
  readonly observedItems: number;
}

export interface AuthorityDecisionReference {
  readonly decisionId: string;
  readonly policyVersion: string;
  readonly freshnessDeadline: string;
  readonly bindingDigest: string;
  readonly authority: "reference-only";
}

export interface AuthorityDecisionSnapshot extends AuthorityDecisionReference {
  readonly observedAt: string;
  readonly freshness: "CURRENT" | "STALE" | "UNKNOWN" | "REVOKED";
  readonly decision: "ALLOW" | "DENY";
}

export interface EvidenceEnvelope {
  readonly schemaVersion: 1;
  readonly contract: "curiosity.retrieval/evidence-envelope/v1";
  readonly recordKind: "evidence-envelope";
  readonly evidenceId: string;
  readonly committedCaptureRef: string;
  readonly representationRef: string;
  readonly spanRef: string;
  readonly receiptRef: string;
  readonly authorityDecisionRef: AuthorityDecisionReference;
  readonly immutable: true;
}

export interface RetrievalPlan {
  readonly schemaVersion: 1;
  readonly contract: "curiosity.retrieval/plan/v1";
  readonly planId: string;
  readonly requestId: string;
  readonly authorityDecisionRef: AuthorityDecisionReference;
  readonly legs: readonly { readonly legId: string; readonly surfaceId: string; readonly mode: RetrievalMode; readonly maxResults: number }[];
  readonly budget: { readonly maxLegs: number; readonly maxResults: number; readonly deadlineUnixMs: number };
  readonly reasonCodes: readonly string[];
}

export interface SourceAttempt {
  readonly surfaceId: string;
  readonly mode: RetrievalMode;
  readonly outcome: "NOT_ATTEMPTED" | "SUCCEEDED" | "FAILED" | "UNSUPPORTED";
  readonly freshness: { readonly state: "CURRENT" | "STALE" | "UNKNOWN"; readonly observedAt?: string; readonly watermark?: string };
  readonly observedItems: number;
}

export interface RetrievalFrame {
  readonly schemaVersion: 1;
  readonly contract: "curiosity.retrieval/frame/v1";
  readonly requestId: string;
  readonly planRef: string;
  readonly candidates: readonly DiscoveryCandidate[];
  readonly attempts: readonly SourceAttempt[];
  readonly coverage: Coverage;
  readonly failures: readonly { readonly surfaceId: string; readonly code: string; readonly detail: string }[];
  readonly partial: boolean;
  readonly asOf: string;
}

export interface LegacyCharacterization {
  readonly schemaVersion: 1;
  readonly contract: "curiosity.retrieval/legacy-characterization/v1";
  readonly sourceKind: "M2" | "M6" | "EVENT_CAPTURE" | "LEDGER_V1" | "DEVELOPMENT_EVIDENCE";
  readonly authority: "none";
  readonly uncertainty: "UNVALIDATED";
  readonly findings: readonly string[];
  readonly extensions: NamespacedExtensions;
}
