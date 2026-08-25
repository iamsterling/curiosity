import { Effect } from "effect";
import type { ChatTurnResult } from "../domain/chat.js";
import { decodeChatTurnPayload } from "../domain/chat.js";
import type { StoredEvent } from "../domain/event.js";
import type { ChatMessageProjection } from "../projection/chat-projection.js";
import {
  ActionExecutionFailure,
  CommandUnavailable,
  TextGenerationFailure,
  type ChatFailure,
} from "../kernel/errors.js";
import type { ActionStreamDelta } from "../kernel/provider-gateway.js";

interface ChatApiPort {
  readonly events: () => Promise<readonly StoredEvent[]>;
  readonly messages: (
    threadId: string,
  ) => Promise<readonly ChatMessageProjection[]>;
  readonly run: (
    input: unknown,
    onDelta?: (delta: ActionStreamDelta) => void,
  ) => Promise<unknown>;
}

const record = (value: unknown): Record<string, unknown> | undefined =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;

const commandPayload = (input: unknown): unknown => {
  const envelope = record(input);
  const command = record(envelope?.command);
  if (command?.kind !== "chat.turn")
    throw new CommandUnavailable({
      kind: typeof command?.kind === "string" ? command.kind : "",
      message: "CHAT_COMMAND_REQUIRED",
    });
  return command.payload;
};

const failureFor = (
  events: readonly StoredEvent[],
  turnId: string,
): { readonly errorCode: string; readonly modelId: string } | undefined => {
  for (const event of [...events].reverse()) {
    if (event.type !== "turn.failed") continue;
    const body = record(event.body);
    if (body?.turnId !== turnId) continue;
    return {
      errorCode:
        typeof body.errorCode === "string"
          ? body.errorCode
          : "TEXT_GENERATION_FAILED",
      modelId: typeof body.modelId === "string" ? body.modelId : "",
    };
  }
  return undefined;
};

export const makeChatApi =
  (port: ChatApiPort) =>
  async (
    input: unknown,
    onTextDelta?: (delta: string) => void,
  ): Promise<ChatTurnResult> => {
    const payload = await Effect.runPromise(
      decodeChatTurnPayload(commandPayload(input)),
    );
    let streamed = false;
    try {
      await port.run(input, (stream) => {
        const correlation = record(stream.correlation);
        if (
          stream.actionType === "provider.generate" &&
          correlation?.kind === "curiosity.chat.turn" &&
          correlation.turnId === payload.turnId
        ) {
          streamed = true;
          onTextDelta?.(stream.delta);
        }
      });
    } catch (error) {
      if (error instanceof ActionExecutionFailure)
        throw new TextGenerationFailure({
          message: error.message,
          modelId: error.modelId,
        });
      throw error;
    }
    const assistant = (await port.messages(payload.threadId)).find(
      (message) =>
        message.role === "assistant" && message.turnId === payload.turnId,
    );
    if (assistant) {
      if (onTextDelta && !streamed) onTextDelta(assistant.text);
      return {
        assistantMessageId: assistant.messageId,
        durationMs: assistant.durationMs ?? 0,
        effort: assistant.effort ?? "default",
        modelId: assistant.modelId ?? "",
        text: assistant.text,
        threadId: assistant.threadId,
        turnId: assistant.turnId,
      };
    }
    const failure = failureFor(await port.events(), payload.turnId);
    throw new TextGenerationFailure({
      message: failure?.errorCode ?? "CHAT_TURN_INCOMPLETE",
      modelId: failure?.modelId ?? "",
    });
  };

export type ChatApiFailure = ChatFailure;
