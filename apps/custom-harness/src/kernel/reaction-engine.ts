import { createHash } from "node:crypto";
import { Effect } from "effect";
import type { StoredAction } from "../domain/action.js";
import type { ProposedEvent, StoredEvent } from "../domain/event.js";
import type { EventJournal } from "../storage/event-journal.js";
import { validateReactionProposal } from "./action-proposal.js";
import { canonicalJson } from "./canonical-json.js";
import { ActionExecutionFailure, PluginFailure } from "./errors.js";
import type { StaticPluginCatalog } from "./plugin.js";
import { ProviderGateway, type ActionStreamDelta } from "./provider-gateway.js";
import { ToolGateway } from "./tool-gateway.js";

const maximumDrainSteps = 1_024;

const digest = (value: unknown): string =>
  createHash("sha256").update(canonicalJson(value)).digest("hex");

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
  constructor(
    private readonly journal: EventJournal,
    private readonly catalog: StaticPluginCatalog,
    private readonly providers: ProviderGateway,
    private readonly tools: ToolGateway,
    private readonly now: () => number,
    private readonly grantedCapabilities: ReadonlySet<string>,
    private readonly eligibleActorId: string,
  ) {}

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
    if (["workspace.read", "workspace.search"].includes(action.actionType))
      return yield* this.tools.execute(action);
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

  drain = Effect.fn("ReactionEngine.drain")(function* (
    this: ReactionEngine,
    onDelta?: (delta: ActionStreamDelta) => void,
  ) {
    yield* this.providers.reconcileInterrupted();
    yield* this.tools.reconcileInterrupted();
    let firstFailure: ActionExecutionFailure | undefined;
    let steps = 0;
    while (steps < maximumDrainSteps) {
      const reactions = yield* this.processReactions();
      steps += reactions;
      const actions = this.journal.actions
        .proposedActions()
        .filter((action) =>
          this.journal.attempts.isActionDispatchReady(
            action,
            new Date(this.now()).toISOString(),
          ),
        );
      for (const action of actions) {
        const result = yield* this.executeAction(action, onDelta).pipe(
          Effect.result,
        );
        if (result._tag === "Failure" && !firstFailure)
          firstFailure = result.failure;
        steps += 1;
      }
      if (reactions === 0 && actions.length === 0) {
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
