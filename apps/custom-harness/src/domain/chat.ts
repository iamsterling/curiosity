import { Schema } from "effect";

export class ChatTurnPayload extends Schema.Class<ChatTurnPayload>(
  "@curiosity/custom-harness/ChatTurnPayload",
)({
  agentId: Schema.optional(Schema.NonEmptyString),
  assistantMessageId: Schema.NonEmptyString,
  text: Schema.NonEmptyString,
  threadId: Schema.NonEmptyString,
  turnId: Schema.NonEmptyString,
  userMessageId: Schema.NonEmptyString,
}) {}

export const decodeChatTurnPayload =
  Schema.decodeUnknownEffect(ChatTurnPayload);

export interface ChatTurnResult {
  readonly assistantMessageId: string;
  readonly durationMs: number;
  readonly effort: string;
  readonly modelId: string;
  readonly text: string;
  readonly threadId: string;
  readonly turnId: string;
}
