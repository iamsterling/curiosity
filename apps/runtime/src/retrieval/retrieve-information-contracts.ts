export const RETRIEVE_INFORMATION_LIMITS = {
  legs: 2,
  results: 10,
  requestBytes: 32_768,
  requestNodes: 256,
  reportBytes: 128_000,
  reportNodes: 1_024,
  text: 2_000,
  id: 128,
} as const;

export type EpistemicKind =
  | "source-observation"
  | "custodied-evidence"
  | "remembered-belief"
  | "active-assertion";

export interface RetrieveInformationRequest {
  readonly schemaVersion: 2;
  readonly contract: "curiosity.retrieval/retrieve-information-request/v2";
  readonly requestId: string;
  /** Reference minted and owned by authenticated host context; never credentials. */
  readonly authenticatedContextRef: string;
  readonly purpose: string;
  readonly objective: { readonly question: string };
  readonly validAsOf: string | null;
  readonly knownAsOf: string;
  readonly legs: readonly RetrievalLeg[];
  readonly budget: {
    readonly maxLegs: 2;
    readonly maxResults: number;
    readonly maxUtf8Bytes: number;
    readonly maxNodes: number;
    readonly deadlineUnixMs: number;
  };
}

export type RetrievalLeg =
  | {
      readonly legId: string;
      readonly surfaceSelector: "public-web/searxng-gateway";
      readonly mode: "LIVE";
      readonly obligation: "REQUIRED" | "OPTIONAL";
      readonly maxResults: number;
    }
  | {
      readonly legId: string;
      readonly surfaceSelector: "development-memory/evidence";
      readonly mode: "INDEXED";
      readonly obligation: "REQUIRED" | "OPTIONAL";
      readonly maxResults: number;
    };

export interface ResultLifecycle {
  readonly custody: "DURABLE";
  readonly assertion: "ACTIVE" | "NOT_APPLICABLE";
  readonly queryEligibility: "ELIGIBLE";
  readonly authorizationFreshness: "CURRENT";
  readonly validation: "CURRENT";
  readonly deletion: "LIVE";
}

export interface SourceObservation {
  readonly recordKind: "source-observation";
  readonly observationId: string;
  readonly title: string;
  readonly excerpt: string;
  readonly sourceLocator: string;
  readonly observedAt: string;
  readonly nativeRank: {
    readonly namespace: "org.searxng.providers/v1";
    readonly labels: readonly string[];
  };
  readonly trust: "untrusted-source-observation";
}

export interface CustodiedEvidence {
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
  readonly lifecycle: ResultLifecycle;
}

export interface RememberedBelief extends Omit<
  CustodiedEvidence,
  "recordKind"
> {
  readonly recordKind: "remembered-belief";
  readonly beliefRevisionRef: string;
  readonly evidenceSetRef: string;
  readonly validationPolicyRef: string;
  readonly validationDecisionRef: string;
}

export interface ActiveAssertion extends Omit<RememberedBelief, "recordKind"> {
  readonly recordKind: "active-assertion";
  readonly assertionId: string;
}

export type RetrievalResult =
  SourceObservation | CustodiedEvidence | RememberedBelief | ActiveAssertion;
export interface LegReport {
  readonly legId: string;
  readonly surfaceSelector: RetrievalLeg["surfaceSelector"];
  readonly mode: RetrievalLeg["mode"];
  readonly obligation: RetrievalLeg["obligation"];
  readonly coverage: {
    readonly measurement: "MEASURED" | "UNKNOWN";
    readonly completeness: "COMPLETE" | "PARTIAL" | "UNKNOWN";
    readonly observedItems: number;
  };
  readonly freshness: {
    readonly state: "CURRENT" | "UNKNOWN";
    readonly observedAt?: string;
  };
  readonly failures: readonly { readonly code: string }[];
  /** Items surviving delivery authorization, lifecycle recheck, and output budgets. */
  readonly deliveredItems: number;
}

export interface RetrieveInformationReport {
  readonly schemaVersion: 2;
  readonly contract: "curiosity.retrieval/retrieve-information-report/v2";
  readonly status: "OK" | "DENIED";
  readonly requestId: string;
  readonly authorityRef: string;
  readonly asOf: string;
  readonly strata: readonly {
    readonly stratumId: string;
    readonly legId: string;
    readonly epistemicKind: EpistemicKind;
    readonly items: readonly RetrievalResult[];
  }[];
  readonly legs: readonly LegReport[];
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
      "RETRIEVE_INFORMATION_DENIED" | "RETRIEVE_INFORMATION_DELIVERY_DENIED";
  };
}
