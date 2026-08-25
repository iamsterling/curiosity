import { Effect, Schema } from "effect";
import { InputRejected, PluginFailure } from "../kernel/errors.js";
import {
  KERNEL_PLUGIN_API_VERSION,
  type CuriosityPluginV2,
} from "../kernel/plugin.js";

class EvidenceCandidate extends Schema.Class<EvidenceCandidate>(
  "@curiosity/custom-harness/EvidenceCandidate",
)({
  criterionId: Schema.NonEmptyString,
  criterionRevision: Schema.Number,
  environmentDigest: Schema.NonEmptyString,
  executionId: Schema.NonEmptyString,
  expiresAt: Schema.optional(Schema.NonEmptyString),
  id: Schema.NonEmptyString,
  inputDigest: Schema.NonEmptyString,
  intentId: Schema.NonEmptyString,
  kind: Schema.Literals([
    "build-result",
    "command-result",
    "diff-observation",
    "review-finding",
    "runtime-probe",
    "source-citation",
    "static-analysis",
    "test-green",
    "test-red",
    "user-observation",
  ]),
  observedAt: Schema.NonEmptyString,
  outputDigest: Schema.NonEmptyString,
  schemaVersion: Schema.Literal(1),
  sourceEventIds: Schema.Array(Schema.NonEmptyString),
  status: Schema.Literals(["failed", "observed", "passed"]),
  workId: Schema.NonEmptyString,
}) {}

const strict = { onExcessProperty: "error" } as const;
const decodeEvidence = Schema.decodeUnknownEffect(EvidenceCandidate, strict);
const sha256 = /^[a-f0-9]{64}$/u;
const identity = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,255}$/u;

const validTimestamp = (value: string): boolean =>
  Number.isFinite(Date.parse(value)) && new Date(value).toISOString() === value;

const validateEvidence = (input: EvidenceCandidate): boolean =>
  identity.test(input.id) &&
  identity.test(input.intentId) &&
  identity.test(input.criterionId) &&
  identity.test(input.workId) &&
  identity.test(input.executionId) &&
  Number.isSafeInteger(input.criterionRevision) &&
  input.criterionRevision >= 1 &&
  [input.environmentDigest, input.inputDigest, input.outputDigest].every(
    (value) => sha256.test(value),
  ) &&
  input.sourceEventIds.length > 0 &&
  input.sourceEventIds.length <= 64 &&
  new Set(input.sourceEventIds).size === input.sourceEventIds.length &&
  validTimestamp(input.observedAt) &&
  (input.expiresAt === undefined ||
    (validTimestamp(input.expiresAt) &&
      Date.parse(input.expiresAt) > Date.parse(input.observedAt)));

const eventBody = (value: unknown): Record<string, unknown> | undefined =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;

export const evidencePlugin: CuriosityPluginV2 = {
  commandDeciders: [
    {
      commandKinds: ["evidence.record"],
      decide: Effect.fn("EvidencePlugin.decide")(function* (command, context) {
        const input = yield* decodeEvidence(command.payload).pipe(
          Effect.mapError(
            () => new InputRejected({ message: "EVIDENCE_PAYLOAD_INVALID" }),
          ),
        );
        if (!validateEvidence(input))
          return yield* new InputRejected({
            message: "EVIDENCE_PAYLOAD_INVALID",
          });
        const sourceIds = new Set(context.events.map((event) => event.eventId));
        if (input.sourceEventIds.some((eventId) => !sourceIds.has(eventId)))
          return yield* new InputRejected({
            message: "EVIDENCE_SOURCE_EVENT_MISSING",
          });
        const intent = context.events.find(
          (event) =>
            event.type === "ledger.intent.recorded" &&
            eventBody(event.body)?.id === input.intentId,
        );
        const criterion = context.events.find(
          (event) =>
            event.type === "ledger.criterion.recorded" &&
            eventBody(event.body)?.id === input.criterionId,
        );
        const work = context.events.find(
          (event) =>
            event.type === "ledger.work.recorded" &&
            eventBody(event.body)?.id === input.workId,
        );
        if (!intent || !criterion || !work)
          return yield* new InputRejected({
            message: "EVIDENCE_LEDGER_BINDING_MISSING",
          });
        if (
          eventBody(criterion.body)?.intentId !== input.intentId ||
          eventBody(criterion.body)?.revision !== input.criterionRevision ||
          eventBody(work.body)?.intentId !== input.intentId
        )
          return yield* new InputRejected({
            message: "EVIDENCE_LEDGER_BINDING_MISMATCH",
          });
        if (
          context.events.some(
            (event) =>
              event.type === "evidence.recorded" &&
              eventBody(event.body)?.id === input.id,
          )
        )
          return yield* new InputRejected({
            message: "EVIDENCE_ID_IMMUTABLE",
          });
        return [
          {
            body: { ...input },
            streamId: input.intentId,
            type: "evidence.recorded",
          },
        ];
      }),
      id: "curiosity.stock.evidence.commands.record",
      schemaVersion: 1,
    },
  ],
  context: [
    {
      actionTypes: ["provider.generate"],
      agentIds: [],
      eventTypes: ["evidence.recorded"],
      id: "curiosity.stock.evidence.context.candidates",
      maxBlocks: 1,
      maxEvents: 32,
      maxOutputBytes: 16_384,
      project: Effect.fn("EvidenceContext.project")(function* (input) {
        const candidates: Array<{
          readonly eventId: string;
          readonly evidence: EvidenceCandidate;
        }> = [];
        for (const event of input.events) {
          const decoded = yield* decodeEvidence(event.body).pipe(
            Effect.mapError(
              () =>
                new PluginFailure({
                  message: "EVIDENCE_EVENT_INVALID",
                  pluginId: "curiosity.stock.evidence",
                }),
            ),
          );
          candidates.push({ eventId: event.eventId, evidence: decoded });
        }
        if (candidates.length === 0) return [];
        return [
          {
            content: candidates
              .map(
                ({ evidence }) =>
                  `${evidence.id}: ${evidence.kind} reported ${evidence.status}; digest ${evidence.outputDigest}`,
              )
              .join("\n"),
            id: "evidence-candidates",
            provenance: "untrusted-evidence" as const,
            sourceEventIds: candidates.map(({ eventId }) => eventId),
          },
        ];
      }),
      rank: 200,
      required: false,
      schemaVersion: 1,
      slot: "durable-context",
    },
  ],
  manifest: {
    capabilities: [],
    class: "semantic",
    id: "curiosity.stock.evidence",
    kernelApi: KERNEL_PLUGIN_API_VERSION,
    provenance: {
      license: "Project-owned clean-room translation",
      revision: "1.0.0",
      source: "apps/custom-harness/src/plugins/evidence.ts",
    },
    requires: [{ pluginId: "curiosity.stock.ledger", version: "1.0.0" }],
    schemaVersion: 2,
    version: "1.0.0",
  },
  projections: [
    {
      eventSchemas: [{ eventType: "evidence.recorded", schemaVersions: [1] }],
      id: "curiosity.stock.evidence.projections.candidates",
      initialState: {
        candidates: [],
        revision: 0,
        schemaVersion: 1,
      },
      reduce: Effect.fn("EvidenceProjection.reduce")(function* (state, event) {
        const evidence = yield* decodeEvidence(event.body).pipe(
          Effect.mapError(
            () =>
              new PluginFailure({
                message: "EVIDENCE_EVENT_INVALID",
                pluginId: "curiosity.stock.evidence",
              }),
          ),
        );
        const current = state as {
          readonly candidates: readonly unknown[];
          readonly schemaVersion: 1;
        };
        return {
          candidates: [
            ...current.candidates,
            {
              ...evidence,
              assertionState: "PENDING",
              authority: "none",
              custody: "PROVISIONAL",
              eventId: event.eventId,
              producerActorId: event.actorId,
            },
          ],
          revision: event.sequence,
          schemaVersion: 1,
        };
      }),
      schemaVersion: 1,
    },
  ],
};
