import type { Awaitable, WorkflowLimits } from "./workflow-domain.js";

export type AgentRunStatus =
  "cancelled" | "completed" | "completion-requested" | "failed" | "running";

export type AgentJournalActionStatus =
  "delivery-unknown" | "failed" | "proposed" | "running" | "succeeded";

export interface AgentJournalStartRun {
  readonly capabilityCeiling: readonly string[];
  readonly childKey?: string;
  readonly contributionId: string;
  readonly contributionVersion: string;
  readonly depth: number;
  readonly executionId: string;
  readonly input: unknown;
  readonly limits: WorkflowLimits;
  readonly parentRunId?: string;
  readonly pluginId: string;
  readonly runId: string;
  readonly sourceEventId: string;
  readonly startedAt: string;
  readonly state: unknown;
  readonly workflowName: string;
}

export interface AgentJournalActionAllocation {
  readonly actionId: string;
  readonly actionSchemaVersion: number;
  readonly actionType: string;
  readonly deadlineClass: "background" | "interactive";
  readonly executionId: string;
  readonly gateClass: "binding-human-requested" | "none-requested";
  readonly input: unknown;
  readonly inputDigest: string;
  readonly pluginId: string;
  readonly reactorId: string;
  readonly requestedCapabilities: readonly string[];
  readonly resource: string;
  readonly sourceEventId: string;
}

export interface AgentJournalRunnableToolAction extends AgentJournalActionAllocation {
  readonly createdAt: string;
  readonly executionGeneration: number;
  readonly runId: string;
}

export interface AgentJournalChildAllocation {
  readonly capabilityCeiling: readonly string[];
  readonly childKey: string;
  readonly contributionId: string;
  readonly contributionVersion: string;
  readonly executionId: string;
  readonly initialState: unknown;
  readonly limits: WorkflowLimits;
  readonly pluginId: string;
  readonly runId: string;
  readonly workflowName: string;
}

export interface AgentJournalCommitTransition {
  readonly actions: readonly AgentJournalActionAllocation[];
  readonly children: readonly AgentJournalChildAllocation[];
  readonly committedAt: string;
  readonly expectedRevision: number;
  readonly gateEligibleActorId: string;
  readonly gateExpiresAt: string;
  readonly nextState: unknown;
  readonly observedStateDigest: string;
  readonly progressKey: string;
  readonly runId: string;
  readonly terminalRequested: boolean;
  readonly transitionDigest: string;
}

export interface AgentJournalMutationResult {
  readonly disposition: "accepted" | "duplicate";
  readonly revision: number;
  readonly runId: string;
}

export interface AgentRunProjection {
  readonly actionCount: number;
  readonly capabilityCeiling: readonly string[];
  readonly childCount: number;
  readonly childKey?: string;
  readonly contributionId: string;
  readonly contributionVersion: string;
  readonly createdAt: string;
  readonly depth: number;
  readonly errorCode?: string;
  readonly executionGeneration: number;
  readonly executionId: string;
  readonly input: unknown;
  readonly lastProgressKey?: string;
  readonly limits: WorkflowLimits;
  readonly noProgressCount: number;
  readonly parentRunId?: string;
  readonly pluginId: string;
  readonly providerAction?: AgentJournalProviderActionProjection;
  readonly revision: number;
  readonly runId: string;
  readonly sourceEventId: string;
  readonly state: unknown;
  readonly stateDigest: string;
  readonly status: AgentRunStatus;
  readonly updatedAt: string;
  readonly workflowName: string;
}

export interface AgentJournalProviderTerminalEvent {
  readonly body: unknown;
  readonly streamId: string;
  readonly type: string;
}

export interface AgentJournalProviderCallProjection {
  readonly allocatedAt: string;
  readonly attemptId: string;
  readonly callId: string;
  readonly completedAt?: string;
  readonly dispatchState: "armed" | "dispatched";
  readonly dispatchedAt?: string;
  readonly errorCode?: string;
  readonly generation: number;
  readonly modelId: string;
  readonly outputDigest?: string;
  readonly promptSnapshotDigest: string;
  readonly requestDigest: string;
  readonly sourceRevision: number;
  readonly status: "allocated" | "delivery-unknown" | "failed" | "succeeded";
  readonly terminalEvent?: AgentJournalProviderTerminalEvent;
}

export interface AgentJournalProviderActionProjection {
  readonly actionId: string;
  readonly errorCode?: string;
  readonly input: unknown;
  readonly inputDigest: string;
  readonly outputDigest?: string;
  readonly status: AgentJournalActionStatus;
  readonly call?: AgentJournalProviderCallProjection;
}

export interface AgentJournalProviderDispatch {
  readonly kind: "provider";
  readonly modelId: string;
  readonly promptSnapshot: unknown;
  readonly promptSnapshotDigest: string;
  readonly purpose: string;
  readonly requestDigest: string;
  readonly sourceRevision: number;
}

export interface AgentJournalToolDispatch {
  readonly kind: "tool";
  readonly modelToolCallId: string;
  readonly requestDigest: string;
  readonly toolName: string;
  readonly toolVersion: string;
}

export type AgentJournalDispatchAllocation =
  AgentJournalProviderDispatch | AgentJournalToolDispatch;

export type AgentJournalArmDispatch =
  | {
      readonly actionId: string;
      readonly allocatedAt: string;
      readonly attemptId: string;
      readonly callId: string;
      readonly dispatch: AgentJournalDispatchAllocation;
      readonly executionId: string;
      readonly generation: number;
      readonly inputDigest: string;
      readonly leaseExpiresAt: string;
      readonly ownerId: string;
      readonly phase: "allocate";
      readonly snapshot: unknown;
      readonly snapshotDigest: string;
    }
  | {
      readonly actionId: string;
      readonly attemptId: string;
      readonly authorizedAt: string;
      readonly callId: string;
      readonly generation: number;
      readonly kind: "provider" | "tool";
      readonly phase: "authorize";
      readonly requestDigest: string;
    };

export interface AgentJournalDispatchResult {
  readonly actionId: string;
  readonly attemptId: string;
  readonly callId: string;
  readonly disposition:
    "armed" | "authorized" | "denied" | "duplicate" | "resource-collision";
  readonly generation: number;
}

export interface AgentJournalProposedEvent {
  readonly body: unknown;
  readonly streamId: string;
  readonly type: string;
}

export interface AgentJournalSettleAttempt {
  readonly actionId: string;
  readonly attemptId: string;
  readonly callId: string;
  readonly completedAt: string;
  readonly errorCode?: string;
  readonly events: readonly AgentJournalProposedEvent[];
  readonly generation: number;
  readonly kind: "provider" | "tool";
  readonly outputDigest: string;
  readonly status: "cancelled" | "delivery-unknown" | "failed" | "succeeded";
  readonly usage?: unknown;
  readonly usageState?: "ESTIMATED" | "REPORTED" | "UNKNOWN";
}

export interface AgentJournalSettlementResult {
  readonly actionId: string;
  readonly attemptId: string;
  readonly callId: string;
  readonly disposition: "committed" | "duplicate" | "stale";
  readonly generation: number;
}

export interface AgentJournalReconciledAttempt {
  readonly actionId: string;
  readonly attemptId: string;
  readonly callId: string;
  readonly classification: "cancelled" | "delivery-unknown" | "not-dispatched";
  readonly generation: number;
  readonly kind: "provider" | "tool";
}

export interface AgentJournalTerminalRun {
  readonly runId: string;
  readonly status: "cancelled" | "completed" | "failed";
}

export interface AgentJournalPhysicalCancellation {
  readonly callId: string;
  readonly kind: "provider" | "tool";
}

export interface AgentJournalCancelRunResult {
  readonly disposition: "accepted" | "duplicate";
  readonly physicalCalls: readonly AgentJournalPhysicalCancellation[];
  readonly runId: string;
  readonly status: "cancelled" | "completed" | "failed";
}

export interface AgentJournalPort {
  readonly armDispatch: (
    input: AgentJournalArmDispatch,
  ) => Awaitable<AgentJournalDispatchResult>;
  readonly commitTransition: (
    input: AgentJournalCommitTransition,
  ) => Awaitable<AgentJournalMutationResult>;
  readonly readRunProjection: (
    runId: string,
  ) => Awaitable<AgentRunProjection | undefined>;
  readonly reconcileInterrupted: (
    reconciledAt: string,
  ) => Awaitable<readonly AgentJournalReconciledAttempt[]>;
  readonly runnableRuns: (
    limit: number,
  ) => Awaitable<readonly AgentRunProjection[]>;
  readonly settleAttempt: (
    input: AgentJournalSettleAttempt,
  ) => Awaitable<AgentJournalSettlementResult>;
  readonly startRun: (
    input: AgentJournalStartRun,
  ) => Awaitable<AgentJournalMutationResult>;
}

export interface AgentToolJournalPort {
  readonly armDispatch: AgentJournalPort["armDispatch"];
  readonly runnableToolActions: (
    limit: number,
  ) => Awaitable<readonly AgentJournalRunnableToolAction[]>;
  readonly settleAttempt: AgentJournalPort["settleAttempt"];
}

export interface AgentTerminalJournalPort {
  readonly reconcileTerminalRuns: (
    reconciledAt: string,
    limit: number,
  ) => Awaitable<readonly AgentJournalTerminalRun[]>;
}

export interface AgentCancellationJournalPort {
  readonly cancelRun: (
    runId: string,
    cancelledAt: string,
  ) => Awaitable<AgentJournalCancelRunResult>;
}
