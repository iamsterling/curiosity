export const RETRIEVAL_V3_LIMITS = {
  legs: 3,
  results: 10,
  requestBytes: 32_768,
  requestNodes: 512,
  reportBytes: 128_000,
  reportNodes: 2_048,
  text: 2_000,
  id: 128,
  deadlineHorizonMs: 60_000,
  failures: 16,
} as const;

export const RETRIEVAL_V3_SURFACES = {
  "surface:owned-web:v1": {
    surfaceRef: "surface:owned-web:v1",
    mode: "INDEXED",
    capability: "capture-anchored-owned-snapshot",
  },
  "surface:curiosity-memory:v1": {
    surfaceRef: "surface:curiosity-memory:v1",
    mode: "INDEXED",
    capability: "lifecycle-checked-memory",
  },
  "surface:authorized-mcp:v1": {
    surfaceRef: "surface:authorized-mcp:v1",
    mode: "LIVE",
    capability: "host-receipt-only",
  },
} as const;
export type SurfaceRef = keyof typeof RETRIEVAL_V3_SURFACES;
export type RetrievalV3Profile =
  "OWNED_WEB" | "OWNED_WEB_MEMORY" | "OWNED_WEB_MEMORY_MCP";
interface RetrievalV3LegBase {
  readonly legId: string;
  readonly surfaceRef: SurfaceRef;
  readonly mode: "INDEXED" | "LIVE";
  readonly obligation: "REQUIRED" | "OPTIONAL";
  readonly maxResults: number;
}
export type RetrievalV3Leg =
  | (RetrievalV3LegBase & {
      readonly surfaceRef: "surface:owned-web:v1";
      readonly mode: "INDEXED";
    })
  | (RetrievalV3LegBase & {
      readonly surfaceRef: "surface:curiosity-memory:v1";
      readonly mode: "INDEXED";
    })
  | (RetrievalV3LegBase & {
      readonly surfaceRef: "surface:authorized-mcp:v1";
      readonly mode: "LIVE";
      readonly intentRef: string;
      readonly requestId: string;
      readonly authenticatedContextRef: string;
      readonly sessionRef: string;
      readonly agentRef: string;
      readonly messageRef: string;
      readonly parentCallRef: string;
      readonly canonicalInputDigest: string;
    });
export interface RetrieveInformationV3Request {
  readonly schemaVersion: 3;
  readonly contract: "curiosity.retrieval/retrieve-information-request/v3";
  readonly requestId: string;
  readonly authenticatedContextRef: string;
  readonly purpose: string;
  readonly objective: { readonly question: string };
  readonly validAsOf: string | null;
  readonly knownAsOf: string;
  readonly profile: RetrievalV3Profile;
  readonly legs: readonly RetrievalV3Leg[];
  readonly budget: {
    readonly maxLegs: number;
    readonly maxResults: number;
    readonly maxUtf8Bytes: number;
    readonly maxNodes: number;
    readonly deadlineUnixMs: number;
  };
}
export interface ResultLifecycleV3 {
  readonly custody: "DURABLE";
  readonly assertion: "ACTIVE" | "NOT_APPLICABLE";
  readonly queryEligibility: "ELIGIBLE";
  readonly authorizationFreshness: "CURRENT";
  readonly validation: "CURRENT";
  readonly deletion: "LIVE";
}
export interface SourceProvenanceV3 {
  readonly surfaceRef: SurfaceRef;
  readonly sourceObjectRef: string;
  readonly captureRef: string | null;
  readonly receiptRef: string;
  readonly projectionSnapshotRef: string | null;
}
export interface CustodiedEvidenceV3 {
  readonly recordKind: "custodied-evidence";
  readonly evidenceId: string;
  readonly title: string;
  readonly excerpt: string;
  readonly sourceLocator: string;
  readonly observedAt: string;
  readonly committedCaptureRef: string;
  readonly representationRef: string;
  readonly spanRef: string;
  readonly receiptRef: string;
  readonly provenance: SourceProvenanceV3;
  readonly lifecycle: ResultLifecycleV3;
}
export interface ActiveAssertionV3 extends Omit<
  CustodiedEvidenceV3,
  "recordKind"
> {
  readonly recordKind: "active-assertion";
  readonly assertionId: string;
  readonly beliefRevisionRef: string;
  readonly evidenceSetRef: string;
  readonly validationPolicyRef: string;
  readonly validationDecisionRef: string;
}
export interface McpSourceObservationV3 {
  readonly recordKind: "source-observation";
  readonly observationId: string;
  readonly title: string;
  readonly excerpt: string;
  readonly sourceLocator: string;
  readonly observedAt: string;
  readonly trust: "untrusted-source-observation";
  readonly provenance: SourceProvenanceV3 & {
    readonly hostReceipt: {
      readonly receiptRef: string;
      readonly compatibilityMode: "MODEL_MEDIATED";
      readonly sessionRef: string;
      readonly agentRef: string;
      readonly messageRef: string;
      readonly parentCallRef: string;
      readonly canonicalInputDigest: string;
      readonly capturedAt: string;
    };
  };
}
export type RetrievalV3Result =
  CustodiedEvidenceV3 | ActiveAssertionV3 | McpSourceObservationV3;
export interface RetrievalV3LegReport {
  readonly legId: string;
  readonly surfaceRef: SurfaceRef;
  readonly mode: "INDEXED" | "LIVE";
  readonly obligation: "REQUIRED" | "OPTIONAL";
  readonly coverage: {
    readonly measurement: "MEASURED" | "UNKNOWN";
    readonly completeness: "COMPLETE" | "PARTIAL" | "UNKNOWN";
    readonly observedItems: number;
    readonly declaredItems?: number;
    readonly corpusCellRef?: string;
  };
  readonly freshness: {
    readonly state: "CURRENT" | "UNKNOWN";
    readonly observedAt?: string;
  };
  readonly failures: readonly { readonly code: string }[];
  readonly deliveredItems: number;
  readonly projectionSnapshotRef?: string;
}
export interface RetrieveInformationV3Report {
  readonly schemaVersion: 3;
  readonly contract: "curiosity.retrieval/retrieve-information-report/v3";
  readonly status: "OK" | "DENIED";
  readonly requestId: string;
  readonly authorityRef: string;
  readonly asOf: string;
  readonly strata: readonly {
    readonly stratumId: string;
    readonly legId: string;
    readonly epistemicKind: RetrievalV3Result["recordKind"];
    readonly items: readonly RetrievalV3Result[];
  }[];
  readonly legs: readonly RetrievalV3LegReport[];
  readonly partial: boolean;
  readonly residualUncertainty: readonly string[];
  readonly stoppingReason:
    | "DECLARED_LEGS_COMPLETED"
    | "INITIAL_AUTHORITY_DENIED"
    | "DELIVERY_AUTHORITY_DENIED"
    | "DEADLINE_EXHAUSTED"
    | "REQUIRED_LEG_UNAVAILABLE"
    | "OUTPUT_BUDGET_EXHAUSTED";
  readonly diagnostic?: {
    readonly code:
      | "RETRIEVE_INFORMATION_V3_DENIED"
      | "RETRIEVE_INFORMATION_V3_DELIVERY_DENIED";
  };
}
