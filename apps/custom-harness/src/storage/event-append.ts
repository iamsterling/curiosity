import type { Database } from "bun:sqlite";
import { createHash } from "node:crypto";
import type { CommandAcknowledgement, ProposedEvent } from "../domain/event.js";
import { canonicalJson } from "../kernel/canonical-json.js";

const emptyHash = "0".repeat(64);

interface AdmissionRow {
  readonly command_digest: string;
  readonly event_count: number;
  readonly first_sequence: number;
  readonly last_sequence: number;
}

export interface AdmissionInput {
  readonly acceptedAt: string;
  readonly actorId: string;
  readonly commandDigest: string;
  readonly commandId: string;
  readonly events: readonly ProposedEvent[];
  readonly nonce: string;
  readonly pluginId: string;
}

export type AdmissionResult =
  | {
      readonly _tag: "Acknowledged";
      readonly acknowledgement: CommandAcknowledgement;
    }
  | { readonly _tag: "Conflict" };

const acknowledgement = (
  input: AdmissionInput,
  disposition: CommandAcknowledgement["disposition"],
  row: Pick<AdmissionRow, "event_count" | "first_sequence" | "last_sequence">,
): CommandAcknowledgement => ({
  actorId: input.actorId,
  commandId: input.commandId,
  disposition,
  eventCount: row.event_count,
  firstSequence: row.first_sequence,
  lastSequence: row.last_sequence,
});

export const admitInTransaction = (
  database: Database,
  input: AdmissionInput,
): AdmissionResult => {
  const existing = database
    .query<AdmissionRow, [string, string]>(
      "SELECT command_digest, event_count, first_sequence, last_sequence FROM command_admissions WHERE actor_id = ? AND command_id = ?",
    )
    .get(input.actorId, input.commandId);
  if (existing) {
    if (existing.command_digest !== input.commandDigest)
      return { _tag: "Conflict" };
    return {
      _tag: "Acknowledged",
      acknowledgement: acknowledgement(input, "duplicate", existing),
    };
  }

  const tail = database
    .query<{ global_sequence: number; event_hash: string }, []>(
      "SELECT global_sequence, event_hash FROM events ORDER BY global_sequence DESC LIMIT 1",
    )
    .get();
  let sequence = tail?.global_sequence ?? 0;
  let previousHash = tail?.event_hash ?? emptyHash;
  const firstSequence = sequence + 1;
  for (const [index, event] of input.events.entries()) {
    sequence += 1;
    const bodyJson = canonicalJson(event.body);
    const hashInput = canonicalJson({
      actorId: input.actorId,
      body: event.body,
      commandId: input.commandId,
      occurredAt: input.acceptedAt,
      pluginId: input.pluginId,
      previousHash,
      sequence,
      streamId: event.streamId,
      type: event.type,
    });
    const eventHash = createHash("sha256").update(hashInput).digest("hex");
    const eventId = createHash("sha256")
      .update(`${input.actorId}:${input.commandId}:${index}:${eventHash}`)
      .digest("hex");
    database.run(
      "INSERT INTO events(global_sequence,event_id,command_id,actor_id,plugin_id,event_type,stream_id,body_json,occurred_at,previous_hash,event_hash) VALUES (?,?,?,?,?,?,?,?,?,?,?)",
      [
        sequence,
        eventId,
        input.commandId,
        input.actorId,
        input.pluginId,
        event.type,
        event.streamId,
        bodyJson,
        input.acceptedAt,
        previousHash,
        eventHash,
      ],
    );
    previousHash = eventHash;
  }

  const row = {
    command_digest: input.commandDigest,
    event_count: input.events.length,
    first_sequence: firstSequence,
    last_sequence: sequence,
  };
  database.run(
    "INSERT INTO command_admissions(actor_id,command_id,command_digest,nonce,accepted_at,first_sequence,last_sequence,event_count) VALUES (?,?,?,?,?,?,?,?)",
    [
      input.actorId,
      input.commandId,
      input.commandDigest,
      input.nonce,
      input.acceptedAt,
      row.first_sequence,
      row.last_sequence,
      row.event_count,
    ],
  );
  return {
    _tag: "Acknowledged",
    acknowledgement: acknowledgement(input, "accepted", row),
  };
};
