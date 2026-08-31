import {
  PortableAuthorityError,
  projectTurnStatus,
  type ChatMessageProjection,
  type PortableAuthority,
  type StoredEvent,
} from "@curiosity/authority";
import {
  commandText,
  type CuriosityClient,
  type CuriosityMessage,
  type CuriosityRuntimeStatus,
  type CuriositySession,
  type CuriosityTurn,
} from "./curiosity-client.ts";
import type { DurableAgentAdmission } from "./durable-agent-admission.ts";
import type { DurableAgentScheduler } from "./durable-agent-scheduler.ts";
import type { DurableAgentCancellationPort } from "./mobile-agent-cancellation.ts";

export interface DurableCuriosityClientConfig {
  readonly admission: Pick<DurableAgentAdmission, "admit">;
  readonly cancellation: DurableAgentCancellationPort;
  readonly createAuthority: () => Promise<PortableAuthority>;
  readonly createId: () => string;
  readonly hasPendingOperatorRequest: (runId: string) => Promise<boolean>;
  readonly scheduler: Pick<DurableAgentScheduler, "wake">;
  readonly status: () => Promise<CuriosityRuntimeStatus>;
  readonly subscribeToRunDeltas?: (
    runId: string,
    listener: (delta: string) => void,
  ) => () => void;
}

const record = (value: unknown): Record<string, unknown> | undefined =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;

const activePromptCommands = new Set([
  "bug",
  "compile-handoff",
  "feature",
  "goal",
  "landscape",
  "research",
  "review",
  "secure",
  "task",
  "teardown",
  "verify",
]);
const promptCommandPattern = /^\s*\/([a-z][a-z-]*)(?=\s|$)/u;

const durableCommandText = (
  mode: Parameters<typeof commandText>[0],
  text: string,
): string => {
  const prepared = commandText(mode, text);
  const command = promptCommandPattern.exec(prepared)?.[1];
  if (!command) return prepared;
  if (!activePromptCommands.has(command))
    throw new PortableAuthorityError("PROMPT_COMMAND_UNKNOWN");
  throw new PortableAuthorityError(`PROMPT_COMMAND_UNAVAILABLE:${command}`);
};

interface SequencedCuriosityMessage extends CuriosityMessage {
  readonly sequence: number;
}

const questionText = (prompt: string, options: readonly string[]): string =>
  options.length === 0
    ? prompt
    : `${prompt}\n\nOptions: ${options.join(" · ")}`;

const threadProjects = (
  events: readonly StoredEvent[],
): ReadonlyMap<string, string> => {
  const projects = new Map<string, string>();
  for (const event of events) {
    if (event.type !== "turn.requested") continue;
    const body = record(event.body);
    if (typeof body?.threadId !== "string" || body.projectId === undefined)
      continue;
    if (typeof body.projectId !== "string" || !body.projectId)
      throw new PortableAuthorityError("DURABLE_THREAD_PROJECT_INVALID");
    const existing = projects.get(body.threadId);
    if (existing && existing !== body.projectId)
      throw new PortableAuthorityError("DURABLE_THREAD_PROJECT_CONFLICT");
    projects.set(body.threadId, body.projectId);
  }
  return projects;
};

const threadActivitySequences = (
  events: readonly StoredEvent[],
): ReadonlyMap<string, number> => {
  const threadsByExecution = new Map<string, string>();
  for (const event of events) {
    if (event.type !== "turn.requested") continue;
    const body = record(event.body);
    if (
      typeof body?.threadId !== "string" ||
      !body.threadId ||
      typeof body.turnId !== "string" ||
      !body.turnId
    )
      continue;
    threadsByExecution.set(body.turnId, body.threadId);
    threadsByExecution.set(`agent-execution:${body.turnId}`, body.threadId);
  }

  const activity = new Map<string, number>();
  for (const event of events) {
    const body = record(event.body);
    const directThreadId =
      typeof body?.threadId === "string" && body.threadId
        ? body.threadId
        : undefined;
    const threadId =
      directThreadId ?? threadsByExecution.get(event.rootExecutionId);
    if (!threadId) continue;
    activity.set(
      threadId,
      Math.max(activity.get(threadId) ?? 0, event.sequence),
    );
  }
  return activity;
};

export const projectDurableSessionMessages = (
  events: readonly StoredEvent[],
  chatMessages: readonly ChatMessageProjection[],
  threadId?: string,
): readonly CuriosityMessage[] => {
  const threadByExecution = new Map<string, string>();
  for (const message of chatMessages) {
    threadByExecution.set(message.turnId, message.threadId);
    threadByExecution.set(
      `agent-execution:${message.turnId}`,
      message.threadId,
    );
  }
  const inlineQuestions = events.flatMap(
    (event): readonly SequencedCuriosityMessage[] => {
      const eventThreadId = threadByExecution.get(event.rootExecutionId);
      if (!eventThreadId || (threadId && eventThreadId !== threadId)) return [];
      const body = record(event.body);
      if (event.type === "question.asked") {
        if (
          typeof body?.questionId !== "string" ||
          typeof body.prompt !== "string" ||
          !Array.isArray(body.options) ||
          body.options.some((option) => typeof option !== "string")
        )
          throw new PortableAuthorityError("DURABLE_QUESTION_EVENT_INVALID");
        return [
          Object.freeze({
            messageId: `agent-question:${body.questionId}`,
            role: "assistant" as const,
            sequence: event.sequence,
            text: questionText(body.prompt, body.options as string[]),
          }),
        ];
      }
      if (event.type === "question.answered") {
        if (
          typeof body?.questionId !== "string" ||
          typeof body.answer !== "string" ||
          body.provenance !== "untrusted-user-answer"
        )
          throw new PortableAuthorityError("DURABLE_QUESTION_EVENT_INVALID");
        return [
          Object.freeze({
            messageId: `agent-question-answer:${body.questionId}`,
            role: "user" as const,
            sequence: event.sequence,
            text: body.answer,
          }),
        ];
      }
      return [];
    },
  );
  return Object.freeze(
    [
      ...chatMessages
        .filter((message) => !threadId || message.threadId === threadId)
        .map(({ messageId, role, sequence, text, transportReceipt }) => ({
          messageId,
          role,
          sequence,
          text,
          ...(transportReceipt ? { transportReceipt } : {}),
        })),
      ...inlineQuestions,
    ]
      .sort((left, right) => left.sequence - right.sequence)
      .map(({ sequence: _sequence, ...message }) => Object.freeze(message)),
  );
};

const sessionFrom = (
  authority: PortableAuthority,
  threadId?: string,
): CuriositySession => {
  const events = authority.events();
  const projects = threadProjects(events);
  const activity = threadActivitySequences(events);
  return Object.freeze({
    messages: projectDurableSessionMessages(
      events,
      authority.messages(),
      threadId,
    ),
    threads: authority.threads().map(({ sequence, threadId: id, title }) =>
      Object.freeze({
        ...(projects.has(id) ? { projectId: projects.get(id) } : {}),
        sequence,
        threadId: id,
        title,
        updatedSequence: activity.get(id) ?? sequence,
      }),
    ),
  });
};

const turnFailure = (
  events: readonly StoredEvent[],
  turnId: string,
): string => {
  const failure = [...events].reverse().find((event) => {
    const body = record(event.body);
    return event.type === "turn.failed" && body?.turnId === turnId;
  });
  const code = record(failure?.body)?.errorCode;
  return typeof code === "string" && code ? code : "DURABLE_AGENT_TURN_FAILED";
};

export const createDurableCuriosityClient = (
  config: DurableCuriosityClientConfig,
): CuriosityClient => ({
  cancel: async (turnId) => void (await config.cancellation.cancelTurn(turnId)),
  session: async (threadId) =>
    sessionFrom(await config.createAuthority(), threadId),
  status: config.status,
  submit: async (input, onDelta): Promise<CuriosityTurn> => {
    const text = durableCommandText(input.mode, input.text);
    const authority = await config.createAuthority();
    const threadId = input.threadId ?? config.createId();
    const turnId = config.createId();
    const assistantMessageId = config.createId();
    const admission = await config.admission.admit(authority, {
      id: config.createId(),
      kind: "chat.turn",
      payload: {
        ...(input.agentId ? { agentId: input.agentId } : {}),
        assistantMessageId,
        ...(input.projectId ? { projectId: input.projectId } : {}),
        text,
        threadId,
        turnId,
        userMessageId: config.createId(),
      },
      schemaVersion: 1,
    });
    let streamedText = "";
    const unsubscribe = config.subscribeToRunDeltas?.(
      admission.runId,
      (delta) => {
        streamedText += delta;
        onDelta?.(delta);
      },
    );
    let wake: Awaited<ReturnType<DurableAgentScheduler["wake"]>>;
    try {
      wake = await config.scheduler.wake();
    } catch (error) {
      const interruptedAuthority = await config.createAuthority();
      if (
        projectTurnStatus(interruptedAuthority.events(), turnId) === "cancelled"
      )
        throw new PortableAuthorityError("ACTION_CANCELLED");
      throw error;
    } finally {
      unsubscribe?.();
    }
    const completedAuthority = await config.createAuthority();
    const turnStatus = projectTurnStatus(completedAuthority.events(), turnId);
    if (turnStatus === "failed" || turnStatus === "cancelled")
      throw new PortableAuthorityError(
        turnFailure(completedAuthority.events(), turnId),
      );
    if (turnStatus !== "completed") {
      if (await config.hasPendingOperatorRequest(admission.runId))
        return Object.freeze({
          runId: admission.runId,
          status: "waiting-for-input" as const,
          threadId,
          threads: sessionFrom(completedAuthority).threads,
          turnId,
        });
      throw new PortableAuthorityError(
        wake.stopped === "blocked"
          ? "AGENT_RUN_REQUIRES_RECONCILIATION"
          : wake.stopped === "budget"
            ? "AGENT_SCHEDULER_BUDGET_EXHAUSTED"
            : wake.stopped === "inactive"
              ? "AGENT_SCHEDULER_INACTIVE"
              : "AGENT_RUN_STALLED",
      );
    }
    const message = completedAuthority
      .messages(threadId)
      .find((item) => item.role === "assistant" && item.turnId === turnId);
    if (!message)
      throw new PortableAuthorityError("DURABLE_CHAT_COMPLETION_MISSING");
    if (!streamedText) onDelta?.(message.text);
    else if (message.text.startsWith(streamedText)) {
      const terminalDelta = message.text.slice(streamedText.length);
      if (terminalDelta) onDelta?.(terminalDelta);
    }
    return Object.freeze({
      assistantMessageId,
      status: "completed" as const,
      text: message.text,
      threadId,
      threads: sessionFrom(completedAuthority).threads,
      ...(message.transportReceipt
        ? { transportReceipt: message.transportReceipt }
        : {}),
      turnId,
    });
  },
});
