import {
  assertAgentStepEnvelope,
  decodeAgentStepProposal,
  type AgentIdentitySnapshot,
  type AgentStepPort,
  type AgentStepProposal,
  type AgentStepRequest,
  type AgentStepResult,
  type AgentToolCallProposal,
  type AgentToolDefinitionSnapshot,
} from "./agent-step.js";
import type {
  AgentJournalActionAllocation,
  AgentJournalCommitTransition,
  AgentJournalMutationResult,
  AgentJournalPort,
  AgentJournalProviderActionProjection,
  AgentJournalSettlementResult,
  AgentRunProjection,
} from "./agent-journal-port.js";
import { validateReactionProposal } from "./action-proposal.js";
import { canonicalJson } from "./canonical-json.js";
import type { ContextPlan } from "./context-plan.js";
import { PortableAuthorityError, type Sha256 } from "./domain.js";
import type { GenerationRouteReceipt } from "./generation-route.js";
import type { Awaitable } from "./workflow-domain.js";

export interface AgentKernelToolBinding {
  readonly definition: AgentToolDefinitionSnapshot;
  readonly pluginId: string;
  readonly propose: (
    input: unknown,
    context: {
      readonly callKey: string;
      readonly executionId: string;
      readonly runId: string;
    },
  ) => Awaitable<unknown>;
  readonly reactorId: string;
}

export interface AgentKernelStepPlan {
  readonly agent: AgentIdentitySnapshot;
  readonly contextPlan: ContextPlan;
  readonly finalizationOnly: boolean;
  readonly route: GenerationRouteReceipt;
  readonly tools: readonly AgentKernelToolBinding[];
}

export interface AgentKernelPlanPort {
  readonly plan: (
    run: AgentRunProjection,
    signal: AbortSignal,
  ) => Awaitable<AgentKernelStepPlan>;
}

export interface AgentKernelConfig {
  readonly agentStep: AgentStepPort;
  readonly catalogDigest: string;
  readonly eligibleActorId: string;
  readonly journal: AgentJournalPort;
  readonly now: () => string;
  readonly ownerId?: string;
  readonly planner: AgentKernelPlanPort;
  readonly sha256: Sha256;
}

export type AgentKernelDrainResult =
  | { readonly kind: "idle" }
  | {
      readonly commit: AgentJournalMutationResult;
      readonly kind: "committed";
      readonly proposalKind: AgentStepProposal["kind"];
      readonly runId: string;
      readonly stepId: string;
    }
  | {
      readonly actionId: string;
      readonly kind: "provider-blocked";
      readonly reason:
        | "delivery-unknown"
        | "dispatch-denied"
        | "dispatched-unsettled"
        | "failed";
      readonly runId: string;
    }
  | {
      readonly actionId: string;
      readonly allocation?: AgentJournalMutationResult;
      readonly kind: "provider-settled";
      readonly runId: string;
      readonly settlement: AgentJournalSettlementResult;
      readonly stepId: string;
    };

type DurableAgentStepRequest = Omit<AgentStepRequest, "signal">;

interface DurableProviderInput {
  readonly request: DurableAgentStepRequest;
  readonly requestDigest: string;
  readonly schemaVersion: 1;
}

interface WaitingProviderState {
  readonly providerActionId: string;
  readonly providerStepId: string;
}

const identifierPattern = /^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$/u;
const digestPattern = /^[a-f0-9]{64}$/u;
const timestampPattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/u;
const gateLifetimeMs = 24 * 60 * 60 * 1_000;
const providerLeaseMs = 10 * 60 * 1_000;

const stale = (): never => {
  throw new PortableAuthorityError("AGENT_KERNEL_STALE_STEP");
};

const record = (value: unknown): Record<string, unknown> | undefined =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;

const exactKeys = (
  value: Record<string, unknown>,
  keys: readonly string[],
): boolean =>
  Object.keys(value).sort().join("\u0000") === [...keys].sort().join("\u0000");

const checkedTime = (value: string): number => {
  const timestamp = Date.parse(value);
  if (!timestampPattern.test(value) || !Number.isFinite(timestamp))
    throw new PortableAuthorityError("AGENT_KERNEL_TIME_INVALID");
  return timestamp;
};

const exactResultIdentity = (
  result: AgentStepResult,
  request: AgentStepRequest,
): void => {
  if (
    result.contextPlanId !== request.contextPlan.contextPlanId ||
    result.modelId !== request.route.modelId ||
    result.observedRunRevision !== request.observedRunRevision ||
    result.observedStateDigest !== request.observedStateDigest ||
    result.runId !== request.runId ||
    result.selectionId !== request.route.selectionId ||
    result.stepId !== request.stepId ||
    result.stepNumber !== request.stepNumber
  )
    stale();
};

const currentRun = (
  current: AgentRunProjection | undefined,
  observed: AgentRunProjection,
): AgentRunProjection => {
  if (
    !current ||
    current.status !== "running" ||
    current.revision !== observed.revision ||
    current.stateDigest !== observed.stateDigest
  )
    return stale();
  return current;
};

const waitingProvider = (
  run: AgentRunProjection,
): WaitingProviderState | undefined => {
  const state = record(run.state);
  if (state?.phase !== "waiting-provider") return undefined;
  if (
    !identifierPattern.test(String(state.providerActionId ?? "")) ||
    !digestPattern.test(String(state.providerStepId ?? ""))
  )
    return stale();
  return {
    providerActionId: state.providerActionId as string,
    providerStepId: state.providerStepId as string,
  };
};

const assistantState = (
  proposal: AgentStepProposal,
): { readonly assistantState?: unknown } =>
  proposal.assistantState === undefined
    ? {}
    : { assistantState: proposal.assistantState };

const proposedAction = async (
  call: AgentToolCallProposal,
  binding: AgentKernelToolBinding,
  run: AgentRunProjection,
  stepId: string,
  sha256: Sha256,
): Promise<AgentJournalActionAllocation> => {
  if (
    binding.definition.toolId !== call.toolId ||
    binding.definition.version !== call.toolVersion
  )
    throw new PortableAuthorityError("AGENT_STEP_PROPOSAL_INVALID");
  const validated = validateReactionProposal({
    actions: [
      await binding.propose(call.input, {
        callKey: call.callKey,
        executionId: run.executionId,
        runId: run.runId,
      }),
    ],
    events: [],
  }).actions[0];
  if (
    !validated ||
    validated.actionType !== call.toolId ||
    validated.subject.executionId !== run.executionId ||
    validated.requestedCapabilities.some(
      (capability) => !run.capabilityCeiling.includes(capability),
    ) ||
    [...validated.requestedCapabilities].sort().join("\u0000") !==
      validated.requestedCapabilities.join("\u0000") ||
    !identifierPattern.test(binding.pluginId) ||
    !identifierPattern.test(binding.reactorId)
  )
    throw new PortableAuthorityError("AGENT_STEP_PROPOSAL_INVALID");
  const inputDigest = await sha256(canonicalJson(validated.input));
  const actionId = await sha256(
    canonicalJson({
      callKey: call.callKey,
      inputDigest,
      runId: run.runId,
      stepId,
      toolId: call.toolId,
      toolVersion: call.toolVersion,
    }),
  );
  return {
    actionId,
    actionSchemaVersion: validated.actionSchemaVersion,
    actionType: validated.actionType,
    deadlineClass: validated.deadlineClass,
    executionId: run.executionId,
    gateClass: validated.gateClass,
    input: validated.input,
    inputDigest,
    pluginId: binding.pluginId,
    reactorId: binding.reactorId,
    requestedCapabilities: validated.requestedCapabilities,
    resource: validated.subject.resource,
    sourceEventId: run.sourceEventId,
  };
};

const questionAction = async (
  proposal: Extract<AgentStepProposal, { readonly kind: "question" }>,
  run: AgentRunProjection,
  stepId: string,
  reactorId: string,
  sha256: Sha256,
): Promise<AgentJournalActionAllocation> => {
  const input = proposal.question;
  const inputDigest = await sha256(canonicalJson(input));
  return {
    actionId: await sha256(
      canonicalJson({ kind: "question", runId: run.runId, stepId }),
    ),
    actionSchemaVersion: 1,
    actionType: "question.ask",
    deadlineClass: "interactive",
    executionId: run.executionId,
    gateClass: "none-requested",
    input,
    inputDigest,
    pluginId: "curiosity.kernel.questions",
    reactorId,
    requestedCapabilities: [],
    resource: `question:${run.runId}`,
    sourceEventId: run.sourceEventId,
  };
};

const transitionFor = async (
  proposal: AgentStepProposal,
  plan: AgentKernelStepPlan,
  run: AgentRunProjection,
  stepId: string,
  committedAt: string,
  eligibleActorId: string,
  sha256: Sha256,
): Promise<AgentJournalCommitTransition> => {
  let actions: readonly AgentJournalActionAllocation[] = [];
  let nextState: unknown;
  let terminalRequested = false;
  if (proposal.kind === "final") {
    nextState = {
      ...assistantState(proposal),
      final: { citations: proposal.citations, text: proposal.text },
      phase: "final",
      schemaVersion: 1,
    };
    terminalRequested = true;
  } else if (proposal.kind === "no-go") {
    nextState = {
      ...assistantState(proposal),
      phase: "no-go",
      reasonCode: proposal.reasonCode,
      schemaVersion: 1,
    };
    terminalRequested = true;
  } else if (proposal.kind === "question") {
    actions = [
      await questionAction(proposal, run, stepId, plan.agent.id, sha256),
    ];
    nextState = {
      ...assistantState(proposal),
      phase: "waiting-question",
      questionActionId: actions[0]!.actionId,
      schemaVersion: 1,
    };
  } else {
    if (plan.finalizationOnly)
      throw new PortableAuthorityError("AGENT_STEP_PROPOSAL_INVALID");
    const bindings = new Map(
      plan.tools.map((binding) => [binding.definition.toolId, binding]),
    );
    actions = await Promise.all(
      proposal.actions.map((call) => {
        const binding = bindings.get(call.toolId);
        if (!binding)
          throw new PortableAuthorityError("AGENT_STEP_PROPOSAL_INVALID");
        return proposedAction(call, binding, run, stepId, sha256);
      }),
    );
    nextState = {
      ...assistantState(proposal),
      actionIds: actions.map(({ actionId }) => actionId),
      phase: "waiting-actions",
      schemaVersion: 1,
    };
  }
  const progressKey = `agent-step:${run.revision + 1}:${proposal.kind}:${stepId}`;
  const transitionDigest = await sha256(
    canonicalJson({ actions, nextState, progressKey, terminalRequested }),
  );
  const committedTime = checkedTime(committedAt);
  return {
    actions,
    children: [],
    committedAt,
    expectedRevision: run.revision,
    gateEligibleActorId: eligibleActorId,
    gateExpiresAt: new Date(committedTime + gateLifetimeMs).toISOString(),
    nextState,
    observedStateDigest: run.stateDigest,
    progressKey,
    runId: run.runId,
    terminalRequested,
    transitionDigest,
  };
};

const durableRequest = (
  plan: AgentKernelStepPlan,
  run: AgentRunProjection,
  finalizationOnly: boolean,
  stepId: string,
): DurableAgentStepRequest => ({
  agent: plan.agent,
  availableTools: plan.tools.map(({ definition }) => definition),
  contextPlan: plan.contextPlan,
  finalizationOnly,
  observedRunRevision: run.revision,
  observedStateDigest: run.stateDigest,
  route: plan.route,
  runId: run.runId,
  stepId,
  stepNumber: run.revision + 1,
});

const providerTransition = async (
  run: AgentRunProjection,
  plan: AgentKernelStepPlan,
  request: DurableAgentStepRequest,
  committedAt: string,
  eligibleActorId: string,
  sha256: Sha256,
): Promise<{
  input: DurableProviderInput;
  transition: AgentJournalCommitTransition;
}> => {
  if (!run.capabilityCeiling.includes("provider.generate"))
    throw new PortableAuthorityError("AGENT_PROVIDER_CAPABILITY_DENIED");
  assertAgentStepEnvelope(request);
  const requestDigest = await sha256(canonicalJson(request));
  const input: DurableProviderInput = {
    request,
    requestDigest,
    schemaVersion: 1,
  };
  const inputDigest = await sha256(canonicalJson(input));
  const actionId = await sha256(
    canonicalJson({
      requestDigest,
      runId: run.runId,
      stepId: request.stepId,
      type: "provider.generate",
    }),
  );
  const action: AgentJournalActionAllocation = {
    actionId,
    actionSchemaVersion: 1,
    actionType: "provider.generate",
    deadlineClass: "interactive",
    executionId: run.executionId,
    gateClass: "none-requested",
    input,
    inputDigest,
    pluginId: "curiosity.kernel.providers",
    reactorId: plan.agent.id,
    requestedCapabilities: ["provider.generate"],
    resource: `provider:${request.route.routeId}:${run.runId}`,
    sourceEventId: run.sourceEventId,
  };
  const nextState = {
    phase: "waiting-provider",
    providerActionId: actionId,
    providerStepId: request.stepId,
    schemaVersion: 1,
  };
  const progressKey = `agent-provider:${run.revision + 1}:${request.stepId}`;
  const terminalRequested = false;
  const transitionDigest = await sha256(
    canonicalJson({
      actions: [action],
      nextState,
      progressKey,
      terminalRequested,
    }),
  );
  const time = checkedTime(committedAt);
  return {
    input,
    transition: {
      actions: [action],
      children: [],
      committedAt,
      expectedRevision: run.revision,
      gateEligibleActorId: eligibleActorId,
      gateExpiresAt: new Date(time + gateLifetimeMs).toISOString(),
      nextState,
      observedStateDigest: run.stateDigest,
      progressKey,
      runId: run.runId,
      terminalRequested,
      transitionDigest,
    },
  };
};

const decodeProviderInput = async (
  action: AgentJournalProviderActionProjection,
  sha256: Sha256,
): Promise<DurableProviderInput> => {
  const input = record(action.input);
  if (
    !input ||
    !exactKeys(input, ["request", "requestDigest", "schemaVersion"]) ||
    input.schemaVersion !== 1 ||
    typeof input.requestDigest !== "string" ||
    !digestPattern.test(input.requestDigest)
  )
    return stale();
  if (!record(input.request)) return stale();
  const request = input.request as DurableAgentStepRequest;
  try {
    assertAgentStepEnvelope(request);
  } catch {
    return stale();
  }
  if (
    (await sha256(canonicalJson(request))) !== input.requestDigest ||
    (await sha256(canonicalJson(input))) !== action.inputDigest
  )
    return stale();
  return {
    request,
    requestDigest: input.requestDigest,
    schemaVersion: 1,
  };
};

const stableErrorCode = (error: unknown, signal: AbortSignal): string => {
  if (signal.aborted) return "ACTION_CANCELLED";
  const value = record(error)?.code;
  if (typeof value === "string" && identifierPattern.test(value)) return value;
  if (error instanceof Error && identifierPattern.test(error.message))
    return error.message;
  return "PROVIDER_GENERATION_FAILED";
};

const exactBindings = (
  plan: AgentKernelStepPlan,
  request: DurableAgentStepRequest,
): boolean =>
  canonicalJson(plan.agent) === canonicalJson(request.agent) &&
  canonicalJson(plan.tools.map(({ definition }) => definition)) ===
    canonicalJson(request.availableTools);

export class AgentKernel {
  readonly #config: AgentKernelConfig;
  #draining = false;

  constructor(config: AgentKernelConfig) {
    if (
      !digestPattern.test(config.catalogDigest) ||
      !identifierPattern.test(config.ownerId ?? config.eligibleActorId)
    )
      throw new PortableAuthorityError("AGENT_KERNEL_CONFIG_INVALID");
    this.#config = config;
  }

  async drainOne(signal: AbortSignal): Promise<AgentKernelDrainResult> {
    if (this.#draining) throw new PortableAuthorityError("AGENT_KERNEL_BUSY");
    if (signal.aborted) throw new PortableAuthorityError("ACTION_CANCELLED");
    this.#draining = true;
    try {
      const run = (await this.#config.journal.runnableRuns(1))[0];
      if (!run) return { kind: "idle" };
      const waiting = waitingProvider(run);
      if (waiting) return await this.#resumeProvider(run, waiting, signal);
      return await this.#allocateProvider(run, signal);
    } finally {
      this.#draining = false;
    }
  }

  recover(reconciledAt: string) {
    return this.#config.journal.reconcileInterrupted(reconciledAt);
  }

  async #allocateProvider(
    run: AgentRunProjection,
    signal: AbortSignal,
  ): Promise<AgentKernelDrainResult> {
    const plan = await this.#config.planner.plan(run, signal);
    if (signal.aborted) throw new PortableAuthorityError("ACTION_CANCELLED");
    if (
      plan.tools.length > 8 ||
      new Set(plan.tools.map(({ definition }) => definition.toolId)).size !==
        plan.tools.length
    )
      throw new PortableAuthorityError("AGENT_STEP_REQUEST_INVALID");
    const finalizationOnly =
      plan.finalizationOnly || run.actionCount + 1 >= run.limits.maxActions;
    const availableTools = plan.tools.map(({ definition }) => definition);
    const stepId = await this.#config.sha256(
      canonicalJson({
        agent: plan.agent,
        availableTools,
        contextPlanId: plan.contextPlan.contextPlanId,
        finalizationOnly,
        purpose: "agent.step",
        revision: run.revision,
        route: plan.route,
        runId: run.runId,
        stateDigest: run.stateDigest,
      }),
    );
    const request = durableRequest(plan, run, finalizationOnly, stepId);
    const committedAt = this.#config.now();
    const provider = await providerTransition(
      run,
      plan,
      request,
      committedAt,
      this.#config.eligibleActorId,
      this.#config.sha256,
    );
    const allocation = await this.#config.journal.commitTransition(
      provider.transition,
    );
    if (
      allocation.runId !== run.runId ||
      allocation.revision !== run.revision + 1
    )
      return stale();
    const current = await this.#config.journal.readRunProjection(run.runId);
    if (!current || current.revision !== allocation.revision) return stale();
    const waiting = waitingProvider(current);
    if (!waiting || waiting.providerStepId !== stepId) return stale();
    return this.#resumeProvider(current, waiting, signal, allocation);
  }

  async #resumeProvider(
    run: AgentRunProjection,
    waiting: WaitingProviderState,
    signal: AbortSignal,
    allocation?: AgentJournalMutationResult,
  ): Promise<AgentKernelDrainResult> {
    const action = run.providerAction;
    if (!action || action.actionId !== waiting.providerActionId) return stale();
    const input = await decodeProviderInput(action, this.#config.sha256);
    const expectedState = {
      phase: "waiting-provider",
      providerActionId: action.actionId,
      providerStepId: input.request.stepId,
      schemaVersion: 1,
    };
    if (
      input.request.stepId !== waiting.providerStepId ||
      run.revision !== input.request.observedRunRevision + 1 ||
      run.stateDigest !==
        (await this.#config.sha256(canonicalJson(expectedState)))
    )
      return stale();
    const call = action.call;
    if (action.status === "succeeded")
      return this.#applySettledProvider(run, action, input, signal);
    if (action.status === "delivery-unknown")
      return this.#blocked(run, action, "delivery-unknown");
    if (action.status === "failed" || (action.status === "proposed" && call))
      return this.#blocked(run, action, "failed");
    if (action.status === "running" && call?.dispatchState === "dispatched")
      return this.#blocked(run, action, "dispatched-unsettled");
    if (action.status === "running" && !call) return stale();
    return this.#dispatchProvider(run, action, input, signal, allocation);
  }

  #blocked(
    run: AgentRunProjection,
    action: AgentJournalProviderActionProjection,
    reason: Extract<
      AgentKernelDrainResult,
      { kind: "provider-blocked" }
    >["reason"],
  ): AgentKernelDrainResult {
    return {
      actionId: action.actionId,
      kind: "provider-blocked",
      reason,
      runId: run.runId,
    };
  }

  async #dispatchProvider(
    run: AgentRunProjection,
    action: AgentJournalProviderActionProjection,
    input: DurableProviderInput,
    signal: AbortSignal,
    allocation?: AgentJournalMutationResult,
  ): Promise<AgentKernelDrainResult> {
    if (signal.aborted) throw new PortableAuthorityError("ACTION_CANCELLED");
    const allocatedAt = this.#config.now();
    const generation = action.call?.generation ?? run.executionGeneration + 1;
    const attemptId =
      action.call?.attemptId ??
      (await this.#config.sha256(
        canonicalJson({
          actionId: action.actionId,
          generation,
          kind: "attempt",
        }),
      ));
    const callId =
      action.call?.callId ??
      (await this.#config.sha256(
        canonicalJson({
          actionId: action.actionId,
          generation,
          kind: "provider-call",
        }),
      ));
    const snapshot = {
      catalogDigest: this.#config.catalogDigest,
      grantedCapabilities: [...run.capabilityCeiling],
      routeId: input.request.route.routeId,
      schemaVersion: 1,
    };
    if (!action.call) {
      const armed = await this.#config.journal.armDispatch({
        actionId: action.actionId,
        allocatedAt,
        attemptId,
        callId,
        dispatch: {
          kind: "provider",
          modelId: input.request.route.modelId,
          promptSnapshot: input.request,
          promptSnapshotDigest: input.requestDigest,
          purpose: "agent.step",
          requestDigest: input.requestDigest,
          sourceRevision: input.request.observedRunRevision,
        },
        executionId: run.executionId,
        generation,
        inputDigest: action.inputDigest,
        leaseExpiresAt: new Date(
          checkedTime(allocatedAt) + providerLeaseMs,
        ).toISOString(),
        ownerId: this.#config.ownerId ?? this.#config.eligibleActorId,
        phase: "allocate",
        snapshot,
        snapshotDigest: await this.#config.sha256(canonicalJson(snapshot)),
      });
      if (armed.disposition !== "armed")
        return this.#blocked(run, action, "dispatch-denied");
    } else if (
      action.call.requestDigest !== input.requestDigest ||
      action.call.modelId !== input.request.route.modelId ||
      action.call.promptSnapshotDigest !== input.requestDigest ||
      action.call.sourceRevision !== input.request.observedRunRevision ||
      action.call.dispatchState !== "armed" ||
      action.call.status !== "allocated"
    ) {
      return stale();
    }
    const authorization = await this.#config.journal.armDispatch({
      actionId: action.actionId,
      attemptId,
      authorizedAt: this.#config.now(),
      callId,
      generation,
      kind: "provider",
      phase: "authorize",
      requestDigest: input.requestDigest,
    });
    if (authorization.disposition !== "authorized")
      return this.#blocked(run, action, "dispatch-denied");
    const request: AgentStepRequest = { ...input.request, signal };
    let durableResult: AgentStepResult;
    try {
      const result = await this.#config.agentStep.step(request);
      if (signal.aborted) throw new PortableAuthorityError("ACTION_CANCELLED");
      exactResultIdentity(result, request);
      const proposal = decodeAgentStepProposal(result.proposal);
      durableResult = { ...result, proposal };
    } catch (error) {
      const errorCode = stableErrorCode(error, signal);
      const completedAt = this.#config.now();
      const body = {
        actionId: action.actionId,
        attemptId,
        callId,
        errorCode,
        generation,
        schemaVersion: 1,
      };
      await this.#config.journal.settleAttempt({
        actionId: action.actionId,
        attemptId,
        callId,
        completedAt,
        errorCode,
        events: [
          {
            body,
            streamId: action.actionId,
            type:
              errorCode === "ACTION_CANCELLED"
                ? "provider.generate.cancelled"
                : "provider.generate.failed",
          },
        ],
        generation,
        kind: "provider",
        outputDigest: await this.#config.sha256(canonicalJson(body)),
        status: errorCode === "ACTION_CANCELLED" ? "cancelled" : "failed",
        usage: {},
        usageState: "UNKNOWN",
      });
      throw error;
    }
    const outputDigest = await this.#config.sha256(
      canonicalJson(durableResult),
    );
    const completedAt = this.#config.now();
    const settlement = await this.#config.journal.settleAttempt({
      actionId: action.actionId,
      attemptId,
      callId,
      completedAt,
      events: [
        {
          body: {
            actionId: action.actionId,
            attemptId,
            callId,
            generation,
            result: durableResult,
            schemaVersion: 1,
          },
          streamId: action.actionId,
          type: "provider.generate.succeeded",
        },
      ],
      generation,
      kind: "provider",
      outputDigest,
      status: "succeeded",
      usage: { durationMs: durableResult.durationMs },
      usageState: "UNKNOWN",
    });
    if (settlement.disposition === "stale") return stale();
    return {
      actionId: action.actionId,
      ...(allocation ? { allocation } : {}),
      kind: "provider-settled",
      runId: run.runId,
      settlement,
      stepId: input.request.stepId,
    };
  }

  async #applySettledProvider(
    run: AgentRunProjection,
    action: AgentJournalProviderActionProjection,
    input: DurableProviderInput,
    signal: AbortSignal,
  ): Promise<AgentKernelDrainResult> {
    const call = action.call;
    const event = call?.terminalEvent;
    const body = record(event?.body);
    if (
      !call ||
      !event ||
      event.streamId !== action.actionId ||
      event.type !== "provider.generate.succeeded" ||
      !body ||
      !exactKeys(body, [
        "actionId",
        "attemptId",
        "callId",
        "generation",
        "result",
        "schemaVersion",
      ]) ||
      body.actionId !== action.actionId ||
      body.attemptId !== call.attemptId ||
      body.callId !== call.callId ||
      body.generation !== call.generation ||
      body.schemaVersion !== 1 ||
      !record(body.result) ||
      call.status !== "succeeded" ||
      call.requestDigest !== input.requestDigest ||
      call.promptSnapshotDigest !== input.requestDigest ||
      call.modelId !== input.request.route.modelId ||
      call.sourceRevision !== input.request.observedRunRevision ||
      !call.outputDigest ||
      action.outputDigest !== call.outputDigest
    )
      return stale();
    const result = body.result as AgentStepResult;
    const request: AgentStepRequest = { ...input.request, signal };
    exactResultIdentity(result, request);
    const proposal = decodeAgentStepProposal(result.proposal);
    const durableResult: AgentStepResult = { ...result, proposal };
    if (
      (await this.#config.sha256(canonicalJson(durableResult))) !==
      call.outputDigest
    )
      return stale();
    let bindings: readonly AgentKernelToolBinding[] = [];
    if (proposal.kind === "actions") {
      const rebound = await this.#config.planner.plan(run, signal);
      if (!exactBindings(rebound, input.request)) return stale();
      bindings = rebound.tools;
    }
    currentRun(await this.#config.journal.readRunProjection(run.runId), run);
    const transition = await transitionFor(
      proposal,
      {
        agent: input.request.agent,
        contextPlan: input.request.contextPlan,
        finalizationOnly: input.request.finalizationOnly,
        route: input.request.route,
        tools: bindings,
      },
      run,
      input.request.stepId,
      this.#config.now(),
      this.#config.eligibleActorId,
      this.#config.sha256,
    );
    if (signal.aborted) throw new PortableAuthorityError("ACTION_CANCELLED");
    const commit = await this.#config.journal.commitTransition(transition);
    if (commit.runId !== run.runId || commit.revision !== run.revision + 1)
      return stale();
    return {
      commit,
      kind: "committed",
      proposalKind: proposal.kind,
      runId: run.runId,
      stepId: input.request.stepId,
    };
  }
}
