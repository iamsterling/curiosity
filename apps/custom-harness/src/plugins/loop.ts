import { Effect, Schema } from "effect";
import { InputRejected, PluginFailure } from "../kernel/errors.js";
import {
  KERNEL_PLUGIN_API_VERSION,
  type CuriosityPluginV2,
  type WorkflowContribution,
} from "../kernel/plugin.js";

class LoopStart extends Schema.Class<LoopStart>(
  "@curiosity/custom-harness/LoopStart",
)({
  capabilityRequests: Schema.Array(Schema.NonEmptyString),
  instanceId: Schema.NonEmptyString,
  objective: Schema.NonEmptyString,
  schemaVersion: Schema.Literal(1),
  workflowName: Schema.Literals(["gated-wait", "goal-loop", "no-progress"]),
}) {}

const decodeStart = Schema.decodeUnknownEffect(LoopStart, {
  onExcessProperty: "error",
});
const limits = (
  overrides: Partial<WorkflowContribution["limits"]> = {},
): WorkflowContribution["limits"] => ({
  maxActions: 0,
  maxChildren: 0,
  maxDelegationDepth: 0,
  maxNoProgress: 2,
  maxSteps: 8,
  ...overrides,
});

const workflows: readonly WorkflowContribution[] = [
  {
    id: "curiosity.stock.loop.workflows.goal-loop",
    initialState: { phase: "queued", schemaVersion: 1 },
    limits: limits(),
    name: "goal-loop",
    schemaVersion: 1,
    transition: (input) =>
      Effect.succeed(
        input.step === 0
          ? {
              actions: [],
              children: [],
              nextState: { phase: "working", schemaVersion: 1 },
              progressKey: "goal-planned",
              terminalRequested: false,
            }
          : {
              actions: [],
              children: [],
              nextState: { phase: "done", schemaVersion: 1 },
              progressKey: "goal-complete",
              terminalRequested: true,
            },
      ),
    version: "1.0.0",
  },
  {
    id: "curiosity.stock.loop.workflows.no-progress",
    initialState: { phase: "stalled", schemaVersion: 1 },
    limits: limits({ maxNoProgress: 1, maxSteps: 6 }),
    name: "no-progress",
    schemaVersion: 1,
    transition: () =>
      Effect.succeed({
        actions: [],
        children: [],
        nextState: { phase: "stalled", schemaVersion: 1 },
        progressKey: "no-progress",
        terminalRequested: false,
      }),
    version: "1.0.0",
  },
  {
    id: "curiosity.stock.loop.workflows.review-child",
    initialState: { phase: "reviewing", schemaVersion: 1 },
    limits: limits({ maxNoProgress: 0, maxSteps: 2 }),
    name: "review-child",
    schemaVersion: 1,
    transition: () =>
      Effect.succeed({
        actions: [],
        children: [],
        nextState: { phase: "reviewed", schemaVersion: 1 },
        progressKey: "review-complete",
        terminalRequested: true,
      }),
    version: "1.0.0",
  },
  {
    id: "curiosity.stock.loop.workflows.gated-wait",
    initialState: { phase: "queued", schemaVersion: 1 },
    limits: limits({ maxActions: 1, maxNoProgress: 0, maxSteps: 2 }),
    name: "gated-wait",
    schemaVersion: 1,
    transition: (input) =>
      Effect.succeed({
        actions: [
          {
            actionSchemaVersion: 1,
            actionType: "workflow.wait",
            deadlineClass: "background",
            gateClass: "binding-human-requested",
            input: {
              instanceId: input.instanceId,
              schemaVersion: 1,
            },
            requestedCapabilities: [],
            schemaVersion: 1,
            subject: {
              executionId: input.instanceId,
              resource: `workflow:${input.instanceId}`,
            },
          },
        ],
        children: [],
        nextState: { phase: "waiting-gate", schemaVersion: 1 },
        progressKey: "gate-requested",
        terminalRequested: true,
      }),
    version: "1.0.0",
  },
];

const workflowEventTypes = [
  "workflow.advanced",
  "workflow.child-created",
  "workflow.completed",
  "workflow.failed",
  "workflow.started",
] as const;

export const loopPlugin: CuriosityPluginV2 = {
  commandDeciders: [
    {
      commandKinds: ["workflow.start"],
      decide: Effect.fn("LoopPlugin.start")(function* (command, context) {
        const input = yield* decodeStart(command.payload).pipe(
          Effect.mapError(
            () => new InputRejected({ message: "WORKFLOW_START_INVALID" }),
          ),
        );
        if (
          input.instanceId.length > 256 ||
          input.objective.length > 16_384 ||
          input.capabilityRequests.length > 16 ||
          new Set(input.capabilityRequests).size !==
            input.capabilityRequests.length ||
          context.events.some(
            (event) =>
              event.type === "workflow.requested" &&
              event.body &&
              typeof event.body === "object" &&
              !Array.isArray(event.body) &&
              (event.body as Record<string, unknown>).instanceId ===
                input.instanceId,
          )
        )
          return yield* new InputRejected({
            message: "WORKFLOW_INSTANCE_INVALID",
          });
        return [
          {
            body: {
              capabilityRequests: [...input.capabilityRequests],
              input: { objective: input.objective, schemaVersion: 1 },
              instanceId: input.instanceId,
              schemaVersion: 1,
              workflowName: input.workflowName,
            },
            streamId: input.instanceId,
            type: "workflow.requested",
          },
        ];
      }),
      id: "curiosity.stock.loop.commands.start",
      schemaVersion: 1,
    },
  ],
  manifest: {
    capabilities: [],
    class: "semantic",
    id: "curiosity.stock.loop",
    kernelApi: KERNEL_PLUGIN_API_VERSION,
    provenance: {
      license: "Project-owned clean-room translation",
      revision: "1.0.0",
      source: "apps/custom-harness/src/plugins/loop.ts",
    },
    requires: [],
    schemaVersion: 2,
    version: "1.0.0",
  },
  projections: [
    {
      eventSchemas: workflowEventTypes.map((eventType) => ({
        eventType,
        schemaVersions: [1],
      })),
      id: "curiosity.stock.loop.projections.runs",
      initialState: { events: [], revision: 0, schemaVersion: 1 },
      reduce: (state, event) => {
        if (
          !event.body ||
          typeof event.body !== "object" ||
          Array.isArray(event.body) ||
          (event.body as Record<string, unknown>).schemaVersion !== 1
        )
          return Effect.fail(
            new PluginFailure({
              message: "WORKFLOW_EVENT_INVALID",
              pluginId: "curiosity.stock.loop",
            }),
          );
        const current = state as { readonly events: readonly unknown[] };
        return Effect.succeed({
          events: [
            ...current.events,
            {
              body: event.body,
              eventId: event.eventId,
              sequence: event.sequence,
              type: event.type,
            },
          ].slice(-512),
          revision: event.sequence,
          schemaVersion: 1,
        });
      },
      schemaVersion: 1,
    },
  ],
  workflows,
};
