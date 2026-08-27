import { Effect, Schema } from "effect";
import { PluginFailure } from "../kernel/errors.js";
import {
  KERNEL_PLUGIN_API_VERSION,
  type CuriosityPluginV2,
  type ToolContribution,
} from "../kernel/plugin.js";

class DelegatedTask extends Schema.Class<DelegatedTask>(
  "@curiosity/custom-harness/DelegatedTask",
)({
  acceptanceChecks: Schema.Array(Schema.NonEmptyString),
  contextRefs: Schema.Array(Schema.NonEmptyString),
  deliverable: Schema.NonEmptyString,
  nonGoals: Schema.Array(Schema.NonEmptyString),
  objective: Schema.NonEmptyString,
}) {}

class DelegatedOwnership extends Schema.Class<DelegatedOwnership>(
  "@curiosity/custom-harness/DelegatedOwnership",
)({
  readOnly: Schema.Boolean,
  resources: Schema.Array(Schema.NonEmptyString),
}) {}

class DelegatedAuthority extends Schema.Class<DelegatedAuthority>(
  "@curiosity/custom-harness/DelegatedAuthority",
)({
  capabilities: Schema.Array(Schema.NonEmptyString),
  maximumProviderCalls: Schema.Number,
  maximumToolCalls: Schema.Number,
  tools: Schema.Array(Schema.NonEmptyString),
}) {}

class ChildContinuation extends Schema.Class<ChildContinuation>(
  "@curiosity/custom-harness/ChildContinuation",
)({
  agentSessionId: Schema.NonEmptyString,
  expectedRevision: Schema.Number,
}) {}

class AgentDelegateInput extends Schema.Class<AgentDelegateInput>(
  "@curiosity/custom-harness/AgentDelegateInput",
)({
  agentId: Schema.NonEmptyString,
  continuation: Schema.optional(ChildContinuation),
  description: Schema.NonEmptyString,
  ownership: DelegatedOwnership,
  requested: DelegatedAuthority,
  schemaVersion: Schema.Literal(1),
  task: DelegatedTask,
}) {}

const decodeInput = Schema.decodeUnknownEffect(AgentDelegateInput, {
  onExcessProperty: "error",
});
const identifierPattern = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,255}$/u;

const uniqueBoundedIdentifiers = (
  values: readonly string[],
  maximum: number,
): boolean =>
  values.length <= maximum &&
  new Set(values).size === values.length &&
  values.every(
    (value) => Buffer.byteLength(value) <= 256 && identifierPattern.test(value),
  );

const boundedTextArray = (
  values: readonly string[],
  maximum: number,
): boolean =>
  values.length <= maximum &&
  values.every((value) => Buffer.byteLength(value) <= 8 * 1_024);

const validInput = (input: AgentDelegateInput): boolean =>
  identifierPattern.test(input.agentId) &&
  Buffer.byteLength(input.agentId) <= 256 &&
  Array.from(input.description).length <= 120 &&
  Buffer.byteLength(input.task.objective) <= 8 * 1_024 &&
  Buffer.byteLength(input.task.deliverable) <= 8 * 1_024 &&
  boundedTextArray(input.task.acceptanceChecks, 16) &&
  boundedTextArray(input.task.nonGoals, 16) &&
  uniqueBoundedIdentifiers(input.task.contextRefs, 32) &&
  uniqueBoundedIdentifiers(input.ownership.resources, 32) &&
  uniqueBoundedIdentifiers(input.requested.capabilities, 32) &&
  uniqueBoundedIdentifiers(input.requested.tools, 64) &&
  Number.isSafeInteger(input.requested.maximumProviderCalls) &&
  input.requested.maximumProviderCalls >= 1 &&
  input.requested.maximumProviderCalls <= 8 &&
  Number.isSafeInteger(input.requested.maximumToolCalls) &&
  input.requested.maximumToolCalls >= 0 &&
  input.requested.maximumToolCalls <= 8 &&
  (!input.continuation ||
    (identifierPattern.test(input.continuation.agentSessionId) &&
      Number.isSafeInteger(input.continuation.expectedRevision) &&
      input.continuation.expectedRevision >= 0)) &&
  Buffer.byteLength(JSON.stringify(input)) <= 64 * 1_024;

const agentDelegateTool: ToolContribution = {
  actionType: "agent.delegate",
  description:
    "Delegate one bounded task to a fresh, independently executed child agent under inherited authority ceilings.",
  id: "curiosity.stock.delegation.tools.agent-delegate",
  inputSchema: {
    additionalProperties: false,
    properties: {
      agentId: { maxLength: 256, minLength: 1, type: "string" },
      continuation: {
        additionalProperties: false,
        properties: {
          agentSessionId: { maxLength: 256, minLength: 1, type: "string" },
          expectedRevision: { minimum: 0, type: "integer" },
        },
        required: ["agentSessionId", "expectedRevision"],
        type: "object",
      },
      description: { maxLength: 120, minLength: 1, type: "string" },
      ownership: {
        additionalProperties: false,
        properties: {
          readOnly: { type: "boolean" },
          resources: {
            items: { maxLength: 256, minLength: 1, type: "string" },
            maxItems: 32,
            type: "array",
          },
        },
        required: ["readOnly", "resources"],
        type: "object",
      },
      requested: {
        additionalProperties: false,
        properties: {
          capabilities: {
            items: { maxLength: 256, minLength: 1, type: "string" },
            maxItems: 32,
            type: "array",
          },
          maximumProviderCalls: { maximum: 8, minimum: 1, type: "integer" },
          maximumToolCalls: { maximum: 8, minimum: 0, type: "integer" },
          tools: {
            items: { maxLength: 256, minLength: 1, type: "string" },
            maxItems: 64,
            type: "array",
          },
        },
        required: [
          "capabilities",
          "tools",
          "maximumProviderCalls",
          "maximumToolCalls",
        ],
        type: "object",
      },
      schemaVersion: { const: 1 },
      task: {
        additionalProperties: false,
        properties: {
          acceptanceChecks: {
            items: { maxLength: 8192, minLength: 1, type: "string" },
            maxItems: 16,
            type: "array",
          },
          contextRefs: {
            items: { maxLength: 256, minLength: 1, type: "string" },
            maxItems: 32,
            type: "array",
          },
          deliverable: { maxLength: 8192, minLength: 1, type: "string" },
          nonGoals: {
            items: { maxLength: 8192, minLength: 1, type: "string" },
            maxItems: 16,
            type: "array",
          },
          objective: { maxLength: 8192, minLength: 1, type: "string" },
        },
        required: [
          "objective",
          "deliverable",
          "acceptanceChecks",
          "nonGoals",
          "contextRefs",
        ],
        type: "object",
      },
    },
    required: [
      "schemaVersion",
      "agentId",
      "description",
      "task",
      "ownership",
      "requested",
    ],
    type: "object",
  },
  name: "agent.delegate",
  outputProvenance: "untrusted-evidence",
  propose: Effect.fn("AgentDelegateTool.propose")(function* (value, subject) {
    const input = yield* decodeInput(value).pipe(
      Effect.mapError(
        () =>
          new PluginFailure({
            message: "AGENT_DELEGATE_INPUT_INVALID",
            pluginId: "curiosity.stock.delegation",
          }),
      ),
    );
    if (!validInput(input))
      return yield* new PluginFailure({
        message: "AGENT_DELEGATE_INPUT_INVALID",
        pluginId: "curiosity.stock.delegation",
      });
    return {
      actionSchemaVersion: 1,
      actionType: "agent.delegate",
      deadlineClass: "background",
      gateClass: "none-requested",
      input: {
        request: {
          agentId: input.agentId,
          ...(input.continuation
            ? {
                continuation: {
                  agentSessionId: input.continuation.agentSessionId,
                  expectedRevision: input.continuation.expectedRevision,
                },
              }
            : {}),
          description: input.description,
          ownership: {
            readOnly: input.ownership.readOnly,
            resources: [...input.ownership.resources],
          },
          requested: {
            capabilities: [...input.requested.capabilities],
            maximumProviderCalls: input.requested.maximumProviderCalls,
            maximumToolCalls: input.requested.maximumToolCalls,
            tools: [...input.requested.tools],
          },
          schemaVersion: 1,
          task: {
            acceptanceChecks: [...input.task.acceptanceChecks],
            contextRefs: [...input.task.contextRefs],
            deliverable: input.task.deliverable,
            nonGoals: [...input.task.nonGoals],
            objective: input.task.objective,
          },
        },
      },
      requestedCapabilities: ["child.propose"],
      schemaVersion: 1,
      subject,
    };
  }),
  readOnly: false,
  requestedCapabilities: ["child.propose"],
  schemaVersion: 1,
  version: "1.0.0",
};

export const delegationToolContributions = Object.freeze([agentDelegateTool]);

export const delegationPlugin: CuriosityPluginV2 = {
  manifest: {
    capabilities: ["child.propose"],
    class: "semantic",
    id: "curiosity.stock.delegation",
    kernelApi: KERNEL_PLUGIN_API_VERSION,
    provenance: {
      license: "Project-owned",
      revision: "1.0.0",
      source: "apps/custom-harness/src/plugins/delegation.ts",
    },
    requires: [],
    schemaVersion: 2,
    version: "1.0.0",
  },
  tools: delegationToolContributions,
};
