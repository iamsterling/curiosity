import { createHash } from "node:crypto";
import { performance } from "node:perf_hooks";
import { Effect, Schema } from "effect";
import type { StoredAction } from "../domain/action.js";
import type {
  AllocatedProviderAttempt,
  ProviderAttemptSnapshot,
} from "../domain/attempt.js";
import { ActionJournal } from "../storage/action-journal.js";
import { AttemptJournal } from "../storage/attempt-journal.js";
import { canonicalJson } from "./canonical-json.js";
import { ActionExecutionFailure } from "./errors.js";
import { PromptAssembler } from "./prompt-assembler.js";
import type { PromptMessage, TextGenerator } from "./text-generator.js";

export interface ActionStreamDelta {
  readonly actionId: string;
  readonly actionType: string;
  readonly correlation: unknown;
  readonly delta: string;
}

interface ProviderGenerateInput {
  readonly agentId: string;
  readonly correlation: unknown;
  readonly messages: readonly PromptMessage[];
}

class ProviderActionMessage extends Schema.Class<ProviderActionMessage>(
  "@curiosity/custom-harness/ProviderActionMessage",
)({
  content: Schema.NonEmptyString,
  role: Schema.Literals(["user", "assistant"]),
}) {}

class ProviderActionInput extends Schema.Class<ProviderActionInput>(
  "@curiosity/custom-harness/ProviderActionInput",
)({
  agentId: Schema.NonEmptyString,
  correlation: Schema.Unknown,
  messages: Schema.Array(ProviderActionMessage),
}) {}

const decodeInput = Schema.decodeUnknownSync(ProviderActionInput, {
  onExcessProperty: "error",
});

const parseInput = (value: unknown): ProviderGenerateInput => {
  const input = decodeInput(value);
  if (input.messages.length === 0)
    throw new Error("PROVIDER_ACTION_MESSAGES_INVALID");
  canonicalJson(input.correlation);
  return {
    agentId: input.agentId,
    correlation: input.correlation,
    messages: input.messages.map(({ content, role }) => ({ content, role })),
  };
};

export class ProviderGateway {
  readonly #active = new Map<string, AbortController>();

  constructor(
    private readonly actions: ActionJournal,
    private readonly attempts: AttemptJournal,
    private readonly prompts: PromptAssembler,
    private readonly generator: TextGenerator | undefined,
    private readonly now: () => number,
    private readonly grantedCapabilities: ReadonlySet<string>,
  ) {}

  cancelExecution(executionId: string): void {
    this.#active.get(executionId)?.abort("ACTION_CANCELLED");
  }

  cancelGovernedExecutions(): void {
    for (const [executionId, controller] of this.#active)
      if (this.attempts.isExecutionCancelled(executionId))
        controller.abort("ACTION_CANCELLED");
  }

  private failProposedAction(
    action: StoredAction,
    input: {
      readonly correlation: unknown;
      readonly errorCode: string;
      readonly modelId: string;
    },
  ): ActionExecutionFailure {
    const completedAt = new Date(this.now()).toISOString();
    const event = {
      body: {
        actionId: action.actionId,
        actionType: action.actionType,
        correlation: input.correlation,
        errorCode: input.errorCode,
        modelId: input.modelId,
        schemaVersion: 1,
      },
      streamId: action.actionId,
      type: "action.failed",
    };
    this.actions.completeAction({
      actionId: action.actionId,
      completedAt,
      errorCode: input.errorCode,
      event,
      outputDigest: createHash("sha256")
        .update(canonicalJson(event))
        .digest("hex"),
      status: "failed",
    });
    return new ActionExecutionFailure({
      actionId: action.actionId,
      actionType: action.actionType,
      message: input.errorCode,
      modelId: input.modelId,
    });
  }

  reconcileInterrupted = Effect.fn("ProviderGateway.reconcileInterrupted")(
    function* (this: ProviderGateway) {
      for (const action of this.attempts.interruptedProviderCalls()) {
        let correlation: unknown = null;
        try {
          correlation = parseInput(action.input).correlation;
        } catch {
          // Corrupt input remains attributable to the allocated action.
        }
        const completedAt = new Date(this.now()).toISOString();
        const dispatched = action.dispatchState === "dispatched";
        const errorCode = dispatched
          ? "PROVIDER_DELIVERY_UNKNOWN"
          : "PROVIDER_NOT_DISPATCHED";
        const event = {
          body: {
            actionId: action.actionId,
            actionType: action.actionType,
            correlation,
            errorCode,
            modelId: this.generator?.modelId ?? "",
            schemaVersion: 1,
          },
          streamId: action.actionId,
          type: "action.failed",
        };
        this.attempts.completeProviderCall({
          actionId: action.actionId,
          attemptId: action.attemptId,
          callId: action.callId,
          completedAt,
          errorCode,
          event,
          generation: action.generation,
          outputDigest: createHash("sha256")
            .update(canonicalJson(event))
            .digest("hex"),
          status: dispatched ? "delivery-unknown" : "failed",
          usage: {},
          usageState: "UNKNOWN",
        });
      }
    },
  );

  private completeAttempt(input: {
    readonly action: StoredAction;
    readonly allocation: AllocatedProviderAttempt;
    readonly completedAt: string;
    readonly errorCode?: string;
    readonly event: {
      readonly body: unknown;
      readonly streamId: string;
      readonly type: string;
    };
    readonly status: "cancelled" | "failed" | "succeeded";
  }): "committed" | "stale" {
    const outputDigest = createHash("sha256")
      .update(canonicalJson(input.event))
      .digest("hex");
    return this.attempts.completeProviderCall({
      actionId: input.action.actionId,
      attemptId: input.allocation.attemptId,
      callId: input.allocation.callId,
      completedAt: input.completedAt,
      ...(input.errorCode ? { errorCode: input.errorCode } : {}),
      event: input.event,
      generation: input.allocation.generation,
      outputDigest,
      status: input.status,
      usage: {},
      usageState: "UNKNOWN",
    });
  }

  execute = Effect.fn("ProviderGateway.execute")(function* (
    this: ProviderGateway,
    action: StoredAction,
    onDelta?: (delta: ActionStreamDelta) => void,
  ) {
    const parsed = yield* Effect.try({
      try: () => parseInput(action.input),
      catch: () =>
        new ActionExecutionFailure({
          actionId: action.actionId,
          actionType: action.actionType,
          message: "PROVIDER_ACTION_INPUT_INVALID",
          modelId: this.generator?.modelId ?? "",
        }),
    }).pipe(Effect.result);
    if (parsed._tag === "Failure") {
      const failure = this.failProposedAction(action, {
        correlation: null,
        errorCode: parsed.failure.message,
        modelId: parsed.failure.modelId,
      });
      return yield* failure;
    }
    const input = parsed.success;
    const generator = this.generator;
    if (!generator) {
      return yield* this.failProposedAction(action, {
        correlation: input.correlation,
        errorCode: "TEXT_GENERATOR_UNAVAILABLE",
        modelId: "",
      });
    }

    const assembly = yield* this.prompts
      .assemble({
        actionType: action.actionType,
        agentId: input.agentId,
        correlation: input.correlation,
        messages: input.messages,
        sourceEventId: action.sourceEventId,
      })
      .pipe(
        Effect.mapError(
          (error) =>
            new ActionExecutionFailure({
              actionId: action.actionId,
              actionType: action.actionType,
              message: error.message,
              modelId: generator.modelId,
            }),
        ),
        Effect.result,
      );
    if (assembly._tag === "Failure") {
      const failure = this.failProposedAction(action, {
        correlation: input.correlation,
        errorCode: assembly.failure.message,
        modelId: generator.modelId,
      });
      return yield* failure;
    }
    const assembled = assembly.success;

    const requestDigest = createHash("sha256")
      .update(
        canonicalJson({
          effort: generator.effort,
          messages: assembled.messages,
          modelId: generator.modelId,
        }),
      )
      .digest("hex");
    const generation = this.attempts.nextGeneration(action.executionId);
    const grantedCapabilities = [...this.grantedCapabilities].sort();
    const snapshot: ProviderAttemptSnapshot = {
      action: {
        actionId: action.actionId,
        actionType: action.actionType,
        deadlineClass: action.deadlineClass,
        gateClass: action.gateClass,
        inputDigest: action.inputDigest,
        requestedCapabilities: [...action.requestedCapabilities].sort(),
        resource: action.resource,
      },
      catalogDigest: assembled.snapshot.catalogDigest,
      effort: generator.effort,
      generation,
      grantedCapabilities,
      modelId: generator.modelId,
      policyVersion: "local-v1",
      promptSnapshot: assembled.snapshot,
      promptSnapshotDigest: assembled.snapshotDigest,
      providerPurpose: "normal",
      requestDigest,
      schemaVersion: 1,
    };
    const snapshotDigest = createHash("sha256")
      .update(canonicalJson(snapshot))
      .digest("hex");
    const attemptId = createHash("sha256")
      .update(`${action.actionId}:attempt:${generation}:${snapshotDigest}`)
      .digest("hex");
    const callId = createHash("sha256")
      .update(`${attemptId}:provider-call:1:${requestDigest}`)
      .digest("hex");
    const allocatedAtMs = this.now();
    const allocatedAt = new Date(allocatedAtMs).toISOString();
    const leaseMs = action.deadlineClass === "interactive" ? 300_000 : 900_000;
    const allocation = this.attempts.allocateProviderAttempt({
      action,
      allocatedAt,
      attemptId,
      callId,
      generation,
      leaseExpiresAt: new Date(allocatedAtMs + leaseMs).toISOString(),
      modelId: generator.modelId,
      ownerId: "curiosity-kernel",
      promptSnapshotDigest: assembled.snapshotDigest,
      promptSnapshotJson: canonicalJson(assembled.snapshot),
      providerPurpose: "normal",
      requestDigest,
      snapshot,
      snapshotDigest,
      sourceRevision: assembled.snapshot.revision,
    });
    if (!allocation)
      return yield* new ActionExecutionFailure({
        actionId: action.actionId,
        actionType: action.actionType,
        message: "ATTEMPT_AUTHORIZATION_DENIED",
        modelId: generator.modelId,
      });

    const dispatchAt = new Date(this.now()).toISOString();
    if (
      this.attempts.authorizeProviderDispatch({
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
          modelId: generator.modelId,
          schemaVersion: 1,
        },
        streamId: action.actionId,
        type: "action.failed",
      };
      this.completeAttempt({
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
        modelId: generator.modelId,
      });
    }

    const startedAt = performance.now();
    const localAbort = new AbortController();
    this.#active.set(action.executionId, localAbort);
    if (this.attempts.isExecutionCancelled(action.executionId))
      localAbort.abort("ACTION_CANCELLED");
    const generated = Effect.tryPromise({
      try: async (abortSignal) => {
        let output = "";
        let outputBytes = 0;
        const combined = AbortSignal.any([abortSignal, localAbort.signal]);
        try {
          for await (const delta of generator.stream({
            abortSignal: combined,
            messages: assembled.messages,
          })) {
            if (combined.aborted) throw new Error("ACTION_CANCELLED");
            if (typeof delta !== "string")
              throw new Error("TEXT_DELTA_INVALID");
            outputBytes += Buffer.byteLength(delta);
            if (outputBytes > 1_048_576)
              throw new Error("TEXT_RESPONSE_TOO_LARGE");
            output += delta;
            try {
              onDelta?.({
                actionId: action.actionId,
                actionType: action.actionType,
                correlation: input.correlation,
                delta,
              });
            } catch {
              // Projection failure cannot change provider completion authority.
            }
          }
          return output;
        } finally {
          if (this.#active.get(action.executionId) === localAbort)
            this.#active.delete(action.executionId);
        }
      },
      catch: () =>
        new ActionExecutionFailure({
          actionId: action.actionId,
          actionType: action.actionType,
          message: "TEXT_GENERATION_FAILED",
          modelId: generator.modelId,
        }),
    });
    const result = yield* generated.pipe(Effect.result);
    const completedAt = new Date(this.now()).toISOString();
    if (result._tag === "Failure") {
      const cancelled = this.attempts.isExecutionCancelled(action.executionId);
      const errorCode = cancelled ? "ACTION_CANCELLED" : result.failure.message;
      const event = {
        body: {
          actionId: action.actionId,
          actionType: action.actionType,
          correlation: input.correlation,
          errorCode,
          modelId: generator.modelId,
          schemaVersion: 1,
        },
        streamId: action.actionId,
        type: "action.failed",
      };
      this.completeAttempt({
        action,
        allocation,
        completedAt,
        errorCode,
        event,
        status: cancelled ? "cancelled" : "failed",
      });
      return yield* new ActionExecutionFailure({
        actionId: action.actionId,
        actionType: action.actionType,
        message: errorCode,
        modelId: generator.modelId,
      });
    }

    const output = {
      durationMs: Math.max(0, Math.round(performance.now() - startedAt)),
      effort: generator.effort,
      modelId: generator.modelId,
      text: result.success,
    };
    const event = {
      body: {
        actionId: action.actionId,
        actionType: action.actionType,
        correlation: input.correlation,
        output,
        schemaVersion: 1,
      },
      streamId: action.actionId,
      type: "action.succeeded",
    };
    const completion = this.completeAttempt({
      action,
      allocation,
      completedAt,
      event,
      status: "succeeded",
    });
    if (completion === "stale")
      return yield* new ActionExecutionFailure({
        actionId: action.actionId,
        actionType: action.actionType,
        message: "PROVIDER_RECEIPT_STALE",
        modelId: generator.modelId,
      });
  });
}
