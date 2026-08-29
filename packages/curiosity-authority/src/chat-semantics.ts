import { utf8ByteLength } from "./canonical-json.js";
import {
  PortableAuthorityError,
  type ChatResearchReceipt,
  type ChatTurnPayload,
  type ProposedEvent,
  type StoredEvent,
} from "./domain.js";
import type { GenerationRouteReceipt } from "./generation-route.js";

const maximumIdentifierBytes = 256;
const maximumMessageBytes = 64 * 1_024;

const record = (value: unknown): Record<string, unknown> | undefined =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;

const nonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.length > 0;

export const decodeChatTurnPayload = (value: unknown): ChatTurnPayload => {
  const payload = record(value);
  if (
    !payload ||
    !nonEmptyString(payload.assistantMessageId) ||
    !nonEmptyString(payload.text) ||
    !nonEmptyString(payload.threadId) ||
    !nonEmptyString(payload.turnId) ||
    !nonEmptyString(payload.userMessageId) ||
    (payload.agentId !== undefined && !nonEmptyString(payload.agentId))
  )
    throw new PortableAuthorityError("CHAT_TURN_PAYLOAD_INVALID");
  const decoded: ChatTurnPayload = {
    assistantMessageId: payload.assistantMessageId,
    text: payload.text,
    threadId: payload.threadId,
    turnId: payload.turnId,
    userMessageId: payload.userMessageId,
    ...(typeof payload.agentId === "string"
      ? { agentId: payload.agentId }
      : {}),
  };
  validateChatTurnBounds(decoded);
  return Object.freeze(decoded);
};

export const validateChatTurnBounds = (payload: ChatTurnPayload): void => {
  const identifiers = [
    ...(payload.agentId ? [payload.agentId] : []),
    payload.assistantMessageId,
    payload.threadId,
    payload.turnId,
    payload.userMessageId,
  ];
  if (
    identifiers.some((value) => utf8ByteLength(value) > maximumIdentifierBytes)
  )
    throw new PortableAuthorityError("CHAT_IDENTIFIER_TOO_LARGE");
  if (utf8ByteLength(payload.text) > maximumMessageBytes)
    throw new PortableAuthorityError("CHAT_MESSAGE_TOO_LARGE");
};

export const titleFromChatText = (text: string): string => {
  const firstLine = text.split(/\r?\n/u, 1)[0]?.trim() ?? "";
  return Array.from(firstLine || "New conversation")
    .slice(0, 80)
    .join("");
};

export interface RoleActivationIdentity {
  readonly commandName: string;
  readonly eventId: string;
}

export const proposeChatTurn = (
  payload: ChatTurnPayload,
  agentId: string,
  currentEvents: readonly Pick<StoredEvent, "streamId" | "type">[],
  roleActivation?: RoleActivationIdentity,
): readonly ProposedEvent[] => {
  const events: ProposedEvent[] = [];
  const threadExists = currentEvents.some(
    (event) =>
      event.type === "thread.opened" && event.streamId === payload.threadId,
  );
  if (!threadExists)
    events.push({
      body: {
        schemaVersion: 1,
        threadId: payload.threadId,
        title: titleFromChatText(payload.text),
      },
      streamId: payload.threadId,
      type: "thread.opened",
    });
  events.push(
    {
      body: {
        messageId: payload.userMessageId,
        role: "user",
        schemaVersion: 1,
        text: payload.text,
        threadId: payload.threadId,
        turnId: payload.turnId,
      },
      streamId: payload.threadId,
      type: "message.appended",
    },
    {
      body: {
        assistantMessageId: payload.assistantMessageId,
        agentId,
        ...(roleActivation
          ? {
              roleActivationCommand: roleActivation.commandName,
              roleActivationEventId: roleActivation.eventId,
            }
          : {}),
        schemaVersion: 1,
        threadId: payload.threadId,
        turnId: payload.turnId,
      },
      streamId: payload.threadId,
      type: "turn.requested",
    },
  );
  return Object.freeze(events);
};

export interface ChatCompletion {
  readonly assistantMessageId: string;
  readonly durationMs: number;
  readonly effort: string;
  readonly modelId: string;
  readonly researchReceipt?: ChatResearchReceipt;
  readonly routeReceipt?: GenerationRouteReceipt;
  readonly text: string;
  readonly threadId: string;
  readonly turnId: string;
}

export const completeChatTurn = (
  completion: ChatCompletion,
): readonly ProposedEvent[] =>
  Object.freeze([
    {
      body: {
        durationMs: completion.durationMs,
        effort: completion.effort,
        messageId: completion.assistantMessageId,
        modelId: completion.modelId,
        ...(completion.researchReceipt
          ? { researchReceipt: completion.researchReceipt }
          : {}),
        ...(completion.routeReceipt
          ? { routeReceipt: completion.routeReceipt }
          : {}),
        role: "assistant",
        schemaVersion: 1,
        text: completion.text,
        threadId: completion.threadId,
        turnId: completion.turnId,
      },
      streamId: completion.threadId,
      type: "message.appended",
    },
    {
      body: {
        assistantMessageId: completion.assistantMessageId,
        durationMs: completion.durationMs,
        effort: completion.effort,
        modelId: completion.modelId,
        ...(completion.routeReceipt
          ? { routeReceipt: completion.routeReceipt }
          : {}),
        schemaVersion: 1,
        threadId: completion.threadId,
        turnId: completion.turnId,
      },
      streamId: completion.threadId,
      type: "turn.completed",
    },
  ]);

export const failChatTurn = (
  payload: Pick<ChatTurnPayload, "threadId" | "turnId">,
  errorCode: string,
  modelId = "",
  routeReceipt?: GenerationRouteReceipt,
): ProposedEvent => ({
  body: {
    errorCode,
    modelId,
    ...(routeReceipt ? { routeReceipt } : {}),
    schemaVersion: 1,
    threadId: payload.threadId,
    turnId: payload.turnId,
  },
  streamId: payload.threadId,
  type: "turn.failed",
});
