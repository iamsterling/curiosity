import { Effect, Schema } from "effect";
import { InputRejected, PluginFailure } from "../kernel/errors.js";
import {
  KERNEL_PLUGIN_API_VERSION,
  type CuriosityPluginV2,
  type ToolContribution,
} from "../kernel/plugin.js";

class LedgerQuery extends Schema.Class<LedgerQuery>(
  "@curiosity/custom-harness/LedgerQuery",
)({
  intentId: Schema.NonEmptyString,
  limit: Schema.Number,
  schemaVersion: Schema.Literal(1),
}) {}

class EvidenceQuery extends Schema.Class<EvidenceQuery>(
  "@curiosity/custom-harness/EvidenceQuery",
)({
  criterionId: Schema.NonEmptyString,
  intentId: Schema.NonEmptyString,
  limit: Schema.Number,
  schemaVersion: Schema.Literal(1),
}) {}

class ToolProposalCommand extends Schema.Class<ToolProposalCommand>(
  "@curiosity/custom-harness/ToolProposalCommand",
)({
  input: Schema.Unknown,
  proposalId: Schema.NonEmptyString,
  schemaVersion: Schema.Literal(1),
  subjectId: Schema.NonEmptyString,
  toolName: Schema.NonEmptyString,
}) {}

class ToolInvocationRequested extends Schema.Class<ToolInvocationRequested>(
  "@curiosity/custom-harness/ToolInvocationRequested",
)({
  input: Schema.Unknown,
  origin: Schema.Literal("authenticated-client-proposal"),
  proposalId: Schema.NonEmptyString,
  schemaVersion: Schema.Literal(1),
  subjectId: Schema.NonEmptyString,
  toolName: Schema.NonEmptyString,
}) {}

const strict = { onExcessProperty: "error" } as const;
const decodeLedgerQuery = Schema.decodeUnknownEffect(LedgerQuery, strict);
const decodeEvidenceQuery = Schema.decodeUnknownEffect(EvidenceQuery, strict);
const decodeProposal = Schema.decodeUnknownEffect(ToolProposalCommand, strict);
const decodeRequest = Schema.decodeUnknownEffect(
  ToolInvocationRequested,
  strict,
);
const validLimit = (value: number): boolean =>
  Number.isSafeInteger(value) && value >= 1 && value <= 100;

const tools: readonly ToolContribution[] = [
  {
    actionType: "projection.query",
    description: "Query the bounded replayed semantic Ledger view.",
    id: "curiosity.stock.tools.tools.ledger_query",
    inputSchema: {
      additionalProperties: false,
      properties: {
        intentId: { minLength: 1, type: "string" },
        limit: { maximum: 100, minimum: 1, type: "integer" },
        schemaVersion: { const: 1 },
      },
      required: ["schemaVersion", "intentId", "limit"],
      type: "object",
    },
    name: "ledger_query",
    outputProvenance: "trusted-durable",
    propose: Effect.fn("LedgerQueryTool.propose")(function* (input, subject) {
      const query = yield* decodeLedgerQuery(input).pipe(
        Effect.mapError(
          () =>
            new PluginFailure({
              message: "TOOL_INPUT_INVALID",
              pluginId: "curiosity.stock.tools",
            }),
        ),
      );
      if (!validLimit(query.limit))
        return yield* new PluginFailure({
          message: "TOOL_INPUT_INVALID",
          pluginId: "curiosity.stock.tools",
        });
      return {
        actionSchemaVersion: 1,
        actionType: "projection.query",
        deadlineClass: "interactive",
        gateClass: "none-requested",
        input: {
          projectionId: "curiosity.stock.ledger.projections.domain",
          query: { ...query },
        },
        requestedCapabilities: ["projection.read"],
        schemaVersion: 1,
        subject,
      };
    }),
    readOnly: true,
    requestedCapabilities: ["projection.read"],
    schemaVersion: 1,
    version: "1.0.0",
  },
  {
    actionType: "evidence.query",
    description: "Query bounded provisional evidence candidates.",
    id: "curiosity.stock.tools.tools.evidence_query",
    inputSchema: {
      additionalProperties: false,
      properties: {
        criterionId: { minLength: 1, type: "string" },
        intentId: { minLength: 1, type: "string" },
        limit: { maximum: 100, minimum: 1, type: "integer" },
        schemaVersion: { const: 1 },
      },
      required: ["schemaVersion", "intentId", "criterionId", "limit"],
      type: "object",
    },
    name: "evidence_query",
    outputProvenance: "untrusted-evidence",
    propose: Effect.fn("EvidenceQueryTool.propose")(function* (input, subject) {
      const query = yield* decodeEvidenceQuery(input).pipe(
        Effect.mapError(
          () =>
            new PluginFailure({
              message: "TOOL_INPUT_INVALID",
              pluginId: "curiosity.stock.tools",
            }),
        ),
      );
      if (!validLimit(query.limit))
        return yield* new PluginFailure({
          message: "TOOL_INPUT_INVALID",
          pluginId: "curiosity.stock.tools",
        });
      return {
        actionSchemaVersion: 1,
        actionType: "evidence.query",
        deadlineClass: "interactive",
        gateClass: "none-requested",
        input: {
          projectionId: "curiosity.stock.evidence.projections.candidates",
          query: { ...query },
        },
        requestedCapabilities: ["evidence.read"],
        schemaVersion: 1,
        subject,
      };
    }),
    readOnly: true,
    requestedCapabilities: ["evidence.read"],
    schemaVersion: 1,
    version: "1.0.0",
  },
];
const toolsByName = new Map(tools.map((tool) => [tool.name, tool]));

export const toolsPlugin: CuriosityPluginV2 = {
  commandDeciders: [
    {
      commandKinds: ["tool.propose"],
      decide: Effect.fn("ToolsPlugin.decide")(function* (command, context) {
        const proposal = yield* decodeProposal(command.payload).pipe(
          Effect.mapError(
            () => new InputRejected({ message: "TOOL_PROPOSAL_INVALID" }),
          ),
        );
        const selectedTool = toolsByName.get(proposal.toolName);
        if (!selectedTool)
          return yield* new InputRejected({ message: "TOOL_UNKNOWN" });
        if (
          proposal.proposalId.length > 128 ||
          proposal.subjectId.length > 256 ||
          context.events.some(
            (event) =>
              event.type === "tool.invocation.requested" &&
              event.body &&
              typeof event.body === "object" &&
              !Array.isArray(event.body) &&
              (event.body as Record<string, unknown>).proposalId ===
                proposal.proposalId,
          )
        )
          return yield* new InputRejected({
            message: "TOOL_PROPOSAL_ID_IMMUTABLE",
          });
        yield* selectedTool
          .propose(proposal.input, {
            executionId: proposal.subjectId,
            resource: proposal.subjectId,
          })
          .pipe(
            Effect.mapError(
              () => new InputRejected({ message: "TOOL_INPUT_INVALID" }),
            ),
          );
        return [
          {
            body: {
              input: proposal.input,
              origin: "authenticated-client-proposal",
              proposalId: proposal.proposalId,
              schemaVersion: 1,
              subjectId: proposal.subjectId,
              toolName: proposal.toolName,
            },
            streamId: proposal.subjectId,
            type: "tool.invocation.requested",
          },
        ];
      }),
      id: "curiosity.stock.tools.commands.propose",
      schemaVersion: 1,
    },
  ],
  eventReactors: [
    {
      eventTypes: ["tool.invocation.requested"],
      id: "curiosity.stock.tools.reactors.propose-action",
      react: Effect.fn("ToolsPlugin.proposeAction")(function* (event) {
        const request = yield* decodeRequest(event.body).pipe(
          Effect.mapError(
            () =>
              new PluginFailure({
                message: "TOOL_REQUEST_EVENT_INVALID",
                pluginId: "curiosity.stock.tools",
              }),
          ),
        );
        const tool = toolsByName.get(request.toolName);
        if (!tool)
          return yield* new PluginFailure({
            message: "TOOL_UNKNOWN",
            pluginId: "curiosity.stock.tools",
          });
        const action = yield* tool.propose(request.input, {
          executionId: request.subjectId,
          resource: request.subjectId,
        });
        return {
          actions: [
            {
              ...action,
              input: {
                correlation: {
                  origin: request.origin,
                  proposalId: request.proposalId,
                  subjectId: request.subjectId,
                  toolName: request.toolName,
                },
                request: action.input,
              },
            },
          ],
          events: [],
        };
      }),
      schemaVersion: 1,
    },
  ],
  manifest: {
    capabilities: ["evidence.read", "projection.read"],
    class: "semantic",
    id: "curiosity.stock.tools",
    kernelApi: KERNEL_PLUGIN_API_VERSION,
    provenance: {
      license: "Project-owned clean-room translation",
      revision: "1.0.0",
      source: "apps/custom-harness/src/plugins/tools.ts",
    },
    requires: [
      { pluginId: "curiosity.stock.evidence", version: "1.0.0" },
      { pluginId: "curiosity.stock.ledger", version: "1.0.0" },
    ],
    schemaVersion: 2,
    version: "1.0.0",
  },
  tools,
};
