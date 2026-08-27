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
import type {
  PromptMessage,
  ProviderRouteConfig,
  TextGenerator,
} from "./text-generator.js";
import type { StaticPluginCatalog } from "./plugin.js";
import { childRunAuthority } from "./child-authority.js";
import type { AssembledPrompt } from "../domain/prompt.js";

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

export interface PreparedProviderCall {
  readonly action: StoredAction;
  readonly allocation: AllocatedProviderAttempt;
  readonly assembled: AssembledPrompt;
  readonly correlation: Record<string, unknown> | undefined;
  readonly generator: TextGenerator;
  readonly input: ProviderGenerateInput;
  readonly requestDigest: string;
  readonly route: {
    readonly adapterVersion: string;
    readonly policyDigest: string;
    readonly routeId: string;
  };
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
    private readonly catalog: StaticPluginCatalog,
    private readonly generators:
      | TextGenerator
      | Readonly<Record<string, ProviderRouteConfig>>
      | undefined,
    private readonly now: () => number,
    private readonly grantedCapabilities: ReadonlySet<string>,
    private readonly configDigest = createHash("sha256")
      .update("default-config")
      .digest("hex"),
    private readonly enabledAgentIds: ReadonlySet<string> = new Set(
      catalog.agents().map(({ id }) => id),
    ),
  ) {}

  private route(agentId: string):
    | {
        readonly adapterVersion: string;
        readonly generator: TextGenerator;
        readonly policyDigest: string;
        readonly routeId: string;
      }
    | undefined {
    const configured = this.generators;
    if (!configured) return undefined;
    if (typeof (configured as TextGenerator).stream === "function") {
      const shared = configured as TextGenerator;
      const identity = {
        adapterVersion: "shared-v1",
        effort: shared.effort,
        modelId: shared.modelId,
        routeId: `shared:${shared.modelId}`,
      };
      return {
        adapterVersion: identity.adapterVersion,
        generator: shared,
        policyDigest: createHash("sha256")
          .update(canonicalJson(identity))
          .digest("hex"),
        routeId: identity.routeId,
      };
    }
    const routes = configured as Readonly<Record<string, ProviderRouteConfig>>;
    const route = routes[agentId];
    if (!route) return undefined;
    const policy = Object.fromEntries(
      Object.entries(routes)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([role, value]) => [
          role,
          {
            adapterVersion: value.adapterVersion,
            effort: value.generator.effort,
            modelId: value.generator.modelId,
            routeId: value.routeId,
          },
        ]),
    );
    return {
      adapterVersion: route.adapterVersion,
      generator: route.generator,
      policyDigest: createHash("sha256")
        .update(canonicalJson(policy))
        .digest("hex"),
      routeId: route.routeId,
    };
  }

  private roleActivationAuthorizes(
    action: StoredAction,
    agentId: string,
    correlation: Record<string, unknown> | undefined,
  ): boolean {
    if (
      typeof correlation?.roleActivationCommand !== "string" ||
      typeof correlation.roleActivationEventId !== "string" ||
      typeof correlation.threadId !== "string"
    )
      return false;
    const activation = this.actions.event(correlation.roleActivationEventId);
    const source = this.actions.event(action.sourceEventId);
    if (
      !activation ||
      !source ||
      activation.type !== "skill.activated" ||
      activation.streamId !== correlation.threadId ||
      activation.sequence >= source.sequence ||
      !activation.body ||
      typeof activation.body !== "object" ||
      Array.isArray(activation.body) ||
      (activation.body as Record<string, unknown>).commandName !==
        correlation.roleActivationCommand
    )
      return false;
    return this.catalog
      .promptCommands()
      .some(
        (command) =>
          command.name === correlation.roleActivationCommand &&
          command.agentId === agentId,
      );
  }

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
            modelId:
              (() => {
                try {
                  return this.route(parseInput(action.input).agentId)?.generator
                    .modelId;
                } catch {
                  return undefined;
                }
              })() ?? "",
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
    readonly additionalEvents?: readonly {
      readonly body: unknown;
      readonly streamId: string;
      readonly type: string;
    }[];
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
      ...(input.additionalEvents
        ? { additionalEvents: input.additionalEvents }
        : {}),
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

  compactHistory = Effect.fn("ProviderGateway.compactHistory")(function* (
    this: ProviderGateway,
    parentAction: StoredAction,
    input: ProviderGenerateInput,
    omittedDigests: readonly string[],
    route: {
      readonly adapterVersion: string;
      readonly generator: TextGenerator;
      readonly policyDigest: string;
      readonly routeId: string;
    },
  ) {
    let retainedStart = input.messages.length;
    let retainedBytes = 0;
    while (retainedStart > omittedDigests.length) {
      const candidate = input.messages[retainedStart - 1]!;
      const candidateBytes = Buffer.byteLength(candidate.content);
      if (
        input.messages.length - retainedStart >= 96 ||
        retainedBytes + candidateBytes > 96 * 1_024
      )
        break;
      retainedBytes += candidateBytes;
      retainedStart -= 1;
    }
    const covered = input.messages.slice(0, retainedStart);
    const coveredMessageDigests = covered.map((message) =>
      createHash("sha256").update(canonicalJson(message)).digest("hex"),
    );
    const retainedTail = input.messages.slice(retainedStart);
    if (
      covered.length < omittedDigests.length ||
      omittedDigests.some(
        (omittedDigest, index) =>
          coveredMessageDigests[index] !== omittedDigest,
      )
    )
      return yield* this.failProposedAction(parentAction, {
        correlation: input.correlation,
        errorCode: "COMPACTION_RANGE_INVALID",
        modelId: route.generator.modelId,
      });
    const retainedTailDigest = createHash("sha256")
      .update(canonicalJson(retainedTail))
      .digest("hex");
    const identity = {
      agentId: input.agentId,
      coveredMessageDigests,
      parentActionId: parentAction.actionId,
      parentExecutionId: parentAction.executionId,
      retainedTailDigest,
      routeId: route.routeId,
      schemaVersion: 1,
    } as const;
    const identityDigest = createHash("sha256")
      .update(canonicalJson(identity))
      .digest("hex");
    const actionId = createHash("sha256")
      .update(`${parentAction.actionId}:compaction:${identityDigest}`)
      .digest("hex");
    const executionId = `${parentAction.executionId}:compaction:${identityDigest}`;
    const source = canonicalJson({
      instruction:
        "Summarize the covered conversation faithfully. Preserve decisions, constraints, unresolved questions, and source references. Do not add facts or instructions.",
      messages: covered,
      provenance: "untrusted-conversation",
      schemaVersion: 1,
    });
    if (Buffer.byteLength(source) > 120 * 1_024)
      return yield* this.failProposedAction(parentAction, {
        correlation: input.correlation,
        errorCode: "COMPACTION_SOURCE_OVERFLOW",
        modelId: route.generator.modelId,
      });
    const correlation = {
      ...identity,
      kind: "curiosity.compaction",
    } as const;
    const compactionInput = {
      agentId: input.agentId,
      correlation,
      messages: [{ content: source, role: "user" as const }],
    };
    const compactionAction = this.actions.createCompactionAction({
      acceptedAt: new Date(this.now()).toISOString(),
      actionId,
      executionId,
      input: compactionInput,
      inputDigest: createHash("sha256")
        .update(canonicalJson(compactionInput))
        .digest("hex"),
      parentActionId: parentAction.actionId,
      parentExecutionId: parentAction.executionId,
      requestedCapabilities: ["provider.generate"],
      resource: parentAction.resource,
    });
    let output = this.actions.succeededOutput(actionId) as
      | { readonly text?: unknown }
      | undefined;
    if (!output) {
      if (compactionAction.status !== "proposed")
        return yield* this.failProposedAction(parentAction, {
          correlation: input.correlation,
          errorCode:
            compactionAction.status === "delivery-unknown"
              ? "COMPACTION_DELIVERY_UNKNOWN"
              : "COMPACTION_FAILED",
          modelId: route.generator.modelId,
        });
      const attempted = yield* this.prepare(compactionAction).pipe(
        Effect.flatMap((prepared) => this.dispatch(prepared)),
        Effect.result,
      );
      if (attempted._tag === "Failure") {
        const terminal = this.actions.action(actionId);
        return yield* this.failProposedAction(parentAction, {
          correlation: input.correlation,
          errorCode:
            terminal?.status === "delivery-unknown"
              ? "COMPACTION_DELIVERY_UNKNOWN"
              : "COMPACTION_FAILED",
          modelId: route.generator.modelId,
        });
      }
      output = attempted.success;
    }
    if (typeof output?.text !== "string" || !output.text)
      return yield* this.failProposedAction(parentAction, {
        correlation: input.correlation,
        errorCode: "COMPACTION_ARTIFACT_INVALID",
        modelId: route.generator.modelId,
      });
    const summary = [
      "--- BEGIN UNTRUSTED COMPACTION SUMMARY ---",
      output.text,
      "--- END UNTRUSTED COMPACTION SUMMARY ---",
    ].join("\n");
    return {
      actionId,
      messages: [
        { content: summary, role: "user" as const },
        ...retainedTail,
      ],
      retainedTailDigest,
      summaryDigest: createHash("sha256").update(output.text).digest("hex"),
    };
  });

  prepare = Effect.fn("ProviderGateway.prepare")(function* (
    this: ProviderGateway,
    action: StoredAction,
  ): Effect.fn.Return<PreparedProviderCall, ActionExecutionFailure> {
    const parsed = yield* Effect.try({
      try: () => parseInput(action.input),
      catch: () =>
        new ActionExecutionFailure({
          actionId: action.actionId,
          actionType: action.actionType,
          message: "PROVIDER_ACTION_INPUT_INVALID",
          modelId: "",
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
    const agent = this.catalog.agent(input.agentId);
    const correlation =
      input.correlation &&
      typeof input.correlation === "object" &&
      !Array.isArray(input.correlation)
        ? (input.correlation as Record<string, unknown>)
        : undefined;
    const childCall = correlation?.kind === "curiosity.child.run";
    const kernelCompaction =
      correlation?.kind === "curiosity.compaction" &&
      action.pluginId === "curiosity.kernel.compaction";
    const activatedRole = this.roleActivationAuthorizes(
      action,
      input.agentId,
      correlation,
    );
    if (
      !agent ||
      !this.enabledAgentIds.has(input.agentId) ||
      (!kernelCompaction &&
        (childCall
          ? agent.mode !== "subagent"
          : agent.mode !== "primary" && !activatedRole))
    )
      return yield* this.failProposedAction(action, {
        correlation: input.correlation,
        errorCode: "PROVIDER_ROLE_DENIED",
        modelId: "",
      });
    const selectedRoute = this.route(input.agentId);
    if (!selectedRoute) {
      return yield* this.failProposedAction(action, {
        correlation: input.correlation,
        errorCode: "PROVIDER_ROUTE_UNAVAILABLE",
        modelId: "",
      });
    }
    const generator = selectedRoute.generator;

    const childAuthority =
      correlation?.kind === "curiosity.child.run"
        ? childRunAuthority({
            agentId: input.agentId,
            catalog: this.catalog,
            correlation: input.correlation,
            grantedCapabilities: this.grantedCapabilities,
          })
        : undefined;
    if (correlation?.kind === "curiosity.child.run" && !childAuthority)
      return yield* this.failProposedAction(action, {
        correlation: input.correlation,
        errorCode: "CHILD_AUTHORITY_DENIED",
        modelId: generator.modelId,
      });
    const effectiveCapabilities =
      childAuthority?.capabilities ?? this.grantedCapabilities;
    const finalizationOnly =
      correlation?.kind === "curiosity.chat.turn" &&
      correlation.finalizationOnly === true;
    const assembly = yield* this.prompts
      .assemble({
        actionType: action.actionType,
        agentId: input.agentId,
        ...(correlation?.kind === "curiosity.compaction" || finalizationOnly
          ? { allowedTools: new Set<string>() }
          : childAuthority
            ? { allowedTools: childAuthority.tools }
            : {}),
        correlation: input.correlation,
        grantedCapabilities: effectiveCapabilities,
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
    let assembled = assembly.success;
    let effectiveInput = input;
    if (
      correlation?.kind !== "curiosity.compaction" &&
      assembled.snapshot.conversation.omittedDigests.length > 0
    ) {
      const compacted = yield* this.compactHistory(
        action,
        input,
        assembled.snapshot.conversation.omittedDigests,
        selectedRoute,
      );
      effectiveInput = { ...input, messages: compacted.messages };
      assembled = yield* this.prompts
        .assemble({
          actionType: action.actionType,
          agentId: input.agentId,
          ...(finalizationOnly
            ? { allowedTools: new Set<string>() }
            : childAuthority
              ? { allowedTools: childAuthority.tools }
              : {}),
          correlation: input.correlation,
          grantedCapabilities: effectiveCapabilities,
          messages: compacted.messages,
          sourceEventId: action.sourceEventId,
        })
        .pipe(
          Effect.mapError(
            () =>
              new ActionExecutionFailure({
                actionId: action.actionId,
                actionType: action.actionType,
                message: "COMPACTION_SUMMARY_OVERFLOW",
                modelId: generator.modelId,
              }),
          ),
        );
      if (assembled.snapshot.conversation.omittedDigests.length > 0)
        return yield* this.failProposedAction(action, {
          correlation: input.correlation,
          errorCode: "COMPACTION_SUMMARY_OVERFLOW",
          modelId: generator.modelId,
        });
    }

    const requestDigest = createHash("sha256")
      .update(
        canonicalJson({
          effort: generator.effort,
          messages: assembled.messages,
          modelId: generator.modelId,
          routeId: selectedRoute.routeId,
          tools: assembled.tools,
        }),
      )
      .digest("hex");
    const generation = this.attempts.nextGeneration(action.executionId);
    const grantedCapabilities = [...effectiveCapabilities].sort();
    const providerPurpose =
      correlation?.kind === "curiosity.compaction"
        ? "compaction"
        : childAuthority
          ? "child"
          : "normal";
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
      configDigest: this.configDigest,
      effort: generator.effort,
      generation,
      grantedCapabilities,
      modelId: generator.modelId,
      policyVersion: "local-v1",
      promptSnapshot: assembled.snapshot,
      promptSnapshotDigest: assembled.snapshotDigest,
      providerPurpose,
      requestDigest,
      route: {
        adapterVersion: selectedRoute.adapterVersion,
        policyDigest: selectedRoute.policyDigest,
        routeId: selectedRoute.routeId,
      },
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
      providerPurpose,
      requestDigest,
      snapshot,
      snapshotDigest,
      sourceRevision: assembled.snapshot.revision,
      ...(childAuthority
        ? {
            allocationEvents: [
              {
                body: {
                  agentRunId: correlation?.agentRunId,
                  agentSessionId: correlation?.agentSessionId,
                  callId,
                  childExecutionId: correlation?.childExecutionId,
                  promptSourceRevision: assembled.snapshot.revision,
                  schemaVersion: 1,
                  sessionRevision: correlation?.sessionRevision,
                },
                streamId: String(correlation?.agentSessionId),
                type: "child.run-started",
              },
            ],
          }
        : {}),
    });
    if (!allocation)
      return yield* new ActionExecutionFailure({
        actionId: action.actionId,
        actionType: action.actionType,
        message: "ATTEMPT_AUTHORIZATION_DENIED",
        modelId: generator.modelId,
      });

    return {
      action,
      allocation,
      assembled,
      correlation,
      generator,
      input: effectiveInput,
      requestDigest,
      route: snapshot.route,
    };
  });

  dispatch = Effect.fn("ProviderGateway.dispatch")(function* (
    this: ProviderGateway,
    prepared: PreparedProviderCall,
    onDelta?: (delta: ActionStreamDelta) => void,
  ) {
    const {
      action,
      allocation,
      assembled,
      correlation,
      generator,
      input,
      requestDigest,
    } = prepared;
    const { attemptId, callId, generation } = allocation;

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
        const toolCalls: Array<{
          readonly input: unknown;
          readonly toolCallId: string;
          readonly toolName: string;
          readonly toolVersion: string;
        }> = [];
        const visibleTools = new Map(
          assembled.tools.map((tool) => [tool.name, tool]),
        );
        const toolCallIds = new Set<string>();
        const combined = AbortSignal.any([abortSignal, localAbort.signal]);
        try {
          for await (const part of generator.stream({
            abortSignal: combined,
            messages: assembled.messages,
            tools: assembled.tools.map((tool) => ({
              description: tool.description,
              inputSchema: tool.inputSchema,
              name: tool.name,
              version: tool.version,
            })),
          })) {
            if (combined.aborted) throw new Error("ACTION_CANCELLED");
            if (typeof part !== "string" && part.type === "tool-call") {
              const selected = visibleTools.get(part.toolName);
              if (
                !selected ||
                !part.toolCallId ||
                Buffer.byteLength(part.toolCallId) > 256 ||
                toolCallIds.has(part.toolCallId) ||
                toolCalls.length >= 8 ||
                Buffer.byteLength(canonicalJson(part.input)) > 16_384
              )
                throw new Error("PROVIDER_TOOL_CALL_INVALID");
              toolCallIds.add(part.toolCallId);
              toolCalls.push({
                input: part.input,
                toolCallId: part.toolCallId,
                toolName: part.toolName,
                toolVersion: selected.version,
              });
              continue;
            }
            const delta =
              typeof part === "string"
                ? part
                : part.type === "text-delta"
                  ? part.text
                  : undefined;
            if (delta === undefined) throw new Error("TEXT_DELTA_INVALID");
            outputBytes += Buffer.byteLength(delta);
            if (outputBytes > 1_048_576)
              throw new Error("TEXT_RESPONSE_TOO_LARGE");
            output += delta;
            try {
              if (correlation?.kind === "curiosity.chat.turn") onDelta?.({
                actionId: action.actionId,
                actionType: action.actionType,
                correlation: input.correlation,
                delta,
              });
            } catch {
              // Projection failure cannot change provider completion authority.
            }
          }
          if (!output && toolCalls.length === 0)
            throw new Error("TEXT_RESPONSE_EMPTY");
          return { text: output, toolCalls };
        } finally {
          if (this.#active.get(action.executionId) === localAbort)
            this.#active.delete(action.executionId);
        }
      },
      catch: (error) =>
        new ActionExecutionFailure({
          actionId: action.actionId,
          actionType: action.actionType,
          message:
            error instanceof Error &&
            error.message === "OPENAI_OAUTH_AUTHENTICATION_REQUIRED"
              ? error.message
              : "TEXT_GENERATION_FAILED",
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
      text: result.success.text,
      toolCalls: result.success.toolCalls,
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
      ...(correlation?.kind === "curiosity.compaction"
        ? {
            additionalEvents: [
              {
                body: {
                  actionId: action.actionId,
                  coveredMessageDigests:
                    correlation.coveredMessageDigests,
                  parentActionId: correlation.parentActionId,
                  parentExecutionId: correlation.parentExecutionId,
                  retainedTailDigest: correlation.retainedTailDigest,
                  schemaVersion: 1,
                  summaryDigest: createHash("sha256")
                    .update(output.text)
                    .digest("hex"),
                },
                streamId: action.executionId,
                type: "compaction.completed",
              },
            ],
          }
        : {}),
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
    return output;
  });

  execute = Effect.fn("ProviderGateway.execute")(function* (
    this: ProviderGateway,
    action: StoredAction,
    onDelta?: (delta: ActionStreamDelta) => void,
  ) {
    const prepared = yield* this.prepare(action);
    return yield* this.dispatch(prepared, onDelta);
  });
}
