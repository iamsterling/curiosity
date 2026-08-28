import type { SignedCommandEnvelope } from "../domain/command.js";
import { signCommand } from "../kernel/authenticator.js";
import type { ChatTurnResult } from "../domain/chat.js";
import type { ChatMessageProjection } from "../projection/chat-projection.js";
import type { ThreadProjection } from "../projection/thread-projection.js";
import { OPENAI_OAUTH_DEVICE_LOGIN_COMMAND } from "./config.js";

export interface TurnIdentity {
  readonly agentId?: string;
  readonly actorId: string;
  readonly secret: string;
}

export interface PromptCommandInput {
  readonly arguments: string;
  readonly name: string;
}

export const parsePromptCommand = (
  text: string,
): PromptCommandInput | undefined => {
  const match = /^\/([a-z][a-z0-9-]{0,63})(?:[ \t]+([\s\S]*))?$/u.exec(text);
  const name = match?.[1];
  if (!name) return undefined;
  return Object.freeze({
    arguments: (match[2] ?? "").trim(),
    name,
  });
};
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

const failureMessage = (error: unknown): string | undefined =>
  typeof error === "object" &&
  error !== null &&
  "message" in error &&
  typeof error.message === "string" &&
  error.message.length > 0
    ? error.message
    : undefined;

export const failureDiagnostic = (error: unknown): string => {
  const tag = failureTag(error);
  const message = failureMessage(error);
  return message && tag !== "CHAT_FAILED" && message !== tag
    ? `${tag} · ${message}`
    : tag;
};

export const formatChatFailure = (
  modelId: string,
  error: unknown,
): string => {
  const diagnostic = failureDiagnostic(error);
  return modelId.startsWith("openai-oauth:") &&
    failureMessage(error) === "OPENAI_OAUTH_AUTHENTICATION_REQUIRED"
    ? `${diagnostic} · Run \`${OPENAI_OAUTH_DEVICE_LOGIN_COMMAND}\`, then retry.`
    : diagnostic;
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
          ...(identity.agentId ? { agentId: identity.agentId } : {}),
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

export const signPromptCommand = (
  identity: TurnIdentity,
  threadId: string,
  prompt: PromptCommandInput,
  createId: () => string,
  issuedAt: () => string,
): SignedCommandEnvelope => {
  const activationId = createId();
  return signCommand(
    {
      actorId: identity.actorId,
      command: {
        id: createId(),
        kind: "prompt.command.invoke",
        payload: {
          activationId,
          arguments: prompt.arguments,
          name: prompt.name,
          schemaVersion: 1,
          threadId,
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

export const signQuestionAnswer = (
  identity: TurnIdentity,
  questionId: string,
  answer: string,
  createId: () => string,
  issuedAt: () => string,
): SignedCommandEnvelope =>
  signCommand(
    {
      actorId: identity.actorId,
      command: {
        id: createId(),
        kind: "question.answer",
        payload: { answer, questionId, schemaVersion: 1 },
        schemaVersion: 1,
      },
      issuedAt: issuedAt(),
      nonce: createId(),
      schemaVersion: 1,
    },
    identity.secret,
  );

export const signExecutionCancellation = (
  identity: TurnIdentity,
  executionId: string,
  createId: () => string,
  issuedAt: () => string,
): SignedCommandEnvelope =>
  signCommand(
    {
      actorId: identity.actorId,
      command: {
        id: createId(),
        kind: "execution.cancel",
        payload: { executionId, schemaVersion: 1 },
        schemaVersion: 1,
      },
      issuedAt: issuedAt(),
      nonce: createId(),
      schemaVersion: 1,
    },
    identity.secret,
  );

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
      ...(result.researchReceipt
        ? { researchReceipt: result.researchReceipt }
        : {}),
      role: "assistant" as const,
      sequence: 2,
      text: result.text,
      threadId: payload.threadId,
      turnId: payload.turnId,
    }),
  ]);
};
