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
  readonly event_schema_version: number;
  readonly aggregate_version: number;
  readonly causation_id: string;
  readonly correlation_id: string;
  readonly root_execution_id: string;
  readonly parent_execution_id: string;
  readonly child_execution_id: string;
  readonly contribution_id: string;
  readonly contribution_version: string;
  readonly catalog_digest: string;
}

export const toStoredEvent = (row: EventRow): StoredEvent => {
  if (row.event_schema_version !== 0 && row.event_schema_version !== 1)
    throw new Error("EVENT_SCHEMA_VERSION_UNSUPPORTED");
  return {
    aggregateVersion: row.aggregate_version,
    actorId: row.actor_id,
    body: JSON.parse(row.body_json) as unknown,
    catalogDigest: row.catalog_digest,
    causationId: row.causation_id,
    childExecutionId: row.child_execution_id,
    commandId: row.command_id,
    contributionId: row.contribution_id,
    contributionVersion: row.contribution_version,
    correlationId: row.correlation_id,
    eventHash: row.event_hash,
    eventId: row.event_id,
    eventSchemaVersion: row.event_schema_version,
    occurredAt: row.occurred_at,
    parentExecutionId: row.parent_execution_id,
    pluginId: row.plugin_id,
    previousHash: row.previous_hash,
    rootExecutionId: row.root_execution_id,
    sequence: row.global_sequence,
    streamId: row.stream_id,
    type: row.event_type,
  };
};
