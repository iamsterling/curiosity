import {
  decodeDocumentToolInput,
  nativeDocumentRootId,
  nativeDocumentToolVersion,
  PortableAuthorityError,
  type AgentKernelToolBinding,
} from "@curiosity/authority";

export const mobileAgentCatalogVersion = "1";
export const mobileAgentPolicyVersion = "2";

export const mobileAgentPolicies = Object.freeze({
  analyst:
    "Analyze bounded evidence economically. Distinguish facts, inferences, and unknowns. Do not mutate resources.",
  generalist:
    "Execute ordinary work directly. Delegate only when the operator explicitly requests independent work or one bounded subtask has exclusive ownership and acceptance checks. Use a document tool only when durable context is insufficient. Never claim an effect that is absent from tool or child evidence.",
  implementer:
    "Own one bounded implementation unit and require explicit evidence. Mutation and process capabilities are unavailable in this profile.",
  orchestrator:
    "Coordinate rather than implement. Delegate only bounded read-only work with explicit ownership, acceptance checks, and stop conditions, then synthesize the durable child results.",
  researcher:
    "Research within supplied durable evidence. Network access is unavailable in this profile.",
  reviewer:
    "Review evidence adversarially without editing or increasing authority.",
  strategist:
    "Analyze consequential trade-offs while separating facts, inferences, and unknowns.",
  worker:
    "Complete one narrow unit using only the visible capabilities and exact evidence.",
} as const);

export type MobileAgentId = keyof typeof mobileAgentPolicies;

export const mobilePrimaryAgentIds = Object.freeze([
  "generalist",
  "orchestrator",
] as const satisfies readonly MobileAgentId[]);
export type MobilePrimaryAgentId = (typeof mobilePrimaryAgentIds)[number];

export const mobileSubagentIds = Object.freeze([
  "analyst",
  "implementer",
  "researcher",
  "reviewer",
  "strategist",
  "worker",
] as const satisfies readonly MobileAgentId[]);
export type MobileSubagentId = (typeof mobileSubagentIds)[number];

const childAllowlist = Object.freeze({
  generalist: mobileSubagentIds,
  orchestrator: mobileSubagentIds,
} as const satisfies Record<MobilePrimaryAgentId, readonly MobileSubagentId[]>);

export const mobileAgentAllowsChild = (
  parentAgentId: MobileAgentId,
  childAgentId: MobileAgentId,
): childAgentId is MobileSubagentId =>
  parentAgentId in childAllowlist &&
  (
    childAllowlist[parentAgentId as MobilePrimaryAgentId] as readonly string[]
  ).includes(childAgentId);

export const isMobilePrimaryAgentId = (
  value: string,
): value is MobilePrimaryAgentId =>
  (mobilePrimaryAgentIds as readonly string[]).includes(value);

export const mobileDelegationToolDefinition = Object.freeze({
  description:
    "Delegate one bounded read-only task to an independent qualified child agent.",
  inputSchema: {
    additionalProperties: false,
    properties: {
      agentId: { enum: mobileSubagentIds, type: "string" },
      description: { maxLength: 256, minLength: 1, type: "string" },
      task: {
        additionalProperties: false,
        properties: {
          acceptanceChecks: {
            items: { maxLength: 512, minLength: 1, type: "string" },
            maxItems: 4,
            minItems: 1,
            type: "array",
          },
          deliverable: { maxLength: 512, minLength: 1, type: "string" },
          nonGoals: {
            items: { maxLength: 512, minLength: 1, type: "string" },
            maxItems: 4,
            type: "array",
          },
          objective: { maxLength: 1024, minLength: 1, type: "string" },
        },
        required: ["acceptanceChecks", "deliverable", "nonGoals", "objective"],
        type: "object",
      },
    },
    required: ["agentId", "description", "task"],
    type: "object",
  },
  toolId: "agent.delegate",
  version: "1",
} as const);

const rootProperty = { const: nativeDocumentRootId, type: "string" } as const;

const definitions = Object.freeze([
  Object.freeze({
    description: "List bounded files in the app Documents root.",
    inputSchema: {
      additionalProperties: false,
      properties: {
        maxResults: { maximum: 128, minimum: 1, type: "integer" },
        rootId: rootProperty,
      },
      required: ["maxResults", "rootId"],
      type: "object",
    },
    toolId: "document.list",
    version: nativeDocumentToolVersion,
  }),
  Object.freeze({
    description: "Read one bounded UTF-8 file from the app Documents root.",
    inputSchema: {
      additionalProperties: false,
      properties: {
        documentId: { maxLength: 512, minLength: 1, type: "string" },
        maxBytes: { maximum: 262_144, minimum: 1, type: "integer" },
        rootId: rootProperty,
      },
      required: ["documentId", "maxBytes", "rootId"],
      type: "object",
    },
    toolId: "document.read",
    version: nativeDocumentToolVersion,
  }),
  Object.freeze({
    description: "Search bounded UTF-8 files in the app Documents root.",
    inputSchema: {
      additionalProperties: false,
      properties: {
        maxBytesPerFile: {
          maximum: 131_072,
          minimum: 1,
          type: "integer",
        },
        maxFiles: { maximum: 128, minimum: 1, type: "integer" },
        maxResults: { maximum: 64, minimum: 1, type: "integer" },
        query: { maxLength: 256, minLength: 1, type: "string" },
        rootId: rootProperty,
      },
      required: [
        "maxBytesPerFile",
        "maxFiles",
        "maxResults",
        "query",
        "rootId",
      ],
      type: "object",
    },
    toolId: "document.search",
    version: nativeDocumentToolVersion,
  }),
]);

const resourceFor = (toolId: string, input: unknown): string => {
  if (toolId !== "document.read") return `documents:${nativeDocumentRootId}`;
  if (!input || typeof input !== "object" || Array.isArray(input))
    throw new PortableAuthorityError("NATIVE_DOCUMENT_INPUT_INVALID");
  const documentId = (input as Record<string, unknown>).documentId;
  if (typeof documentId !== "string")
    throw new PortableAuthorityError("NATIVE_DOCUMENT_INPUT_INVALID");
  return `document:${documentId}`;
};

export const mobileAgentToolBindings = (
  agentId: string,
): readonly AgentKernelToolBinding[] =>
  definitions.map((definition) => ({
    definition,
    pluginId: "curiosity.documents",
    propose: (input, { executionId }) => {
      const resource = resourceFor(definition.toolId, input);
      const decoded = decodeDocumentToolInput(
        definition.toolId,
        input,
        resource,
      );
      return {
        actionSchemaVersion: 1,
        actionType: definition.toolId,
        deadlineClass: "interactive" as const,
        gateClass: "none-requested" as const,
        input: decoded,
        requestedCapabilities: ["documents.read"],
        schemaVersion: 1 as const,
        subject: { executionId, resource },
      };
    },
    reactorId: agentId,
  }));

export const mobileAgentCatalogIdentity = Object.freeze({
  agents: Object.keys(mobileAgentPolicies).sort(),
  profile: "curiosity.ipados.durable-agent.v1",
  semanticCommands: Object.freeze([
    "chat.turn",
    "execution.cancel",
    "thread.open",
  ]),
  tools: definitions.map(({ toolId, version }) => ({ toolId, version })),
  version: mobileAgentCatalogVersion,
});
