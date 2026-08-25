import { Effect, Schema } from "effect";
import { InputRejected } from "../kernel/errors.js";
import {
  KERNEL_PLUGIN_API_VERSION,
  type CuriosityPluginV2,
  type WorkflowContribution,
} from "../kernel/plugin.js";

class OrchestrationStart extends Schema.Class<OrchestrationStart>(
  "@curiosity/custom-harness/OrchestrationStart",
)({
  capabilityRequests: Schema.Array(Schema.NonEmptyString),
  instanceId: Schema.NonEmptyString,
  objective: Schema.NonEmptyString,
  schemaVersion: Schema.Literal(1),
  workflowName: Schema.Literals([
    "ceiling-violation",
    "delegated-gated",
    "delegated-review",
  ]),
}) {}

const decodeStart = Schema.decodeUnknownEffect(OrchestrationStart, {
  onExcessProperty: "error",
});

const orchestrationWorkflows: readonly WorkflowContribution[] = [
  {
    id: "curiosity.stock.orchestration.workflows.delegated-review",
    initialState: { phase: "queued", schemaVersion: 1 },
    limits: {
      maxActions: 0,
      maxChildren: 1,
      maxDelegationDepth: 1,
      maxNoProgress: 1,
      maxSteps: 4,
    },
    name: "delegated-review",
    schemaVersion: 1,
    transition: (input) => {
      const completed = input.children.some(
        (child) => child.id === "review" && child.status === "completed",
      );
      return Effect.succeed(
        input.children.length === 0
          ? {
              actions: [],
              children: [
                {
                  id: "review",
                  requestedCapabilities: [],
                  workflowName: "review-child",
                },
              ],
              nextState: { phase: "waiting-review", schemaVersion: 1 },
              progressKey: "review-delegated",
              terminalRequested: false,
            }
          : {
              actions: [],
              children: [],
              nextState: {
                phase: completed ? "done" : "waiting-review",
                schemaVersion: 1,
              },
              progressKey: completed ? "review-accepted" : "review-waiting",
              terminalRequested: completed,
            },
      );
    },
    version: "1.0.0",
  },
  {
    id: "curiosity.stock.orchestration.workflows.ceiling-violation",
    initialState: { phase: "queued", schemaVersion: 1 },
    limits: {
      maxActions: 0,
      maxChildren: 1,
      maxDelegationDepth: 1,
      maxNoProgress: 0,
      maxSteps: 2,
    },
    name: "ceiling-violation",
    schemaVersion: 1,
    transition: () =>
      Effect.succeed({
        actions: [],
        children: [
          {
            id: "overbroad-child",
            requestedCapabilities: ["provider.generate"],
            workflowName: "review-child",
          },
        ],
        nextState: { phase: "must-not-commit", schemaVersion: 1 },
        progressKey: "must-not-progress",
        terminalRequested: false,
      }),
    version: "1.0.0",
  },
  {
    id: "curiosity.stock.orchestration.workflows.delegated-gated",
    initialState: { phase: "queued", schemaVersion: 1 },
    limits: {
      maxActions: 0,
      maxChildren: 1,
      maxDelegationDepth: 1,
      maxNoProgress: 0,
      maxSteps: 2,
    },
    name: "delegated-gated",
    schemaVersion: 1,
    transition: () =>
      Effect.succeed({
        actions: [],
        children: [
          {
            id: "gated-child",
            requestedCapabilities: [],
            workflowName: "gated-wait",
          },
        ],
        nextState: { phase: "waiting-child", schemaVersion: 1 },
        progressKey: "gated-child-created",
        terminalRequested: false,
      }),
    version: "1.0.0",
  },
];

export const orchestrationPlugin: CuriosityPluginV2 = {
  commandDeciders: [
    {
      commandKinds: ["orchestration.start"],
      decide: Effect.fn("OrchestrationPlugin.start")(function* (command) {
        const input = yield* decodeStart(command.payload).pipe(
          Effect.mapError(
            () => new InputRejected({ message: "ORCHESTRATION_START_INVALID" }),
          ),
        );
        if (
          input.instanceId.length > 256 ||
          input.objective.length > 16_384 ||
          input.capabilityRequests.length > 16 ||
          new Set(input.capabilityRequests).size !==
            input.capabilityRequests.length
        )
          return yield* new InputRejected({
            message: "ORCHESTRATION_START_INVALID",
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
      id: "curiosity.stock.orchestration.commands.start",
      schemaVersion: 1,
    },
  ],
  manifest: {
    capabilities: [],
    class: "semantic",
    id: "curiosity.stock.orchestration",
    kernelApi: KERNEL_PLUGIN_API_VERSION,
    provenance: {
      license: "Project-owned clean-room translation",
      revision: "1.0.0",
      source: "apps/custom-harness/src/plugins/orchestration.ts",
    },
    requires: [{ pluginId: "curiosity.stock.loop", version: "1.0.0" }],
    schemaVersion: 2,
    version: "1.0.0",
  },
  workflows: orchestrationWorkflows,
};
