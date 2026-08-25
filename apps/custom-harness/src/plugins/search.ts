import { Effect, Schema } from "effect";
import { InputRejected, PluginFailure } from "../kernel/errors.js";
import {
  KERNEL_PLUGIN_API_VERSION,
  type CuriosityPluginV2,
  type ToolContribution,
} from "../kernel/plugin.js";

class WebSearchInput extends Schema.Class<WebSearchInput>(
  "@curiosity/custom-harness/WebSearchInput",
)({
  maxResults: Schema.Number,
  query: Schema.NonEmptyString,
  schemaVersion: Schema.Literal(1),
}) {}

class SearchProposal extends Schema.Class<SearchProposal>(
  "@curiosity/custom-harness/SearchProposal",
)({
  input: WebSearchInput,
  proposalId: Schema.NonEmptyString,
  schemaVersion: Schema.Literal(1),
  subjectId: Schema.NonEmptyString,
}) {}

const strict = { onExcessProperty: "error" } as const;
const decodeSearch = Schema.decodeUnknownEffect(WebSearchInput, strict);
const decodeProposal = Schema.decodeUnknownEffect(SearchProposal, strict);

const validSearch = (input: WebSearchInput): boolean =>
  Number.isSafeInteger(input.maxResults) &&
  input.maxResults >= 1 &&
  input.maxResults <= 10 &&
  input.query.length <= 1_024;

const webSearchTool: ToolContribution = {
  actionType: "search.web",
  description:
    "Propose a bounded public-web search whose results remain untrusted evidence candidates.",
  id: "curiosity.stock.search.tools.web_search",
  inputSchema: {
    additionalProperties: false,
    properties: {
      maxResults: { maximum: 10, minimum: 1, type: "integer" },
      query: { maxLength: 1024, minLength: 1, type: "string" },
      schemaVersion: { const: 1 },
    },
    required: ["schemaVersion", "query", "maxResults"],
    type: "object",
  },
  name: "web_search",
  outputProvenance: "untrusted-evidence",
  propose: Effect.fn("WebSearchTool.propose")(function* (input, subject) {
    const search = yield* decodeSearch(input).pipe(
      Effect.mapError(
        () =>
          new PluginFailure({
            message: "SEARCH_INPUT_INVALID",
            pluginId: "curiosity.stock.search",
          }),
      ),
    );
    if (!validSearch(search))
      return yield* new PluginFailure({
        message: "SEARCH_INPUT_INVALID",
        pluginId: "curiosity.stock.search",
      });
    return {
      actionSchemaVersion: 1,
      actionType: "search.web",
      deadlineClass: "interactive",
      gateClass: "none-requested",
      input: {
        query: { ...search },
        resultProvenance: "untrusted-evidence-candidate",
      },
      requestedCapabilities: ["network.search"],
      schemaVersion: 1,
      subject,
    };
  }),
  readOnly: true,
  requestedCapabilities: ["network.search"],
  schemaVersion: 1,
  version: "1.0.0",
};

export const searchPlugin: CuriosityPluginV2 = {
  commandDeciders: [
    {
      commandKinds: ["search.propose"],
      decide: Effect.fn("SearchPlugin.decide")(function* (command, context) {
        const proposal = yield* decodeProposal(command.payload).pipe(
          Effect.mapError(
            () => new InputRejected({ message: "SEARCH_PROPOSAL_INVALID" }),
          ),
        );
        if (!validSearch(proposal.input))
          return yield* new InputRejected({
            message: "SEARCH_PROPOSAL_INVALID",
          });
        if (
          context.events.some(
            (event) =>
              event.type === "search.requested" &&
              event.body &&
              typeof event.body === "object" &&
              !Array.isArray(event.body) &&
              (event.body as Record<string, unknown>).proposalId ===
                proposal.proposalId,
          )
        )
          return yield* new InputRejected({
            message: "SEARCH_PROPOSAL_ID_IMMUTABLE",
          });
        return [
          {
            body: {
              input: { ...proposal.input },
              proposalId: proposal.proposalId,
              schemaVersion: 1,
              subjectId: proposal.subjectId,
            },
            streamId: proposal.subjectId,
            type: "search.requested",
          },
        ];
      }),
      id: "curiosity.stock.search.commands.propose",
      schemaVersion: 1,
    },
  ],
  eventReactors: [
    {
      eventTypes: ["search.requested"],
      id: "curiosity.stock.search.reactors.propose-action",
      react: Effect.fn("SearchPlugin.proposeAction")(function* (event) {
        const request = yield* decodeProposal(event.body).pipe(
          Effect.mapError(
            () =>
              new PluginFailure({
                message: "SEARCH_REQUEST_EVENT_INVALID",
                pluginId: "curiosity.stock.search",
              }),
          ),
        );
        const action = yield* webSearchTool.propose(request.input, {
          executionId: request.subjectId,
          resource: request.subjectId,
        });
        return {
          actions: [
            {
              ...action,
              input: {
                correlation: {
                  proposalId: request.proposalId,
                  subjectId: request.subjectId,
                  toolName: webSearchTool.name,
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
    capabilities: ["network.search"],
    class: "semantic",
    id: "curiosity.stock.search",
    kernelApi: KERNEL_PLUGIN_API_VERSION,
    provenance: {
      license: "Project-owned clean-room translation",
      revision: "1.0.0",
      source: "apps/custom-harness/src/plugins/search.ts",
    },
    requires: [],
    schemaVersion: 2,
    version: "1.0.0",
  },
  tools: [webSearchTool],
};
