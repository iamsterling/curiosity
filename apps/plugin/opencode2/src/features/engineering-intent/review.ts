import { DiagnosticError } from "../../core/diagnostics/diagnostic.js";
export interface EngineeringReviewAttestation {
  ownerSessionID: string;
  reviewerSessionID: string;
  artifactDigests: readonly string[];
  criterionRevisions: readonly { id: string; revision: number }[];
  findingCodes: readonly string[];
  independence: "bounded-session-independence" | "strict";
}
const strings = (value: unknown): readonly string[] => {
  if (
    !Array.isArray(value) ||
    value.length === 0 ||
    value.some((item) => typeof item !== "string" || item.length === 0) ||
    new Set(value).size !== value.length
  )
    throw new DiagnosticError("ENGINEERING_REVIEW_SCHEMA_INVALID");
  return Object.freeze([...value]);
};
export const validateReview = (value: EngineeringReviewAttestation) => {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value) ||
    Object.keys(value).length !== 6 ||
    Object.keys(value).some(
      (key) =>
        ![
          "ownerSessionID",
          "reviewerSessionID",
          "artifactDigests",
          "criterionRevisions",
          "findingCodes",
          "independence",
        ].includes(key),
    )
  )
    throw new DiagnosticError("ENGINEERING_REVIEW_SCHEMA_INVALID");
  if (
    typeof value.ownerSessionID !== "string" ||
    typeof value.reviewerSessionID !== "string" ||
    !value.ownerSessionID ||
    !value.reviewerSessionID ||
    !["bounded-session-independence", "strict"].includes(value.independence)
  )
    throw new DiagnosticError("ENGINEERING_REVIEW_SCHEMA_INVALID");
  const artifactDigests = strings(value.artifactDigests);
  const findingCodes = strings(value.findingCodes);
  if (!Array.isArray(value.criterionRevisions) || value.criterionRevisions.length === 0)
    throw new DiagnosticError("ENGINEERING_REVIEW_SCHEMA_INVALID");
  const criterionRevisions = value.criterionRevisions.map((raw) => {
    if (
      !raw ||
      typeof raw !== "object" ||
      Array.isArray(raw) ||
      Object.keys(raw).length !== 2 ||
      Object.keys(raw).some((key) => !["id", "revision"].includes(key)) ||
      typeof raw.id !== "string" ||
      !raw.id ||
      !Number.isInteger(raw.revision) ||
      raw.revision < 1
    )
      throw new DiagnosticError("ENGINEERING_REVIEW_SCHEMA_INVALID");
    return Object.freeze({ id: raw.id, revision: raw.revision });
  });
  if (new Set(criterionRevisions.map((item) => item.id)).size !== criterionRevisions.length)
    throw new DiagnosticError("ENGINEERING_REVIEW_SCHEMA_INVALID");
  if (value.ownerSessionID === value.reviewerSessionID) throw new DiagnosticError("ENGINEERING_REVIEW_NOT_INDEPENDENT");
  if (value.independence === "strict") throw new DiagnosticError("ENGINEERING_REVIEW_LINEAGE_UNPROVEN");
  return Object.freeze({
    ownerSessionID: value.ownerSessionID,
    reviewerSessionID: value.reviewerSessionID,
    artifactDigests,
    criterionRevisions: Object.freeze(criterionRevisions),
    findingCodes,
    independence: value.independence,
  });
};
