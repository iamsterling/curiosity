import type { GenerationRouteReceipt } from "./generation-route.js";
import type { GenerationTransportReceipt } from "./generation-transport-receipt.js";

export interface CommandInput {
  readonly id: string;
  readonly kind: string;
  readonly payload: unknown;
  readonly schemaVersion: 1;
}

export interface CommandAcknowledgement {
  readonly actorId: string;
  readonly commandId: string;
  readonly disposition: "accepted" | "duplicate";
  readonly eventCount: number;
  readonly firstSequence: number;
  readonly lastSequence: number;
}

export interface ProposedEvent {
  readonly body: unknown;
  readonly streamId: string;
  readonly type: string;
}

export interface StoredEvent extends ProposedEvent {
  readonly actorId: string;
  readonly aggregateVersion: number;
  readonly catalogDigest: string;
  readonly causationId: string;
  readonly childExecutionId: string;
  readonly commandId: string;
  readonly contributionId: string;
  readonly contributionVersion: string;
  readonly correlationId: string;
  readonly eventHash: string;
  readonly eventId: string;
  readonly eventSchemaVersion: number;
  readonly occurredAt: string;
  readonly parentExecutionId: string;
  readonly pluginId: string;
  readonly previousHash: string;
  readonly rootExecutionId: string;
  readonly sequence: number;
}

export interface ChatTurnPayload {
  readonly agentId?: string | undefined;
  readonly assistantMessageId: string;
  readonly projectId?: string | undefined;
  readonly text: string;
  readonly threadId: string;
  readonly turnId: string;
  readonly userMessageId: string;
}

export interface ChatMessageProjection {
  readonly durationMs?: number;
  readonly effort?: string;
  readonly messageId: string;
  readonly modelId?: string;
  readonly routeReceipt?: GenerationRouteReceipt;
  readonly transportReceipt?: GenerationTransportReceipt;
  readonly researchReceipt?: ChatResearchReceipt;
  readonly role: "assistant" | "user";
  readonly sequence: number;
  readonly text: string;
  readonly threadId: string;
  readonly turnId: string;
}

export interface ChatResearchReceipt {
  readonly citationCount: number;
  readonly receiptId: string;
  readonly sourceCount: number;
  readonly toolCallCount: number;
  readonly verification: "not-applicable" | "verified";
}

export interface ThreadProjection {
  readonly openedBy: string;
  readonly sequence: number;
  readonly threadId: string;
  readonly title: string;
}

export type Sha256 = (value: string) => Promise<string>;

export class PortableAuthorityError extends Error {
  readonly code: string;

  constructor(code: string) {
    super(code);
    this.code = code;
    this.name = "PortableAuthorityError";
  }
}
