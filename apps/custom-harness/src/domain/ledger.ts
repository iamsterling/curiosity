import { Schema } from "effect";

const StringList = Schema.Array(Schema.NonEmptyString);

export class LedgerIntent extends Schema.Class<LedgerIntent>(
  "@curiosity/custom-harness/LedgerIntent",
)({
  id: Schema.NonEmptyString,
  invariant: Schema.NonEmptyString,
  nonGoals: StringList,
  objective: Schema.NonEmptyString,
  revision: Schema.Number,
  rigor: Schema.Literals(["lite", "practical", "rigorous"]),
  schemaVersion: Schema.Literal(1),
  scope: StringList,
}) {}

export class LedgerCriterion extends Schema.Class<LedgerCriterion>(
  "@curiosity/custom-harness/LedgerCriterion",
)({
  id: Schema.NonEmptyString,
  intentId: Schema.NonEmptyString,
  intentRevision: Schema.Number,
  observable: Schema.NonEmptyString,
  oracle: Schema.NonEmptyString,
  requiredEvidence: StringList,
  revision: Schema.Number,
  schemaVersion: Schema.Literal(1),
}) {}

export class LedgerWork extends Schema.Class<LedgerWork>(
  "@curiosity/custom-harness/LedgerWork",
)({
  criterionIds: StringList,
  id: Schema.NonEmptyString,
  intentId: Schema.NonEmptyString,
  intentRevision: Schema.Number,
  schemaVersion: Schema.Literal(1),
  state: Schema.Literals(["blocked", "pending", "resolved"]),
  writableScope: StringList,
}) {}

export class LedgerResolutionProposal extends Schema.Class<LedgerResolutionProposal>(
  "@curiosity/custom-harness/LedgerResolutionProposal",
)({
  evidenceIds: StringList,
  id: Schema.NonEmptyString,
  intentId: Schema.NonEmptyString,
  rationale: Schema.NonEmptyString,
  schemaVersion: Schema.Literal(1),
  verdict: Schema.Literals(["accept", "blocked", "reject"]),
}) {}

const strict = { onExcessProperty: "error" } as const;
export const decodeLedgerIntent = Schema.decodeUnknownEffect(
  LedgerIntent,
  strict,
);
export const decodeLedgerCriterion = Schema.decodeUnknownEffect(
  LedgerCriterion,
  strict,
);
export const decodeLedgerWork = Schema.decodeUnknownEffect(LedgerWork, strict);
export const decodeLedgerResolution = Schema.decodeUnknownEffect(
  LedgerResolutionProposal,
  strict,
);

export const validRevision = (value: number): boolean =>
  Number.isSafeInteger(value) && value >= 1;

export const validStringList = (
  values: readonly string[],
  maximum = 64,
): boolean =>
  values.length <= maximum &&
  new Set(values).size === values.length &&
  values.every((value) => Buffer.byteLength(value) <= 4_096);
