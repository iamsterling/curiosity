import type { WorkflowTransitionInput } from "./workflow-transition.js";

export type Awaitable<T> = T | Promise<T>;

export interface WorkflowLimits {
  readonly maxActions: number;
  readonly maxChildren: number;
  readonly maxDelegationDepth: number;
  readonly maxNoProgress: number;
  readonly maxSteps: number;
}

export type WorkflowStatus =
  | "running"
  | "completion-requested"
  | "completed"
  | "failed"
  | "cancelled";

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
  readonly limits: WorkflowLimits;
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
  readonly deadlineClass: "interactive" | "background";
  readonly executionId: string;
  readonly gateClass: "none-requested" | "binding-human-requested";
  readonly input: unknown;
  readonly inputDigest: string;
  readonly pluginId: string;
  readonly reactorId: string;
  readonly requestedCapabilities: readonly string[];
  readonly resource: string;
  readonly sourceEventId: string;
}

export interface WorkflowDefinitionSnapshot {
  readonly id: string;
  readonly initialState: unknown;
  readonly limits: WorkflowLimits;
  readonly name: string;
  readonly pluginId: string;
  readonly version: string;
}

export interface WorkflowDefinition extends WorkflowDefinitionSnapshot {
  readonly transition: (
    input: WorkflowTransitionInput,
  ) => Awaitable<unknown>;
}
