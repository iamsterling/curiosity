import { DiagnosticError } from "../../core/diagnostics/diagnostic.js";

export const engineeringKinds = ["bug", "feature", "secure"] as const;
export type EngineeringKind = (typeof engineeringKinds)[number];
export const effectClasses = [
  "reasoning",
  "repository-read",
  "research",
  "local-check",
  "workspace-edit",
  "active-security-test",
  "destructive-security-test",
  "git-commit",
  "git-push",
  "github-read",
  "issue-write",
  "pr-write",
  "security-advisory-write",
  "merge",
  "publish",
  "deploy",
  "public-disclosure",
] as const;
export type EffectClass = (typeof effectClasses)[number];
export type EvidenceKind = "source-observation" | "test-red" | "test-green" | "command-result" | "review-observation";

export interface EngineeringIntentProfileV1 {
  readonly schemaVersion: 1;
  readonly policyVersion: "1";
  readonly intentID: string;
  readonly intentRevision: number;
  readonly kind: EngineeringKind;
  readonly objectiveRef: { readonly sessionCorrelationID: string };
  readonly repository: { readonly rootIdentity: string };
  readonly scope: { readonly paths: readonly ["."]; readonly defaulted: true };
  readonly evidencePolicy: {
    readonly requiredKinds: readonly EvidenceKind[];
    readonly freshness: "revision-and-input-bound";
    readonly independentReview: boolean;
  };
  readonly durableRecord: "local-only";
  readonly risk: "normal" | "high";
  readonly privacy: "repository-private" | "restricted-security";
  readonly completionCriteria: readonly {
    readonly id: string;
    readonly revision: 1;
    readonly expectedEvidence: readonly EvidenceKind[];
  }[];
  readonly correlation: { readonly commandInvocationID: string };
  readonly createdAt: string;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value);
const fail = (code = "ENGINEERING_PROFILE_SCHEMA_INVALID"): never => {
  throw new DiagnosticError(code);
};
const exact = (value: unknown, keys: readonly string[]): Record<string, unknown> => {
  if (!isRecord(value)) return fail();
  const actual = Object.keys(value);
  if (actual.length !== keys.length || actual.some((key) => !keys.includes(key))) return fail();
  return value;
};
const nonempty = (value: unknown): value is string =>
  typeof value === "string" && value.length > 0 && value.length <= 256;
const stringArray = <T extends string>(value: unknown, allowed?: readonly T[]): readonly T[] => {
  if (
    !Array.isArray(value) ||
    value.length === 0 ||
    value.some((item) => !nonempty(item) || (allowed && !allowed.includes(item as T)))
  )
    return fail();
  if (new Set(value).size !== value.length) return fail();
  return Object.freeze([...value]) as readonly T[];
};
const freeze = <T>(value: T): T => {
  if (value && typeof value === "object")
    for (const child of Object.values(value as Record<string, unknown>)) freeze(child);
  return Object.freeze(value);
};

export const decodeEngineeringIntentProfile = (value: unknown): EngineeringIntentProfileV1 => {
  const input = exact(value, [
    "schemaVersion",
    "policyVersion",
    "intentID",
    "intentRevision",
    "kind",
    "objectiveRef",
    "repository",
    "scope",
    "evidencePolicy",
    "durableRecord",
    "risk",
    "privacy",
    "completionCriteria",
    "correlation",
    "createdAt",
  ]);
  if (input.schemaVersion !== 1) fail("ENGINEERING_PROFILE_VERSION_UNSUPPORTED");
  if (input.policyVersion !== "1" || !engineeringKinds.includes(input.kind as EngineeringKind))
    fail("ENGINEERING_PROFILE_KIND_INVALID");
  if (
    !nonempty(input.intentID) ||
    !Number.isInteger(input.intentRevision) ||
    Number(input.intentRevision) < 1 ||
    !nonempty(input.createdAt) ||
    !Number.isFinite(Date.parse(input.createdAt))
  )
    fail();
  const objectiveRef = exact(input.objectiveRef, ["sessionCorrelationID"]);
  const repository = exact(input.repository, ["rootIdentity"]);
  const scope = exact(input.scope, ["paths", "defaulted"]);
  const evidencePolicy = exact(input.evidencePolicy, ["requiredKinds", "freshness", "independentReview"]);
  const correlation = exact(input.correlation, ["commandInvocationID"]);
  if (
    !nonempty(objectiveRef.sessionCorrelationID) ||
    !nonempty(repository.rootIdentity) ||
    !nonempty(correlation.commandInvocationID)
  )
    fail();
  if (!Array.isArray(scope.paths) || scope.paths.length !== 1 || scope.paths[0] !== "." || scope.defaulted !== true)
    fail();
  const requiredKinds = stringArray(evidencePolicy.requiredKinds, [
    "source-observation",
    "test-red",
    "test-green",
    "command-result",
    "review-observation",
  ] as const);
  if (evidencePolicy.freshness !== "revision-and-input-bound" || typeof evidencePolicy.independentReview !== "boolean")
    fail();
  if (!Array.isArray(input.completionCriteria) || input.completionCriteria.length === 0) fail();
  const rawCriteria = input.completionCriteria as unknown[];
  const completionCriteria: Array<{ id: string; revision: 1; expectedEvidence: readonly EvidenceKind[] }> =
    rawCriteria.map((raw: unknown) => {
      const criterion = exact(raw, ["id", "revision", "expectedEvidence"]);
      if (!nonempty(criterion.id) || criterion.revision !== 1) return fail();
      return {
        id: criterion.id,
        revision: 1 as const,
        expectedEvidence: stringArray(criterion.expectedEvidence, [
          "source-observation",
          "test-red",
          "test-green",
          "command-result",
          "review-observation",
        ] as const),
      };
    });
  if (new Set(completionCriteria.map((item) => item.id)).size !== completionCriteria.length) fail();
  const decoded = {
    schemaVersion: 1 as const,
    policyVersion: "1" as const,
    intentID: input.intentID,
    intentRevision: Number(input.intentRevision),
    kind: input.kind as EngineeringKind,
    objectiveRef: { sessionCorrelationID: objectiveRef.sessionCorrelationID },
    repository: { rootIdentity: repository.rootIdentity },
    scope: { paths: ["."] as const, defaulted: true as const },
    evidencePolicy: {
      requiredKinds,
      freshness: "revision-and-input-bound" as const,
      independentReview: evidencePolicy.independentReview,
    },
    durableRecord: input.durableRecord,
    risk: input.risk,
    privacy: input.privacy,
    completionCriteria,
    correlation: { commandInvocationID: correlation.commandInvocationID },
    createdAt: input.createdAt,
  };
  const expected = policyShape(decoded.kind);
  if (
    decoded.durableRecord !== "local-only" ||
    decoded.risk !== expected.risk ||
    decoded.privacy !== expected.privacy ||
    decoded.evidencePolicy.independentReview !== expected.independentReview ||
    JSON.stringify(decoded.evidencePolicy.requiredKinds) !== JSON.stringify(expected.requiredKinds) ||
    JSON.stringify(decoded.completionCriteria.map((item) => item.id)) !== JSON.stringify(expected.criteria)
  )
    fail("ENGINEERING_PROFILE_POLICY_MISMATCH");
  return freeze(decoded as EngineeringIntentProfileV1);
};

export const policyShape = (kind: EngineeringKind) =>
  kind === "secure"
    ? {
        risk: "high" as const,
        privacy: "restricted-security" as const,
        independentReview: true,
        requiredKinds: ["source-observation", "review-observation"] as const,
        criteria: [
          "authorized-target-roe",
          "threat-model",
          "attack-surface",
          "risk-adapted-analysis",
          "risk-ranked-findings",
          "secret-safe-oracle",
          "remediation",
          "security-regression",
          "residual-risk",
          "bounded-independent-verification",
        ] as const,
      }
    : kind === "feature"
      ? {
          risk: "normal" as const,
          privacy: "repository-private" as const,
          independentReview: true,
          requiredKinds: ["source-observation", "test-red", "test-green", "review-observation"] as const,
          criteria: [
            "discovery",
            "user-behavior",
            "non-goals",
            "binary-acceptance",
            "architecture-security-performance-accessibility",
            "framing-challenged",
            "red-test",
            "vertical-slice",
            "regression-checks",
            "independent-challenge",
          ] as const,
        }
      : {
          risk: "normal" as const,
          privacy: "repository-private" as const,
          independentReview: false,
          requiredKinds: ["source-observation", "test-red", "test-green"] as const,
          criteria: [
            "reproduction",
            "expected-observed",
            "competing-hypotheses",
            "root-cause",
            "failing-regression",
            "invariant-restored",
            "focused-green",
            "surrounding-checks",
            "observed-resolution",
          ] as const,
        };
