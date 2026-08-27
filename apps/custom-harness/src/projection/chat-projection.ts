import { Schema } from "effect";
import type { StoredEvent } from "../domain/event.js";
import type { ChatResearchReceipt } from "../domain/chat.js";

class ResearchReceiptSummary extends Schema.Class<ResearchReceiptSummary>(
  "@curiosity/custom-harness/ResearchReceiptSummary",
)({
  citationCount: Schema.Number,
  receiptId: Schema.NonEmptyString,
  sourceCount: Schema.Number,
  toolCallCount: Schema.Number,
  verification: Schema.Literals(["not-applicable", "verified"]),
}) {}

class MessageAppendedBody extends Schema.Class<MessageAppendedBody>(
  "@curiosity/custom-harness/MessageAppendedBody",
)({
  messageId: Schema.NonEmptyString,
  durationMs: Schema.optional(Schema.Number),
  effort: Schema.optional(Schema.NonEmptyString),
  modelId: Schema.optional(Schema.NonEmptyString),
  researchReceipt: Schema.optional(ResearchReceiptSummary),
  role: Schema.Literals(["user", "assistant"]),
  text: Schema.String,
  threadId: Schema.NonEmptyString,
  turnId: Schema.NonEmptyString,
}) {}

const decodeMessage = Schema.decodeUnknownSync(MessageAppendedBody);

export interface ChatMessageProjection {
  readonly durationMs?: number;
  readonly effort?: string;
  readonly messageId: string;
  readonly modelId?: string;
  readonly researchReceipt?: ChatResearchReceipt;
  readonly role: "user" | "assistant";
  readonly sequence: number;
  readonly text: string;
  readonly threadId: string;
  readonly turnId: string;
}

export const projectChatMessages = (
  events: readonly StoredEvent[],
  threadId?: string,
): readonly ChatMessageProjection[] =>
  Object.freeze(
    events.flatMap((event) => {
      if (event.type !== "message.appended") return [];
      const body = decodeMessage(event.body);
      if (threadId && body.threadId !== threadId) return [];
      return [
        Object.freeze({
          ...(body.durationMs === undefined
            ? {}
            : { durationMs: body.durationMs }),
          ...(body.effort ? { effort: body.effort } : {}),
          messageId: body.messageId,
          ...(body.modelId ? { modelId: body.modelId } : {}),
          ...(body.researchReceipt
            ? { researchReceipt: { ...body.researchReceipt } }
            : {}),
          role: body.role,
          sequence: event.sequence,
          text: body.text,
          threadId: body.threadId,
          turnId: body.turnId,
        }),
      ];
    }),
  );
