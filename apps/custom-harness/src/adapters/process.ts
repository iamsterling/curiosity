import { Effect, Schema } from "effect";
import { PluginFailure } from "../kernel/errors.js";
import {
  KERNEL_PLUGIN_API_VERSION,
  type CuriosityPluginV2,
  type ToolContribution,
} from "../kernel/plugin.js";

class ProcessRunInput extends Schema.Class<ProcessRunInput>(
  "@curiosity/custom-harness/ProcessRunInput",
)({
  arguments: Schema.Array(Schema.String),
  cwd: Schema.NonEmptyString,
  maxOutputBytes: Schema.Number,
  profileId: Schema.NonEmptyString,
  schemaVersion: Schema.Literal(1),
  timeoutMs: Schema.Number,
}) {}

const decodeInput = Schema.decodeUnknownEffect(ProcessRunInput, {
  onExcessProperty: "error",
});
const profileId = /^[A-Za-z0-9._-]{1,64}$/u;
const invalid = () =>
  new PluginFailure({
    message: "PROCESS_RUN_INPUT_INVALID",
    pluginId: "curiosity.stock.process",
  });

const processRun: ToolContribution = {
  actionType: "process.run",
  description:
    "Run one exact operator-configured build, test, or check argv under a closed environment, workspace cwd, deadline, and output cap. This is not a shell.",
  id: "curiosity.stock.process.tools.process_run",
  inputSchema: {
    additionalProperties: false,
    properties: {
      arguments: {
        items: { maxLength: 1024, type: "string" },
        maxItems: 32,
        type: "array",
      },
      cwd: { maxLength: 4096, minLength: 1, type: "string" },
      maxOutputBytes: { maximum: 8192, minimum: 1, type: "integer" },
      profileId: { maxLength: 64, minLength: 1, type: "string" },
      schemaVersion: { const: 1 },
      timeoutMs: { maximum: 300_000, minimum: 1, type: "integer" },
    },
    required: [
      "schemaVersion",
      "profileId",
      "arguments",
      "cwd",
      "timeoutMs",
      "maxOutputBytes",
    ],
    type: "object",
  },
  name: "process_run",
  outputProvenance: "untrusted-evidence",
  propose: Effect.fn("ProcessRunTool.propose")(function* (value, subject) {
    const input = yield* decodeInput(value).pipe(Effect.mapError(invalid));
    if (
      !profileId.test(input.profileId) ||
      Buffer.byteLength(input.cwd) > 4_096 ||
      input.arguments.length > 32 ||
      input.arguments.some(
        (argument) =>
          argument.includes("\0") || Buffer.byteLength(argument) > 1_024,
      ) ||
      !Number.isSafeInteger(input.timeoutMs) ||
      input.timeoutMs < 1 ||
      input.timeoutMs > 300_000 ||
      !Number.isSafeInteger(input.maxOutputBytes) ||
      input.maxOutputBytes < 1 ||
      input.maxOutputBytes > 8 * 1_024 ||
      Buffer.byteLength(JSON.stringify(input)) > 48 * 1_024
    )
      return yield* invalid();
    return {
      actionSchemaVersion: 1,
      actionType: "process.run",
      deadlineClass: "background",
      gateClass: "none-requested",
      input: {
        request: {
          arguments: [...input.arguments],
          cwd: input.cwd,
          maxOutputBytes: input.maxOutputBytes,
          profileId: input.profileId,
          schemaVersion: 1,
          timeoutMs: input.timeoutMs,
        },
      },
      requestedCapabilities: ["process.execution"],
      schemaVersion: 1,
      subject,
    };
  }),
  readOnly: false,
  requestedCapabilities: ["process.execution"],
  schemaVersion: 1,
  version: "1.0.0",
};

export const processToolContributions = Object.freeze([processRun]);

export const processPlugin: CuriosityPluginV2 = {
  manifest: {
    capabilities: ["process.execution"],
    class: "adapter",
    id: "curiosity.stock.process",
    kernelApi: KERNEL_PLUGIN_API_VERSION,
    provenance: {
      license: "Project-owned",
      revision: "1.0.0",
      source: "apps/custom-harness/src/adapters/process.ts",
    },
    requires: [],
    schemaVersion: 2,
    version: "1.0.0",
  },
  tools: processToolContributions,
};
