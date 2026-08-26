import type { PromptSnapshot } from "./prompt.js";

export type ProviderPurpose =
  | "normal"
  | "retry"
  | "warmup"
  | "compaction"
  | "child"
  | "reconciliation"
  | "evaluation";

export interface ProviderAttemptSnapshot {
  readonly action: {
    readonly actionId: string;
    readonly actionType: string;
    readonly deadlineClass: "interactive" | "background";
    readonly gateClass: "none-requested" | "binding-human-requested";
    readonly inputDigest: string;
    readonly requestedCapabilities: readonly string[];
    readonly resource: string;
  };
  readonly catalogDigest: string;
  readonly effort: string;
  readonly generation: number;
  readonly grantedCapabilities: readonly string[];
  readonly modelId: string;
  readonly policyVersion: "local-v1";
  readonly promptSnapshot: PromptSnapshot;
  readonly promptSnapshotDigest: string;
  readonly providerPurpose: ProviderPurpose;
  readonly requestDigest: string;
  readonly schemaVersion: 1;
}

export interface AllocatedProviderAttempt {
  readonly actionId: string;
  readonly attemptId: string;
  readonly callId: string;
  readonly executionId: string;
  readonly generation: number;
  readonly leaseExpiresAt: string;
}

export interface ToolAttemptSnapshot {
  readonly action: ProviderAttemptSnapshot["action"];
  readonly catalogDigest: string;
  readonly generation: number;
  readonly grantedCapabilities: readonly string[];
  readonly policyVersion: "local-v1";
  readonly requestDigest: string;
  readonly schemaVersion: 1;
  readonly tool: {
    readonly digest: string;
    readonly name: string;
    readonly pluginId: string;
    readonly pluginVersion: string;
    readonly version: string;
  };
}

export interface AllocatedToolAttempt {
  readonly actionId: string;
  readonly attemptId: string;
  readonly callId: string;
  readonly executionId: string;
  readonly generation: number;
  readonly leaseExpiresAt: string;
}
