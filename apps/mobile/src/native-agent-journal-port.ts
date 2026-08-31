import {
  PortableAuthorityError,
  type AgentCancellationJournalPort,
  type AgentControlJournalPort,
  type AgentJournalControlMutationResult,
  type AgentJournalCancelRunResult,
  type AgentJournalDispatchResult,
  type AgentJournalGateProjection,
  type AgentJournalMutationResult,
  type AgentJournalPort,
  type AgentJournalProviderActionProjection,
  type AgentJournalProviderCallProjection,
  type AgentJournalQuestionProjection,
  type AgentJournalReconciledAttempt,
  type AgentJournalRunnableToolAction,
  type AgentJournalSettlementResult,
  type AgentJournalTerminalRun,
  type AgentJournalOperatorRequests,
  type AgentRunProjection,
  type AgentTerminalJournalPort,
  type AgentToolJournalPort,
} from "@curiosity/authority";

export interface NativeAgentJournalModule {
  agentJournalCall(inputJson: string): Promise<string>;
}

export interface AgentActivityPort {
  readonly listRunProjections: (
    limit: number,
  ) => Promise<readonly AgentRunProjection[]>;
}

const codes = new Set([
  "COMMAND_DIGEST_CONFLICT",
  "EVENT_HASH_CHAIN_INVALID",
  "EVENT_SCHEMA_VERSION_UNSUPPORTED",
  "NATIVE_AGENT_IDENTITY_CONFLICT",
  "NATIVE_AGENT_RECORD_NOT_FOUND",
  "NATIVE_AGENT_REVISION_FENCED",
  "NATIVE_JOURNAL_ABI_UNSUPPORTED",
  "NATIVE_JOURNAL_REQUEST_INVALID",
  "NATIVE_JOURNAL_RESPONSE_INVALID",
  "NATIVE_JOURNAL_RESPONSE_TOO_LARGE",
  "NATIVE_JOURNAL_STORAGE_UNAVAILABLE",
  "NATIVE_JOURNAL_TRANSACTION_FAILED",
]);

const code = (error: unknown): string => {
  if (error && typeof error === "object") {
    const value = (error as { readonly code?: unknown }).code;
    if (typeof value === "string" && codes.has(value)) return value;
  }
  if (error instanceof Error && codes.has(error.message)) return error.message;
  return "NATIVE_JOURNAL_TRANSACTION_FAILED";
};

const object = (value: unknown): Record<string, unknown> => {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new PortableAuthorityError("NATIVE_JOURNAL_RESPONSE_INVALID");
  return value as Record<string, unknown>;
};

const json = (value: string): unknown => {
  try {
    return JSON.parse(value) as unknown;
  } catch {
    throw new PortableAuthorityError("NATIVE_JOURNAL_RESPONSE_INVALID");
  }
};

const string = (value: unknown): string => {
  if (typeof value !== "string" || !value)
    throw new PortableAuthorityError("NATIVE_JOURNAL_RESPONSE_INVALID");
  return value;
};

const integer = (value: unknown): number => {
  if (!Number.isSafeInteger(value))
    throw new PortableAuthorityError("NATIVE_JOURNAL_RESPONSE_INVALID");
  return value as number;
};

const boolean = (value: unknown): boolean => {
  if (typeof value !== "boolean")
    throw new PortableAuthorityError("NATIVE_JOURNAL_RESPONSE_INVALID");
  return value;
};

const call = async (
  native: NativeAgentJournalModule,
  request: Record<string, unknown>,
): Promise<unknown> => {
  try {
    return json(await native.agentJournalCall(JSON.stringify(request)));
  } catch (error) {
    if (error instanceof PortableAuthorityError) throw error;
    throw new PortableAuthorityError(code(error));
  }
};

const mutation = (value: unknown): AgentJournalMutationResult => {
  const item = object(value);
  const disposition = string(item.disposition);
  if (disposition !== "accepted" && disposition !== "duplicate")
    throw new PortableAuthorityError("NATIVE_JOURNAL_RESPONSE_INVALID");
  return {
    disposition,
    revision: integer(item.revision),
    runId: string(item.runId),
  };
};

const strings = (value: unknown): readonly string[] => {
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string"))
    throw new PortableAuthorityError("NATIVE_JOURNAL_RESPONSE_INVALID");
  return value as string[];
};

const optionalString = (
  item: Record<string, unknown>,
  name: string,
): string | undefined => {
  const value = item[name];
  return value === null || value === undefined ? undefined : string(value);
};

const providerCall = (value: unknown): AgentJournalProviderCallProjection => {
  const item = object(value);
  const dispatchState = string(item.dispatchState);
  const status = string(item.status);
  if (
    !["armed", "dispatched"].includes(dispatchState) ||
    !["allocated", "delivery-unknown", "failed", "succeeded"].includes(status)
  )
    throw new PortableAuthorityError("NATIVE_JOURNAL_RESPONSE_INVALID");
  const terminal = item.terminalEvent;
  const terminalEvent =
    terminal === null || terminal === undefined
      ? undefined
      : (() => {
          const event = object(terminal);
          return {
            body: event.body,
            streamId: string(event.streamId),
            type: string(event.type),
          };
        })();
  return {
    allocatedAt: string(item.allocatedAt),
    attemptId: string(item.attemptId),
    callId: string(item.callId),
    ...(optionalString(item, "completedAt")
      ? { completedAt: optionalString(item, "completedAt") }
      : {}),
    dispatchState:
      dispatchState as AgentJournalProviderCallProjection["dispatchState"],
    ...(optionalString(item, "dispatchedAt")
      ? { dispatchedAt: optionalString(item, "dispatchedAt") }
      : {}),
    ...(optionalString(item, "errorCode")
      ? { errorCode: optionalString(item, "errorCode") }
      : {}),
    generation: integer(item.generation),
    modelId: string(item.modelId),
    ...(optionalString(item, "outputDigest")
      ? { outputDigest: optionalString(item, "outputDigest") }
      : {}),
    promptSnapshotDigest: string(item.promptSnapshotDigest),
    requestDigest: string(item.requestDigest),
    sourceRevision: integer(item.sourceRevision),
    status: status as AgentJournalProviderCallProjection["status"],
    ...(terminalEvent ? { terminalEvent } : {}),
  };
};

const providerAction = (
  value: unknown,
): AgentJournalProviderActionProjection => {
  const item = object(value);
  const status = string(item.status);
  if (
    ![
      "delivery-unknown",
      "failed",
      "proposed",
      "running",
      "succeeded",
    ].includes(status)
  )
    throw new PortableAuthorityError("NATIVE_JOURNAL_RESPONSE_INVALID");
  return {
    actionId: string(item.actionId),
    ...(item.call === null || item.call === undefined
      ? {}
      : { call: providerCall(item.call) }),
    ...(optionalString(item, "errorCode")
      ? { errorCode: optionalString(item, "errorCode") }
      : {}),
    input: item.input,
    inputDigest: string(item.inputDigest),
    ...(optionalString(item, "outputDigest")
      ? { outputDigest: optionalString(item, "outputDigest") }
      : {}),
    status: status as AgentJournalProviderActionProjection["status"],
  };
};

const projection = (value: unknown): AgentRunProjection => {
  const item = object(value);
  const limits = object(item.limits);
  const status = string(item.status);
  if (
    ![
      "cancelled",
      "completed",
      "completion-requested",
      "failed",
      "running",
    ].includes(status)
  )
    throw new PortableAuthorityError("NATIVE_JOURNAL_RESPONSE_INVALID");
  return {
    actionCount: integer(item.actionCount),
    capabilityCeiling: strings(item.capabilityCeiling),
    childCount: integer(item.childCount),
    ...(optionalString(item, "childKey")
      ? { childKey: optionalString(item, "childKey") }
      : {}),
    contributionId: string(item.contributionId),
    contributionVersion: string(item.contributionVersion),
    createdAt: string(item.createdAt),
    depth: integer(item.depth),
    ...(optionalString(item, "errorCode")
      ? { errorCode: optionalString(item, "errorCode") }
      : {}),
    executionGeneration: integer(item.executionGeneration),
    executionId: string(item.executionId),
    input: item.input,
    ...(optionalString(item, "lastProgressKey")
      ? { lastProgressKey: optionalString(item, "lastProgressKey") }
      : {}),
    limits: {
      maxActions: integer(limits.maxActions),
      maxChildren: integer(limits.maxChildren),
      maxDelegationDepth: integer(limits.maxDelegationDepth),
      maxNoProgress: integer(limits.maxNoProgress),
      maxSteps: integer(limits.maxSteps),
    },
    noProgressCount: integer(item.noProgressCount),
    ...(optionalString(item, "parentRunId")
      ? { parentRunId: optionalString(item, "parentRunId") }
      : {}),
    pluginId: string(item.pluginId),
    ...(item.providerAction === null || item.providerAction === undefined
      ? {}
      : { providerAction: providerAction(item.providerAction) }),
    revision: integer(item.revision),
    runId: string(item.runId),
    sourceEventId: string(item.sourceEventId),
    state: item.state,
    stateDigest: string(item.stateDigest),
    status: status as AgentRunProjection["status"],
    updatedAt: string(item.updatedAt),
    workflowName: string(item.workflowName),
  };
};

const runnableToolAction = (value: unknown): AgentJournalRunnableToolAction => {
  const item = object(value);
  const deadlineClass = string(item.deadlineClass);
  const gateClass = string(item.gateClass);
  if (
    !["background", "interactive"].includes(deadlineClass) ||
    !["binding-human-requested", "none-requested"].includes(gateClass)
  )
    throw new PortableAuthorityError("NATIVE_JOURNAL_RESPONSE_INVALID");
  const gateReceipt =
    item.gateReceipt === null || item.gateReceipt === undefined
      ? undefined
      : (() => {
          const receipt = object(item.gateReceipt);
          return {
            gateId: string(receipt.gateId),
            payloadDigest: string(receipt.payloadDigest),
            proposalRevision: integer(receipt.proposalRevision),
          };
        })();
  if (
    (gateClass === "binding-human-requested" &&
      (!gateReceipt ||
        gateReceipt.payloadDigest !== item.inputDigest ||
        gateReceipt.proposalRevision < 1)) ||
    (gateClass === "none-requested" && gateReceipt)
  )
    throw new PortableAuthorityError("NATIVE_JOURNAL_RESPONSE_INVALID");
  return {
    actionId: string(item.actionId),
    actionSchemaVersion: integer(item.actionSchemaVersion),
    actionType: string(item.actionType),
    createdAt: string(item.createdAt),
    deadlineClass:
      deadlineClass as AgentJournalRunnableToolAction["deadlineClass"],
    executionGeneration: integer(item.executionGeneration),
    executionId: string(item.executionId),
    gateClass: gateClass as AgentJournalRunnableToolAction["gateClass"],
    ...(gateReceipt ? { gateReceipt } : {}),
    input: item.input,
    inputDigest: string(item.inputDigest),
    pluginId: string(item.pluginId),
    reactorId: string(item.reactorId),
    requestedCapabilities: strings(item.requestedCapabilities),
    resource: string(item.resource),
    runId: string(item.runId),
    sourceEventId: string(item.sourceEventId),
  };
};

const questionProjection = (value: unknown): AgentJournalQuestionProjection => {
  const item = object(value);
  const status = string(item.status);
  if (!["answered", "cancelled", "pending"].includes(status))
    throw new PortableAuthorityError("NATIVE_JOURNAL_RESPONSE_INVALID");
  return {
    actionId: string(item.actionId),
    allowFreeText: boolean(item.allowFreeText),
    ...(optionalString(item, "answer")
      ? { answer: optionalString(item, "answer") }
      : {}),
    executionId: string(item.executionId),
    options: strings(item.options),
    prompt: string(item.prompt),
    questionId: string(item.questionId),
    runId: string(item.runId),
    status: status as AgentJournalQuestionProjection["status"],
  };
};

const gateProjection = (value: unknown): AgentJournalGateProjection => {
  const item = object(value);
  const status = string(item.status);
  if (!["approved", "denied", "expired", "pending"].includes(status))
    throw new PortableAuthorityError("NATIVE_JOURNAL_RESPONSE_INVALID");
  return {
    actionId: string(item.actionId),
    actionType: string(item.actionType),
    createdAt: string(item.createdAt),
    eligibleActorId: string(item.eligibleActorId),
    expiresAt: string(item.expiresAt),
    gateId: string(item.gateId),
    input: item.input,
    payloadDigest: string(item.payloadDigest),
    proposalRevision: integer(item.proposalRevision),
    requestedCapabilities: strings(item.requestedCapabilities),
    resource: string(item.resource),
    runId: string(item.runId),
    status: status as AgentJournalGateProjection["status"],
  };
};

const operatorRequests = (value: unknown): AgentJournalOperatorRequests => {
  const item = object(value);
  if (!Array.isArray(item.gates) || !Array.isArray(item.questions))
    throw new PortableAuthorityError("NATIVE_JOURNAL_RESPONSE_INVALID");
  return {
    gates: item.gates.map(gateProjection),
    questions: item.questions.map(questionProjection),
  };
};

const controlMutation = (value: unknown): AgentJournalControlMutationResult => {
  const item = object(value);
  const disposition = string(item.disposition);
  if (disposition !== "accepted" && disposition !== "duplicate")
    throw new PortableAuthorityError("NATIVE_JOURNAL_RESPONSE_INVALID");
  return {
    actionId: string(item.actionId),
    disposition,
    runId: string(item.runId),
  };
};

const dispatch = (value: unknown): AgentJournalDispatchResult => {
  const item = object(value);
  const disposition = string(item.disposition);
  if (
    ![
      "armed",
      "authorized",
      "denied",
      "duplicate",
      "resource-collision",
    ].includes(disposition)
  )
    throw new PortableAuthorityError("NATIVE_JOURNAL_RESPONSE_INVALID");
  return {
    actionId: string(item.actionId),
    attemptId: string(item.attemptId),
    callId: string(item.callId),
    disposition: disposition as AgentJournalDispatchResult["disposition"],
    generation: integer(item.generation),
  };
};

const settlement = (value: unknown): AgentJournalSettlementResult => {
  const item = object(value);
  const disposition = string(item.disposition);
  if (!["committed", "duplicate", "stale"].includes(disposition))
    throw new PortableAuthorityError("NATIVE_JOURNAL_RESPONSE_INVALID");
  return {
    actionId: string(item.actionId),
    attemptId: string(item.attemptId),
    callId: string(item.callId),
    disposition: disposition as AgentJournalSettlementResult["disposition"],
    generation: integer(item.generation),
  };
};

const sameAttempt = (
  expected: {
    readonly actionId: string;
    readonly attemptId: string;
    readonly callId: string;
    readonly generation: number;
  },
  actual: AgentJournalDispatchResult | AgentJournalSettlementResult,
): void => {
  if (
    actual.actionId !== expected.actionId ||
    actual.attemptId !== expected.attemptId ||
    actual.callId !== expected.callId ||
    actual.generation !== expected.generation
  )
    throw new PortableAuthorityError("NATIVE_AGENT_REVISION_FENCED");
};

const reconciled = (value: unknown): AgentJournalReconciledAttempt => {
  const item = object(value);
  const classification = string(item.classification);
  const kind = string(item.kind);
  if (
    !["cancelled", "delivery-unknown", "not-dispatched"].includes(
      classification,
    ) ||
    !["provider", "tool"].includes(kind)
  )
    throw new PortableAuthorityError("NATIVE_JOURNAL_RESPONSE_INVALID");
  return {
    actionId: string(item.actionId),
    attemptId: string(item.attemptId),
    callId: string(item.callId),
    classification:
      classification as AgentJournalReconciledAttempt["classification"],
    generation: integer(item.generation),
    kind: kind as AgentJournalReconciledAttempt["kind"],
  };
};

const terminalRun = (value: unknown): AgentJournalTerminalRun => {
  const item = object(value);
  if (
    item.status !== "cancelled" &&
    item.status !== "completed" &&
    item.status !== "failed"
  )
    throw new PortableAuthorityError("NATIVE_JOURNAL_RESPONSE_INVALID");
  return {
    runId: string(item.runId),
    status: item.status,
  } as AgentJournalTerminalRun;
};

const cancelledRun = (value: unknown): AgentJournalCancelRunResult => {
  const item = object(value);
  const disposition = string(item.disposition);
  const status = string(item.status);
  if (
    !["accepted", "duplicate"].includes(disposition) ||
    !["cancelled", "completed", "failed"].includes(status) ||
    !Array.isArray(item.physicalCalls)
  )
    throw new PortableAuthorityError("NATIVE_JOURNAL_RESPONSE_INVALID");
  const physicalCalls = item.physicalCalls.map((value) => {
    const call = object(value);
    const kind = string(call.kind);
    if (kind !== "provider" && kind !== "tool")
      throw new PortableAuthorityError("NATIVE_JOURNAL_RESPONSE_INVALID");
    return {
      callId: string(call.callId),
      kind: kind as "provider" | "tool",
    };
  });
  if (
    new Set(physicalCalls.map(({ callId, kind }) => `${kind}:${callId}`))
      .size !== physicalCalls.length
  )
    throw new PortableAuthorityError("NATIVE_JOURNAL_RESPONSE_INVALID");
  return {
    disposition: disposition as AgentJournalCancelRunResult["disposition"],
    physicalCalls,
    runId: string(item.runId),
    status: status as AgentJournalCancelRunResult["status"],
  };
};

export const createNativeAgentJournal = (
  native: NativeAgentJournalModule,
): AgentJournalPort &
  AgentCancellationJournalPort &
  AgentControlJournalPort &
  AgentActivityPort &
  AgentToolJournalPort &
  AgentTerminalJournalPort => ({
  answerQuestion: async (input) =>
    controlMutation(
      await call(native, { answer: input, operation: "answerQuestion" }),
    ),
  armDispatch: async (input) => {
    const result = dispatch(
      await call(native, { dispatch: input, operation: "armDispatch" }),
    );
    sameAttempt(input, result);
    return result;
  },
  cancelRun: async (runId, cancelledAt) => {
    const result = cancelledRun(
      await call(native, { cancelledAt, operation: "cancelRun", runId }),
    );
    if (result.runId !== runId)
      throw new PortableAuthorityError("NATIVE_AGENT_REVISION_FENCED");
    return result;
  },
  commitTransition: async (input) => {
    const result = mutation(
      await call(native, {
        operation: "commitTransition",
        transition: input,
      }),
    );
    if (
      result.runId !== input.runId ||
      result.revision !== input.expectedRevision + 1
    )
      throw new PortableAuthorityError("NATIVE_AGENT_REVISION_FENCED");
    return result;
  },
  decideGate: async (input) =>
    controlMutation(
      await call(native, { decision: input, operation: "decideGate" }),
    ),
  listOperatorRequests: async (limit) =>
    operatorRequests(
      await call(native, { limit, operation: "listOperatorRequests" }),
    ),
  listRunProjections: async (limit) => {
    const value = await call(native, {
      limit,
      operation: "listRunProjections",
    });
    if (!Array.isArray(value))
      throw new PortableAuthorityError("NATIVE_JOURNAL_RESPONSE_INVALID");
    return value.map(projection);
  },
  readRunProjection: async (runId) => {
    const value = await call(native, { operation: "readRunProjection", runId });
    if (value === null) return undefined;
    const result = projection(value);
    if (result.runId !== runId)
      throw new PortableAuthorityError("NATIVE_AGENT_REVISION_FENCED");
    return result;
  },
  reconcileInterrupted: async (reconciledAt) => {
    const value = object(
      await call(native, { operation: "reconcileInterrupted", reconciledAt }),
    ).attempts;
    if (!Array.isArray(value))
      throw new PortableAuthorityError("NATIVE_JOURNAL_RESPONSE_INVALID");
    return value.map(reconciled);
  },
  reconcileTerminalRuns: async (reconciledAt, limit) => {
    const value = await call(native, {
      limit,
      operation: "reconcileTerminalRuns",
      reconciledAt,
    });
    if (!Array.isArray(value))
      throw new PortableAuthorityError("NATIVE_JOURNAL_RESPONSE_INVALID");
    return value.map(terminalRun);
  },
  runnableRuns: async (limit) => {
    const value = await call(native, { limit, operation: "runnableRuns" });
    if (!Array.isArray(value))
      throw new PortableAuthorityError("NATIVE_JOURNAL_RESPONSE_INVALID");
    return value.map(projection);
  },
  runnableToolActions: async (limit) => {
    const value = await call(native, {
      limit,
      operation: "runnableToolActions",
    });
    if (!Array.isArray(value))
      throw new PortableAuthorityError("NATIVE_JOURNAL_RESPONSE_INVALID");
    return value.map(runnableToolAction);
  },
  settleAttempt: async (input) => {
    const result = settlement(
      await call(native, { operation: "settleAttempt", settlement: input }),
    );
    sameAttempt(input, result);
    return result;
  },
  startRun: async (input) => {
    const result = mutation(
      await call(native, { operation: "startRun", run: input }),
    );
    if (result.runId !== input.runId)
      throw new PortableAuthorityError("NATIVE_AGENT_REVISION_FENCED");
    return result;
  },
});
