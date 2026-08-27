import { createHash } from "node:crypto";
import { Effect } from "effect";
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
  return {
    actionId,
    actionSchemaVersion: proposal.actionSchemaVersion,
    actionType: proposal.actionType,
    deadlineClass: proposal.deadlineClass,
    executionId: proposal.subject.executionId,
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

  constructor(
    private readonly journal: EventJournal,
    private readonly catalog: StaticPluginCatalog,
    private readonly providers: ProviderGateway,
    private readonly tools: ToolGateway,
    private readonly now: () => number,
    private readonly grantedCapabilities: ReadonlySet<string>,
    private readonly eligibleActorId: string,
    rolePolicy: RolePolicyConfig,
  ) {
    this.localActions = new LocalActionGateway(journal, catalog, now, rolePolicy);
    this.children = new ChildScheduler(
      journal.actions,
      journal.delegations,
      catalog,
      now,
      grantedCapabilities,
      rolePolicy,
    );
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
      { concurrency: "unbounded" },
    );
    for (const result of results)
      if (result._tag === "Failure") failures.push(result.failure);
    return failures;
  });

  drain = Effect.fn("ReactionEngine.drain")(function* (
    this: ReactionEngine,
    onDelta?: (delta: ActionStreamDelta) => void,
  ) {
    yield* this.providers.reconcileInterrupted();
    yield* this.tools.reconcileInterrupted();
    let firstFailure: ActionExecutionFailure | undefined;
    let steps = 0;
    while (steps < maximumDrainSteps) {
      const reconciledChildren = yield* this.children.reconcile();
      const reactions = yield* this.processReactions();
      steps += reconciledChildren + reactions;
      const actions = this.journal.actions
        .proposedActions()
        .filter((action) =>
          this.journal.attempts.isActionDispatchReady(
            action,
            new Date(this.now()).toISOString(),
          ),
        );
      const childProviderActions = actions.filter(isChildProviderAction);
      const serialActions = actions.filter(
        (action) => !isChildProviderAction(action),
      );
      for (const action of serialActions) {
        const result = yield* this.executeAction(action, onDelta).pipe(
          Effect.result,
        );
        if (
          result._tag === "Failure" &&
          !firstFailure &&
          actionCorrelation(action)?.kind !== "curiosity.child.run" &&
          !isRecoverableResearchFailure(action)
        )
          firstFailure = result.failure;
        steps += 1;
      }
      if (childProviderActions.length > 0) {
        yield* this.executeChildProviderBatch(childProviderActions);
        steps += childProviderActions.length;
      }
      if (
        reconciledChildren === 0 &&
        reactions === 0 &&
        actions.length === 0
      ) {
        if (firstFailure) return yield* firstFailure;
        return;
      }
    }
    return yield* new PluginFailure({
      message: "REACTION_DRAIN_LIMIT_EXCEEDED",
      pluginId: "curiosity.kernel.reactions",
    });
  });
}
