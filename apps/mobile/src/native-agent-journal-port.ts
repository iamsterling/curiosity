import {
  PortableAuthorityError,
  type AgentJournalDispatchResult,
  type AgentJournalMutationResult,
  type AgentJournalPort,
  type AgentJournalProviderActionProjection,
  type AgentJournalProviderCallProjection,
  type AgentJournalReconciledAttempt,
  type AgentJournalSettlementResult,
  type AgentRunProjection,
} from "@curiosity/authority";

export interface NativeAgentJournalModule {
  agentJournalCall(inputJson: string): Promise<string>;
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

export const createNativeAgentJournal = (
  native: NativeAgentJournalModule,
): AgentJournalPort => ({
  armDispatch: async (input) => {
    const result = dispatch(
      await call(native, { dispatch: input, operation: "armDispatch" }),
    );
    sameAttempt(input, result);
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
  runnableRuns: async (limit) => {
    const value = await call(native, { limit, operation: "runnableRuns" });
    if (!Array.isArray(value))
      throw new PortableAuthorityError("NATIVE_JOURNAL_RESPONSE_INVALID");
    return value.map(projection);
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
