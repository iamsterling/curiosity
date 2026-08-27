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

export interface ChatResearchReceipt {
  readonly citationCount: number;
  readonly receiptId: string;
  readonly sourceCount: number;
  readonly toolCallCount: number;
  readonly verification: "not-applicable" | "verified";
}

export interface ChatTurnResult {
  readonly assistantMessageId: string;
  readonly durationMs: number;
  readonly effort: string;
  readonly modelId: string;
  readonly researchReceipt?: ChatResearchReceipt;
  readonly text: string;
  readonly threadId: string;
  readonly turnId: string;
}
