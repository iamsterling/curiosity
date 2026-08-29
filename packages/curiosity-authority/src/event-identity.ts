import { canonicalJson } from "./canonical-json.js";
import type { CommandInput, ProposedEvent } from "./domain.js";

export interface StoredEventEnvelope {
  readonly actorId: string;
  readonly aggregateVersion: number;
  readonly body: unknown;
  readonly catalogDigest: string;
  readonly causationId: string;
  readonly childExecutionId: string;
  readonly commandId: string;
  readonly contributionId: string;
  readonly contributionVersion: string;
  readonly correlationId: string;
  readonly eventSchemaVersion: number;
  readonly occurredAt: string;
  readonly parentExecutionId: string;
  readonly pluginId: string;
  readonly previousHash: string;
  readonly rootExecutionId: string;
  readonly sequence: number;
  readonly streamId: string;
  readonly type: string;
}

export const commandDigestSource = (command: CommandInput): string =>
  canonicalJson({
    id: command.id,
    kind: command.kind,
    payload: command.payload,
    schemaVersion: command.schemaVersion,
  });

export const eventHashSource = (event: StoredEventEnvelope): string =>
  canonicalJson(event);

export const eventIdSource = (
  actorId: string,
  commandId: string,
  eventIndex: number,
  eventHash: string,
): string => `${actorId}:${commandId}:${eventIndex}:${eventHash}`;

const field = (
  value: unknown,
  ...names: readonly string[]
): string | undefined =>
  value && typeof value === "object" && !Array.isArray(value)
    ? names
        .map((name) => (value as Record<string, unknown>)[name])
        .find(
          (candidate): candidate is string =>
            typeof candidate === "string" && candidate.length > 0,
        )
    : undefined;

export const commandExecutionId = (
  events: readonly ProposedEvent[],
): string | undefined =>
  events
    .map(({ body }) => field(body, "rootExecutionId", "turnId", "executionId"))
    .find((value): value is string => Boolean(value));

export const basicEventLineage = (
  event: ProposedEvent,
  commandId: string,
  executionId?: string,
) => {
  const rootExecutionId =
    field(event.body, "rootExecutionId", "turnId") ??
    executionId ??
    event.streamId;
  return Object.freeze({
    causationId: commandId,
    childExecutionId:
      field(event.body, "childExecutionId", "executionId") ?? rootExecutionId,
    correlationId:
      field(event.body, "correlationId", "turnId", "delegationGroupId") ??
      rootExecutionId,
    parentExecutionId:
      field(event.body, "parentExecutionId") ?? rootExecutionId,
    rootExecutionId,
  });
};
