import { createHash } from "node:crypto";
import { Effect } from "effect";
import type { StoredAction } from "../domain/action.js";
import type { ActionJournal } from "../storage/action-journal.js";
import type {
  ChildAllocationRecord,
  DelegationJournal,
} from "../storage/delegation-journal.js";
import { canonicalJson } from "./canonical-json.js";
import { ActionExecutionFailure } from "./errors.js";
import type { StaticPluginCatalog } from "./plugin.js";
import {
  enabledRoleIds,
  type RolePolicyConfig,
} from "./role-policy.js";

interface DelegateRequest {
  readonly agentId: string;
  readonly continuation?: {
    readonly agentSessionId: string;
    readonly expectedRevision: number;
  };
  readonly description: string;
  readonly ownership: {
    readonly readOnly: boolean;
    readonly resources: readonly string[];
  };
  readonly requested: {
    readonly capabilities: readonly string[];
    readonly maximumProviderCalls: number;
    readonly maximumToolCalls: number;
    readonly tools: readonly string[];
  };
  readonly schemaVersion: 1;
  readonly task: {
    readonly acceptanceChecks: readonly string[];
    readonly contextRefs: readonly string[];
    readonly deliverable: string;
    readonly nonGoals: readonly string[];
    readonly objective: string;
  };
}

interface DelegateCorrelation extends Record<string, unknown> {
  readonly agentId: string;
  readonly delegationCallIds: readonly string[];
  readonly delegationGroupId: string;
  readonly kind: "curiosity.chat.tool";
  readonly providerActionId: string;
  readonly toolCallId: string;
  readonly toolName: "agent.delegate";
  readonly toolVersion: string;
  readonly turnId: string;
}

const hash = (value: unknown): string =>
  createHash("sha256").update(canonicalJson(value)).digest("hex");

const record = (value: unknown): Record<string, unknown> | undefined =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;

const stringArray = (value: unknown): readonly string[] | undefined =>
  Array.isArray(value) &&
  value.every((item) => typeof item === "string" && item.length > 0) &&
  new Set(value).size === value.length
    ? (value as string[])
    : undefined;

const parseInput = (
  value: unknown,
): { correlation: DelegateCorrelation; request: DelegateRequest } => {
  const input = record(value);
  if (Object.keys(input ?? {}).sort().join(",") !== "correlation,request")
    throw new Error("DELEGATION_ACTION_INPUT_INVALID");
  const correlation = record(input?.correlation);
  const request = record(input?.request);
  const delegationCallIds = stringArray(correlation?.delegationCallIds);
  if (
    !correlation ||
    !request ||
    correlation.kind !== "curiosity.chat.tool" ||
    typeof correlation.agentId !== "string" ||
    typeof correlation.delegationGroupId !== "string" ||
    typeof correlation.providerActionId !== "string" ||
    typeof correlation.toolCallId !== "string" ||
    correlation.toolName !== "agent.delegate" ||
    typeof correlation.toolVersion !== "string" ||
    typeof correlation.turnId !== "string" ||
    !delegationCallIds ||
    delegationCallIds.length < 1 ||
    delegationCallIds.length > 4 ||
    !delegationCallIds.includes(correlation.toolCallId)
  )
    throw new Error("DELEGATION_ACTION_INPUT_INVALID");
  return {
    correlation: {
      ...correlation,
      agentId: correlation.agentId,
      delegationCallIds,
      delegationGroupId: correlation.delegationGroupId,
      kind: "curiosity.chat.tool",
      providerActionId: correlation.providerActionId,
      toolCallId: correlation.toolCallId,
      toolName: "agent.delegate",
      toolVersion: correlation.toolVersion,
      turnId: correlation.turnId,
    },
    request: request as unknown as DelegateRequest,
  };
};

const childTaskMessage = (request: DelegateRequest): string =>
  [
    "Bounded child task contract (trusted kernel-normalized input):",
    canonicalJson({
      acceptanceChecks: request.task.acceptanceChecks,
      deliverable: request.task.deliverable,
      description: request.description,
      nonGoals: request.task.nonGoals,
      objective: request.task.objective,
      ownership: request.ownership,
    }),
    "Return only the bounded deliverable. Completion is mechanical and does not approve or merge work.",
  ].join("\n");

export class ChildScheduler {
  constructor(
    private readonly actions: ActionJournal,
    private readonly delegations: DelegationJournal,
    private readonly catalog: StaticPluginCatalog,
    private readonly now: () => number,
    private readonly grantedCapabilities: ReadonlySet<string>,
    private readonly rolePolicy: RolePolicyConfig,
  ) {}

  private deny(
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
      additionalEvents: [
        {
          body: {
            delegationActionId: action.actionId,
            errorCode,
            schemaVersion: 1,
          },
          streamId: action.actionId,
          type: "delegation.denied",
        },
      ],
      completedAt,
      errorCode,
      event,
      outputDigest: hash(event),
      status: "failed",
    });
    return new ActionExecutionFailure({
      actionId: action.actionId,
      actionType: action.actionType,
      message: errorCode,
      modelId: "",
    });
  }

  execute = Effect.fn("ChildScheduler.execute")(function* (
    this: ChildScheduler,
    action: StoredAction,
  ) {
    let input: ReturnType<typeof parseInput>;
    try {
      input = parseInput(action.input);
    } catch {
      return yield* this.deny(
        action,
        null,
        "DELEGATION_ACTION_INPUT_INVALID",
      );
    }
    const { correlation, request } = input;
    const selected = this.catalog.tool(correlation.toolName);
    if (
      !selected ||
      selected.version !== correlation.toolVersion ||
      selected.actionType !== action.actionType ||
      canonicalJson(action.requestedCapabilities) !==
        canonicalJson(["child.propose"]) ||
      !this.delegations.parentToolCallVisible({
        modelToolCallId: correlation.toolCallId,
        parentProviderActionId: correlation.providerActionId,
        toolName: correlation.toolName,
        toolVersion: correlation.toolVersion,
      })
    )
      return yield* this.deny(
        action,
        correlation,
        "DELEGATION_TOOL_SNAPSHOT_INVALID",
      );
    const reproposed = yield* selected
      .propose(request, {
        executionId: action.executionId,
        resource: action.resource,
      })
      .pipe(Effect.result);
    if (
      reproposed._tag === "Failure" ||
      canonicalJson(record(reproposed.success.input)?.request) !==
        canonicalJson(request)
    )
      return yield* this.deny(
        action,
        correlation,
        "DELEGATION_PROPOSAL_INVALID",
      );

    const parent = this.catalog.agent(correlation.agentId);
    const child = this.catalog.agent(request.agentId);
    const enabledAgents = enabledRoleIds(this.rolePolicy);
    if (!parent || !enabledAgents.has(parent.id))
      return yield* this.deny(action, correlation, "PARENT_AGENT_UNKNOWN");
    if (!child || child.mode !== "subagent" || !enabledAgents.has(child.id))
      return yield* this.deny(action, correlation, "CHILD_AGENT_UNKNOWN");
    if (
      !parent.childAgents.includes(child.id) ||
      !parent.requestedCapabilities.includes("child.propose") ||
      !parent.requestedTools.includes("agent.delegate")
    )
      return yield* this.deny(action, correlation, "CHILD_AGENT_DENIED");
    if (
      parent.maxDelegationDepth < 1 ||
      this.rolePolicy.maximumDelegationDepth < 1
    )
      return yield* this.deny(action, correlation, "CHILD_DEPTH_EXCEEDED");
    if (
      correlation.delegationCallIds.length >
      this.rolePolicy.maximumChildrenPerTurn
    )
      return yield* this.deny(action, correlation, "CHILD_COUNT_EXCEEDED");
    if (request.task.contextRefs.length > 0)
      return yield* this.deny(
        action,
        correlation,
        "CHILD_CONTEXT_REFS_UNAVAILABLE",
      );
    if (!request.ownership.readOnly)
      return yield* this.deny(
        action,
        correlation,
        "CHILD_MUTATION_UNAVAILABLE",
      );
    if (
      request.requested.maximumProviderCalls !== 1 ||
      request.requested.maximumToolCalls !== 0 ||
      request.requested.tools.length > 0
    )
      return yield* this.deny(
        action,
        correlation,
        "CHILD_BUDGET_UNAVAILABLE",
      );
    if (!request.requested.capabilities.includes("provider.generate"))
      return yield* this.deny(
        action,
        correlation,
        "CHILD_PROVIDER_CAPABILITY_REQUIRED",
      );
    if (
      request.requested.capabilities.some(
        (capability) =>
          !this.grantedCapabilities.has(capability) ||
          !parent.requestedCapabilities.includes(capability) ||
          !child.requestedCapabilities.includes(capability),
      )
    )
      return yield* this.deny(
        action,
        correlation,
        "CHILD_CAPABILITY_DENIED",
      );

    const ordinal = correlation.delegationCallIds.indexOf(
      correlation.toolCallId,
    );
    const identity = {
      delegationGroupId: correlation.delegationGroupId,
      modelToolCallId: correlation.toolCallId,
      ordinal,
    };
    const capabilityCeiling = [...request.requested.capabilities].sort();
    const toolCeiling = [...request.requested.tools].sort();
    const taskMessage = childTaskMessage(request);
    const proposedSessionId = `agent-session:${hash({ ...identity, type: "session" })}`;
    const agentSessionId =
      request.continuation?.agentSessionId ?? proposedSessionId;
    const session = request.continuation
      ? this.delegations.session(agentSessionId)
      : undefined;
    if (request.continuation && !session)
      return yield* this.deny(action, correlation, "CHILD_SESSION_UNKNOWN");
    if (session?.status === "busy")
      return yield* this.deny(action, correlation, "CHILD_SESSION_BUSY");
    if (
      session &&
      session.revision !== request.continuation?.expectedRevision
    )
      return yield* this.deny(
        action,
        correlation,
        "CHILD_SESSION_REVISION_CONFLICT",
      );
    if (
      session &&
      (session.agentId !== child.id || session.agentVersion !== child.version)
    )
      return yield* this.deny(
        action,
        correlation,
        "CHILD_SESSION_AGENT_CONFLICT",
      );
    if (
      session &&
      (session.parentExecutionId !== action.executionId ||
        session.rootExecutionId !== correlation.turnId ||
        session.depth !== 1)
    )
      return yield* this.deny(
        action,
        correlation,
        "CHILD_SESSION_LINEAGE_CONFLICT",
      );
    if (
      session &&
      (canonicalJson(session.capabilityCeiling) !==
        canonicalJson(capabilityCeiling) ||
        canonicalJson(session.toolCeiling) !== canonicalJson(toolCeiling))
    )
      return yield* this.deny(
        action,
        correlation,
        "CHILD_SESSION_AUTHORITY_CONFLICT",
      );
    const agentRunId = `agent-run:${hash({ ...identity, type: "run" })}`;
    const childExecutionId = `child-execution:${hash({ ...identity, type: "execution" })}`;
    const childProviderActionId = hash({ ...identity, type: "provider-action" });
    const sessionRevision = session?.revision ?? 0;
    const childProviderInput = {
      agentId: child.id,
      correlation: {
        agentId: child.id,
        agentRunId,
        agentSessionId,
        capabilityCeiling,
        childExecutionId,
        delegationActionId: action.actionId,
        delegationGroupId: correlation.delegationGroupId,
        depth: 1,
        kind: "curiosity.child.run",
        parentAgentId: parent.id,
        parentExecutionId: action.executionId,
        rootExecutionId: correlation.turnId,
        sessionRevision,
        toolCeiling,
      },
      messages: [
        ...(session?.messages ?? []),
        { content: taskMessage, role: "user" },
      ],
    };
    const allocation: ChildAllocationRecord = {
      agentId: child.id,
      agentRunId,
      agentSessionId,
      agentVersion: child.version,
      budgetSnapshot: {
        maximumProviderCalls: request.requested.maximumProviderCalls,
        maximumToolCalls: request.requested.maximumToolCalls,
      },
      capabilityCeiling,
      catalogDigest: this.catalog.catalogDigest,
      childExecutionId,
      childProviderActionId,
      childProviderInput,
      ...(request.continuation
        ? {
            continuationExpectedRevision:
              request.continuation.expectedRevision,
          }
        : {}),
      delegationGroupId: correlation.delegationGroupId,
      expectedChildren: correlation.delegationCallIds.length,
      modelToolCallId: correlation.toolCallId,
      ordinal,
      parentExecutionId: action.executionId,
      parentProviderActionId: correlation.providerActionId,
      rootExecutionId: correlation.turnId,
      resourceClaims: {
        mode: "shared-read",
        resources: [...request.ownership.resources].sort(),
        scopeState:
          request.ownership.resources.length === 0
            ? "unknown-no-write-authority"
            : "declared",
      },
      sessionRevision,
      task: request,
      taskMessage,
      toolCeiling,
    };
    yield* Effect.try({
      try: () =>
        this.delegations.allocate(
          action,
          allocation,
          new Date(this.now()).toISOString(),
        ),
      catch: (cause) => {
        const message = cause instanceof Error ? cause.message : "";
        if (/^CHILD_SESSION_[A-Z_]+$/u.test(message))
          return this.deny(action, correlation, message);
        return new ActionExecutionFailure({
          actionId: action.actionId,
          actionType: action.actionType,
          message: "CHILD_ALLOCATION_INTERRUPTED",
          modelId: "",
        });
      },
    });
  });

  reconcile = Effect.fn("ChildScheduler.reconcile")(function* (
    this: ChildScheduler,
  ) {
    return yield* Effect.sync(() =>
      this.delegations.reconcileTerminals(new Date(this.now()).toISOString()),
    );
  });
}
