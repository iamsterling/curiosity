import type { StoredEvent } from "../domain/event.js";

export interface EventRow {
  readonly global_sequence: number;
  readonly event_id: string;
  readonly command_id: string;
  readonly actor_id: string;
  readonly plugin_id: string;
  readonly event_type: string;
  readonly stream_id: string;
  readonly body_json: string;
  readonly occurred_at: string;
  readonly previous_hash: string;
  readonly event_hash: string;
}

export const toStoredEvent = (row: EventRow): StoredEvent => ({
  actorId: row.actor_id,
  body: JSON.parse(row.body_json) as unknown,
  commandId: row.command_id,
  eventHash: row.event_hash,
  eventId: row.event_id,
  occurredAt: row.occurred_at,
  pluginId: row.plugin_id,
  previousHash: row.previous_hash,
  sequence: row.global_sequence,
  streamId: row.stream_id,
  type: row.event_type,
});
