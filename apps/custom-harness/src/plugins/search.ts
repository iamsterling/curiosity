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

class WebFetchInput extends Schema.Class<WebFetchInput>(
  "@curiosity/custom-harness/WebFetchInput",
)({
  maxBytes: Schema.Number,
  schemaVersion: Schema.Literal(1),
  url: Schema.NonEmptyString,
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
const decodeFetch = Schema.decodeUnknownEffect(WebFetchInput, strict);
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
      input: { request: { ...search } },
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

const webFetchTool: ToolContribution = {
  actionType: "fetch.web",
  description:
    "Fetch one bounded public HTTPS source through the configured research adapter; remote content remains untrusted evidence.",
  id: "curiosity.stock.search.tools.web_fetch",
  inputSchema: {
    additionalProperties: false,
    properties: {
      maxBytes: { maximum: 40_960, minimum: 1, type: "integer" },
      schemaVersion: { const: 1 },
      url: { maxLength: 4096, minLength: 1, type: "string" },
    },
    required: ["schemaVersion", "url", "maxBytes"],
    type: "object",
  },
  name: "web_fetch",
  outputProvenance: "untrusted-evidence",
  propose: Effect.fn("WebFetchTool.propose")(function* (input, subject) {
    const request = yield* decodeFetch(input).pipe(
      Effect.mapError(
        () =>
          new PluginFailure({
            message: "FETCH_INPUT_INVALID",
            pluginId: "curiosity.stock.search",
          }),
      ),
    );
    if (
      !Number.isSafeInteger(request.maxBytes) ||
      request.maxBytes < 1 ||
      request.maxBytes > 40_960 ||
      Buffer.byteLength(request.url) > 4_096
    )
      return yield* new PluginFailure({
        message: "FETCH_INPUT_INVALID",
        pluginId: "curiosity.stock.search",
      });
    return {
      actionSchemaVersion: 1,
      actionType: "fetch.web",
      deadlineClass: "interactive",
      gateClass: "none-requested",
      input: { request: { ...request } },
      requestedCapabilities: ["network.fetch"],
      schemaVersion: 1,
      subject,
    };
  }),
  readOnly: true,
  requestedCapabilities: ["network.fetch"],
  schemaVersion: 1,
  version: "1.0.0",
};

const formerHumanSearchTool: ToolContribution = {
  ...webSearchTool,
  description:
    "Deprecated compatibility name for the provider-neutral bounded web search proposal.",
  id: "curiosity.stock.search.tools.formerhuman_search",
  name: "formerhuman_search",
};

export const searchToolContributions = Object.freeze([
  formerHumanSearchTool,
  webFetchTool,
  webSearchTool,
]);

const record = (value: unknown): Record<string, unknown> | undefined =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;

const sourceCustodyRecord = (
  value: unknown,
): Record<string, unknown> | undefined => {
  const source = record(value);
  return source &&
    source.schemaVersion === 1 &&
    source.provenance === "untrusted-evidence" &&
    typeof source.sourceId === "string" &&
    typeof source.callId === "string" &&
    typeof source.canonicalUrl === "string" &&
    typeof source.contentDigest === "string" &&
    typeof source.retrievalKind === "string" &&
    typeof source.capturedAt === "string"
    ? source
    : undefined;
};

const captureSources = Effect.fn("SearchPlugin.captureSources")(
  function* (event) {
    const body = record(event.body);
    if (!body || !["fetch.web", "search.web"].includes(String(body.actionType)))
      return { actions: [], events: [] };
    const output = record(body.output);
    const adapter = record(output?.adapter);
    const correlation = record(body.correlation);
    if (
      output?.provenance !== "untrusted-evidence" ||
      !Array.isArray(output.sources) ||
      typeof adapter?.id !== "string" ||
      typeof adapter.version !== "string"
    )
      return yield* new PluginFailure({
        message: "RESEARCH_SOURCE_CUSTODY_INVALID",
        pluginId: "curiosity.stock.search",
      });
    const events = [];
    for (const value of output.sources) {
      const source = record(value);
      if (
        typeof source?.sourceId !== "string" ||
        typeof source.callId !== "string" ||
        typeof source.canonicalUrl !== "string" ||
        typeof source.contentDigest !== "string" ||
        typeof source.retrievalKind !== "string" ||
        typeof source.capturedAt !== "string"
      )
        return yield* new PluginFailure({
          message: "RESEARCH_SOURCE_CUSTODY_INVALID",
          pluginId: "curiosity.stock.search",
        });
      events.push({
        body: {
          actionId: body.actionId,
          adapterId: adapter.id,
          adapterSecurityProfile: adapter.securityProfile,
          adapterVersion: adapter.version,
          byteLength: source.byteLength,
          callId: source.callId,
          canonicalUrl: source.canonicalUrl,
          capturedAt: source.capturedAt,
          contentDigest: source.contentDigest,
          mediaType: source.mediaType,
          provenance: "untrusted-evidence",
          retrievalKind: source.retrievalKind,
          schemaVersion: 1,
          sourceId: source.sourceId,
          ...(typeof correlation?.threadId === "string"
            ? { threadId: correlation.threadId }
            : {}),
          ...(typeof correlation?.toolCallId === "string"
            ? { toolCallId: correlation.toolCallId }
            : {}),
          ...(typeof correlation?.turnId === "string"
            ? { turnId: correlation.turnId }
            : {}),
          ...(typeof source.statusCode === "number"
            ? { statusCode: source.statusCode }
            : {}),
        },
        streamId: source.sourceId,
        type: "source.captured",
      });
    }
    return { actions: [], events };
  },
);

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
                  toolCallId: `search-proposal:${request.proposalId}`,
                  toolName: webSearchTool.name,
                  toolVersion: webSearchTool.version,
                },
                request: (action.input as { readonly request: unknown }).request,
              },
            },
          ],
          events: [],
        };
      }),
      schemaVersion: 1,
    },
    {
      eventTypes: ["action.succeeded"],
      id: "curiosity.stock.search.reactors.capture-sources",
      react: captureSources,
      schemaVersion: 1,
    },
  ],
  manifest: {
    capabilities: ["network.fetch", "network.search"],
    class: "semantic",
    id: "curiosity.stock.search",
    kernelApi: KERNEL_PLUGIN_API_VERSION,
    provenance: {
      license: "Project-owned clean-room translation",
      revision: "1.2.0",
      source: "apps/custom-harness/src/plugins/search.ts",
    },
    requires: [],
    schemaVersion: 2,
    version: "1.2.0",
  },
  projections: [
    {
      eventSchemas: [
        { eventType: "research.receipt.generated", schemaVersions: [1] },
        { eventType: "source.captured", schemaVersions: [1] },
      ],
      id: "curiosity.stock.search.projections.source-custody",
      initialState: {
        receipts: [],
        revision: 0,
        schemaVersion: 1,
        sources: [],
      },
      reduce: Effect.fn("SearchProjection.reduce")(function* (state, event) {
        const current = state as {
          readonly receipts: readonly unknown[];
          readonly sources: readonly unknown[];
        };
        if (event.type === "research.receipt.generated") {
          const receipt = record(event.body);
          if (
            receipt?.schemaVersion !== 1 ||
            typeof receipt.receiptId !== "string" ||
            typeof receipt.turnId !== "string" ||
            !Array.isArray(receipt.sources) ||
            !Array.isArray(receipt.citations)
          )
            return yield* new PluginFailure({
              message: "RESEARCH_RECEIPT_INVALID",
              pluginId: "curiosity.stock.search",
            });
          return {
            receipts: [
              ...current.receipts,
              { ...receipt, eventId: event.eventId },
            ],
            revision: event.sequence,
            schemaVersion: 1,
            sources: current.sources,
          };
        }
        const source = sourceCustodyRecord(event.body);
        if (!source)
          return yield* new PluginFailure({
            message: "RESEARCH_SOURCE_CUSTODY_INVALID",
            pluginId: "curiosity.stock.search",
          });
        return {
          receipts: current.receipts,
          revision: event.sequence,
          schemaVersion: 1,
          sources: [...current.sources, { ...source, eventId: event.eventId }],
        };
      }),
      schemaVersion: 1,
    },
  ],
  tools: searchToolContributions,
};
