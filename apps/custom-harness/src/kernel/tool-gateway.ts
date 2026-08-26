import { createHash } from "node:crypto";
import { Effect } from "effect";
import type { StoredAction } from "../domain/action.js";
import type {
  AllocatedToolAttempt,
  ToolAttemptSnapshot,
} from "../domain/attempt.js";
import { ActionJournal } from "../storage/action-journal.js";
import { AttemptJournal } from "../storage/attempt-journal.js";
import type { SupervisorClient } from "../supervisor/client.js";
import { canonicalJson } from "./canonical-json.js";
import { ActionExecutionFailure } from "./errors.js";
import type { StaticPluginCatalog } from "./plugin.js";

interface WorkspaceActionInput {
  readonly correlation: Record<string, unknown>;
  readonly request: Record<string, unknown>;
  readonly toolCallId: string;
  readonly toolName: string;
  readonly toolVersion: string;
}

const digest = (value: unknown): string =>
  createHash("sha256").update(canonicalJson(value)).digest("hex");

const record = (value: unknown): Record<string, unknown> | undefined =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;

const parseInput = (value: unknown): WorkspaceActionInput => {
  const input = record(value);
  if (Object.keys(input ?? {}).sort().join(",") !== "correlation,request")
    throw new Error("WORKSPACE_ACTION_INPUT_INVALID");
  const correlation = record(input?.correlation);
  const request = record(input?.request);
  if (
    !correlation ||
    !request ||
    typeof correlation.toolCallId !== "string" ||
    !correlation.toolCallId ||
    typeof correlation.toolName !== "string" ||
    typeof correlation.toolVersion !== "string"
  )
    throw new Error("WORKSPACE_ACTION_INPUT_INVALID");
  return {
    correlation,
    request,
    toolCallId: correlation.toolCallId,
    toolName: correlation.toolName,
    toolVersion: correlation.toolVersion,
  };
};

const stableToolError = (cause: unknown): string => {
  const message = cause instanceof Error ? cause.message : "";
  return /^(?:SUPERVISOR|WORKSPACE)_[A-Z0-9_]+$/u.test(message)
    ? message
    : "WORKSPACE_TOOL_FAILED";
};

export class ToolGateway {
  constructor(
    private readonly actions: ActionJournal,
    private readonly attempts: AttemptJournal,
    private readonly catalog: StaticPluginCatalog,
    private readonly supervisor: SupervisorClient,
    private readonly now: () => number,
    private readonly grantedCapabilities: ReadonlySet<string>,
  ) {}

  private failProposedAction(
    action: StoredAction,
    correlation: unknown,
    errorCode: string,
  ): ActionExecutionFailure {
    const completedAt = new Date(this.now()).toISOString();
    const event = {
      body: {
        actionId: action.actionId,
        actionType: action.actionType,
        correlation,
        errorCode,
        schemaVersion: 1,
      },
      streamId: action.actionId,
      type: "action.failed",
    };
    this.actions.completeAction({
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

  reconcileInterrupted = Effect.fn("ToolGateway.reconcileInterrupted")(
    function* (this: ToolGateway) {
      for (const action of this.attempts.interruptedToolCalls()) {
        let correlation: unknown = null;
        try {
          correlation = parseInput(action.input).correlation;
        } catch {
          // Corrupt input remains attributable to the allocated action.
        }
        const dispatched = action.dispatchState === "dispatched";
        const errorCode = dispatched
          ? "WORKSPACE_DELIVERY_UNKNOWN"
          : "WORKSPACE_NOT_DISPATCHED";
        const completedAt = new Date(this.now()).toISOString();
        const event = {
          body: {
            actionId: action.actionId,
            actionType: action.actionType,
            correlation,
            errorCode,
            schemaVersion: 1,
          },
          streamId: action.actionId,
          type: "action.failed",
        };
        this.attempts.completeToolCall({
          actionId: action.actionId,
          attemptId: action.attemptId,
          callId: action.callId,
          completedAt,
          errorCode,
          event,
          generation: action.generation,
          outputDigest: digest(event),
          status: dispatched ? "delivery-unknown" : "failed",
        });
      }
    },
  );

  private complete(input: {
    readonly action: StoredAction;
    readonly allocation: AllocatedToolAttempt;
    readonly completedAt: string;
    readonly errorCode?: string;
    readonly event: {
      readonly body: unknown;
      readonly streamId: string;
      readonly type: string;
    };
    readonly status: "failed" | "succeeded";
  }) {
    return this.attempts.completeToolCall({
      actionId: input.action.actionId,
      attemptId: input.allocation.attemptId,
      callId: input.allocation.callId,
      completedAt: input.completedAt,
      ...(input.errorCode ? { errorCode: input.errorCode } : {}),
      event: input.event,
      generation: input.allocation.generation,
      outputDigest: digest(input.event),
      status: input.status,
    });
  }

  execute = Effect.fn("ToolGateway.execute")(function* (
    this: ToolGateway,
    action: StoredAction,
  ) {
    let input: WorkspaceActionInput;
    try {
      input = parseInput(action.input);
    } catch {
      return yield* this.failProposedAction(
        action,
        null,
        "WORKSPACE_ACTION_INPUT_INVALID",
      );
    }
    const tool = this.catalog.tool(input.toolName);
    if (
      !tool ||
      tool.version !== input.toolVersion ||
      tool.actionType !== action.actionType ||
      !tool.readOnly
    )
      return yield* this.failProposedAction(
        action,
        input.correlation,
        "WORKSPACE_TOOL_SNAPSHOT_INVALID",
      );
    const proposed = yield* tool
      .propose(input.request, {
        executionId: action.executionId,
        resource: action.resource,
      })
      .pipe(Effect.result);
    if (
      proposed._tag === "Failure" ||
      proposed.success.actionType !== action.actionType ||
      canonicalJson(proposed.success.requestedCapabilities) !==
        canonicalJson(action.requestedCapabilities)
    )
      return yield* this.failProposedAction(
        action,
        input.correlation,
        "WORKSPACE_TOOL_PROPOSAL_INVALID",
      );

    const requestDigest = digest({
      request: input.request,
      toolName: tool.name,
      toolVersion: tool.version,
    });
    const toolIdentity = {
      description: tool.description,
      inputSchema: tool.inputSchema,
      name: tool.name,
      outputProvenance: tool.outputProvenance,
      pluginId: tool.pluginId,
      pluginVersion: tool.pluginVersion,
      readOnly: tool.readOnly,
      requestedCapabilities: [...tool.requestedCapabilities].sort(),
      version: tool.version,
    };
    const generation = this.attempts.nextGeneration(action.executionId);
    const snapshot: ToolAttemptSnapshot = {
      action: {
        actionId: action.actionId,
        actionType: action.actionType,
        deadlineClass: action.deadlineClass,
        gateClass: action.gateClass,
        inputDigest: action.inputDigest,
        requestedCapabilities: [...action.requestedCapabilities].sort(),
        resource: action.resource,
      },
      catalogDigest: this.catalog.catalogDigest,
      generation,
      grantedCapabilities: [...this.grantedCapabilities].sort(),
      policyVersion: "local-v1",
      requestDigest,
      schemaVersion: 1,
      tool: {
        digest: digest(toolIdentity),
        name: tool.name,
        pluginId: tool.pluginId,
        pluginVersion: tool.pluginVersion,
        version: tool.version,
      },
    };
    const snapshotDigest = digest(snapshot);
    const attemptId = digest({
      actionId: action.actionId,
      generation,
      snapshotDigest,
      type: "tool-attempt",
    });
    const callId = digest({ attemptId, requestDigest, type: "tool-call" });
    const allocatedAtMs = this.now();
    const allocatedAt = new Date(allocatedAtMs).toISOString();
    const allocation = this.attempts.allocateToolAttempt({
      action,
      allocatedAt,
      attemptId,
      callId,
      generation,
      leaseExpiresAt: new Date(allocatedAtMs + 30_000).toISOString(),
      modelToolCallId: input.toolCallId,
      ownerId: "curiosity-kernel",
      requestDigest,
      snapshot,
      snapshotDigest,
      toolName: tool.name,
      toolVersion: tool.version,
    });
    if (!allocation)
      return yield* new ActionExecutionFailure({
        actionId: action.actionId,
        actionType: action.actionType,
        message: "ATTEMPT_AUTHORIZATION_DENIED",
        modelId: "",
      });
    const dispatchAt = new Date(this.now()).toISOString();
    if (
      this.attempts.authorizeToolDispatch({
        actionId: action.actionId,
        attemptId,
        callId,
        generation,
        now: dispatchAt,
        requestDigest,
      }) !== "authorized"
    ) {
      const errorCode = "ATTEMPT_DISPATCH_DENIED";
      const event = {
        body: {
          actionId: action.actionId,
          actionType: action.actionType,
          correlation: input.correlation,
          errorCode,
          schemaVersion: 1,
        },
        streamId: action.actionId,
        type: "action.failed",
      };
      this.complete({
        action,
        allocation,
        completedAt: dispatchAt,
        errorCode,
        event,
        status: "failed",
      });
      return yield* new ActionExecutionFailure({
        actionId: action.actionId,
        actionType: action.actionType,
        message: errorCode,
        modelId: "",
      });
    }

    const result = yield* Effect.tryPromise({
      try: () =>
        action.actionType === "workspace.read"
          ? this.supervisor.workspaceRead(callId, {
              maxLines: input.request.maxLines as number,
              path: input.request.path as string,
              startLine: input.request.startLine as number,
            })
          : this.supervisor.workspaceSearch(callId, {
              maxResults: input.request.maxResults as number,
              query: input.request.query as string,
            }),
      catch: (cause) => stableToolError(cause),
    }).pipe(Effect.result);
    const completedAt = new Date(this.now()).toISOString();
    if (result._tag === "Failure") {
      const errorCode = result.failure;
      const event = {
        body: {
          actionId: action.actionId,
          actionType: action.actionType,
          correlation: input.correlation,
          errorCode,
          schemaVersion: 1,
        },
        streamId: action.actionId,
        type: "action.failed",
      };
      this.complete({
        action,
        allocation,
        completedAt,
        errorCode,
        event,
        status: "failed",
      });
      return yield* new ActionExecutionFailure({
        actionId: action.actionId,
        actionType: action.actionType,
        message: errorCode,
        modelId: "",
      });
    }
    if (Buffer.byteLength(canonicalJson(result.success)) > 48 * 1_024) {
      const errorCode = "WORKSPACE_TOOL_OUTPUT_TOO_LARGE";
      const event = {
        body: {
          actionId: action.actionId,
          actionType: action.actionType,
          correlation: input.correlation,
          errorCode,
          schemaVersion: 1,
        },
        streamId: action.actionId,
        type: "action.failed",
      };
      this.complete({
        action,
        allocation,
        completedAt,
        errorCode,
        event,
        status: "failed",
      });
      return yield* new ActionExecutionFailure({
        actionId: action.actionId,
        actionType: action.actionType,
        message: errorCode,
        modelId: "",
      });
    }
    const event = {
      body: {
        actionId: action.actionId,
        actionType: action.actionType,
        correlation: input.correlation,
        output: result.success,
        schemaVersion: 1,
        toolName: tool.name,
        toolVersion: tool.version,
      },
      streamId: action.actionId,
      type: "action.succeeded",
    };
    if (
      this.complete({
        action,
        allocation,
        completedAt,
        event,
        status: "succeeded",
      }) === "stale"
    )
      return yield* new ActionExecutionFailure({
        actionId: action.actionId,
        actionType: action.actionType,
        message: "WORKSPACE_RECEIPT_STALE",
        modelId: "",
      });
  });
}
