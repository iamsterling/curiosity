import { Effect, Schema } from "effect";
import { PluginFailure } from "../kernel/errors.js";
import {
  KERNEL_PLUGIN_API_VERSION,
  type CuriosityPluginV2,
} from "../kernel/plugin.js";

class ObservationRecorded extends Schema.Class<ObservationRecorded>(
  "@curiosity/custom-harness/ObservationRecorded",
)({
  category: Schema.Literals(["action", "conversation", "failure", "provider"]),
  observationId: Schema.NonEmptyString,
  schemaVersion: Schema.Literal(1),
  sourceEventHash: Schema.NonEmptyString,
  sourceEventId: Schema.NonEmptyString,
  sourceEventType: Schema.NonEmptyString,
  summary: Schema.NonEmptyString,
  taint: Schema.Literals([
    "trusted-kernel-metadata",
    "untrusted-evidence-candidate",
    "untrusted-model-output",
    "untrusted-user-input",
  ]),
}) {}

const decodeObservation = Schema.decodeUnknownEffect(ObservationRecorded, {
  onExcessProperty: "error",
});

const categoryFor = (eventType: string): ObservationRecorded["category"] => {
  if (eventType === "action.failed" || eventType === "turn.failed")
    return "failure";
  if (eventType === "action.succeeded") return "provider";
  if (eventType.startsWith("action.")) return "action";
  return "conversation";
};

const taintFor = (
  eventType: string,
  body: unknown,
): ObservationRecorded["taint"] => {
  if (eventType === "evidence.recorded") return "untrusted-evidence-candidate";
  if (eventType === "message.appended") {
    const role =
      body && typeof body === "object" && !Array.isArray(body)
        ? (body as Record<string, unknown>).role
        : undefined;
    return role === "assistant"
      ? "untrusted-model-output"
      : "untrusted-user-input";
  }
  if (eventType === "turn.requested") return "untrusted-user-input";
  return "trusted-kernel-metadata";
};

export const observationsPlugin: CuriosityPluginV2 = {
  eventReactors: [
    {
      eventTypes: [
        "action.failed",
        "action.proposed",
        "action.succeeded",
        "message.appended",
        "search.requested",
        "skill.activated",
        "tool.invocation.requested",
        "workflow.advanced",
        "workflow.child-created",
        "workflow.completed",
        "workflow.failed",
        "workflow.requested",
        "workflow.started",
        "evidence.recorded",
        "ledger.criterion.recorded",
        "ledger.intent.recorded",
        "ledger.resolution.proposed",
        "ledger.work.recorded",
        "thread.opened",
        "turn.failed",
        "turn.requested",
      ],
      id: "curiosity.stock.observations.reactors.classify",
      react: (event) =>
        Effect.succeed({
          actions: [],
          events: [
            {
              body: {
                category: categoryFor(event.type),
                observationId: `observation:${event.eventId}`,
                schemaVersion: 1,
                sourceEventHash: event.eventHash,
                sourceEventId: event.eventId,
                sourceEventType: event.type,
                summary: `Observed canonical ${event.type} event at sequence ${event.sequence}.`,
                taint: taintFor(event.type, event.body),
              },
              streamId: event.streamId,
              type: "observation.recorded",
            },
          ],
        }),
      schemaVersion: 1,
    },
  ],
  manifest: {
    capabilities: [],
    class: "semantic",
    id: "curiosity.stock.observations",
    kernelApi: KERNEL_PLUGIN_API_VERSION,
    provenance: {
      license: "Project-owned clean-room translation",
      revision: "1.0.0",
      source: "apps/custom-harness/src/plugins/observations.ts",
    },
    requires: [],
    schemaVersion: 2,
    version: "1.0.0",
  },
  projections: [
    {
      eventSchemas: [
        { eventType: "observation.recorded", schemaVersions: [1] },
      ],
      id: "curiosity.stock.observations.projections.recent",
      initialState: {
        observations: [],
        revision: 0,
        schemaVersion: 1,
        total: 0,
      },
      reduce: Effect.fn("ObservationsProjection.reduce")(
        function* (state, event) {
          const current = state as {
            readonly observations: readonly ObservationRecorded[];
            readonly schemaVersion: 1;
            readonly total: number;
          };
          const observation = yield* decodeObservation(event.body).pipe(
            Effect.mapError(
              () =>
                new PluginFailure({
                  message: "OBSERVATION_EVENT_INVALID",
                  pluginId: "curiosity.stock.observations",
                }),
            ),
          );
          return {
            observations: [...current.observations, { ...observation }].slice(
              -256,
            ),
            revision: event.sequence,
            schemaVersion: 1,
            total: current.total + 1,
          };
        },
      ),
      schemaVersion: 1,
    },
  ],
};
