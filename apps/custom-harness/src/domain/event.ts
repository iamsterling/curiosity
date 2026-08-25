export interface ProposedEvent {
  readonly type: string;
  readonly streamId: string;
  readonly body: unknown;
}

export interface StoredEvent extends ProposedEvent {
  readonly sequence: number;
  readonly eventId: string;
  readonly commandId: string;
  readonly actorId: string;
  readonly pluginId: string;
  readonly occurredAt: string;
  readonly previousHash: string;
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
