import type { Sha256 } from "./domain.js";
import type {
  StoredWorkflowInstance,
  WorkflowDefinition,
  WorkflowDefinitionSnapshot,
} from "./workflow-domain.js";
import type {
  WorkflowCatalogPort,
  WorkflowJournalPort,
  WorkflowSourceEvent,
} from "./workflow-port.js";
import {
  decodeWorkflowRequest,
  planWorkflowTransition,
} from "./workflow-planner.js";
import { validateWorkflowTransition } from "./workflow-transition.js";

const maximumSchedulerSteps = 1_024;
const gateLifetimeMs = 24 * 60 * 60 * 1_000;

export class WorkflowEngineFailure extends Error {
  readonly code: string;
  readonly pluginId: string;

  constructor(code: string, pluginId: string) {
    super(code);
    this.code = code;
    this.name = "WorkflowEngineFailure";
    this.pluginId = pluginId;
  }
}

export interface PortableWorkflowEngineConfig {
  readonly catalog: WorkflowCatalogPort;
  readonly eligibleActorId: string;
  readonly grantedCapabilities: ReadonlySet<string>;
  readonly journal: WorkflowJournalPort;
  readonly now: () => number;
  readonly sha256: Sha256;
}

const snapshot = (
  definition: WorkflowDefinition,
): WorkflowDefinitionSnapshot => ({
  id: definition.id,
  initialState: definition.initialState,
  limits: definition.limits,
  name: definition.name,
  pluginId: definition.pluginId,
  version: definition.version,
});

const request = (event: WorkflowSourceEvent) => {
  if (event.type !== "workflow.requested") return undefined;
  return decodeWorkflowRequest(event.body);
};

export class PortableWorkflowEngine {
  readonly #catalog: WorkflowCatalogPort;
  readonly #eligibleActorId: string;
  readonly #grantedCapabilities: ReadonlySet<string>;
  readonly #journal: WorkflowJournalPort;
  readonly #now: () => number;
  readonly #sha256: Sha256;

  constructor(config: PortableWorkflowEngineConfig) {
    this.#catalog = config.catalog;
    this.#eligibleActorId = config.eligibleActorId;
    this.#grantedCapabilities = config.grantedCapabilities;
    this.#journal = config.journal;
    this.#now = config.now;
    this.#sha256 = config.sha256;
  }

  async #startRequests(): Promise<number> {
    let created = 0;
    for (const event of await this.#journal.readEvents()) {
      let decoded;
      try {
        decoded = request(event);
      } catch {
        throw new WorkflowEngineFailure(
          "WORKFLOW_REQUEST_INVALID",
          event.pluginId,
        );
      }
      if (!decoded) continue;
      const contribution = this.#catalog.workflow(decoded.workflowName);
      if (!contribution)
        throw new WorkflowEngineFailure(
          "WORKFLOW_DEFINITION_NOT_FOUND",
          event.pluginId,
        );
      const capabilityCeiling = decoded.capabilityRequests
        .filter((capability) => this.#grantedCapabilities.has(capability))
        .sort();
      let result: "created" | "existing";
      try {
        result = await this.#journal.ensureRoot({
          capabilityCeiling,
          contribution: snapshot(contribution),
          input: decoded.input,
          instanceId: decoded.instanceId,
          sourceEventId: event.eventId,
          startedAt: new Date(this.#now()).toISOString(),
        });
      } catch {
        throw new WorkflowEngineFailure(
          "WORKFLOW_START_FAILED",
          contribution.pluginId,
        );
      }
      if (result === "created") created += 1;
    }
    return created;
  }

  async #advance(instance: StoredWorkflowInstance): Promise<void> {
    const contribution = this.#catalog.workflow(instance.workflowName);
    if (
      !contribution ||
      contribution.id !== instance.contributionId ||
      contribution.version !== instance.contributionVersion
    ) {
      await this.#journal.fail(
        instance,
        "WORKFLOW_DEFINITION_CHANGED",
        new Date(this.#now()).toISOString(),
      );
      return;
    }
    if (instance.stepCount >= instance.limits.maxSteps) {
      await this.#journal.fail(
        instance,
        "WORKFLOW_STEP_BUDGET_EXCEEDED",
        new Date(this.#now()).toISOString(),
      );
      return;
    }
    const proposed = await contribution.transition({
      children: await this.#journal.children(instance.instanceId),
      input: instance.input,
      instanceId: instance.instanceId,
      state: instance.state,
      step: instance.stepCount,
    });
    let output;
    try {
      output = validateWorkflowTransition(proposed);
    } catch {
      throw new WorkflowEngineFailure(
        "WORKFLOW_TRANSITION_INVALID",
        contribution.pluginId,
      );
    }
    const committedAtMs = this.#now();
    try {
      const plan = await planWorkflowTransition(
        instance,
        output,
        this.#catalog,
        this.#sha256,
      );
      await this.#journal.commitTransition({
        actions: plan.actions,
        children: plan.children,
        committedAt: new Date(committedAtMs).toISOString(),
        expectedStep: instance.stepCount,
        gateEligibleActorId: this.#eligibleActorId,
        gateExpiresAt: new Date(committedAtMs + gateLifetimeMs).toISOString(),
        instanceId: instance.instanceId,
        nextState: output.nextState,
        progressKey: output.progressKey,
        terminalRequested: output.terminalRequested,
        transitionDigest: plan.transitionDigest,
      });
    } catch (error) {
      const code = error instanceof Error ? error.message : "WORKFLOW_STEP_FAILED";
      await this.#journal.fail(
        instance,
        code,
        new Date(this.#now()).toISOString(),
      );
    }
  }

  async drain(): Promise<number> {
    let steps = 0;
    while (steps < maximumSchedulerSteps) {
      const started = await this.#startRequests();
      const reconciled = await this.#journal.reconcileTerminals(
        new Date(this.#now()).toISOString(),
      );
      const runnable = await this.#journal.runnable();
      for (const instance of runnable) await this.#advance(instance);
      const settled = await this.#journal.reconcileTerminals(
        new Date(this.#now()).toISOString(),
      );
      const changed = started + reconciled + runnable.length + settled;
      steps += changed;
      if (changed === 0) return steps;
    }
    throw new WorkflowEngineFailure(
      "WORKFLOW_SCHEDULER_LIMIT_EXCEEDED",
      "curiosity.kernel.workflows",
    );
  }
}
