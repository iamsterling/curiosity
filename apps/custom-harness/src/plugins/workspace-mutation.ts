import { Effect, Schema } from "effect";
import { PluginFailure } from "../kernel/errors.js";
import {
  KERNEL_PLUGIN_API_VERSION,
  type CuriosityPluginV2,
  type ToolContribution,
} from "../kernel/plugin.js";

class WorkspaceWriteInput extends Schema.Class<WorkspaceWriteInput>(
  "@curiosity/custom-harness/WorkspaceWriteInput",
)({
  content: Schema.String,
  expectedSha256: Schema.NullOr(Schema.String),
  path: Schema.NonEmptyString,
  schemaVersion: Schema.Literal(1),
}) {}

class WorkspaceReplacement extends Schema.Class<WorkspaceReplacement>(
  "@curiosity/custom-harness/WorkspaceReplacement",
)({
  expectedOccurrences: Schema.Number,
  new: Schema.String,
  old: Schema.NonEmptyString,
}) {}

class WorkspacePatchInput extends Schema.Class<WorkspacePatchInput>(
  "@curiosity/custom-harness/WorkspacePatchInput",
)({
  expectedSha256: Schema.NonEmptyString,
  path: Schema.NonEmptyString,
  replacements: Schema.Array(WorkspaceReplacement),
  schemaVersion: Schema.Literal(1),
}) {}

class WorkspaceDeleteInput extends Schema.Class<WorkspaceDeleteInput>(
  "@curiosity/custom-harness/WorkspaceDeleteInput",
)({
  expectedSha256: Schema.NonEmptyString,
  path: Schema.NonEmptyString,
  schemaVersion: Schema.Literal(1),
}) {}

const strict = { onExcessProperty: "error" } as const;
const decodeWrite = Schema.decodeUnknownEffect(WorkspaceWriteInput, strict);
const decodePatch = Schema.decodeUnknownEffect(WorkspacePatchInput, strict);
const decodeDelete = Schema.decodeUnknownEffect(WorkspaceDeleteInput, strict);
const digest = /^[a-f0-9]{64}$/u;
const invalid = () =>
  new PluginFailure({
    message: "WORKSPACE_MUTATION_INPUT_INVALID",
    pluginId: "curiosity.stock.workspace-mutation",
  });
const validPath = (value: string): boolean =>
  Buffer.byteLength(value) <= 4_096 &&
  !value.startsWith("/") &&
  !value.includes("\0") &&
  value
    .split(/[\\/]/u)
    .every((component) => component && component !== "." && component !== "..");
const mutationSubject = (
  executionId: string,
  path: string,
): { readonly executionId: string; readonly resource: string } => ({
  executionId,
  resource: `workspace:path:${path.replaceAll("\\", "/")}`,
});

const workspaceWrite: ToolContribution = {
  actionType: "workspace.write",
  description:
    "Create or atomically replace one workspace file only when its exact prior SHA-256 state matches (null means absent).",
  id: "curiosity.stock.workspace-mutation.tools.workspace_write",
  inputSchema: {
    additionalProperties: false,
    properties: {
      content: { maxLength: 32_768, type: "string" },
      expectedSha256: {
        anyOf: [
          { type: "null" },
          { maxLength: 64, minLength: 64, type: "string" },
        ],
      },
      path: { maxLength: 4096, minLength: 1, type: "string" },
      schemaVersion: { const: 1 },
    },
    required: ["schemaVersion", "path", "expectedSha256", "content"],
    type: "object",
  },
  name: "workspace_write",
  outputProvenance: "untrusted-evidence",
  propose: Effect.fn("WorkspaceWriteTool.propose")(function* (value, subject) {
    const input = yield* decodeWrite(value).pipe(Effect.mapError(invalid));
    if (
      !validPath(input.path) ||
      (input.expectedSha256 !== null && !digest.test(input.expectedSha256)) ||
      Buffer.byteLength(input.content) > 32 * 1_024
    )
      return yield* invalid();
    return {
      actionSchemaVersion: 1,
      actionType: "workspace.write",
      deadlineClass: "interactive",
      gateClass: "none-requested",
      input: { request: { ...input } },
      requestedCapabilities: ["filesystem.mutation"],
      schemaVersion: 1,
      subject: mutationSubject(subject.executionId, input.path),
    };
  }),
  readOnly: false,
  requestedCapabilities: ["filesystem.mutation"],
  schemaVersion: 1,
  version: "1.0.0",
};

const workspacePatch: ToolContribution = {
  actionType: "workspace.patch",
  description:
    "Apply bounded literal replacements to one UTF-8 workspace file under an exact SHA-256 and occurrence precondition.",
  id: "curiosity.stock.workspace-mutation.tools.workspace_patch",
  inputSchema: {
    additionalProperties: false,
    properties: {
      expectedSha256: { maxLength: 64, minLength: 64, type: "string" },
      path: { maxLength: 4096, minLength: 1, type: "string" },
      replacements: {
        items: {
          additionalProperties: false,
          properties: {
            expectedOccurrences: {
              maximum: 1_000,
              minimum: 1,
              type: "integer",
            },
            new: { maxLength: 8192, type: "string" },
            old: { maxLength: 8192, minLength: 1, type: "string" },
          },
          required: ["old", "new", "expectedOccurrences"],
          type: "object",
        },
        maxItems: 64,
        minItems: 1,
        type: "array",
      },
      schemaVersion: { const: 1 },
    },
    required: ["schemaVersion", "path", "expectedSha256", "replacements"],
    type: "object",
  },
  name: "workspace_patch",
  outputProvenance: "untrusted-evidence",
  propose: Effect.fn("WorkspacePatchTool.propose")(function* (value, subject) {
    const input = yield* decodePatch(value).pipe(Effect.mapError(invalid));
    if (
      !validPath(input.path) ||
      !digest.test(input.expectedSha256) ||
      input.replacements.length < 1 ||
      input.replacements.length > 64 ||
      input.replacements.some(
        (replacement) =>
          Buffer.byteLength(replacement.old) > 8 * 1_024 ||
          Buffer.byteLength(replacement.new) > 8 * 1_024 ||
          !Number.isSafeInteger(replacement.expectedOccurrences) ||
          replacement.expectedOccurrences < 1 ||
          replacement.expectedOccurrences > 1_000,
      )
    )
      return yield* invalid();
    return {
      actionSchemaVersion: 1,
      actionType: "workspace.patch",
      deadlineClass: "interactive",
      gateClass: "none-requested",
      input: {
        request: {
          expectedSha256: input.expectedSha256,
          path: input.path,
          replacements: input.replacements.map((replacement) => ({
            expectedOccurrences: replacement.expectedOccurrences,
            new: replacement.new,
            old: replacement.old,
          })),
          schemaVersion: 1,
        },
      },
      requestedCapabilities: ["filesystem.mutation"],
      schemaVersion: 1,
      subject: mutationSubject(subject.executionId, input.path),
    };
  }),
  readOnly: false,
  requestedCapabilities: ["filesystem.mutation"],
  schemaVersion: 1,
  version: "1.0.0",
};

const workspaceDelete: ToolContribution = {
  actionType: "workspace.delete",
  description:
    "Delete one workspace file only when its exact current SHA-256 matches the request.",
  id: "curiosity.stock.workspace-mutation.tools.workspace_delete",
  inputSchema: {
    additionalProperties: false,
    properties: {
      expectedSha256: { maxLength: 64, minLength: 64, type: "string" },
      path: { maxLength: 4096, minLength: 1, type: "string" },
      schemaVersion: { const: 1 },
    },
    required: ["schemaVersion", "path", "expectedSha256"],
    type: "object",
  },
  name: "workspace_delete",
  outputProvenance: "untrusted-evidence",
  propose: Effect.fn("WorkspaceDeleteTool.propose")(function* (value, subject) {
    const input = yield* decodeDelete(value).pipe(Effect.mapError(invalid));
    if (!validPath(input.path) || !digest.test(input.expectedSha256))
      return yield* invalid();
    return {
      actionSchemaVersion: 1,
      actionType: "workspace.delete",
      deadlineClass: "interactive",
      gateClass: "none-requested",
      input: { request: { ...input } },
      requestedCapabilities: ["filesystem.mutation"],
      schemaVersion: 1,
      subject: mutationSubject(subject.executionId, input.path),
    };
  }),
  readOnly: false,
  requestedCapabilities: ["filesystem.mutation"],
  schemaVersion: 1,
  version: "1.0.0",
};

export const workspaceMutationTools = Object.freeze([
  workspaceDelete,
  workspacePatch,
  workspaceWrite,
]);

export const workspaceMutationPlugin: CuriosityPluginV2 = {
  manifest: {
    capabilities: ["filesystem.mutation"],
    class: "semantic",
    id: "curiosity.stock.workspace-mutation",
    kernelApi: KERNEL_PLUGIN_API_VERSION,
    provenance: {
      license: "Project-owned",
      revision: "1.0.0",
      source: "apps/custom-harness/src/plugins/workspace-mutation.ts",
    },
    requires: [],
    schemaVersion: 2,
    version: "1.0.0",
  },
  tools: workspaceMutationTools,
};
