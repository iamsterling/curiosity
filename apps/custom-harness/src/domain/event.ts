export interface ProposedEvent {
  readonly type: string;
  readonly streamId: string;
  readonly body: unknown;
}

export interface StoredEvent extends ProposedEvent {
  readonly aggregateVersion: number;
  readonly sequence: number;
  readonly eventId: string;
  readonly eventSchemaVersion: number;
  readonly commandId: string;
  readonly actorId: string;
  readonly catalogDigest: string;
  readonly causationId: string;
  readonly childExecutionId: string;
  readonly contributionId: string;
  readonly contributionVersion: string;
  readonly correlationId: string;
  readonly pluginId: string;
  readonly occurredAt: string;
  readonly parentExecutionId: string;
  readonly previousHash: string;
  readonly rootExecutionId: string;
  readonly eventHash: string;
}

export interface CommandAcknowledgement {
  readonly commandId: string;
  readonly actorId: string;
  readonly disposition: "accepted" | "duplicate";
  readonly eventCount: number;
  readonly firstSequence: number;
  readonly lastSequence: number;
}
