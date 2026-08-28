import type { SignedCommandEnvelope } from "../domain/command.js";
import { signCommand } from "./authenticator.js";

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
