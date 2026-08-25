import { createHash } from "node:crypto";
import { Effect } from "effect";
import type { StoredEvent } from "../domain/event.js";
import type {
  StoredWorkflowInstance,
  WorkflowActionRecord,
} from "../domain/workflow.js";
import type { EventJournal } from "../storage/event-journal.js";
import type { WorkflowChildAllocation } from "../storage/workflow-journal.js";
import { canonicalJson } from "./canonical-json.js";
import { PluginFailure } from "./errors.js";
import type { StaticPluginCatalog } from "./plugin.js";
import { validateWorkflowTransition } from "./workflow-transition-validation.js";

const maximumSchedulerSteps = 1_024;

const digest = (value: unknown): string =>
  createHash("sha256").update(canonicalJson(value)).digest("hex");

const record = (value: unknown): Record<string, unknown> | undefined =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;

const request = (
  event: StoredEvent,
):
  | {
      readonly capabilityRequests: readonly string[];
      readonly input: unknown;
      readonly instanceId: string;
      readonly workflowName: string;
    }
  | undefined => {
  if (event.type !== "workflow.requested") return undefined;
  const body = record(event.body);
  if (
    !body ||
    Object.keys(body).sort().join(",") !==
      "capabilityRequests,input,instanceId,schemaVersion,workflowName" ||
    body.schemaVersion !== 1 ||
    typeof body.instanceId !== "string" ||
    !body.instanceId ||
    body.instanceId.length > 256 ||
    typeof body.workflowName !== "string" ||
    !body.workflowName ||
    !Array.isArray(body.capabilityRequests) ||
    body.capabilityRequests.some(
      (capability) => typeof capability !== "string" || !capability,
    ) ||
    new Set(body.capabilityRequests).size !== body.capabilityRequests.length
  )
    throw new Error("WORKFLOW_REQUEST_INVALID");
  canonicalJson(body.input);
  return {
    capabilityRequests: body.capabilityRequests as string[],
    input: body.input,
    instanceId: body.instanceId,
    workflowName: body.workflowName,
  };
};

export class WorkflowEngine {
  constructor(
    private readonly journal: EventJournal,
    private readonly catalog: StaticPluginCatalog,
    private readonly grantedCapabilities: ReadonlySet<string>,
    private readonly eligibleActorId: string,
    private readonly now: () => number,
  ) {}

  private startRequests = Effect.fn("WorkflowEngine.startRequests")(function* (
    this: WorkflowEngine,
  ) {
    let created = 0;
    for (const event of this.journal.readEvents()) {
      const decoded = yield* Effect.try({
        try: () => request(event),
        catch: () =>
          new PluginFailure({
            message: "WORKFLOW_REQUEST_INVALID",
            pluginId: event.pluginId,
          }),
      });
      if (!decoded) continue;
      const contribution = this.catalog.workflow(decoded.workflowName);
      if (!contribution)
        return yield* new PluginFailure({
          message: "WORKFLOW_DEFINITION_NOT_FOUND",
          pluginId: event.pluginId,
        });
      const capabilityCeiling = decoded.capabilityRequests
        .filter((capability) => this.grantedCapabilities.has(capability))
        .sort();
      const result = yield* Effect.try({
        try: () =>
          this.journal.workflows.ensureRoot({
            capabilityCeiling,
            contribution,
            input: decoded.input,
            instanceId: decoded.instanceId,
            sourceEventId: event.eventId,
            startedAt: new Date(this.now()).toISOString(),
          }),
        catch: () =>
          new PluginFailure({
            message: "WORKFLOW_START_FAILED",
            pluginId: contribution.pluginId,
          }),
      });
      if (result === "created") created += 1;
    }
    return created;
  });

  private actionRecord(
    instance: StoredWorkflowInstance,
    ordinal: number,
    proposal: ReturnType<typeof validateWorkflowTransition>["actions"][number],
  ): WorkflowActionRecord {
    if (proposal.subject.executionId !== instance.executionId)
      throw new Error("WORKFLOW_ACTION_EXECUTION_MISMATCH");
    if (
      proposal.requestedCapabilities.some(
        (capability) => !instance.capabilityCeiling.includes(capability),
      )
    )
      throw new Error("WORKFLOW_ACTION_CEILING_EXCEEDED");
    const inputDigest = digest(proposal.input);
    const actionId = digest({
      inputDigest,
      instanceId: instance.instanceId,
      ordinal,
      step: instance.stepCount + 1,
      type: proposal.actionType,
      version: proposal.actionSchemaVersion,
    });
    return {
      actionId,
      actionSchemaVersion: proposal.actionSchemaVersion,
      actionType: proposal.actionType,
      deadlineClass: proposal.deadlineClass,
      executionId: proposal.subject.executionId,
      gateClass: proposal.gateClass,
      input: proposal.input,
      inputDigest,
      pluginId: instance.pluginId,
      reactorId: instance.contributionId,
      requestedCapabilities: proposal.requestedCapabilities,
      resource: proposal.subject.resource,
      sourceEventId: instance.sourceEventId,
    };
  }

  private childRecord(
    instance: StoredWorkflowInstance,
    child: ReturnType<typeof validateWorkflowTransition>["children"][number],
  ): WorkflowChildAllocation {
    if (instance.depth >= instance.limits.maxDelegationDepth)
      throw new Error("WORKFLOW_DELEGATION_DEPTH_EXCEEDED");
    if (
      child.requestedCapabilities.some(
        (capability) => !instance.capabilityCeiling.includes(capability),
      )
    )
      throw new Error("WORKFLOW_CHILD_CEILING_EXCEEDED");
    const contribution = this.catalog.workflow(child.workflowName);
    if (!contribution) throw new Error("WORKFLOW_CHILD_DEFINITION_NOT_FOUND");
    const instanceId = `child:${digest({
      childKey: child.id,
      parent: instance.instanceId,
      workflowName: child.workflowName,
    })}`;
    return {
      capabilityCeiling: [...child.requestedCapabilities].sort(),
      childKey: child.id,
      contribution,
      executionId: instanceId,
      instanceId,
    };
  }

  private advance = Effect.fn("WorkflowEngine.advance")(function* (
    this: WorkflowEngine,
    instance: StoredWorkflowInstance,
  ) {
    const contribution = this.catalog.workflow(instance.workflowName);
    if (
      !contribution ||
      contribution.id !== instance.contributionId ||
      contribution.version !== instance.contributionVersion
    ) {
      this.journal.workflows.fail(
        instance,
        "WORKFLOW_DEFINITION_CHANGED",
        new Date(this.now()).toISOString(),
      );
      return;
    }
    if (instance.stepCount >= instance.limits.maxSteps) {
      this.journal.workflows.fail(
        instance,
        "WORKFLOW_STEP_BUDGET_EXCEEDED",
        new Date(this.now()).toISOString(),
      );
      return;
    }
    const output = yield* contribution
      .transition({
        children: this.journal.workflows.children(instance.instanceId),
        input: instance.input,
        instanceId: instance.instanceId,
        state: instance.state,
        step: instance.stepCount,
      })
      .pipe(
        Effect.flatMap((value) =>
          Effect.try({
            try: () => validateWorkflowTransition(value),
            catch: () =>
              new PluginFailure({
                message: "WORKFLOW_TRANSITION_INVALID",
                pluginId: contribution.pluginId,
              }),
          }),
        ),
      );
    const committedAtMs = this.now();
    yield* Effect.try({
      try: () => {
        const actions = output.actions.map((action, ordinal) =>
          this.actionRecord(instance, ordinal, action),
        );
        const children = output.children.map((child) =>
          this.childRecord(instance, child),
        );
        const transitionDigest = digest({
          actions,
          children: children.map((child) => ({
            capabilityCeiling: child.capabilityCeiling,
            childKey: child.childKey,
            contributionId: child.contribution.id,
            contributionVersion: child.contribution.version,
            instanceId: child.instanceId,
          })),
          instanceId: instance.instanceId,
          nextState: output.nextState,
          progressKey: output.progressKey,
          step: instance.stepCount + 1,
          terminalRequested: output.terminalRequested,
        });
        this.journal.workflows.commitTransition({
          actions,
          children,
          committedAt: new Date(committedAtMs).toISOString(),
          expectedStep: instance.stepCount,
          gateEligibleActorId: this.eligibleActorId,
          gateExpiresAt: new Date(
            committedAtMs + 24 * 60 * 60 * 1_000,
          ).toISOString(),
          instanceId: instance.instanceId,
          nextState: output.nextState,
          progressKey: output.progressKey,
          terminalRequested: output.terminalRequested,
          transitionDigest,
        });
      },
      catch: (error) => {
        const code =
          error instanceof Error ? error.message : "WORKFLOW_STEP_FAILED";
        this.journal.workflows.fail(
          instance,
          code,
          new Date(this.now()).toISOString(),
        );
        return new PluginFailure({
          message: code,
          pluginId: contribution.pluginId,
        });
      },
    }).pipe(Effect.catch(() => Effect.void));
  });

  drain = Effect.fn("WorkflowEngine.drain")(function* (this: WorkflowEngine) {
    let steps = 0;
    while (steps < maximumSchedulerSteps) {
      const started = yield* this.startRequests();
      const reconciled = this.journal.workflows.reconcileTerminals(
        new Date(this.now()).toISOString(),
      );
      const runnable = this.journal.workflows.runnable();
      for (const instance of runnable) yield* this.advance(instance);
      const settled = this.journal.workflows.reconcileTerminals(
        new Date(this.now()).toISOString(),
      );
      const changed = started + reconciled + runnable.length + settled;
      steps += changed;
      if (changed === 0) return steps;
    }
    return yield* new PluginFailure({
      message: "WORKFLOW_SCHEDULER_LIMIT_EXCEEDED",
      pluginId: "curiosity.kernel.workflows",
    });
  });
}
