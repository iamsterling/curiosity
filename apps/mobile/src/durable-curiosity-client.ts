import {
  PortableAuthorityError,
  projectTurnStatus,
  type PortableAuthority,
  type StoredEvent,
} from "@curiosity/authority";
import {
  commandText,
  type CuriosityClient,
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
  readonly scheduler: Pick<DurableAgentScheduler, "wake">;
  readonly status: () => Promise<CuriosityRuntimeStatus>;
}

const record = (value: unknown): Record<string, unknown> | undefined =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;

const sessionFrom = (
  authority: PortableAuthority,
  threadId?: string,
): CuriositySession =>
  Object.freeze({
    messages: authority
      .messages(threadId)
      .map(({ messageId, role, text, transportReceipt }) =>
        Object.freeze({
          messageId,
          role,
          text,
          ...(transportReceipt ? { transportReceipt } : {}),
        }),
      ),
    threads: authority
      .threads()
      .map(({ sequence, threadId: id, title }) =>
        Object.freeze({ sequence, threadId: id, title }),
      ),
  });

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
    const authority = await config.createAuthority();
    const threadId = input.threadId ?? config.createId();
    const turnId = config.createId();
    const assistantMessageId = config.createId();
    await config.admission.admit(authority, {
      id: config.createId(),
      kind: "chat.turn",
      payload: {
        assistantMessageId,
        ...(input.projectId ? { projectId: input.projectId } : {}),
        text: commandText(input.mode, input.text),
        threadId,
        turnId,
        userMessageId: config.createId(),
      },
      schemaVersion: 1,
    });
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
    }
    const completedAuthority = await config.createAuthority();
    const turnStatus = projectTurnStatus(completedAuthority.events(), turnId);
    if (turnStatus === "failed" || turnStatus === "cancelled")
      throw new PortableAuthorityError(
        turnFailure(completedAuthority.events(), turnId),
      );
    if (turnStatus !== "completed")
      throw new PortableAuthorityError(
        wake.stopped === "blocked"
          ? "AGENT_RUN_REQUIRES_RECONCILIATION"
          : "AGENT_RUN_WAITING_FOR_INPUT",
      );
    const message = completedAuthority
      .messages(threadId)
      .find((item) => item.role === "assistant" && item.turnId === turnId);
    if (!message)
      throw new PortableAuthorityError("DURABLE_CHAT_COMPLETION_MISSING");
    onDelta?.(message.text);
    return Object.freeze({
      assistantMessageId,
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
