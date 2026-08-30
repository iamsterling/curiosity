import {
  completeChatTurn,
  decodeChatTurnPayload,
  failChatTurn,
  proposeChatTurn,
  type ChatCompletion,
} from "./chat-semantics.js";
import { canonicalJson } from "./canonical-json.js";
import { createContextPlan, type ContextPlan } from "./context-plan.js";
import {
  PortableAuthorityError,
  type ChatMessageProjection,
  type ChatTurnPayload,
  type CommandAcknowledgement,
  type CommandInput,
  type ProposedEvent,
  type Sha256,
  type StoredEvent,
  type ThreadProjection,
} from "./domain.js";
import {
  createGenerationRouteReceipt,
  validateGenerationSelection,
  type GenerationRouteReceipt,
  type GenerationSelection,
} from "./generation-route.js";
import {
  validateGenerationTransportReceipt,
  type GenerationTransportReceipt,
} from "./generation-transport-receipt.js";
import { InMemoryJournal } from "./in-memory-journal.js";
import type { AuthorityJournal } from "./journal-port.js";
import type { Awaitable } from "./workflow-domain.js";
import {
  createMemoryCurationJob,
  decodeMemoryCurationResult,
  memoryCurationCompletedEvent,
  memoryCurationRequestedEvent,
  projectMemoryCurationJob,
  projectMemoryCurationProposalDigest,
  projectMemoryCurationJobStatus,
  type MemoryCurationJob,
} from "./memory-curation.js";
import {
  evaluateMemoryProposals,
  freezeMemoryAdmissionPolicy,
  type MemoryAdmissionPolicy,
  type MemoryPolicyResult,
} from "./memory-policy.js";
import { projectActiveMemories } from "./memory-projections.js";
import {
  projectChatMessages,
  projectGenerationRoute,
  projectThreads,
  projectTurnStatus,
} from "./projections.js";
import {
  decodeOpenThreadPayload,
  proposeThreadOpen,
} from "./thread-semantics.js";

export interface GenerationRequest {
  readonly agentId: string;
  readonly messages: readonly {
    readonly content: string;
    readonly role: "assistant" | "user";
  }[];
  readonly contextPlan: ContextPlan;
  readonly route: GenerationRouteReceipt;
  readonly signal: AbortSignal;
  readonly tools: readonly [];
  readonly turnId: string;
}

export interface GenerationResult {
  readonly durationMs: number;
  readonly effort: string;
  readonly modelId: string;
  readonly text: string;
  readonly transportReceipt?: GenerationTransportReceipt;
}

export interface GenerationPort {
  readonly generate: (
    request: GenerationRequest,
    onDelta?: (delta: string) => void,
  ) => Promise<GenerationResult>;
}

export interface GenerationSelectionRequest {
  readonly contextPlanId: string;
  readonly purpose: "turn.answer";
  readonly turnId: string;
}

export interface GenerationSelectionPort {
  readonly select: (
    request: GenerationSelectionRequest,
  ) => Awaitable<GenerationSelection>;
}

export interface PortableAuthorityConfig {
  readonly actorId: string;
  readonly catalogDigest: string;
  readonly createId: () => string;
  readonly defaultPrimaryRole?: string;
  readonly enabledPrimaryRoles?: readonly string[];
  readonly generation?: GenerationPort;
  readonly generationSelection?: GenerationSelection | GenerationSelectionPort;
  readonly journal?: AuthorityJournal;
  readonly memoryPolicy?: MemoryAdmissionPolicy;
  readonly now: () => string;
  readonly sha256: Sha256;
}

interface ActiveTurn {
  readonly controller: AbortController;
  readonly payload: ChatTurnPayload;
  routeReceipt?: GenerationRouteReceipt;
  settled: boolean;
}

const pluginIdentity = (kind: string) => {
  if (kind === "thread.open")
    return {
      contributionId: "curiosity.stock.thread.commands.open",
      contributionVersion: "1",
      pluginId: "curiosity.stock.thread",
    };
  if (kind === "execution.cancel")
    return {
      contributionId: "curiosity.kernel.control.execution-cancel",
      contributionVersion: "1",
      pluginId: "curiosity.kernel.control",
    };
  if (kind === "chat.complete")
    return {
      contributionId: "curiosity.stock.chat.reactors.provider-succeeded",
      contributionVersion: "1",
      pluginId: "curiosity.stock.chat",
    };
  if (kind === "chat.fail")
    return {
      contributionId: "curiosity.stock.chat.reactors.provider-failed",
      contributionVersion: "1",
      pluginId: "curiosity.stock.chat",
    };
  if (kind === "generation.select")
    return {
      contributionId: "curiosity.kernel.routes.select",
      contributionVersion: "1",
      pluginId: "curiosity.kernel.routes",
    };
  if (kind === "memory.curation.request")
    return {
      contributionId: "curiosity.stock.memory.commands.request-curation",
      contributionVersion: "1",
      pluginId: "curiosity.stock.memory",
    };
  if (kind === "memory.curation.complete")
    return {
      contributionId: "curiosity.stock.memory.commands.complete-curation",
      contributionVersion: "1",
      pluginId: "curiosity.stock.memory",
    };
  return {
    contributionId: "curiosity.stock.chat.commands.turn",
    contributionVersion: "1",
    pluginId: "curiosity.stock.chat",
  };
};

export class PortableAuthority {
  readonly #activeTurns = new Map<string, ActiveTurn>();
  readonly #actorId: string;
  readonly #createId: () => string;
  readonly #defaultPrimaryRole: string;
  readonly #enabledPrimaryRoles: ReadonlySet<string>;
  readonly #generation: GenerationPort | undefined;
  readonly #generationSelection: GenerationSelectionPort | undefined;
  readonly #journal: AuthorityJournal;
  readonly #memoryPolicy: MemoryAdmissionPolicy | undefined;
  readonly #now: () => string;
  readonly #sha256: Sha256;
  #serial: Promise<void> = Promise.resolve();

  constructor(config: PortableAuthorityConfig) {
    this.#actorId = config.actorId;
    this.#createId = config.createId;
    this.#defaultPrimaryRole = config.defaultPrimaryRole ?? "generalist";
    this.#enabledPrimaryRoles = new Set(
      config.enabledPrimaryRoles ?? [this.#defaultPrimaryRole],
    );
    this.#generation = config.generation;
    this.#generationSelection = config.generationSelection
      ? "select" in config.generationSelection
        ? config.generationSelection
        : {
            select: () =>
              validateGenerationSelection(config.generationSelection),
          }
      : undefined;
    if (this.#generation && !this.#generationSelection)
      throw new PortableAuthorityError("GENERATION_ROUTE_SELECTION_REQUIRED");
    this.#journal = config.journal ?? new InMemoryJournal(config);
    this.#memoryPolicy = config.memoryPolicy
      ? freezeMemoryAdmissionPolicy(config.memoryPolicy)
      : undefined;
    this.#now = config.now;
    this.#sha256 = config.sha256;
  }

  events(): readonly StoredEvent[] {
    return this.#journal.events();
  }

  messages(threadId?: string): readonly ChatMessageProjection[] {
    return projectChatMessages(this.events(), threadId);
  }

  threads(): readonly ThreadProjection[] {
    return projectThreads(this.events());
  }

  memories() {
    return projectActiveMemories(this.events());
  }

  async requestMemoryCuration(turnId: string): Promise<MemoryCurationJob> {
    if (!this.#memoryPolicy)
      throw new PortableAuthorityError("MEMORY_POLICY_UNAVAILABLE");
    if (projectTurnStatus(this.events(), turnId) !== "completed")
      throw new PortableAuthorityError("MEMORY_SOURCE_TURN_INCOMPLETE");
    const messages = this.events().flatMap((event) => {
      if (event.type !== "message.appended") return [];
      const body =
        event.body &&
        typeof event.body === "object" &&
        !Array.isArray(event.body)
          ? (event.body as Record<string, unknown>)
          : undefined;
      if (
        body?.turnId !== turnId ||
        typeof body.messageId !== "string" ||
        typeof body.role !== "string" ||
        typeof body.text !== "string"
      )
        return [];
      return [
        {
          eventId: event.eventId,
          messageId: body.messageId,
          role: body.role,
          text: body.text,
        },
      ];
    });
    if (messages.length < 2)
      throw new PortableAuthorityError("MEMORY_SOURCE_MESSAGES_INCOMPLETE");
    const job = await createMemoryCurationJob(
      {
        policyId: this.#memoryPolicy.policyId,
        sourceDigest: await this.#sha256(canonicalJson({ messages, turnId })),
        sourceMessageIds: messages.map(({ messageId }) => messageId),
        sourceTurnId: turnId,
      },
      this.#sha256,
    );
    const existing = projectMemoryCurationJob(this.events(), job.jobId);
    if (existing) return existing;
    await this.#serialize(async () => {
      await this.#admit(
        {
          id: `memory.curation.request:${job.jobId}`,
          kind: "memory.curation.request",
          payload: { jobId: job.jobId },
          schemaVersion: 1,
        },
        [memoryCurationRequestedEvent(job)],
      );
    });
    return job;
  }

  async applyMemoryCurationResult(
    value: unknown,
  ): Promise<MemoryPolicyResult | undefined> {
    if (!this.#memoryPolicy)
      throw new PortableAuthorityError("MEMORY_POLICY_UNAVAILABLE");
    const envelope =
      value && typeof value === "object" && !Array.isArray(value)
        ? (value as Record<string, unknown>)
        : undefined;
    if (typeof envelope?.jobId !== "string")
      throw new PortableAuthorityError("MEMORY_CURATION_RESULT_INVALID");
    const job = projectMemoryCurationJob(this.events(), envelope.jobId);
    if (!job) throw new PortableAuthorityError("MEMORY_CURATION_JOB_NOT_FOUND");
    if (job.policyId !== this.#memoryPolicy.policyId)
      throw new PortableAuthorityError("MEMORY_POLICY_VERSION_CHANGED");
    const result = decodeMemoryCurationResult(value, job);
    const status = projectMemoryCurationJobStatus(this.events(), job.jobId);
    if (status === "completed") {
      const proposalDigest = await this.#sha256(
        canonicalJson(result.proposals),
      );
      if (
        projectMemoryCurationProposalDigest(this.events(), job.jobId) !==
        proposalDigest
      )
        throw new PortableAuthorityError("MEMORY_CURATION_RESULT_CONFLICT");
      return undefined;
    }
    if (status !== "requested")
      throw new PortableAuthorityError("MEMORY_CURATION_JOB_NOT_RUNNABLE");
    const policyResult = await evaluateMemoryProposals(
      {
        activeMemories: this.memories(),
        jobId: job.jobId,
        policy: this.#memoryPolicy,
        proposals: result.proposals,
        sourceDigest: job.sourceDigest,
        sourceMessageIds: job.sourceMessageIds,
      },
      this.#sha256,
    );
    await this.#serialize(async () => {
      if (
        projectMemoryCurationJobStatus(this.events(), job.jobId) === "completed"
      )
        return;
      await this.#admit(
        {
          id: `memory.curation.complete:${job.jobId}`,
          kind: "memory.curation.complete",
          payload: {
            jobId: job.jobId,
            proposalDigest: policyResult.proposalDigest,
          },
          schemaVersion: 1,
        },
        [
          ...policyResult.events,
          memoryCurationCompletedEvent(job, policyResult),
        ],
      );
    });
    return policyResult;
  }

  async submit(command: CommandInput): Promise<CommandAcknowledgement> {
    return this.#serialize(async () => {
      if (command.schemaVersion !== 1 || !command.id || !command.kind)
        throw new PortableAuthorityError("COMMAND_ENVELOPE_INVALID");
      if (command.kind === "thread.open") {
        const payload = decodeOpenThreadPayload(command.payload);
        return this.#admit(command, proposeThreadOpen(payload));
      }
      if (command.kind !== "chat.turn")
        throw new PortableAuthorityError("COMMAND_KIND_UNAVAILABLE");
      const payload = decodeChatTurnPayload(command.payload);
      const agentId = payload.agentId ?? this.#defaultPrimaryRole;
      if (!this.#enabledPrimaryRoles.has(agentId))
        throw new PortableAuthorityError("CHAT_AGENT_UNKNOWN");
      return this.#admit(
        command,
        proposeChatTurn(payload, agentId, this.events()),
      );
    });
  }

  async runTurn(
    command: CommandInput,
    onDelta?: (delta: string) => void,
  ): Promise<ChatCompletion> {
    const payload = decodeChatTurnPayload(command.payload);
    await this.submit(command);
    if (this.#activeTurns.has(payload.turnId))
      throw new PortableAuthorityError("CHAT_TURN_ALREADY_ACTIVE");
    const existing = this.messages(payload.threadId).find(
      (message) =>
        message.role === "assistant" && message.turnId === payload.turnId,
    );
    if (existing)
      return {
        assistantMessageId: existing.messageId,
        durationMs: existing.durationMs ?? 0,
        effort: existing.effort ?? "default",
        modelId: existing.modelId ?? "",
        ...(existing.routeReceipt
          ? { routeReceipt: existing.routeReceipt }
          : {}),
        ...(existing.transportReceipt
          ? { transportReceipt: existing.transportReceipt }
          : {}),
        text: existing.text,
        threadId: existing.threadId,
        turnId: existing.turnId,
      };
    if (projectTurnStatus(this.events(), payload.turnId) !== "pending")
      throw new PortableAuthorityError("CHAT_TURN_INCOMPLETE");

    const active: ActiveTurn = {
      controller: new AbortController(),
      payload,
      settled: false,
    };
    this.#activeTurns.set(payload.turnId, active);
    if (!this.#generation) {
      try {
        await this.#fail(active, "PROVIDER_ROUTE_UNAVAILABLE");
        throw new PortableAuthorityError("PROVIDER_ROUTE_UNAVAILABLE");
      } finally {
        this.#activeTurns.delete(payload.turnId);
      }
    }

    try {
      const messages = this.messages(payload.threadId);
      const contextPlan = await this.#contextPlan(payload.threadId, messages);
      const routeReceipt = await this.#selectRoute(
        payload.turnId,
        contextPlan.contextPlanId,
        active,
      );
      if (active.settled || active.controller.signal.aborted)
        throw new PortableAuthorityError("ACTION_CANCELLED");
      const result = await this.#generation.generate(
        {
          agentId: payload.agentId ?? this.#defaultPrimaryRole,
          contextPlan,
          messages: messages.map(({ role, text }) => ({
            content: text,
            role,
          })),
          route: routeReceipt,
          signal: active.controller.signal,
          tools: [],
          turnId: payload.turnId,
        },
        onDelta,
      );
      if (active.settled || active.controller.signal.aborted)
        throw new PortableAuthorityError("ACTION_CANCELLED");
      if (result.modelId !== routeReceipt.modelId)
        throw new PortableAuthorityError("GENERATION_ROUTE_MISMATCH");
      const transportReceipt = result.transportReceipt
        ? validateGenerationTransportReceipt(result.transportReceipt)
        : undefined;
      if (transportReceipt && transportReceipt.callId !== payload.turnId)
        throw new PortableAuthorityError(
          "GENERATION_TRANSPORT_RECEIPT_INVALID",
        );
      const completion: ChatCompletion = {
        ...payload,
        ...result,
        routeReceipt,
        ...(transportReceipt ? { transportReceipt } : {}),
      };
      await this.#serialize(async () => {
        active.settled = true;
        await this.#admit(
          this.#systemCommand("chat.complete", completion.turnId),
          completeChatTurn(completion),
        );
      });
      return Object.freeze(completion);
    } catch (error) {
      if (active.controller.signal.aborted)
        throw new PortableAuthorityError("ACTION_CANCELLED");
      active.settled = false;
      const code =
        error instanceof PortableAuthorityError
          ? error.code
          : "TEXT_GENERATION_FAILED";
      await this.#fail(active, code);
      throw new PortableAuthorityError(code);
    } finally {
      this.#activeTurns.delete(payload.turnId);
    }
  }

  async cancel(turnId: string): Promise<void> {
    const active = this.#activeTurns.get(turnId);
    if (!active || active.settled) return;
    active.settled = true;
    active.controller.abort();
    await this.#serialize(async () => {
      await this.#admit(this.#systemCommand("execution.cancel", turnId), [
        {
          body: { executionId: turnId, schemaVersion: 1 },
          streamId: turnId,
          type: "execution.cancelled",
        },
        failChatTurn(
          active.payload,
          "ACTION_CANCELLED",
          active.routeReceipt?.modelId ?? "",
          active.routeReceipt,
        ),
      ]);
    });
  }

  async #fail(active: ActiveTurn, code: string): Promise<void> {
    await this.#serialize(async () => {
      if (active.settled) return;
      await this.#admit(
        this.#systemCommand("chat.fail", active.payload.turnId),
        [
          failChatTurn(
            active.payload,
            code,
            active.routeReceipt?.modelId ?? "",
            active.routeReceipt,
          ),
        ],
      );
      active.settled = true;
    });
  }

  #systemCommand(kind: string, subject: string): CommandInput {
    return {
      id: `${kind}:${subject}:${this.#createId()}`,
      kind,
      payload: { subject },
      schemaVersion: 1,
    };
  }

  async #selectRoute(
    turnId: string,
    contextPlanId: string,
    active: ActiveTurn,
  ): Promise<GenerationRouteReceipt> {
    if (!this.#generationSelection)
      throw new PortableAuthorityError("PROVIDER_ROUTE_UNAVAILABLE");
    const existing = projectGenerationRoute(this.events(), turnId);
    if (existing) {
      active.routeReceipt = existing;
      return existing;
    }
    const selection = validateGenerationSelection(
      await this.#generationSelection.select({
        contextPlanId,
        purpose: "turn.answer",
        turnId,
      }),
    );
    const receipt = await createGenerationRouteReceipt(
      selection,
      turnId,
      contextPlanId,
      this.#sha256,
    );
    active.routeReceipt = receipt;
    await this.#serialize(async () => {
      await this.#admit(
        {
          id: `generation.select:${receipt.selectionId}`,
          kind: "generation.select",
          payload: { subject: turnId },
          schemaVersion: 1,
        },
        [
          {
            body: { routeReceipt: receipt, schemaVersion: 1, turnId },
            streamId: turnId,
            type: "generation.route.selected",
          },
        ],
      );
    });
    return receipt;
  }

  async #contextPlan(
    threadId: string,
    messages: readonly ChatMessageProjection[],
  ): Promise<ContextPlan> {
    const sourceEventIds = new Map<string, string>();
    for (const event of this.events()) {
      if (event.type !== "message.appended") continue;
      const body =
        event.body &&
        typeof event.body === "object" &&
        !Array.isArray(event.body)
          ? (event.body as Record<string, unknown>)
          : undefined;
      if (body?.threadId === threadId && typeof body.messageId === "string")
        sourceEventIds.set(body.messageId, event.eventId);
    }
    return createContextPlan(
      messages.map((message) => ({
        blockId: `message:${message.messageId}`,
        content: `${message.role}: ${message.text}`,
        kind: "conversation",
        provenance: "trusted-durable",
        sourceEventIds: sourceEventIds.has(message.messageId)
          ? [sourceEventIds.get(message.messageId)!]
          : [],
      })),
      "ipados-chat-context-v1",
      this.#sha256,
    );
  }

  #admit(command: CommandInput, events: readonly ProposedEvent[]) {
    const identity = pluginIdentity(command.kind);
    return this.#journal.admit({
      acceptedAt: this.#now(),
      actorId: this.#actorId,
      command,
      events,
      ...identity,
    });
  }

  #serialize<T>(work: () => Promise<T>): Promise<T> {
    const result = this.#serial.then(work, work);
    this.#serial = result.then(
      () => undefined,
      () => undefined,
    );
    return result;
  }
}
