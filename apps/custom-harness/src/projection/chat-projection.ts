import {
  projectChatMessages as projectPortableChatMessages,
  type ChatMessageProjection as PortableChatMessageProjection,
} from "@curiosity/authority";
import type { StoredEvent } from "../domain/event.js";
import type { ChatResearchReceipt } from "../domain/chat.js";

export interface ChatMessageProjection extends PortableChatMessageProjection {
  readonly researchReceipt?: ChatResearchReceipt;
}

export const projectChatMessages = (
  events: readonly StoredEvent[],
  threadId?: string,
): readonly ChatMessageProjection[] =>
  projectPortableChatMessages(events, threadId);
