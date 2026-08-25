import type { SignedCommandEnvelope } from "../domain/command.js";
import { signCommand } from "../kernel/authenticator.js";
import type { ChatTurnResult } from "../domain/chat.js";
import type { ChatMessageProjection } from "../projection/chat-projection.js";
import type { ThreadProjection } from "../projection/thread-projection.js";

export interface TurnIdentity {
  readonly actorId: string;
  readonly secret: string;
}

export const latestThread = (
  threads: readonly ThreadProjection[],
): ThreadProjection | undefined =>
  threads.reduce<ThreadProjection | undefined>(
    (latest, thread) =>
      !latest || thread.sequence > latest.sequence ? thread : latest,
    undefined,
  );

export const failureTag = (error: unknown): string => {
  if (
    typeof error === "object" &&
    error !== null &&
    "_tag" in error &&
    typeof error._tag === "string"
  )
    return error._tag;
  return "CHAT_FAILED";
};

export const signTurn = (
  identity: TurnIdentity,
  threadId: string,
  text: string,
  createId: () => string,
  issuedAt: () => string,
): SignedCommandEnvelope => {
  const turnId = createId();
  return signCommand(
    {
      actorId: identity.actorId,
      command: {
        id: createId(),
        kind: "chat.turn",
        payload: {
          assistantMessageId: createId(),
          text,
          threadId,
          turnId,
          userMessageId: createId(),
        },
        schemaVersion: 1,
      },
      issuedAt: issuedAt(),
      nonce: createId(),
      schemaVersion: 1,
    },
    identity.secret,
  );
};

export const fallbackMessages = (
  envelope: SignedCommandEnvelope,
  result: ChatTurnResult,
): readonly ChatMessageProjection[] => {
  const payload = envelope.command.payload as {
    readonly assistantMessageId: string;
    readonly text: string;
    readonly threadId: string;
    readonly turnId: string;
    readonly userMessageId: string;
  };
  return Object.freeze([
    Object.freeze({
      messageId: payload.userMessageId,
      role: "user" as const,
      sequence: 1,
      text: payload.text,
      threadId: payload.threadId,
      turnId: payload.turnId,
    }),
    Object.freeze({
      durationMs: result.durationMs,
      effort: result.effort,
      messageId: payload.assistantMessageId,
      modelId: result.modelId,
      role: "assistant" as const,
      sequence: 2,
      text: result.text,
      threadId: payload.threadId,
      turnId: payload.turnId,
    }),
  ]);
};
