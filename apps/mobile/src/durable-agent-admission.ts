import {
  decodeChatTurnPayload,
  PortableAuthorityError,
  projectTurnStatus,
  type AgentJournalMutationResult,
  type AgentJournalPort,
  type ChatTurnPayload,
  type CommandAcknowledgement,
  type CommandInput,
  type PortableAuthority,
  type StoredEvent,
} from "@curiosity/authority";

export const durableChatWorkflowVersion = "1";
export const durableChatCapabilities = Object.freeze([
  "documents.read",
  "provider.generate",
]);

export interface DurableChatRunInput extends ChatTurnPayload {
  readonly agentId: string;
  readonly kind: "chat.turn";
  readonly schemaVersion: 1;
}

export interface DurableAgentAdmissionConfig {
  readonly journal: Pick<AgentJournalPort, "startRun">;
  readonly now: () => string;
}

export interface DurableChatAdmissionResult {
  readonly acknowledgement: CommandAcknowledgement;
  readonly run: AgentJournalMutationResult;
  readonly runId: string;
  readonly turnId: string;
}

const record = (value: unknown): Record<string, unknown> | undefined =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;

const requestedPayload = (
  request: StoredEvent,
  events: readonly StoredEvent[],
): DurableChatRunInput => {
  const body = record(request.body);
  if (
    !body ||
    typeof body.agentId !== "string" ||
    typeof body.assistantMessageId !== "string" ||
    typeof body.threadId !== "string" ||
    typeof body.turnId !== "string"
  )
    throw new PortableAuthorityError("DURABLE_CHAT_ADMISSION_INVALID");
  const message = events.find((event) => {
    if (
      event.commandId !== request.commandId ||
      event.type !== "message.appended"
    )
      return false;
    const messageBody = record(event.body);
    return messageBody?.role === "user" && messageBody.turnId === body.turnId;
  });
  const messageBody = record(message?.body);
  if (
    !messageBody ||
    typeof messageBody.messageId !== "string" ||
    typeof messageBody.text !== "string"
  )
    throw new PortableAuthorityError("DURABLE_CHAT_ADMISSION_INVALID");
  const payload = decodeChatTurnPayload({
    agentId: body.agentId,
    assistantMessageId: body.assistantMessageId,
    ...(typeof body.projectId === "string"
      ? { projectId: body.projectId }
      : {}),
    text: messageBody.text,
    threadId: body.threadId,
    turnId: body.turnId,
    userMessageId: messageBody.messageId,
  });
  return Object.freeze({
    ...payload,
    agentId: body.agentId,
    kind: "chat.turn",
    schemaVersion: 1,
  });
};

const requestForCommand = (
  events: readonly StoredEvent[],
  commandId: string,
): StoredEvent => {
  const request = events.find(
    (event) => event.commandId === commandId && event.type === "turn.requested",
  );
  if (!request)
    throw new PortableAuthorityError("DURABLE_CHAT_SOURCE_EVENT_MISSING");
  return request;
};

const startInput = (
  input: DurableChatRunInput,
  sourceEventId: string,
  startedAt: string,
) => {
  const runId = `agent-run:${input.turnId}`;
  return {
    capabilityCeiling: durableChatCapabilities,
    contributionId: `curiosity.agent.${input.agentId}`,
    contributionVersion: durableChatWorkflowVersion,
    depth: 0,
    executionId: `agent-execution:${input.turnId}`,
    input,
    limits: {
      maxActions: 6,
      maxChildren: 0,
      maxDelegationDepth: 0,
      maxNoProgress: 2,
      maxSteps: 12,
    },
    pluginId: "curiosity.agent.runtime",
    runId,
    sourceEventId,
    startedAt,
    state: { phase: "ready", schemaVersion: 1 },
    workflowName: input.agentId,
  } as const;
};

export class DurableAgentAdmission {
  readonly #config: DurableAgentAdmissionConfig;
  #serial: Promise<void> = Promise.resolve();

  constructor(config: DurableAgentAdmissionConfig) {
    this.#config = config;
  }

  admit(
    authority: Pick<PortableAuthority, "events" | "submit">,
    command: CommandInput,
  ): Promise<DurableChatAdmissionResult> {
    return this.#serialize(async () => {
      const payload = decodeChatTurnPayload(command.payload);
      const acknowledgement = await authority.submit(command);
      const events = authority.events();
      const request = requestForCommand(events, command.id);
      const input = requestedPayload(request, events);
      if (input.turnId !== payload.turnId)
        throw new PortableAuthorityError("DURABLE_CHAT_ADMISSION_INVALID");
      const run = await this.#start(input, request.eventId);
      return Object.freeze({
        acknowledgement,
        run,
        runId: run.runId,
        turnId: input.turnId,
      });
    });
  }

  reconcile(
    authority: Pick<PortableAuthority, "events">,
    limit = 32,
  ): Promise<readonly AgentJournalMutationResult[]> {
    return this.#serialize(async () => {
      if (!Number.isSafeInteger(limit) || limit < 1 || limit > 128)
        throw new PortableAuthorityError(
          "DURABLE_CHAT_ADMISSION_LIMIT_INVALID",
        );
      const events = authority.events();
      const requests = events
        .filter((event) => event.type === "turn.requested")
        .filter((event) => {
          const turnId = record(event.body)?.turnId;
          return (
            typeof turnId === "string" &&
            projectTurnStatus(events, turnId) === "pending"
          );
        })
        .slice(0, limit);
      const results: AgentJournalMutationResult[] = [];
      for (const request of requests) {
        results.push(
          await this.#start(requestedPayload(request, events), request.eventId),
        );
      }
      return Object.freeze(results);
    });
  }

  #start(input: DurableChatRunInput, sourceEventId: string) {
    return this.#config.journal.startRun(
      startInput(input, sourceEventId, this.#config.now()),
    );
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
