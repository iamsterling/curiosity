import { fail } from "./diagnostics.js";

export const ASSERTION_STATES = ["PENDING", "ACTIVE", "DISPUTED", "QUARANTINED", "REJECTED"] as const;
export const RELATIONSHIP_TYPES = [
  "supports",
  "contradicts",
  "supersedes",
  "derived_from",
  "duplicate_of",
  "same_entity_as",
  "precedes",
  "decision_based_on",
  "invalidated_by",
] as const;
export type AssertionState = (typeof ASSERTION_STATES)[number];
export type RelationshipType = (typeof RELATIONSHIP_TYPES)[number];

export interface Lifecycle {
  readonly schemaVersion: 1;
  readonly custody: "PROVISIONAL" | "DURABLE" | "RESTRICTED" | "RELEASED";
  readonly derivation: "RAW" | "DERIVED" | "STALE" | "FAILED";
  readonly assertion: AssertionState;
  readonly queryEligibility: "ELIGIBLE" | "SUPPRESSED" | "NOT_PROJECTED";
  readonly authorizationFreshness: "CURRENT" | "STALE" | "UNKNOWN" | "REVOKED";
  readonly deletion:
    | "LIVE"
    | "TOMBSTONED"
    | "ERASURE_PENDING"
    | "PRIMARY_ERASED"
    | "RETAINED_EXPIRY_PENDING"
    | "VERIFIED";
}

export interface Relationship {
  readonly schemaVersion: 1;
  readonly id: string;
  readonly revision: number;
  readonly type: RelationshipType;
  readonly subject: { readonly kind: string; readonly id: string };
  readonly object: { readonly kind: string; readonly id: string };
  readonly direction: "SUBJECT_TO_OBJECT";
  readonly evidenceSpanIds: readonly string[];
  readonly producer: string;
  readonly producerVersion: string;
  readonly assertedAt: string;
  readonly observedAt: string;
  readonly validTime?: { readonly start?: string; readonly end?: string };
  readonly validatorRef?: string;
  readonly policyRef?: string;
  readonly assertionState: AssertionState;
}

export interface LayeredIdentities {
  readonly schemaVersion: 1;
  readonly sourceObjectId: string;
  readonly revisionId: string | null;
  readonly contentId: string;
  readonly occurrenceId: string;
  readonly captureId: string;
  readonly representationId: string;
  readonly spanId: string;
}

const object = (value: unknown): Record<string, unknown> => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return fail("EVIDENCE_CODEC_INVALID_OBJECT");
  return value as Record<string, unknown>;
};

const exactKeys = (value: Record<string, unknown>, allowed: readonly string[], required: readonly string[]): void => {
  if (Object.keys(value).some((key) => !allowed.includes(key))) fail("EVIDENCE_CODEC_UNKNOWN_FIELD");
  if (required.some((key) => !(key in value))) fail("EVIDENCE_CODEC_MISSING_FIELD");
};

const oneOf = <T extends string>(value: unknown, values: readonly T[]): T => {
  if (typeof value !== "string" || !values.includes(value as T)) return fail("EVIDENCE_CODEC_INVALID_ENUM");
  return value as T;
};

export const decodeLifecycle = (input: unknown): Lifecycle => {
  const value = object(input);
  const keys = [
    "schemaVersion",
    "custody",
    "derivation",
    "assertion",
    "queryEligibility",
    "authorizationFreshness",
    "deletion",
  ];
  exactKeys(value, keys, keys);
  if (value.schemaVersion !== 1) fail("EVIDENCE_CODEC_UNSUPPORTED_VERSION");
  return {
    schemaVersion: 1,
    custody: oneOf(value.custody, ["PROVISIONAL", "DURABLE", "RESTRICTED", "RELEASED"]),
    derivation: oneOf(value.derivation, ["RAW", "DERIVED", "STALE", "FAILED"]),
    assertion: oneOf(value.assertion, ASSERTION_STATES),
    queryEligibility: oneOf(value.queryEligibility, ["ELIGIBLE", "SUPPRESSED", "NOT_PROJECTED"]),
    authorizationFreshness: oneOf(value.authorizationFreshness, ["CURRENT", "STALE", "UNKNOWN", "REVOKED"]),
    deletion: oneOf(value.deletion, [
      "LIVE",
      "TOMBSTONED",
      "ERASURE_PENDING",
      "PRIMARY_ERASED",
      "RETAINED_EXPIRY_PENDING",
      "VERIFIED",
    ]),
  };
};

export const decodeLayeredIdentities = (input: unknown): LayeredIdentities => {
  const value = object(input);
  const keys = [
    "schemaVersion",
    "sourceObjectId",
    "revisionId",
    "contentId",
    "occurrenceId",
    "captureId",
    "representationId",
    "spanId",
  ];
  exactKeys(value, keys, keys);
  if (value.schemaVersion !== 1) return fail("EVIDENCE_CODEC_UNSUPPORTED_VERSION");
  for (const key of keys.slice(1)) {
    if (key === "revisionId" && value[key] === null) continue;
    if (typeof value[key] !== "string" || value[key] === "") return fail("EVIDENCE_CODEC_INVALID_IDENTITY");
  }
  return value as unknown as LayeredIdentities;
};

const decodeRef = (input: unknown): { kind: string; id: string } => {
  const value = object(input);
  exactKeys(value, ["kind", "id"], ["kind", "id"]);
  if (typeof value.kind !== "string" || typeof value.id !== "string") return fail("EVIDENCE_CODEC_INVALID_REFERENCE");
  return { kind: value.kind, id: value.id };
};

const decodeValidTime = (input: unknown): { start?: string; end?: string } => {
  if (!input || typeof input !== "object" || Array.isArray(input)) return fail("EVIDENCE_CODEC_INVALID_RELATIONSHIP");
  const value = object(input);
  exactKeys(value, ["start", "end"], []);
  for (const key of ["start", "end"] as const) {
    if (key in value && (typeof value[key] !== "string" || value[key] === ""))
      return fail("EVIDENCE_CODEC_INVALID_RELATIONSHIP");
  }
  return {
    ...(typeof value.start === "string" ? { start: value.start } : {}),
    ...(typeof value.end === "string" ? { end: value.end } : {}),
  };
};

export const decodeRelationship = (input: unknown): Relationship => {
  const value = object(input);
  const required = [
    "schemaVersion",
    "id",
    "revision",
    "type",
    "subject",
    "object",
    "direction",
    "evidenceSpanIds",
    "producer",
    "producerVersion",
    "assertedAt",
    "observedAt",
    "assertionState",
  ];
  const optional = ["validTime", "validatorRef", "policyRef"];
  exactKeys(value, [...required, ...optional], required);
  if (value.schemaVersion !== 1) fail("EVIDENCE_CODEC_UNSUPPORTED_VERSION");
  if (
    typeof value.id !== "string" ||
    typeof value.revision !== "number" ||
    !Number.isSafeInteger(value.revision) ||
    value.revision < 1
  )
    fail("EVIDENCE_CODEC_INVALID_RELATIONSHIP");
  if (
    ![value.producer, value.producerVersion, value.assertedAt, value.observedAt].every(
      (item) => typeof item === "string",
    )
  )
    fail("EVIDENCE_CODEC_INVALID_RELATIONSHIP");
  if (
    !Array.isArray(value.evidenceSpanIds) ||
    value.evidenceSpanIds.length === 0 ||
    value.evidenceSpanIds.some((item) => typeof item !== "string")
  )
    fail("EVIDENCE_CODEC_INVALID_SPANS");
  if (value.direction !== "SUBJECT_TO_OBJECT") fail("EVIDENCE_CODEC_INVALID_DIRECTION");
  for (const key of ["validatorRef", "policyRef"] as const) {
    if (key in value && (typeof value[key] !== "string" || value[key] === ""))
      fail("EVIDENCE_CODEC_INVALID_RELATIONSHIP");
  }
  const validTime = "validTime" in value ? decodeValidTime(value.validTime) : undefined;
  const id = value.id as string;
  const revision = value.revision as number;
  return {
    schemaVersion: 1,
    id,
    revision,
    type: oneOf(value.type, RELATIONSHIP_TYPES),
    subject: decodeRef(value.subject),
    object: decodeRef(value.object),
    direction: "SUBJECT_TO_OBJECT",
    evidenceSpanIds: value.evidenceSpanIds as string[],
    producer: value.producer as string,
    producerVersion: value.producerVersion as string,
    assertedAt: value.assertedAt as string,
    observedAt: value.observedAt as string,
    assertionState: oneOf(value.assertionState, ASSERTION_STATES),
    ...(validTime ? { validTime } : {}),
    ...(typeof value.validatorRef === "string" ? { validatorRef: value.validatorRef } : {}),
    ...(typeof value.policyRef === "string" ? { policyRef: value.policyRef } : {}),
  };
};

const TRANSITIONS: Readonly<Record<AssertionState, readonly AssertionState[]>> = {
  PENDING: ["ACTIVE", "QUARANTINED", "REJECTED"],
  ACTIVE: ["DISPUTED", "QUARANTINED", "REJECTED"],
  DISPUTED: ["ACTIVE", "QUARANTINED", "REJECTED"],
  QUARANTINED: ["REJECTED"],
  REJECTED: [],
};

export const assertionTransition = (
  from: AssertionState,
  to: AssertionState,
  proof: { localCommitted: boolean; exactSpans: boolean; validatorAuthorized: boolean; policyCurrent: boolean },
): AssertionState => {
  if (!TRANSITIONS[from].includes(to)) return fail("EVIDENCE_ASSERTION_TRANSITION_INVALID");
  if (to === "ACTIVE" && !Object.values(proof).every(Boolean)) return fail("EVIDENCE_ASSERTION_ACTIVATION_BLOCKED");
  return to;
};
