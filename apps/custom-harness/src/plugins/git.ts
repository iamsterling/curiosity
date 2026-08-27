import { Effect, Schema } from "effect";
import { PluginFailure } from "../kernel/errors.js";
import {
  KERNEL_PLUGIN_API_VERSION,
  type CuriosityPluginV2,
  type ToolContribution,
} from "../kernel/plugin.js";

class GitStatusInput extends Schema.Class<GitStatusInput>(
  "@curiosity/custom-harness/GitStatusInput",
)({
  maxOutputBytes: Schema.Number,
  schemaVersion: Schema.Literal(1),
}) {}

class GitDiffInput extends Schema.Class<GitDiffInput>(
  "@curiosity/custom-harness/GitDiffInput",
)({
  maxOutputBytes: Schema.Number,
  paths: Schema.Array(Schema.NonEmptyString),
  schemaVersion: Schema.Literal(1),
}) {}

class GitWorktreeCreateInput extends Schema.Class<GitWorktreeCreateInput>(
  "@curiosity/custom-harness/GitWorktreeCreateInput",
)({
  expectedClean: Schema.Literal(true),
  expectedHead: Schema.NonEmptyString,
  maxOutputBytes: Schema.Number,
  schemaVersion: Schema.Literal(1),
  worktreeId: Schema.NonEmptyString,
}) {}

class GitWorktreeInspectInput extends Schema.Class<GitWorktreeInspectInput>(
  "@curiosity/custom-harness/GitWorktreeInspectInput",
)({
  expectedHead: Schema.NonEmptyString,
  maxOutputBytes: Schema.Number,
  schemaVersion: Schema.Literal(1),
  worktreeId: Schema.NonEmptyString,
}) {}

class GitRefInspectInput extends Schema.Class<GitRefInspectInput>(
  "@curiosity/custom-harness/GitRefInspectInput",
)({
  maxOutputBytes: Schema.Number,
  refName: Schema.NonEmptyString,
  schemaVersion: Schema.Literal(1),
}) {}

class GitRefUpdateInput extends Schema.Class<GitRefUpdateInput>(
  "@curiosity/custom-harness/GitRefUpdateInput",
)({
  expectedClean: Schema.Literal(true),
  expectedOldHead: Schema.NonEmptyString,
  maxOutputBytes: Schema.Number,
  newHead: Schema.NonEmptyString,
  refName: Schema.NonEmptyString,
  schemaVersion: Schema.Literal(1),
}) {}

const strict = { onExcessProperty: "error" } as const;
const decodeStatus = Schema.decodeUnknownEffect(GitStatusInput, strict);
const decodeDiff = Schema.decodeUnknownEffect(GitDiffInput, strict);
const decodeWorktreeCreate = Schema.decodeUnknownEffect(
  GitWorktreeCreateInput,
  strict,
);
const decodeWorktreeInspect = Schema.decodeUnknownEffect(
  GitWorktreeInspectInput,
  strict,
);
const decodeRefInspect = Schema.decodeUnknownEffect(GitRefInspectInput, strict);
const decodeRefUpdate = Schema.decodeUnknownEffect(GitRefUpdateInput, strict);
const invalid = () =>
  new PluginFailure({
    message: "GIT_READ_INPUT_INVALID",
    pluginId: "curiosity.stock.git",
  });
const validLimit = (value: number) =>
  Number.isSafeInteger(value) && value >= 1 && value <= 8 * 1_024;
const validPath = (value: string) =>
  Buffer.byteLength(value) <= 4_096 &&
  !value.startsWith("/") &&
  !value.includes("\0") &&
  value
    .split(/[\\/]/u)
    .every((component) => component && component !== "." && component !== "..");
const validHead = (value: string) =>
  /^(?:[a-f0-9]{40}|[a-f0-9]{64})$/u.test(value);
const validWorktreeId = (value: string) =>
  /^[A-Za-z0-9._-]{1,64}$/u.test(value);
const validRefName = (value: string) =>
  /^refs\/heads\/curiosity\/(?:[A-Za-z0-9][A-Za-z0-9._-]{0,63})(?:\/[A-Za-z0-9][A-Za-z0-9._-]{0,63})*$/u.test(
    value,
  ) &&
  Buffer.byteLength(value) <= 255 &&
  value
    .split("/")
    .every((component) => !component.endsWith(".") && !component.endsWith(".lock"));

const gitStatus: ToolContribution = {
  actionType: "git.status",
  description:
    "Read identity-bound Git HEAD and porcelain-v2 status through the dedicated supervisor sink.",
  id: "curiosity.stock.git.tools.git_status",
  inputSchema: {
    additionalProperties: false,
    properties: {
      maxOutputBytes: { maximum: 8192, minimum: 1, type: "integer" },
      schemaVersion: { const: 1 },
    },
    required: ["schemaVersion", "maxOutputBytes"],
    type: "object",
  },
  name: "git_status",
  outputProvenance: "untrusted-evidence",
  propose: Effect.fn("GitStatusTool.propose")(function* (value, subject) {
    const input = yield* decodeStatus(value).pipe(Effect.mapError(invalid));
    if (!validLimit(input.maxOutputBytes)) return yield* invalid();
    return {
      actionSchemaVersion: 1,
      actionType: "git.status",
      deadlineClass: "interactive",
      gateClass: "none-requested",
      input: { request: { ...input } },
      requestedCapabilities: ["git.read"],
      schemaVersion: 1,
      subject: { ...subject, resource: "git:repository" },
    };
  }),
  readOnly: true,
  requestedCapabilities: ["git.read"],
  schemaVersion: 1,
  version: "1.0.0",
};

const gitDiff: ToolContribution = {
  actionType: "git.diff",
  description:
    "Read a bounded no-ext-diff patch for confined repository-relative paths under an exact HEAD precondition.",
  id: "curiosity.stock.git.tools.git_diff",
  inputSchema: {
    additionalProperties: false,
    properties: {
      maxOutputBytes: { maximum: 8192, minimum: 1, type: "integer" },
      paths: {
        items: { maxLength: 4096, minLength: 1, type: "string" },
        maxItems: 64,
        type: "array",
      },
      schemaVersion: { const: 1 },
    },
    required: ["schemaVersion", "paths", "maxOutputBytes"],
    type: "object",
  },
  name: "git_diff",
  outputProvenance: "untrusted-evidence",
  propose: Effect.fn("GitDiffTool.propose")(function* (value, subject) {
    const input = yield* decodeDiff(value).pipe(Effect.mapError(invalid));
    if (
      !validLimit(input.maxOutputBytes) ||
      input.paths.length > 64 ||
      input.paths.some((path) => !validPath(path))
    )
      return yield* invalid();
    return {
      actionSchemaVersion: 1,
      actionType: "git.diff",
      deadlineClass: "interactive",
      gateClass: "none-requested",
      input: { request: { maxOutputBytes: input.maxOutputBytes, paths: [...input.paths], schemaVersion: 1 } },
      requestedCapabilities: ["git.read"],
      schemaVersion: 1,
      subject: { ...subject, resource: "git:repository" },
    };
  }),
  readOnly: true,
  requestedCapabilities: ["git.read"],
  schemaVersion: 1,
  version: "1.0.0",
};

const gitRefInspect: ToolContribution = {
  actionType: "git.ref.inspect",
  description:
    "Inspect one Curiosity-owned branch ref through the identity-bound Git supervisor sink.",
  id: "curiosity.stock.git.tools.git_ref_inspect",
  inputSchema: {
    additionalProperties: false,
    properties: {
      maxOutputBytes: { maximum: 8192, minimum: 1, type: "integer" },
      refName: {
        maxLength: 255,
        pattern:
          "^refs/heads/curiosity/[A-Za-z0-9][A-Za-z0-9._-]{0,63}(?:/[A-Za-z0-9][A-Za-z0-9._-]{0,63})*$",
        type: "string",
      },
      schemaVersion: { const: 1 },
    },
    required: ["schemaVersion", "refName", "maxOutputBytes"],
    type: "object",
  },
  name: "git_ref_inspect",
  outputProvenance: "trusted-durable",
  propose: Effect.fn("GitRefInspectTool.propose")(function* (value, subject) {
    const input = yield* decodeRefInspect(value).pipe(Effect.mapError(invalid));
    if (!validLimit(input.maxOutputBytes) || !validRefName(input.refName))
      return yield* invalid();
    return {
      actionSchemaVersion: 1,
      actionType: "git.ref.inspect",
      deadlineClass: "interactive",
      gateClass: "none-requested",
      input: { request: { ...input } },
      requestedCapabilities: ["git.read"],
      schemaVersion: 1,
      subject: { ...subject, resource: `git:ref:${input.refName}` },
    };
  }),
  readOnly: true,
  requestedCapabilities: ["git.read"],
  schemaVersion: 1,
  version: "1.0.0",
};

const gitRefUpdate: ToolContribution = {
  actionType: "git.ref.update",
  description:
    "Compare-and-swap one Curiosity-owned branch ref to an exact commit after clean-repository checks and binding human approval.",
  id: "curiosity.stock.git.tools.git_ref_update",
  inputSchema: {
    additionalProperties: false,
    properties: {
      expectedClean: { const: true },
      expectedOldHead: {
        pattern: "^(?:[a-f0-9]{40}|[a-f0-9]{64})$",
        type: "string",
      },
      maxOutputBytes: { maximum: 8192, minimum: 1, type: "integer" },
      newHead: {
        pattern: "^(?:[a-f0-9]{40}|[a-f0-9]{64})$",
        type: "string",
      },
      refName: {
        maxLength: 255,
        pattern:
          "^refs/heads/curiosity/[A-Za-z0-9][A-Za-z0-9._-]{0,63}(?:/[A-Za-z0-9][A-Za-z0-9._-]{0,63})*$",
        type: "string",
      },
      schemaVersion: { const: 1 },
    },
    required: [
      "schemaVersion",
      "refName",
      "expectedOldHead",
      "newHead",
      "expectedClean",
      "maxOutputBytes",
    ],
    type: "object",
  },
  name: "git_ref_update",
  outputProvenance: "trusted-durable",
  propose: Effect.fn("GitRefUpdateTool.propose")(function* (value, subject) {
    const input = yield* decodeRefUpdate(value).pipe(Effect.mapError(invalid));
    if (
      !validLimit(input.maxOutputBytes) ||
      !validRefName(input.refName) ||
      !validHead(input.expectedOldHead) ||
      !validHead(input.newHead) ||
      !/[1-9a-f]/u.test(input.newHead) ||
      input.expectedOldHead.length !== input.newHead.length
    )
      return yield* invalid();
    return {
      actionSchemaVersion: 1,
      actionType: "git.ref.update",
      deadlineClass: "background",
      gateClass: "binding-human-requested",
      input: { request: { ...input } },
      requestedCapabilities: ["git.mutation"],
      schemaVersion: 1,
      subject: { ...subject, resource: `git:ref:${input.refName}` },
    };
  }),
  readOnly: false,
  requestedCapabilities: ["git.mutation"],
  schemaVersion: 1,
  version: "1.0.0",
};

const gitWorktreeCreate: ToolContribution = {
  actionType: "git.worktree.create",
  description:
    "Create one supervisor-named detached, locked worktree at an exact clean repository HEAD after binding human approval.",
  id: "curiosity.stock.git.tools.git_worktree_create",
  inputSchema: {
    additionalProperties: false,
    properties: {
      expectedClean: { const: true },
      expectedHead: {
        pattern: "^(?:[a-f0-9]{40}|[a-f0-9]{64})$",
        type: "string",
      },
      maxOutputBytes: { maximum: 8192, minimum: 1, type: "integer" },
      schemaVersion: { const: 1 },
      worktreeId: {
        maxLength: 64,
        minLength: 1,
        pattern: "^[A-Za-z0-9._-]+$",
        type: "string",
      },
    },
    required: [
      "schemaVersion",
      "worktreeId",
      "expectedHead",
      "expectedClean",
      "maxOutputBytes",
    ],
    type: "object",
  },
  name: "git_worktree_create",
  outputProvenance: "trusted-durable",
  propose: Effect.fn("GitWorktreeCreateTool.propose")(function* (
    value,
    subject,
  ) {
    const input = yield* decodeWorktreeCreate(value).pipe(
      Effect.mapError(invalid),
    );
    if (
      !validLimit(input.maxOutputBytes) ||
      !validHead(input.expectedHead) ||
      !validWorktreeId(input.worktreeId)
    )
      return yield* invalid();
    return {
      actionSchemaVersion: 1,
      actionType: "git.worktree.create",
      deadlineClass: "background",
      gateClass: "binding-human-requested",
      input: { request: { ...input } },
      requestedCapabilities: ["git.mutation"],
      schemaVersion: 1,
      subject: { ...subject, resource: `git:worktree:${input.worktreeId}` },
    };
  }),
  readOnly: false,
  requestedCapabilities: ["git.mutation"],
  schemaVersion: 1,
  version: "1.0.0",
};

const gitWorktreeInspect: ToolContribution = {
  actionType: "git.worktree.inspect",
  description:
    "Reconcile one supervisor-named worktree against exact registration, locked detached state, HEAD, and retained filesystem identity.",
  id: "curiosity.stock.git.tools.git_worktree_inspect",
  inputSchema: {
    additionalProperties: false,
    properties: {
      expectedHead: {
        pattern: "^(?:[a-f0-9]{40}|[a-f0-9]{64})$",
        type: "string",
      },
      maxOutputBytes: { maximum: 8192, minimum: 1, type: "integer" },
      schemaVersion: { const: 1 },
      worktreeId: {
        maxLength: 64,
        minLength: 1,
        pattern: "^[A-Za-z0-9._-]+$",
        type: "string",
      },
    },
    required: [
      "schemaVersion",
      "worktreeId",
      "expectedHead",
      "maxOutputBytes",
    ],
    type: "object",
  },
  name: "git_worktree_inspect",
  outputProvenance: "trusted-durable",
  propose: Effect.fn("GitWorktreeInspectTool.propose")(function* (
    value,
    subject,
  ) {
    const input = yield* decodeWorktreeInspect(value).pipe(
      Effect.mapError(invalid),
    );
    if (
      !validLimit(input.maxOutputBytes) ||
      !validHead(input.expectedHead) ||
      !validWorktreeId(input.worktreeId)
    )
      return yield* invalid();
    return {
      actionSchemaVersion: 1,
      actionType: "git.worktree.inspect",
      deadlineClass: "interactive",
      gateClass: "none-requested",
      input: { request: { ...input } },
      requestedCapabilities: ["git.read"],
      schemaVersion: 1,
      subject: { ...subject, resource: `git:worktree:${input.worktreeId}` },
    };
  }),
  readOnly: true,
  requestedCapabilities: ["git.read"],
  schemaVersion: 1,
  version: "1.0.0",
};

const gitWorktreeRemove: ToolContribution = {
  actionType: "git.worktree.remove",
  description:
    "Remove one clean, identity-bound Curiosity worktree without force after binding human approval.",
  id: "curiosity.stock.git.tools.git_worktree_remove",
  inputSchema: {
    additionalProperties: false,
    properties: {
      expectedClean: { const: true },
      expectedHead: {
        pattern: "^(?:[a-f0-9]{40}|[a-f0-9]{64})$",
        type: "string",
      },
      maxOutputBytes: { maximum: 8192, minimum: 1, type: "integer" },
      schemaVersion: { const: 1 },
      worktreeId: {
        maxLength: 64,
        minLength: 1,
        pattern: "^[A-Za-z0-9._-]+$",
        type: "string",
      },
    },
    required: [
      "schemaVersion",
      "worktreeId",
      "expectedHead",
      "expectedClean",
      "maxOutputBytes",
    ],
    type: "object",
  },
  name: "git_worktree_remove",
  outputProvenance: "trusted-durable",
  propose: Effect.fn("GitWorktreeRemoveTool.propose")(function* (
    value,
    subject,
  ) {
    const input = yield* decodeWorktreeCreate(value).pipe(
      Effect.mapError(invalid),
    );
    if (
      !validLimit(input.maxOutputBytes) ||
      !validHead(input.expectedHead) ||
      !validWorktreeId(input.worktreeId)
    )
      return yield* invalid();
    return {
      actionSchemaVersion: 1,
      actionType: "git.worktree.remove",
      deadlineClass: "background",
      gateClass: "binding-human-requested",
      input: { request: { ...input } },
      requestedCapabilities: ["git.mutation"],
      schemaVersion: 1,
      subject: { ...subject, resource: `git:worktree:${input.worktreeId}` },
    };
  }),
  readOnly: false,
  requestedCapabilities: ["git.mutation"],
  schemaVersion: 1,
  version: "1.0.0",
};

export const gitTools = Object.freeze([
  gitDiff,
  gitRefInspect,
  gitRefUpdate,
  gitStatus,
  gitWorktreeCreate,
  gitWorktreeInspect,
  gitWorktreeRemove,
]);

export const gitPlugin: CuriosityPluginV2 = {
  manifest: {
    capabilities: ["git.mutation", "git.read"],
    class: "semantic",
    id: "curiosity.stock.git",
    kernelApi: KERNEL_PLUGIN_API_VERSION,
    provenance: {
      license: "Project-owned",
      revision: "1.1.0",
      source: "apps/custom-harness/src/plugins/git.ts",
    },
    requires: [],
    schemaVersion: 2,
    version: "1.1.0",
  },
  tools: gitTools,
};
