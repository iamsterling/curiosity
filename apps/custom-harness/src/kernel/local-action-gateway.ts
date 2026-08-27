import { createHash } from "node:crypto";
import { Effect } from "effect";
import type { StoredAction } from "../domain/action.js";
import type { ProposedEvent } from "../domain/event.js";
import type { EventJournal } from "../storage/event-journal.js";
import { canonicalJson } from "./canonical-json.js";
import { ActionExecutionFailure } from "./errors.js";
import type { StaticPluginCatalog } from "./plugin.js";
import {
  enabledRoleIds,
  type RolePolicyConfig,
} from "./role-policy.js";

const record = (value: unknown): Record<string, unknown> => {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("LOCAL_ACTION_INPUT_INVALID");
  return value as Record<string, unknown>;
};

const digest = (value: unknown): string =>
  createHash("sha256").update(canonicalJson(value)).digest("hex");

export class LocalActionGateway {
  constructor(
    private readonly journal: EventJournal,
    private readonly catalog: StaticPluginCatalog,
    private readonly now: () => number,
    private readonly rolePolicy: RolePolicyConfig,
    private readonly grantedCapabilities: ReadonlySet<string>,
  ) {}

  supports(actionType: string): boolean {
    return [
      "diagnostic.report",
      "semantic.command",
      "workflow.cancel",
      "workflow.status",
    ].includes(actionType);
  }

  private fail(
    action: StoredAction,
    errorCode: string,
  ): ActionExecutionFailure {
    const completedAt = new Date(this.now()).toISOString();
    const event = {
      body: {
        actionId: action.actionId,
        actionType: action.actionType,
        errorCode,
        schemaVersion: 1,
      },
      streamId: action.actionId,
      type: "action.failed",
    };
    this.journal.actions.completeAction({
      actionId: action.actionId,
      completedAt,
      errorCode,
      event,
      outputDigest: digest(event),
      status: "failed",
    });
    return new ActionExecutionFailure({
      actionId: action.actionId,
      actionType: action.actionType,
      message: errorCode,
      modelId: "",
    });
  }

  private succeed(
    action: StoredAction,
    correlation: unknown,
    output: unknown,
    additionalEvents: readonly ProposedEvent[] = [],
  ): void {
    const completedAt = new Date(this.now()).toISOString();
    const event = {
      body: {
        actionId: action.actionId,
        actionType: action.actionType,
        correlation,
        output,
        schemaVersion: 1,
      },
      streamId: action.actionId,
      type: "action.succeeded",
    };
    this.journal.actions.completeAction({
      actionId: action.actionId,
      additionalEvents,
      completedAt,
      event,
      outputDigest: digest({ additionalEvents, event }),
      status: "succeeded",
    });
  }

  execute = Effect.fn("LocalActionGateway.execute")(function* (
    this: LocalActionGateway,
    action: StoredAction,
  ) {
    let envelope: Record<string, unknown>;
    let request: Record<string, unknown>;
    try {
      envelope = record(action.input);
      request = record(envelope.request);
      canonicalJson(envelope.correlation);
    } catch {
      return yield* this.fail(action, "LOCAL_ACTION_INPUT_INVALID");
    }

    if (action.actionType === "diagnostic.report") {
      this.succeed(action, envelope.correlation, request);
      return;
    }
    if (action.actionType === "workflow.status") {
      this.succeed(action, envelope.correlation, {
        instances: this.journal.workflows.instances(),
        schemaVersion: 1,
      });
      return;
    }
    if (action.actionType === "workflow.cancel") {
      if (
        typeof request.executionId !== "string" ||
        request.executionId.length === 0 ||
        request.executionId.length > 128
      )
        return yield* this.fail(action, "WORKFLOW_CANCEL_INPUT_INVALID");
      const acceptedAt = new Date(this.now()).toISOString();
      const event = {
        body: {
          executionId: request.executionId,
          schemaVersion: 1,
        },
        streamId: request.executionId,
        type: "execution.cancelled",
      };
      const cancelled = yield* Effect.try({
        try: () =>
          this.journal.attempts.cancelExecution({
            acceptedAt,
            actorId: "curiosity-kernel",
            commandDigest: digest(event),
            commandId: `workflow-cancel:${action.actionId}`,
            events: [event],
            executionId: request.executionId as string,
            nonce: `workflow-cancel:${action.actionId}`,
            pluginId: "curiosity.kernel.workflows",
          }),
        catch: (cause) =>
          this.fail(
            action,
            cause instanceof Error &&
              ["EXECUTION_NOT_FOUND", "EXECUTION_NOT_CANCELLABLE"].includes(
                cause.message,
              )
              ? cause.message
              : "WORKFLOW_CANCEL_FAILED",
          ),
      }).pipe(Effect.result);
      if (cancelled._tag === "Failure") return yield* cancelled.failure;
      this.succeed(action, envelope.correlation, {
        executionId: request.executionId,
        status: "cancelled",
      });
      return;
    }

    const kind = request.kind;
    if (typeof kind !== "string" || !("payload" in request))
      return yield* this.fail(action, "SEMANTIC_COMMAND_INPUT_INVALID");
    const owner = this.catalog.find(kind);
    if (!owner)
      return yield* this.fail(action, "SEMANTIC_COMMAND_UNAVAILABLE");
    const decided = yield* owner
      .decide(
        {
          id: `action:${action.actionId}`,
          kind,
          payload: request.payload,
          schemaVersion: 1,
        },
        {
          defaultPrimaryRole: this.rolePolicy.defaultPrimaryRole,
          enabledAgentIds: enabledRoleIds(this.rolePolicy),
          enabledPrimaryAgentIds: new Set(
            this.rolePolicy.enabledPrimaryRoles,
          ),
          events: this.journal.readEvents(),
          grantedCapabilities: this.grantedCapabilities,
        },
      )
      .pipe(Effect.result);
    if (decided._tag === "Failure")
      return yield* this.fail(action, decided.failure.message);
    if (decided.success.length === 0)
      return yield* this.fail(action, "SEMANTIC_COMMAND_EVENT_REQUIRED");
    this.succeed(
      action,
      envelope.correlation,
      { commandKind: kind, eventCount: decided.success.length },
      decided.success,
    );
  });
}
