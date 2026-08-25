import { Effect } from "effect";
import type { ProposedEvent, StoredEvent } from "../domain/event.js";
import { InputRejected, PluginFailure } from "../kernel/errors.js";
import {
  KERNEL_PLUGIN_API_VERSION,
  type CuriosityPluginV2,
} from "../kernel/plugin.js";
import {
  decodeLedgerCriterion,
  decodeLedgerIntent,
  decodeLedgerResolution,
  decodeLedgerWork,
  validRevision,
  validStringList,
} from "../domain/ledger.js";

const record = (value: unknown): Record<string, unknown> | undefined =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;

const hasEntity = (
  events: readonly StoredEvent[],
  eventType: string,
  id: string,
): boolean =>
  events.some(
    (event) => event.type === eventType && record(event.body)?.id === id,
  );

const reject = (message: string) => new InputRejected({ message });

const event = (
  type: string,
  streamId: string,
  body: Record<string, unknown>,
): ProposedEvent => ({ body, streamId, type });

const decideLedger = Effect.fn("LedgerPlugin.decide")(function* (
  command: Parameters<
    NonNullable<CuriosityPluginV2["commandDeciders"]>[number]["decide"]
  >[0],
  context: Parameters<
    NonNullable<CuriosityPluginV2["commandDeciders"]>[number]["decide"]
  >[1],
) {
  if (command.kind === "ledger.intent.record") {
    const input = yield* decodeLedgerIntent(command.payload).pipe(
      Effect.mapError(() => reject("LEDGER_INTENT_PAYLOAD_INVALID")),
    );
    if (
      !validRevision(input.revision) ||
      !validStringList(input.scope) ||
      !validStringList(input.nonGoals)
    )
      return yield* reject("LEDGER_INTENT_PAYLOAD_INVALID");
    if (hasEntity(context.events, "ledger.intent.recorded", input.id))
      return yield* reject("LEDGER_ENTITY_IMMUTABLE");
    return [event("ledger.intent.recorded", input.id, { ...input })];
  }
  if (command.kind === "ledger.criterion.record") {
    const input = yield* decodeLedgerCriterion(command.payload).pipe(
      Effect.mapError(() => reject("LEDGER_CRITERION_PAYLOAD_INVALID")),
    );
    if (
      !validRevision(input.revision) ||
      !validRevision(input.intentRevision) ||
      !validStringList(input.requiredEvidence)
    )
      return yield* reject("LEDGER_CRITERION_PAYLOAD_INVALID");
    const intent = context.events.find(
      (item) =>
        item.type === "ledger.intent.recorded" &&
        record(item.body)?.id === input.intentId,
    );
    if (record(intent?.body)?.revision !== input.intentRevision)
      return yield* reject("LEDGER_INTENT_REVISION_MISMATCH");
    if (hasEntity(context.events, "ledger.criterion.recorded", input.id))
      return yield* reject("LEDGER_ENTITY_IMMUTABLE");
    return [event("ledger.criterion.recorded", input.intentId, { ...input })];
  }
  if (command.kind === "ledger.work.record") {
    const input = yield* decodeLedgerWork(command.payload).pipe(
      Effect.mapError(() => reject("LEDGER_WORK_PAYLOAD_INVALID")),
    );
    if (
      !validRevision(input.intentRevision) ||
      !validStringList(input.criterionIds) ||
      !validStringList(input.writableScope)
    )
      return yield* reject("LEDGER_WORK_PAYLOAD_INVALID");
    if (
      input.criterionIds.some(
        (id) => !hasEntity(context.events, "ledger.criterion.recorded", id),
      )
    )
      return yield* reject("LEDGER_CRITERION_MISSING");
    if (hasEntity(context.events, "ledger.work.recorded", input.id))
      return yield* reject("LEDGER_ENTITY_IMMUTABLE");
    return [event("ledger.work.recorded", input.intentId, { ...input })];
  }
  const input = yield* decodeLedgerResolution(command.payload).pipe(
    Effect.mapError(() => reject("LEDGER_RESOLUTION_PAYLOAD_INVALID")),
  );
  if (!validStringList(input.evidenceIds))
    return yield* reject("LEDGER_RESOLUTION_PAYLOAD_INVALID");
  if (!hasEntity(context.events, "ledger.intent.recorded", input.intentId))
    return yield* reject("LEDGER_INTENT_MISSING");
  if (
    input.evidenceIds.some(
      (id) => !hasEntity(context.events, "evidence.recorded", id),
    )
  )
    return yield* reject("LEDGER_EVIDENCE_MISSING");
  if (hasEntity(context.events, "ledger.resolution.proposed", input.id))
    return yield* reject("LEDGER_ENTITY_IMMUTABLE");
  return [
    event("ledger.resolution.proposed", input.intentId, {
      ...input,
    }),
  ];
});

const eventDecoders = {
  "ledger.criterion.recorded": decodeLedgerCriterion,
  "ledger.intent.recorded": decodeLedgerIntent,
  "ledger.resolution.proposed": decodeLedgerResolution,
  "ledger.work.recorded": decodeLedgerWork,
} as const;

const decodeLedgerEventBody = (
  stored: StoredEvent,
): Effect.Effect<Record<string, unknown>, PluginFailure> => {
  const failure = () =>
    new PluginFailure({
      message: "LEDGER_EVENT_INVALID",
      pluginId: "curiosity.stock.ledger",
    });
  if (stored.type === "ledger.intent.recorded")
    return decodeLedgerIntent(stored.body).pipe(
      Effect.map((value) => ({ ...value })),
      Effect.mapError(failure),
    );
  if (stored.type === "ledger.criterion.recorded")
    return decodeLedgerCriterion(stored.body).pipe(
      Effect.map((value) => ({ ...value })),
      Effect.mapError(failure),
    );
  if (stored.type === "ledger.work.recorded")
    return decodeLedgerWork(stored.body).pipe(
      Effect.map((value) => ({ ...value })),
      Effect.mapError(failure),
    );
  return decodeLedgerResolution(stored.body).pipe(
    Effect.map((value) => ({ ...value })),
    Effect.mapError(failure),
  );
};

export const ledgerPlugin: CuriosityPluginV2 = {
  commandDeciders: [
    {
      commandKinds: [
        "ledger.criterion.record",
        "ledger.intent.record",
        "ledger.resolution.propose",
        "ledger.work.record",
      ],
      decide: decideLedger,
      id: "curiosity.stock.ledger.commands.domain",
      schemaVersion: 1,
    },
  ],
  manifest: {
    capabilities: [],
    class: "semantic",
    id: "curiosity.stock.ledger",
    kernelApi: KERNEL_PLUGIN_API_VERSION,
    provenance: {
      license: "Project-owned clean-room translation",
      revision: "1.0.0",
      source: "apps/custom-harness/src/plugins/ledger.ts",
    },
    requires: [],
    schemaVersion: 2,
    version: "1.0.0",
  },
  projections: [
    {
      eventSchemas: Object.keys(eventDecoders).map((eventType) => ({
        eventType,
        schemaVersions: [1],
      })),
      id: "curiosity.stock.ledger.projections.domain",
      initialState: {
        criteria: [],
        intents: [],
        resolutions: [],
        revision: 0,
        schemaVersion: 1,
        work: [],
      },
      reduce: Effect.fn("LedgerProjection.reduce")(function* (state, stored) {
        const entity = yield* decodeLedgerEventBody(stored);
        const current = state as Record<string, unknown>;
        const key =
          stored.type === "ledger.intent.recorded"
            ? "intents"
            : stored.type === "ledger.criterion.recorded"
              ? "criteria"
              : stored.type === "ledger.work.recorded"
                ? "work"
                : "resolutions";
        return {
          ...current,
          [key]: [
            ...((current[key] as readonly unknown[]) ?? []),
            {
              ...entity,
              ...(stored.type === "ledger.resolution.proposed"
                ? { authority: "proposal-only" }
                : {}),
              actorId: stored.actorId,
              eventId: stored.eventId,
            },
          ],
          revision: stored.sequence,
        };
      }),
      schemaVersion: 1,
    },
  ],
};
