import { DiagnosticError } from "../../core/diagnostics/diagnostic.js";
import type { EvidenceKind } from "./codec.js";

export interface ObservationBefore {
  readonly hostEventID: string;
  readonly toolCallID: string;
  readonly toolID: string;
  readonly actionTicketID: string;
  readonly intentID: string;
  readonly intentRevision: number;
  readonly criterionID: string;
  readonly criterionRevision: number;
  readonly evidenceKind: EvidenceKind;
  readonly repositoryRevision: string;
  readonly inputDigest: string;
  readonly environmentDigest: string;
  readonly observedAt: string;
}
export interface ObservationAfter {
  readonly hostEventID: string;
  readonly toolCallID: string;
  readonly toolID: string;
  readonly status: "passed" | "failed" | "ambiguous";
  readonly outputDigest: string;
  readonly artifact: { readonly locator: string; readonly digest: string };
  readonly observedAt: string;
  readonly expiresAt?: string;
}
export interface TrustedObservation
  extends ObservationBefore,
    Omit<ObservationAfter, "toolCallID" | "toolID" | "observedAt"> {
  readonly completedAt: string;
}

const exact = (value: unknown, keys: readonly string[], code: string): Record<string, unknown> => {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new DiagnosticError(code);
  const record = value as Record<string, unknown>;
  if (Object.keys(record).length !== keys.length || Object.keys(record).some((key) => !keys.includes(key)))
    throw new DiagnosticError(code);
  return record;
};
const requiredString = (value: unknown, code: string): string => {
  if (typeof value !== "string" || value.length === 0 || value.length > 4096) throw new DiagnosticError(code);
  return value;
};
const identityString = (value: unknown, code: string): string => {
  const result = requiredString(value, code);
  if (!/^[A-Za-z0-9][A-Za-z0-9._:-]{0,255}$/u.test(result)) throw new DiagnosticError(code);
  return result;
};
const digestString = (value: unknown, code: string): string => {
  const result = requiredString(value, code);
  if (!/^sha256:[a-f0-9]{64}$/u.test(result)) throw new DiagnosticError(code);
  return result;
};
const timestamp = (value: unknown, code: string): string => {
  const result = requiredString(value, code);
  if (!Number.isFinite(Date.parse(result)) || new Date(result).toISOString() !== result)
    throw new DiagnosticError(code);
  return result;
};
const positiveRevision = (value: unknown, code: string): number => {
  if (!Number.isSafeInteger(value) || Number(value) < 1) throw new DiagnosticError(code);
  return Number(value);
};
const evidenceKinds = new Set<EvidenceKind>([
  "source-observation",
  "test-red",
  "test-green",
  "command-result",
  "review-observation",
]);
const statuses = new Set(["passed", "failed", "ambiguous"]);

export class TrustedObservationStore {
  private readonly pending = new Map<string, ObservationBefore>();
  private readonly complete = new Map<string, TrustedObservation>();
  private readonly eventIDs = new Set<string>();
  before(value: ObservationBefore): void {
    const v = exact(
      value,
      [
        "hostEventID",
        "toolCallID",
        "toolID",
        "actionTicketID",
        "intentID",
        "intentRevision",
        "criterionID",
        "criterionRevision",
        "evidenceKind",
        "repositoryRevision",
        "inputDigest",
        "environmentDigest",
        "observedAt",
      ],
      "ENGINEERING_OBSERVATION_SCHEMA_INVALID",
    ) as unknown as ObservationBefore;
    for (const key of [v.hostEventID, v.toolCallID, v.toolID, v.actionTicketID, v.intentID, v.criterionID])
      identityString(key, "ENGINEERING_OBSERVATION_SCHEMA_INVALID");
    for (const digest of [v.repositoryRevision, v.inputDigest, v.environmentDigest])
      digestString(digest, "ENGINEERING_OBSERVATION_SCHEMA_INVALID");
    positiveRevision(v.intentRevision, "ENGINEERING_OBSERVATION_SCHEMA_INVALID");
    positiveRevision(v.criterionRevision, "ENGINEERING_OBSERVATION_SCHEMA_INVALID");
    timestamp(v.observedAt, "ENGINEERING_OBSERVATION_SCHEMA_INVALID");
    if (!evidenceKinds.has(v.evidenceKind)) throw new DiagnosticError("ENGINEERING_OBSERVATION_SCHEMA_INVALID");
    if (this.pending.has(v.toolCallID) || this.complete.has(v.toolCallID) || this.eventIDs.has(v.hostEventID))
      throw new DiagnosticError("ENGINEERING_OBSERVATION_COLLISION");
    const decoded = Object.freeze({
      hostEventID: v.hostEventID,
      toolCallID: v.toolCallID,
      toolID: v.toolID,
      actionTicketID: v.actionTicketID,
      intentID: v.intentID,
      intentRevision: v.intentRevision,
      criterionID: v.criterionID,
      criterionRevision: v.criterionRevision,
      evidenceKind: v.evidenceKind,
      repositoryRevision: v.repositoryRevision,
      inputDigest: v.inputDigest,
      environmentDigest: v.environmentDigest,
      observedAt: v.observedAt,
    });
    this.eventIDs.add(v.hostEventID);
    this.pending.set(v.toolCallID, decoded);
  }
  after(value: ObservationAfter): TrustedObservation {
    const v = exact(
      value,
      [
        "hostEventID",
        "toolCallID",
        "toolID",
        "status",
        "outputDigest",
        "artifact",
        "observedAt",
        ...(value.expiresAt === undefined ? [] : ["expiresAt"]),
      ],
      "ENGINEERING_OBSERVATION_SCHEMA_INVALID",
    ) as unknown as ObservationAfter;
    const before = this.pending.get(v.toolCallID);
    if (!before) throw new DiagnosticError("ENGINEERING_OBSERVATION_BEFORE_MISSING");
    const artifact = exact(v.artifact, ["locator", "digest"], "ENGINEERING_OBSERVATION_SCHEMA_INVALID");
    if (before.toolID !== v.toolID) throw new DiagnosticError("ENGINEERING_OBSERVATION_TOOL_MISMATCH");
    identityString(v.hostEventID, "ENGINEERING_OBSERVATION_SCHEMA_INVALID");
    requiredString(artifact.locator, "ENGINEERING_OBSERVATION_SCHEMA_INVALID");
    for (const digest of [v.outputDigest, artifact.digest])
      digestString(digest, "ENGINEERING_OBSERVATION_SCHEMA_INVALID");
    if (!statuses.has(v.status) || this.eventIDs.has(v.hostEventID))
      throw new DiagnosticError(
        this.eventIDs.has(v.hostEventID)
          ? "ENGINEERING_OBSERVATION_COLLISION"
          : "ENGINEERING_OBSERVATION_SCHEMA_INVALID",
      );
    const completedAt = timestamp(v.observedAt, "ENGINEERING_OBSERVATION_SCHEMA_INVALID");
    const expiresAt =
      v.expiresAt === undefined ? undefined : timestamp(v.expiresAt, "ENGINEERING_OBSERVATION_SCHEMA_INVALID");
    if (
      Date.parse(completedAt) < Date.parse(before.observedAt) ||
      (expiresAt && Date.parse(expiresAt) <= Date.parse(completedAt))
    )
      throw new DiagnosticError("ENGINEERING_OBSERVATION_SCHEMA_INVALID");
    const observation = Object.freeze({
      ...before,
      hostEventID: v.hostEventID,
      status: v.status,
      outputDigest: v.outputDigest,
      artifact: Object.freeze({ locator: String(artifact.locator), digest: String(artifact.digest) }),
      completedAt,
      ...(expiresAt ? { expiresAt } : {}),
    });
    this.pending.delete(v.toolCallID);
    this.eventIDs.add(v.hostEventID);
    this.complete.set(v.toolCallID, observation);
    return observation;
  }
  resolve(toolCallID: string): TrustedObservation | undefined {
    return this.complete.get(toolCallID);
  }
}
