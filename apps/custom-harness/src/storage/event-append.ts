import type { Database } from "bun:sqlite";
import { createHash } from "node:crypto";
import type { CommandAcknowledgement, ProposedEvent } from "../domain/event.js";
import { canonicalJson } from "../kernel/canonical-json.js";

const emptyHash = "0".repeat(64);
const field = (value: unknown, ...names: readonly string[]): string | undefined =>
  value && typeof value === "object" && !Array.isArray(value)
    ? names
        .map((name) => (value as Record<string, unknown>)[name])
        .find((candidate): candidate is string =>
          Boolean(typeof candidate === "string" && candidate),
        )
    : undefined;

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
  readonly contributionId?: string;
  readonly contributionVersion?: string;
  readonly events: readonly ProposedEvent[];
  readonly eventContexts?: readonly (
    | {
        readonly causationId: string;
        readonly childExecutionId: string;
        readonly contributionId: string;
        readonly contributionVersion: string;
        readonly correlationId: string;
        readonly parentExecutionId: string;
        readonly rootExecutionId: string;
      }
    | undefined
  )[];
  readonly lineage?: {
    readonly causationId: string;
    readonly childExecutionId: string;
    readonly correlationId: string;
    readonly parentExecutionId: string;
    readonly rootExecutionId: string;
  };
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
  const commandExecutionId = input.events
    .map(({ body }) => field(body, "rootExecutionId", "turnId", "executionId"))
    .find((value): value is string => Boolean(value));
  for (const [index, event] of input.events.entries()) {
    sequence += 1;
    const bodyJson = canonicalJson(event.body);
    const body =
      event.body && typeof event.body === "object" && !Array.isArray(event.body)
        ? (event.body as Record<string, unknown>)
        : {};
    const actionId = field(body, "actionId");
    const actionIdentity = actionId
      ? database
          .query<
            {
              execution_id: string;
              reactor_id: string;
              reactor_version: number | null;
              source_event_id: string;
            },
            [string]
          >(
            "SELECT actions.execution_id,actions.reactor_id,actions.source_event_id,reaction_runs.reactor_version FROM actions LEFT JOIN reaction_runs ON reaction_runs.source_event_id = actions.source_event_id AND reaction_runs.reactor_id = actions.reactor_id WHERE actions.action_id = ? ORDER BY reaction_runs.reactor_version DESC LIMIT 1",
          )
          .get(actionId)
      : undefined;
    const executionId =
      field(body, "childExecutionId", "executionId") ??
      actionIdentity?.execution_id;
    const childIdentity = executionId
      ? database
          .query<
            {
              child_execution_id: string;
              parent_execution_id: string;
              root_execution_id: string;
            },
            [string]
          >(
            "SELECT agent_runs.child_execution_id,delegation_groups.parent_execution_id,delegation_groups.root_execution_id FROM agent_runs JOIN delegation_groups USING(delegation_group_id) WHERE agent_runs.child_execution_id = ? LIMIT 1",
          )
          .get(executionId)
      : undefined;
    const ancestryRoot = executionId
      ? database
          .query<{ ancestor_execution_id: string }, [string]>(
            "SELECT ancestor_execution_id FROM execution_ancestry WHERE descendant_execution_id = ? ORDER BY depth DESC LIMIT 1",
          )
          .get(executionId)?.ancestor_execution_id
      : undefined;
    const aggregateVersion =
      (database
        .query<{ version: number }, [string]>(
          "SELECT count(*) + 1 AS version FROM events WHERE stream_id = ?",
        )
        .get(event.streamId)?.version ?? 1);
    const eventContext = input.eventContexts?.[index];
    const causationId =
      eventContext?.causationId ??
      input.lineage?.causationId ??
      actionIdentity?.source_event_id ??
      field(body, "causationId", "sourceEventId") ??
      input.commandId;
    const causalEvent = database
      .query<
        {
          child_execution_id: string;
          correlation_id: string;
          parent_execution_id: string;
          root_execution_id: string;
        },
        [string]
      >(
        "SELECT child_execution_id,correlation_id,parent_execution_id,root_execution_id FROM events WHERE event_id = ?",
      )
      .get(causationId);
    const rootExecutionId =
      eventContext?.rootExecutionId ??
      input.lineage?.rootExecutionId ??
      field(body, "rootExecutionId", "turnId") ??
      childIdentity?.root_execution_id ??
      ancestryRoot ??
      causalEvent?.root_execution_id ??
      commandExecutionId ??
      executionId ??
      event.streamId;
    const parentExecutionId =
      eventContext?.parentExecutionId ??
      input.lineage?.parentExecutionId ??
      field(body, "parentExecutionId") ??
      childIdentity?.parent_execution_id ??
      causalEvent?.parent_execution_id ??
      executionId ??
      rootExecutionId;
    const childExecutionId =
      eventContext?.childExecutionId ??
      input.lineage?.childExecutionId ??
      field(body, "childExecutionId", "executionId") ??
      childIdentity?.child_execution_id ??
      causalEvent?.child_execution_id ??
      rootExecutionId;
    const correlationId =
      eventContext?.correlationId ??
      input.lineage?.correlationId ??
      field(body, "correlationId", "turnId", "delegationGroupId") ??
      causalEvent?.correlation_id ??
      rootExecutionId;
    const contributionId =
      eventContext?.contributionId ??
      input.contributionId ??
      actionIdentity?.reactor_id ??
      input.pluginId;
    const contributionVersion =
      eventContext?.contributionVersion ??
      input.contributionVersion ??
      (actionIdentity?.reactor_version === null ||
      actionIdentity?.reactor_version === undefined
        ? "1"
        : String(actionIdentity.reactor_version));
    const catalogDigest =
      database
        .query<{ value: string }, [string]>(
          "SELECT value FROM harness_metadata WHERE key = ?",
        )
        .get("active_catalog_digest")?.value ?? emptyHash;
    const envelope = {
      aggregateVersion,
      catalogDigest,
      causationId,
      childExecutionId,
      contributionId,
      contributionVersion,
      correlationId,
      eventSchemaVersion: 1,
      parentExecutionId,
      rootExecutionId,
    };
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
      ...envelope,
    });
    const eventHash = createHash("sha256").update(hashInput).digest("hex");
    const eventId = createHash("sha256")
      .update(`${input.actorId}:${input.commandId}:${index}:${eventHash}`)
      .digest("hex");
    database.run(
      "INSERT INTO events(global_sequence,event_id,command_id,actor_id,plugin_id,event_type,stream_id,body_json,occurred_at,previous_hash,event_hash,event_schema_version,aggregate_version,causation_id,correlation_id,root_execution_id,parent_execution_id,child_execution_id,contribution_id,contribution_version,catalog_digest) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
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
        envelope.eventSchemaVersion,
        envelope.aggregateVersion,
        envelope.causationId,
        envelope.correlationId,
        envelope.rootExecutionId,
        envelope.parentExecutionId,
        envelope.childExecutionId,
        envelope.contributionId,
        envelope.contributionVersion,
        envelope.catalogDigest,
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
