import {
  decodeEngineeringIntentProfile,
  engineeringKinds,
  policyShape,
  type EngineeringIntentProfileV1,
  type EngineeringKind,
} from "./codec.js";
import { randomUUID } from "node:crypto";
import { DiagnosticError } from "../../core/diagnostics/diagnostic.js";

export const criteriaByKind: Record<EngineeringKind, readonly string[]> = {
  bug: policyShape("bug").criteria,
  feature: policyShape("feature").criteria,
  secure: policyShape("secure").criteria,
};

/** Ledger-owned constructor. Its input is trusted workspace/policy state, never a tool payload. */
export const profileFor = (input: {
  kind: EngineeringKind;
  intentID: string;
  intentRevision: number;
  repositoryRootIdentity: string;
  commandInvocationID: string;
  createdAt: string;
}): EngineeringIntentProfileV1 => {
  const policy = policyShape(input.kind);
  return decodeEngineeringIntentProfile({
    schemaVersion: 1,
    policyVersion: "1",
    intentID: input.intentID,
    intentRevision: input.intentRevision,
    kind: input.kind,
    objectiveRef: { sessionCorrelationID: input.commandInvocationID },
    repository: { rootIdentity: input.repositoryRootIdentity },
    scope: { paths: ["."], defaulted: true },
    evidencePolicy: {
      requiredKinds: [...policy.requiredKinds],
      freshness: "revision-and-input-bound",
      independentReview: policy.independentReview,
    },
    durableRecord: "local-only",
    risk: policy.risk,
    privacy: policy.privacy,
    completionCriteria: policy.criteria.map((id) => ({ id, revision: 1, expectedEvidence: [...policy.requiredKinds] })),
    correlation: { commandInvocationID: input.commandInvocationID },
    createdAt: input.createdAt,
  });
};

export const startForegroundEngineeringPursuit = (
  input: unknown,
  trusted: {
    repositoryRootIdentity: string;
    now: string;
    captureAcceptedCommand?: (input: unknown) => void;
  },
): { readonly profile: EngineeringIntentProfileV1; readonly persistence: "disabled"; readonly resumable: false } => {
  if (!input || typeof input !== "object" || Array.isArray(input))
    throw new DiagnosticError("ENGINEERING_COMMAND_SCHEMA_INVALID");
  const value = input as Record<string, unknown>;
  if (value.classification === "restricted") throw new DiagnosticError("ENGINEERING_RESTRICTED_INPUT_UNSUPPORTED");
  const keys = Object.keys(value);
  if (keys.some((key) => !["kind", "classification", "scope"].includes(key)) || keys.length !== 3)
    throw new DiagnosticError(
      value.kind === "secure" ? "ENGINEERING_RESTRICTED_INPUT_UNSUPPORTED" : "ENGINEERING_COMMAND_SCHEMA_INVALID",
    );
  if (!engineeringKinds.includes(value.kind as EngineeringKind) || value.scope !== "trusted-workspace")
    throw new DiagnosticError("ENGINEERING_COMMAND_SCHEMA_INVALID");
  if (!["public-safe", "restricted"].includes(String(value.classification)))
    throw new DiagnosticError("ENGINEERING_TRUSTED_CLASSIFICATION_REQUIRED");
  trusted.captureAcceptedCommand?.(input);
  const invocation = randomUUID();
  return Object.freeze({
    profile: profileFor({
      kind: value.kind as EngineeringKind,
      intentID: `foreground:${randomUUID()}`,
      intentRevision: 1,
      repositoryRootIdentity: trusted.repositoryRootIdentity,
      commandInvocationID: invocation,
      createdAt: trusted.now,
    }),
    persistence: "disabled" as const,
    resumable: false as const,
  });
};
