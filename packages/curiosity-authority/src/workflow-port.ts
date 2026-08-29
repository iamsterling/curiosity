import type {
  Awaitable,
  StoredWorkflowInstance,
  WorkflowActionRecord,
  WorkflowDefinition,
  WorkflowDefinitionSnapshot,
} from "./workflow-domain.js";
import type { WorkflowTransitionInput } from "./workflow-transition.js";

export interface WorkflowSourceEvent {
  readonly body: unknown;
  readonly eventId: string;
  readonly pluginId: string;
  readonly type: string;
}

export interface WorkflowChildAllocation {
  readonly capabilityCeiling: readonly string[];
  readonly childKey: string;
  readonly contribution: WorkflowDefinitionSnapshot;
  readonly executionId: string;
  readonly instanceId: string;
}

export interface WorkflowEnsureRootInput {
  readonly capabilityCeiling: readonly string[];
  readonly contribution: WorkflowDefinitionSnapshot;
  readonly input: unknown;
  readonly instanceId: string;
  readonly sourceEventId: string;
  readonly startedAt: string;
}

export interface WorkflowCommitTransitionInput {
  readonly actions: readonly WorkflowActionRecord[];
  readonly children: readonly WorkflowChildAllocation[];
  readonly committedAt: string;
  readonly expectedStep: number;
  readonly gateEligibleActorId: string;
  readonly gateExpiresAt: string;
  readonly instanceId: string;
  readonly nextState: unknown;
  readonly progressKey: string;
  readonly terminalRequested: boolean;
  readonly transitionDigest: string;
}

export interface WorkflowCatalogPort {
  readonly workflow: (name: string) => WorkflowDefinition | undefined;
}

export interface WorkflowJournalPort {
  readonly children: (
    instanceId: string,
  ) => Awaitable<WorkflowTransitionInput["children"]>;
  readonly commitTransition: (
    input: WorkflowCommitTransitionInput,
  ) => Awaitable<void>;
  readonly ensureRoot: (
    input: WorkflowEnsureRootInput,
  ) => Awaitable<"created" | "existing">;
  readonly fail: (
    instance: StoredWorkflowInstance,
    errorCode: string,
    at: string,
  ) => Awaitable<void>;
  readonly readEvents: () => Awaitable<readonly WorkflowSourceEvent[]>;
  readonly reconcileTerminals: (at: string) => Awaitable<number>;
  readonly runnable: () => Awaitable<readonly StoredWorkflowInstance[]>;
}
