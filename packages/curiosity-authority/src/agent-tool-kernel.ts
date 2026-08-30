import {
  createActionGrant,
  createToolRequestDigest,
  type ActionGrant,
} from "./action-grant.js";
import type {
  AgentJournalRunnableToolAction,
  AgentToolJournalPort,
} from "./agent-journal-port.js";
import { canonicalJson, utf8ByteLength } from "./canonical-json.js";
import { PortableAuthorityError, type Sha256 } from "./domain.js";
import type { Awaitable } from "./workflow-domain.js";

export interface AgentReadToolBinding {
  readonly effectClass: "read-only";
  readonly execute: (request: {
    readonly grant: ActionGrant;
    readonly input: unknown;
    readonly signal: AbortSignal;
  }) => Awaitable<unknown>;
  readonly toolId: string;
  readonly toolVersion: string;
}

export interface AgentReadToolKernelConfig {
  readonly catalogDigest: string;
  readonly grantedCapabilities: readonly string[];
  readonly journal: AgentToolJournalPort;
  readonly leaseDurationMs?: number;
  readonly now: () => string;
  readonly ownerId: string;
  readonly sha256: Sha256;
  readonly tools: readonly AgentReadToolBinding[];
}

export type AgentReadToolDrainResult =
  | { readonly kind: "idle" }
  | {
      readonly actionId: string;
      readonly errorCode: string;
      readonly kind: "failed";
    }
  | { readonly actionId: string; readonly kind: "stale" }
  | { readonly actionId: string; readonly kind: "succeeded" };

const digestPattern = /^[a-f0-9]{64}$/u;
const identifierPattern = /^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$/u;
const maximumReceiptBytes = 240 * 1_024;
const defaultLeaseDurationMs = 5 * 60 * 1_000;

const checkedTime = (value: string): number => {
  const time = Date.parse(value);
  if (!Number.isFinite(time) || new Date(time).toISOString() !== value)
    throw new PortableAuthorityError("AGENT_TOOL_TIME_INVALID");
  return time;
};

const errorCode = (error: unknown, signal: AbortSignal): string => {
  if (signal.aborted) return "ACTION_CANCELLED";
  const value =
    error && typeof error === "object"
      ? (error as { readonly code?: unknown }).code
      : undefined;
  if (typeof value === "string" && identifierPattern.test(value)) return value;
  if (error instanceof Error && identifierPattern.test(error.message))
    return error.message;
  return "AGENT_TOOL_EXECUTION_FAILED";
};

const exactCapabilities = (
  action: AgentJournalRunnableToolAction,
  granted: ReadonlySet<string>,
): boolean =>
  action.requestedCapabilities.length > 0 &&
  action.requestedCapabilities.every((capability) => granted.has(capability)) &&
  [...action.requestedCapabilities].sort().join("\u0000") ===
    action.requestedCapabilities.join("\u0000") &&
  new Set(action.requestedCapabilities).size ===
    action.requestedCapabilities.length;

export class AgentReadToolKernel {
  readonly #config: AgentReadToolKernelConfig;
  readonly #grantedCapabilities: ReadonlySet<string>;
  readonly #tools: ReadonlyMap<string, AgentReadToolBinding>;
  #draining = false;

  constructor(config: AgentReadToolKernelConfig) {
    const leaseDurationMs = config.leaseDurationMs ?? defaultLeaseDurationMs;
    const tools = new Map(config.tools.map((tool) => [tool.toolId, tool]));
    if (
      !digestPattern.test(config.catalogDigest) ||
      !identifierPattern.test(config.ownerId) ||
      !Number.isSafeInteger(leaseDurationMs) ||
      leaseDurationMs < 1_000 ||
      leaseDurationMs > 60 * 60 * 1_000 ||
      tools.size !== config.tools.length ||
      config.grantedCapabilities.length > 64 ||
      config.grantedCapabilities.some(
        (capability) => !identifierPattern.test(capability),
      ) ||
      [...config.grantedCapabilities].sort().join("\u0000") !==
        config.grantedCapabilities.join("\u0000") ||
      new Set(config.grantedCapabilities).size !==
        config.grantedCapabilities.length ||
      config.tools.some(
        ({ effectClass, toolId, toolVersion }) =>
          effectClass !== "read-only" ||
          !identifierPattern.test(toolId) ||
          !identifierPattern.test(toolVersion),
      )
    )
      throw new PortableAuthorityError("AGENT_TOOL_KERNEL_CONFIG_INVALID");
    this.#config = { ...config, leaseDurationMs };
    this.#grantedCapabilities = new Set(config.grantedCapabilities);
    this.#tools = tools;
  }

  async drainOne(signal: AbortSignal): Promise<AgentReadToolDrainResult> {
    if (this.#draining)
      throw new PortableAuthorityError("AGENT_TOOL_KERNEL_BUSY");
    if (signal.aborted) throw new PortableAuthorityError("ACTION_CANCELLED");
    this.#draining = true;
    try {
      const action = (await this.#config.journal.runnableToolActions(1))[0];
      if (!action) return { kind: "idle" };
      return await this.#execute(action, signal);
    } finally {
      this.#draining = false;
    }
  }

  async #execute(
    action: AgentJournalRunnableToolAction,
    signal: AbortSignal,
  ): Promise<AgentReadToolDrainResult> {
    const binding = this.#tools.get(action.actionType);
    if (!binding || !exactCapabilities(action, this.#grantedCapabilities))
      throw new PortableAuthorityError("AGENT_TOOL_UNAVAILABLE");
    if ((await this.#config.sha256(canonicalJson(action.input))) !== action.inputDigest)
      throw new PortableAuthorityError("AGENT_TOOL_ACTION_STALE");
    const requestDigest = await createToolRequestDigest(
      binding.toolId,
      binding.toolVersion,
      action.input,
      this.#config.sha256,
    );
    const generation = action.executionGeneration + 1;
    const [attemptId, callId] = await Promise.all([
      this.#config.sha256(
        canonicalJson({ actionId: action.actionId, generation, kind: "tool-attempt" }),
      ),
      this.#config.sha256(
        canonicalJson({ actionId: action.actionId, generation, kind: "tool-call" }),
      ),
    ]);
    const allocatedAt = this.#config.now();
    const leaseExpiresAt = new Date(
      checkedTime(allocatedAt) + (this.#config.leaseDurationMs ?? defaultLeaseDurationMs),
    ).toISOString();
    const snapshot = {
      actionId: action.actionId,
      catalogDigest: this.#config.catalogDigest,
      grantedCapabilities: [...action.requestedCapabilities],
      inputDigest: action.inputDigest,
      runId: action.runId,
      schemaVersion: 1,
      toolId: binding.toolId,
      toolVersion: binding.toolVersion,
    };
    const snapshotDigest = await this.#config.sha256(canonicalJson(snapshot));
    const allocation = await this.#config.journal.armDispatch({
      actionId: action.actionId,
      allocatedAt,
      attemptId,
      callId,
      dispatch: {
        kind: "tool",
        modelToolCallId: action.actionId,
        requestDigest,
        toolName: binding.toolId,
        toolVersion: binding.toolVersion,
      },
      executionId: action.executionId,
      generation,
      inputDigest: action.inputDigest,
      leaseExpiresAt,
      ownerId: this.#config.ownerId,
      phase: "allocate",
      snapshot,
      snapshotDigest,
    });
    if (allocation.disposition !== "armed")
      throw new PortableAuthorityError("AGENT_TOOL_DISPATCH_DENIED");
    const grant = await createActionGrant(
      {
        actionId: action.actionId,
        attemptId,
        callId,
        catalogDigest: this.#config.catalogDigest,
        deadlineAt: leaseExpiresAt,
        executionId: action.executionId,
        generation,
        inputDigest: action.inputDigest,
        requestDigest,
        requestedCapabilities: action.requestedCapabilities,
        resource: action.resource,
        toolId: binding.toolId,
        toolVersion: binding.toolVersion,
      },
      this.#config.sha256,
    );
    let receipt: unknown;
    let outputDigest: string;
    try {
      receipt = await binding.execute({ grant, input: action.input, signal });
      if (signal.aborted) throw new PortableAuthorityError("ACTION_CANCELLED");
      const serialized = canonicalJson(receipt);
      if (utf8ByteLength(serialized) > maximumReceiptBytes)
        throw new PortableAuthorityError("AGENT_TOOL_OUTPUT_TOO_LARGE");
      outputDigest = await this.#config.sha256(serialized);
    } catch (error) {
      return await this.#settleFailure(
        action.actionId,
        attemptId,
        callId,
        generation,
        errorCode(error, signal),
      );
    }
    const settlement = await this.#config.journal.settleAttempt({
      actionId: action.actionId,
      attemptId,
      callId,
      completedAt: this.#config.now(),
      events: [
        {
          body: { actionId: action.actionId, outputDigest, receipt, schemaVersion: 1 },
          streamId: action.actionId,
          type: "action.succeeded",
        },
      ],
      generation,
      kind: "tool",
      outputDigest,
      status: "succeeded",
    });
    return settlement.disposition === "committed"
      ? { actionId: action.actionId, kind: "succeeded" }
      : { actionId: action.actionId, kind: "stale" };
  }

  async #settleFailure(
    actionId: string,
    attemptId: string,
    callId: string,
    generation: number,
    code: string,
  ): Promise<AgentReadToolDrainResult> {
    const outputDigest = await this.#config.sha256(canonicalJson({ errorCode: code }));
    const settlement = await this.#config.journal.settleAttempt({
      actionId,
      attemptId,
      callId,
      completedAt: this.#config.now(),
      errorCode: code,
      events: [
        {
          body: { actionId, errorCode: code, schemaVersion: 1 },
          streamId: actionId,
          type: "action.failed",
        },
      ],
      generation,
      kind: "tool",
      outputDigest,
      status: code === "ACTION_CANCELLED" ? "cancelled" : "failed",
    });
    return settlement.disposition === "committed"
      ? { actionId, errorCode: code, kind: "failed" }
      : { actionId, kind: "stale" };
  }
}
