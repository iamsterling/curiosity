import { Effect, Schema } from "effect";
import { PluginFailure } from "../kernel/errors.js";
import {
  KERNEL_PLUGIN_API_VERSION,
  type CuriosityPluginV2,
  type ToolContribution,
} from "../kernel/plugin.js";

class WorkspaceReadInput extends Schema.Class<WorkspaceReadInput>(
  "@curiosity/custom-harness/WorkspaceReadInput",
)({
  maxLines: Schema.Number,
  path: Schema.NonEmptyString,
  schemaVersion: Schema.Literal(1),
  startLine: Schema.Number,
}) {}

class WorkspaceSearchInput extends Schema.Class<WorkspaceSearchInput>(
  "@curiosity/custom-harness/WorkspaceSearchInput",
)({
  maxResults: Schema.Number,
  query: Schema.NonEmptyString,
  schemaVersion: Schema.Literal(1),
}) {}

class WorkspaceGlobInput extends Schema.Class<WorkspaceGlobInput>(
  "@curiosity/custom-harness/WorkspaceGlobInput",
)({
  maxResults: Schema.Number,
  pattern: Schema.NonEmptyString,
  schemaVersion: Schema.Literal(1),
}) {}

class WorkspaceListInput extends Schema.Class<WorkspaceListInput>(
  "@curiosity/custom-harness/WorkspaceListInput",
)({
  maxEntries: Schema.Number,
  path: Schema.NonEmptyString,
  recursive: Schema.Boolean,
  schemaVersion: Schema.Literal(1),
}) {}

const strict = { onExcessProperty: "error" } as const;
const decodeRead = Schema.decodeUnknownEffect(WorkspaceReadInput, strict);
const decodeSearch = Schema.decodeUnknownEffect(WorkspaceSearchInput, strict);
const decodeGlob = Schema.decodeUnknownEffect(WorkspaceGlobInput, strict);
const decodeList = Schema.decodeUnknownEffect(WorkspaceListInput, strict);
const invalid = () =>
  new PluginFailure({
    message: "WORKSPACE_TOOL_INPUT_INVALID",
    pluginId: "curiosity.stock.workspace",
  });
const integerBetween = (value: number, minimum: number, maximum: number) =>
  Number.isSafeInteger(value) && value >= minimum && value <= maximum;

const workspaceRead: ToolContribution = {
  actionType: "workspace.read",
  description:
    "Read a bounded line range from one UTF-8 file under the configured workspace root.",
  id: "curiosity.stock.workspace.tools.workspace_read",
  inputSchema: {
    additionalProperties: false,
    properties: {
      maxLines: { maximum: 400, minimum: 1, type: "integer" },
      path: { maxLength: 4096, minLength: 1, type: "string" },
      schemaVersion: { const: 1 },
      startLine: { maximum: 1_000_000, minimum: 1, type: "integer" },
    },
    required: ["schemaVersion", "path", "startLine", "maxLines"],
    type: "object",
  },
  name: "workspace_read",
  outputProvenance: "untrusted-evidence",
  propose: Effect.fn("WorkspaceReadTool.propose")(function* (input, subject) {
    const request = yield* decodeRead(input).pipe(Effect.mapError(invalid));
    if (
      Buffer.byteLength(request.path) > 4_096 ||
      !integerBetween(request.startLine, 1, 1_000_000) ||
      !integerBetween(request.maxLines, 1, 400)
    )
      return yield* invalid();
    return {
      actionSchemaVersion: 1,
      actionType: "workspace.read",
      deadlineClass: "interactive",
      gateClass: "none-requested",
      input: { request: { ...request } },
      requestedCapabilities: ["filesystem.read"],
      schemaVersion: 1,
      subject,
    };
  }),
  readOnly: true,
  requestedCapabilities: ["filesystem.read"],
  schemaVersion: 1,
  version: "1.0.0",
};

const workspaceSearch: ToolContribution = {
  actionType: "workspace.search",
  description:
    "Search workspace text files for a bounded literal query and return matching paths, lines, and previews.",
  id: "curiosity.stock.workspace.tools.workspace_search",
  inputSchema: {
    additionalProperties: false,
    properties: {
      maxResults: { maximum: 20, minimum: 1, type: "integer" },
      query: { maxLength: 256, minLength: 1, type: "string" },
      schemaVersion: { const: 1 },
    },
    required: ["schemaVersion", "query", "maxResults"],
    type: "object",
  },
  name: "workspace_search",
  outputProvenance: "untrusted-evidence",
  propose: Effect.fn("WorkspaceSearchTool.propose")(function* (
    input,
    subject,
  ) {
    const request = yield* decodeSearch(input).pipe(Effect.mapError(invalid));
    if (
      Buffer.byteLength(request.query) > 256 ||
      !integerBetween(request.maxResults, 1, 20)
    )
      return yield* invalid();
    return {
      actionSchemaVersion: 1,
      actionType: "workspace.search",
      deadlineClass: "interactive",
      gateClass: "none-requested",
      input: { request: { ...request } },
      requestedCapabilities: ["filesystem.read"],
      schemaVersion: 1,
      subject,
    };
  }),
  readOnly: true,
  requestedCapabilities: ["filesystem.read"],
  schemaVersion: 1,
  version: "1.0.0",
};

const workspaceGrep: ToolContribution = {
  ...workspaceSearch,
  description:
    "Find a bounded literal in workspace UTF-8 files and return matching paths, lines, and previews.",
  id: "curiosity.stock.workspace.tools.workspace_grep",
  name: "workspace_grep",
};

const workspaceGlob: ToolContribution = {
  actionType: "workspace.glob",
  description:
    "Match a bounded workspace-relative *, **, and ? file pattern without following symbolic links.",
  id: "curiosity.stock.workspace.tools.workspace_glob",
  inputSchema: {
    additionalProperties: false,
    properties: {
      maxResults: { maximum: 1_000, minimum: 1, type: "integer" },
      pattern: { maxLength: 4096, minLength: 1, type: "string" },
      schemaVersion: { const: 1 },
    },
    required: ["schemaVersion", "pattern", "maxResults"],
    type: "object",
  },
  name: "workspace_glob",
  outputProvenance: "untrusted-evidence",
  propose: Effect.fn("WorkspaceGlobTool.propose")(function* (input, subject) {
    const request = yield* decodeGlob(input).pipe(Effect.mapError(invalid));
    if (
      Buffer.byteLength(request.pattern) > 4_096 ||
      !integerBetween(request.maxResults, 1, 1_000)
    )
      return yield* invalid();
    return {
      actionSchemaVersion: 1,
      actionType: "workspace.glob",
      deadlineClass: "interactive",
      gateClass: "none-requested",
      input: { request: { ...request } },
      requestedCapabilities: ["filesystem.read"],
      schemaVersion: 1,
      subject,
    };
  }),
  readOnly: true,
  requestedCapabilities: ["filesystem.read"],
  schemaVersion: 1,
  version: "1.0.0",
};

const workspaceList: ToolContribution = {
  actionType: "workspace.list",
  description:
    "List bounded workspace-relative directory entries without following symbolic links.",
  id: "curiosity.stock.workspace.tools.workspace_list",
  inputSchema: {
    additionalProperties: false,
    properties: {
      maxEntries: { maximum: 1_000, minimum: 1, type: "integer" },
      path: { maxLength: 4096, minLength: 1, type: "string" },
      recursive: { type: "boolean" },
      schemaVersion: { const: 1 },
    },
    required: ["schemaVersion", "path", "recursive", "maxEntries"],
    type: "object",
  },
  name: "workspace_list",
  outputProvenance: "untrusted-evidence",
  propose: Effect.fn("WorkspaceListTool.propose")(function* (input, subject) {
    const request = yield* decodeList(input).pipe(Effect.mapError(invalid));
    if (
      Buffer.byteLength(request.path) > 4_096 ||
      !integerBetween(request.maxEntries, 1, 1_000)
    )
      return yield* invalid();
    return {
      actionSchemaVersion: 1,
      actionType: "workspace.list",
      deadlineClass: "interactive",
      gateClass: "none-requested",
      input: { request: { ...request } },
      requestedCapabilities: ["filesystem.read"],
      schemaVersion: 1,
      subject,
    };
  }),
  readOnly: true,
  requestedCapabilities: ["filesystem.read"],
  schemaVersion: 1,
  version: "1.0.0",
};

export const workspaceTools = Object.freeze([
  workspaceGlob,
  workspaceGrep,
  workspaceList,
  workspaceRead,
  workspaceSearch,
]);

export const proposeWorkspaceTool = (
  name: string,
  input: unknown,
  subject: { readonly executionId: string; readonly resource: string },
) => {
  const tool = workspaceTools.find((candidate) => candidate.name === name);
  return tool
    ? tool.propose(input, subject)
    : Effect.fail(
        new PluginFailure({
          message: "WORKSPACE_TOOL_UNKNOWN",
          pluginId: "curiosity.stock.workspace",
        }),
      );
};

export const workspacePlugin: CuriosityPluginV2 = {
  manifest: {
    capabilities: ["filesystem.read"],
    class: "semantic",
    id: "curiosity.stock.workspace",
    kernelApi: KERNEL_PLUGIN_API_VERSION,
    provenance: {
      license: "Project-owned",
      revision: "1.1.0",
      source: "apps/custom-harness/src/plugins/workspace.ts",
    },
    requires: [],
    schemaVersion: 2,
    version: "1.1.0",
  },
  tools: workspaceTools,
};
