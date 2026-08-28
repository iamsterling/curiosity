import { createHash } from "node:crypto";
import { Effect, Fiber, Result } from "effect";
import type { StoredAction } from "../domain/action.js";
import type { ProposedEvent, StoredEvent } from "../domain/event.js";
import type { EventJournal } from "../storage/event-journal.js";
import { validateReactionProposal } from "./action-proposal.js";
import { canonicalJson } from "./canonical-json.js";
import { ActionExecutionFailure, PluginFailure } from "./errors.js";
import type { StaticPluginCatalog } from "./plugin.js";
import type { RolePolicyConfig } from "./role-policy.js";
import { ProviderGateway, type ActionStreamDelta } from "./provider-gateway.js";
import { ToolGateway } from "./tool-gateway.js";
import { LocalActionGateway } from "./local-action-gateway.js";
import { ChildScheduler } from "./child-scheduler.js";

const maximumDrainSteps = 1_024;

const digest = (value: unknown): string =>
  createHash("sha256").update(canonicalJson(value)).digest("hex");

const actionCorrelation = (
  action: StoredAction,
): Record<string, unknown> | undefined => {
  const input =
    action.input &&
    typeof action.input === "object" &&
    !Array.isArray(action.input)
      ? (action.input as Record<string, unknown>)
      : undefined;
  return input?.correlation &&
    typeof input.correlation === "object" &&
    !Array.isArray(input.correlation)
    ? (input.correlation as Record<string, unknown>)
    : undefined;
};

const isChildProviderAction = (action: StoredAction): boolean =>
  action.actionType === "provider.generate" &&
  actionCorrelation(action)?.kind === "curiosity.child.run";

const recoverableResearchActionTypes = new Set([
  "fetch.web",
  "search.web",
  "workspace.glob",
  "workspace.list",
  "workspace.read",
  "workspace.search",
]);

const isRecoverableResearchFailure = (action: StoredAction): boolean => {
  const correlation = actionCorrelation(action);
  return (
    correlation?.kind === "curiosity.chat.tool" &&
    correlation.agentId === "researcher" &&
    correlation.recoverableResearchFailures === true &&
    recoverableResearchActionTypes.has(action.actionType)
  );
};

const concurrentExternalActionTypes = new Set([
  "fetch.web",
  "git.diff",
  "git.ref.inspect",
  "git.ref.update",
  "git.status",
  "git.worktree.create",
  "git.worktree.inspect",
  "git.worktree.remove",
  "process.run",
  "provider.generate",
  "question.ask",
  "search.web",
  "workspace.delete",
  "workspace.glob",
  "workspace.list",
  "workspace.patch",
  "workspace.read",
  "workspace.search",
  "workspace.write",
]);

const maximumParallelResearchReads = 4;
const parallelResearchReadTypes = new Set(["fetch.web", "search.web"]);

const parallelResearchCorrelation = (
  actionType: string,
  input: unknown,
): Record<string, unknown> | undefined => {
  if (
    !parallelResearchReadTypes.has(actionType) ||
    !input ||
    typeof input !== "object" ||
    Array.isArray(input)
  )
    return undefined;
  const correlation = (input as Record<string, unknown>).correlation;
  const record =
    correlation && typeof correlation === "object" && !Array.isArray(correlation)
      ? (correlation as Record<string, unknown>)
      : undefined;
  return record?.kind === "curiosity.chat.tool" &&
    record.agentId === "researcher" &&
    typeof record.providerActionId === "string"
    ? record
    : undefined;
};

const parallelResearchBatchKey = (action: StoredAction): string | undefined => {
  const correlation = parallelResearchCorrelation(
    action.actionType,
    action.input,
  );
  return correlation?.providerActionId as string | undefined;
};

const actionRecord = (
  event: StoredEvent,
  reactor: ReturnType<StaticPluginCatalog["reactorsFor"]>[number],
  ordinal: number,
  proposal: ReturnType<typeof validateReactionProposal>["actions"][number],
) => {
  const inputDigest = digest(proposal.input);
  const actionId = digest({
    inputDigest,
    ordinal,
    reactorId: reactor.contributionId,
    reactorVersion: reactor.contributionVersion,
    sourceEventId: event.eventId,
    type: proposal.actionType,
    version: proposal.actionSchemaVersion,
  });
  const executionId = parallelResearchCorrelation(
    proposal.actionType,
    proposal.input,
  )
    ? `research-tool:${actionId}`
    : proposal.subject.executionId;
  return {
    actionId,
    actionSchemaVersion: proposal.actionSchemaVersion,
    actionType: proposal.actionType,
    deadlineClass: proposal.deadlineClass,
    executionId,
    gateClass: proposal.gateClass,
    input: proposal.input,
    inputDigest,
    pluginId: reactor.pluginId,
    reactorId: reactor.contributionId,
    requestedCapabilities: proposal.requestedCapabilities,
    resource: proposal.subject.resource,
    sourceEventId: event.eventId,
  };
};

const actionProposedEvent = (
  action: ReturnType<typeof actionRecord>,
): ProposedEvent => ({
  body: {
    actionId: action.actionId,
    actionSchemaVersion: action.actionSchemaVersion,
    actionType: action.actionType,
    deadlineClass: action.deadlineClass,
    executionId: action.executionId,
    gateClass: action.gateClass,
    inputDigest: action.inputDigest,
    requestedCapabilities: action.requestedCapabilities,
    resource: action.resource,
    schemaVersion: 1,
    sourceEventId: action.sourceEventId,
  },
  streamId: action.actionId,
  type: "action.proposed",
});

export class ReactionEngine {
  private readonly children: ChildScheduler;
  private readonly localActions: LocalActionGateway;
  private readonly wakeWaiters = new Set<() => void>();
  private wakeRevision = 0;

  constructor(
    private readonly journal: EventJournal,
    private readonly catalog: StaticPluginCatalog,
    private readonly providers: ProviderGateway,
    private readonly tools: ToolGateway,
    private readonly now: () => number,
    private readonly grantedCapabilities: ReadonlySet<string>,
    private readonly eligibleActorId: string,
    private readonly rolePolicy: RolePolicyConfig,
  ) {
    this.localActions = new LocalActionGateway(
      journal,
      catalog,
      now,
      rolePolicy,
      grantedCapabilities,
    );
    this.children = new ChildScheduler(
      journal.actions,
      journal.delegations,
      catalog,
      now,
      grantedCapabilities,
      rolePolicy,
    );
  }

  notifyAdmission(): void {
    this.wakeRevision += 1;
    for (const wake of this.wakeWaiters) wake();
    this.wakeWaiters.clear();
  }

  private admissionWait(revision: number): {
    readonly cancel: () => void;
    readonly promise: Promise<void>;
  } {
    if (this.wakeRevision !== revision)
      return { cancel: () => undefined, promise: Promise.resolve() };
    let wake!: () => void;
    const promise = new Promise<void>((resolve) => {
      wake = resolve;
      this.wakeWaiters.add(wake);
    });
    return {
      cancel: () => this.wakeWaiters.delete(wake),
      promise,
    };
  }

  private processReactions = Effect.fn("ReactionEngine.processReactions")(
    function* (this: ReactionEngine) {
      let processed = 0;
      const events = this.journal.readEvents();
      for (const event of events) {
        for (const reactor of this.catalog.reactorsFor(event.type)) {
          const claimed = this.journal.actions.beginReaction({
            pluginId: reactor.pluginId,
            reactorId: reactor.contributionId,
            reactorVersion: reactor.contributionVersion,
            sourceEventId: event.eventId,
            startedAt: new Date(this.now()).toISOString(),
          });
          if (claimed === "completed") continue;
          const proposal = yield* reactor.react(event, { events }).pipe(
            Effect.mapError(
              () =>
                new PluginFailure({
                  message: "PLUGIN_REACTION_FAILED",
                  pluginId: reactor.pluginId,
                }),
            ),
            Effect.flatMap((value) =>
              Effect.try({
                try: () => validateReactionProposal(value),
                catch: () =>
                  new PluginFailure({
                    message: "PLUGIN_REACTION_OUTPUT_INVALID",
                    pluginId: reactor.pluginId,
                  }),
              }),
            ),
          );
          const actions = proposal.actions.map((action, ordinal) =>
            actionRecord(event, reactor, ordinal, action),
          );
          const proposedEvents = actions.map(actionProposedEvent);
          const output = {
            actions,
            events: [...proposal.events, ...proposedEvents],
          };
          const reactionKey = digest({
            reactorId: reactor.contributionId,
            reactorVersion: reactor.contributionVersion,
            sourceEventId: event.eventId,
          });
          const acceptedAtMs = this.now();
          this.journal.actions.completeReaction({
            acceptedAt: new Date(acceptedAtMs).toISOString(),
            actions,
            events: output.events,
            gateEligibleActorId: this.eligibleActorId,
            gateExpiresAt: new Date(
              acceptedAtMs + 24 * 60 * 60 * 1_000,
            ).toISOString(),
            outputDigest: digest(output),
            pluginId: reactor.pluginId,
            reactionId: `reaction:${reactionKey}`,
            reactorId: reactor.contributionId,
            reactorVersion: reactor.contributionVersion,
            sourceEventId: event.eventId,
          });
          processed += 1;
        }
      }
      return processed;
    },
  );

  private executeAction = Effect.fn("ReactionEngine.executeAction")(function* (
    this: ReactionEngine,
    action: StoredAction,
    onDelta?: (delta: ActionStreamDelta) => void,
  ) {
    if (
      action.requestedCapabilities.some(
        (capability) => !this.grantedCapabilities.has(capability),
      )
    ) {
      const completedAt = new Date(this.now()).toISOString();
      const event = {
        body: {
          actionId: action.actionId,
          actionType: action.actionType,
          errorCode: "CAPABILITY_DENIED",
          schemaVersion: 1,
        },
        streamId: action.actionId,
        type: "action.failed",
      };
      this.journal.actions.completeAction({
        actionId: action.actionId,
        completedAt,
        errorCode: "CAPABILITY_DENIED",
        event,
        outputDigest: digest(event),
        status: "failed",
      });
      return yield* new ActionExecutionFailure({
        actionId: action.actionId,
        actionType: action.actionType,
        message: "CAPABILITY_DENIED",
        modelId: "",
      });
    }
    if (action.actionType === "provider.generate")
      return yield* this.providers.execute(action, onDelta);
    if (action.actionType === "agent.delegate")
      return yield* this.children.execute(action);
    if (
      [
        "fetch.web",
        "git.diff",
        "git.ref.inspect",
        "git.ref.update",
        "git.status",
        "git.worktree.create",
        "git.worktree.inspect",
        "git.worktree.remove",
        "process.run",
        "question.ask",
        "search.web",
        "workspace.glob",
        "workspace.list",
        "workspace.read",
        "workspace.search",
        "workspace.write",
        "workspace.patch",
        "workspace.delete",
      ].includes(action.actionType)
    )
      return yield* this.tools.execute(action);
    if (this.localActions.supports(action.actionType))
      return yield* this.localActions.execute(action);
    const completedAt = new Date(this.now()).toISOString();
    const event = {
      body: {
        actionId: action.actionId,
        actionType: action.actionType,
        errorCode: "ACTION_TYPE_UNAVAILABLE",
        schemaVersion: 1,
      },
      streamId: action.actionId,
      type: "action.failed",
    };
    this.journal.actions.completeAction({
      actionId: action.actionId,
      completedAt,
      errorCode: "ACTION_TYPE_UNAVAILABLE",
      event,
      outputDigest: digest(event),
      status: "failed",
    });
    return yield* new ActionExecutionFailure({
      actionId: action.actionId,
      actionType: action.actionType,
      message: "ACTION_TYPE_UNAVAILABLE",
      modelId: "",
    });
  });

  private executeChildProviderBatch = Effect.fn(
    "ReactionEngine.executeChildProviderBatch",
  )(function* (
    this: ReactionEngine,
    actions: readonly StoredAction[],
  ) {
    const prepared = [];
    const failures: ActionExecutionFailure[] = [];
    for (const action of actions) {
      const result = yield* this.providers.prepare(action).pipe(Effect.result);
      if (result._tag === "Failure") failures.push(result.failure);
      else prepared.push(result.success);
    }
    if (prepared.length === 0) return failures;
    const results = yield* Effect.all(
      prepared.map((call) =>
        this.providers.dispatch(call).pipe(Effect.result),
      ),
      { concurrency: this.rolePolicy.maximumConcurrentChildren },
    );
    for (const result of results)
      if (result._tag === "Failure") failures.push(result.failure);
    return failures;
  });

  drain = Effect.fn("ReactionEngine.drain")(function* (
    this: ReactionEngine,
    onDelta?: (delta: ActionStreamDelta) => void,
    failureExecutionId?: string,
  ) {
    yield* this.providers.reconcileInterrupted();
    yield* this.tools.reconcileInterrupted();
    let firstFailure: ActionExecutionFailure | undefined;
    const capturesFailure = (action: StoredAction): boolean =>
      !failureExecutionId ||
      this.journal.attempts.isExecutionInTree(
        failureExecutionId,
        action.executionId,
      );
    const interruptedActionIds = new Set<string>();
    const activeExternal: Array<{
      readonly action?: StoredAction;
      readonly actionIds: readonly string[];
      readonly executionIds: readonly string[];
      readonly fiber: Fiber.Fiber<
        | Result.Result<unknown, ActionExecutionFailure>
        | readonly ActionExecutionFailure[],
        never
      >;
    }> = [];
    let steps = 0;
    while (steps < maximumDrainSteps) {
      for (let index = activeExternal.length - 1; index >= 0; index -= 1) {
        const active = activeExternal[index]!;
        if (!active.fiber.pollUnsafe()) continue;
        const result = yield* Fiber.join(active.fiber);
        activeExternal.splice(index, 1);
        if (Result.isResult(result)) {
          if (
            Result.isFailure(result) &&
            !firstFailure &&
            active.action &&
            capturesFailure(active.action) &&
            active.action.actionType !== "provider.generate" &&
            actionCorrelation(active.action)?.kind !== "curiosity.child.run" &&
            !isRecoverableResearchFailure(active.action)
          )
            firstFailure = result.failure;
        } else {
          for (const failure of result)
            if (
              this.journal.actions.action(failure.actionId)?.status ===
              "proposed"
            ) {
              interruptedActionIds.add(failure.actionId);
              const action = this.journal.actions.action(failure.actionId);
              if (action && capturesFailure(action)) firstFailure ??= failure;
            }
        }
      }
      const cycleWakeRevision = this.wakeRevision;
      const reconciledChildren = yield* this.children.reconcile();
      const reactions = yield* this.processReactions();
      steps += reconciledChildren + reactions;
      const activeActionIds = new Set(
        activeExternal.flatMap(({ actionIds }) => actionIds),
      );
      const activeExecutionIds = new Set(
        activeExternal.flatMap(({ executionIds }) => executionIds),
      );
      const activeResearchBatches = new Map<string, number>();
      for (const active of activeExternal) {
        if (!active.action) continue;
        const key = parallelResearchBatchKey(active.action);
        if (key)
          activeResearchBatches.set(
            key,
            (activeResearchBatches.get(key) ?? 0) + 1,
          );
      }
      const dispatchableActions = this.journal.actions
        .proposedActions()
        .filter((action) => !activeActionIds.has(action.actionId))
        .filter((action) => !interruptedActionIds.has(action.actionId))
        .filter((action) => !activeExecutionIds.has(action.executionId))
        .filter((action) =>
          this.journal.attempts.isActionDispatchReady(
            action,
            new Date(this.now()).toISOString(),
          ),
        );
      const nonChildActions = dispatchableActions.filter(
        (action) => !isChildProviderAction(action),
      );
      const concurrentCandidates = nonChildActions.filter((action) =>
        concurrentExternalActionTypes.has(action.actionType),
      );
      const serialActions = nonChildActions.filter(
        (action) => !concurrentExternalActionTypes.has(action.actionType),
      );
      const selectedExecutionIds = new Set<string>();
      const selectedResearchBatches = new Map(activeResearchBatches);
      const concurrentActions = concurrentCandidates.filter((action) => {
        const batchKey = parallelResearchBatchKey(action);
        if (
          batchKey &&
          (selectedResearchBatches.get(batchKey) ?? 0) >=
            maximumParallelResearchReads
        )
          return false;
        if (selectedExecutionIds.has(action.executionId)) return false;
        selectedExecutionIds.add(action.executionId);
        if (batchKey)
          selectedResearchBatches.set(
            batchKey,
            (selectedResearchBatches.get(batchKey) ?? 0) + 1,
          );
        return true;
      });
      const childProviderActions = dispatchableActions
        .filter(isChildProviderAction)
        .filter((action) => {
          if (selectedExecutionIds.has(action.executionId)) return false;
          selectedExecutionIds.add(action.executionId);
          return true;
        });
      const selectedActionCount =
        serialActions.length +
        concurrentActions.length +
        childProviderActions.length;
      for (const action of serialActions) {
        const result = yield* this.executeAction(action, onDelta).pipe(
          Effect.result,
        );
        if (
          result._tag === "Failure" &&
          !firstFailure &&
          capturesFailure(action) &&
          actionCorrelation(action)?.kind !== "curiosity.child.run" &&
          !isRecoverableResearchFailure(action)
        )
          firstFailure = result.failure;
        if (
          result._tag === "Failure" &&
          this.journal.actions.action(action.actionId)?.status === "proposed"
        )
          interruptedActionIds.add(action.actionId);
        steps += 1;
      }
      for (const action of concurrentActions) {
        activeExternal.push({
          action,
          actionIds: [action.actionId],
          executionIds: [action.executionId],
          fiber: yield* this.executeAction(action, onDelta).pipe(
            Effect.result,
            Effect.forkChild,
          ),
        });
        steps += 1;
      }
      if (childProviderActions.length > 0) {
        const failures = yield* this.executeChildProviderBatch(
          childProviderActions,
        );
        for (const failure of failures)
          if (
            this.journal.actions.action(failure.actionId)?.status === "proposed"
          ) {
            interruptedActionIds.add(failure.actionId);
            const action = this.journal.actions.action(failure.actionId);
            if (action && capturesFailure(action)) firstFailure ??= failure;
          }
        steps += childProviderActions.length;
      }
      if (
        reconciledChildren === 0 &&
        reactions === 0 &&
        selectedActionCount === 0
      ) {
        if (activeExternal.length === 0) {
          if (firstFailure) return yield* firstFailure;
          return;
        }
        const active = activeExternal[0]!;
        const admission = this.admissionWait(cycleWakeRevision);
        const settled = yield* Effect.race(
          Fiber.join(active.fiber).pipe(
            Effect.map((result) => ({ result, type: "settled" as const })),
          ),
          Effect.promise(() => admission.promise).pipe(
            Effect.map(() => ({ type: "admitted" as const })),
          ),
        );
        admission.cancel();
        if (settled.type === "admitted") continue;
        activeExternal.shift();
        const { result } = settled;
        if (
          Result.isResult(result) &&
          Result.isFailure(result) &&
          !firstFailure &&
          active.action &&
          capturesFailure(active.action) &&
          active.action.actionType !== "provider.generate" &&
          actionCorrelation(active.action)?.kind !== "curiosity.child.run" &&
          !isRecoverableResearchFailure(active.action)
        )
          firstFailure = result.failure;
        if (!Result.isResult(result))
          for (const failure of result)
            if (
              this.journal.actions.action(failure.actionId)?.status ===
              "proposed"
            ) {
              interruptedActionIds.add(failure.actionId);
              const action = this.journal.actions.action(failure.actionId);
              if (action && capturesFailure(action)) firstFailure ??= failure;
            }
      }
    }
    return yield* new PluginFailure({
      message: "REACTION_DRAIN_LIMIT_EXCEEDED",
      pluginId: "curiosity.kernel.reactions",
    });
  });
}
