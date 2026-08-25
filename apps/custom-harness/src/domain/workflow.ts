import type { StoredAction } from "./action.js";

export type WorkflowStatus =
  "running" | "completion-requested" | "completed" | "failed" | "cancelled";

export interface StoredWorkflowInstance {
  readonly actionCount: number;
  readonly capabilityCeiling: readonly string[];
  readonly childCount: number;
  readonly childKey?: string;
  readonly contributionId: string;
  readonly contributionVersion: string;
  readonly createdAt: string;
  readonly depth: number;
  readonly errorCode?: string;
  readonly executionId: string;
  readonly input: unknown;
  readonly instanceId: string;
  readonly lastProgressKey?: string;
  readonly limits: {
    readonly maxActions: number;
    readonly maxChildren: number;
    readonly maxDelegationDepth: number;
    readonly maxNoProgress: number;
    readonly maxSteps: number;
  };
  readonly noProgressCount: number;
  readonly parentInstanceId?: string;
  readonly pluginId: string;
  readonly sourceEventId: string;
  readonly state: unknown;
  readonly status: WorkflowStatus;
  readonly stepCount: number;
  readonly updatedAt: string;
  readonly workflowName: string;
}

export interface WorkflowActionRecord {
  readonly actionId: string;
  readonly actionSchemaVersion: number;
  readonly actionType: string;
  readonly deadlineClass: StoredAction["deadlineClass"];
  readonly executionId: string;
  readonly gateClass: StoredAction["gateClass"];
  readonly input: unknown;
  readonly inputDigest: string;
  readonly pluginId: string;
  readonly reactorId: string;
  readonly requestedCapabilities: readonly string[];
  readonly resource: string;
  readonly sourceEventId: string;
}
