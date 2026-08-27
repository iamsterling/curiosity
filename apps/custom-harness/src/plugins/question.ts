import { Effect, Schema } from "effect";
import { PluginFailure } from "../kernel/errors.js";
import {
  KERNEL_PLUGIN_API_VERSION,
  type CuriosityPluginV2,
  type ToolContribution,
} from "../kernel/plugin.js";

class QuestionOption extends Schema.Class<QuestionOption>(
  "@curiosity/custom-harness/QuestionOption",
)({
  id: Schema.NonEmptyString,
  label: Schema.NonEmptyString,
}) {}

class UserQuestionInput extends Schema.Class<UserQuestionInput>(
  "@curiosity/custom-harness/UserQuestionInput",
)({
  allowFreeText: Schema.Boolean,
  options: Schema.Array(QuestionOption),
  prompt: Schema.NonEmptyString,
  schemaVersion: Schema.Literal(1),
}) {}

const decodeInput = Schema.decodeUnknownEffect(UserQuestionInput, {
  onExcessProperty: "error",
});
const invalid = () =>
  new PluginFailure({
    message: "QUESTION_INPUT_INVALID",
    pluginId: "curiosity.stock.question",
  });

export const questionTool: ToolContribution = {
  actionType: "question.ask",
  description:
    "Suspend the exact run for one bounded user answer. An answer is untrusted input and never approves a binding gate.",
  id: "curiosity.stock.question.tools.user_question",
  inputSchema: {
    additionalProperties: false,
    properties: {
      allowFreeText: { type: "boolean" },
      options: {
        items: {
          additionalProperties: false,
          properties: {
            id: { maxLength: 64, minLength: 1, type: "string" },
            label: { maxLength: 256, minLength: 1, type: "string" },
          },
          required: ["id", "label"],
          type: "object",
        },
        maxItems: 12,
        type: "array",
      },
      prompt: { maxLength: 2048, minLength: 1, type: "string" },
      schemaVersion: { const: 1 },
    },
    required: ["schemaVersion", "prompt", "options", "allowFreeText"],
    type: "object",
  },
  name: "user_question",
  outputProvenance: "untrusted-evidence",
  propose: Effect.fn("UserQuestionTool.propose")(function* (value, subject) {
    const input = yield* decodeInput(value).pipe(Effect.mapError(invalid));
    const ids = input.options.map(({ id }) => id);
    if (
      Buffer.byteLength(input.prompt) > 2_048 ||
      input.options.length > 12 ||
      (!input.allowFreeText && input.options.length === 0) ||
      new Set(ids).size !== ids.length ||
      input.options.some(
        ({ id, label }) =>
          Buffer.byteLength(id) > 64 || Buffer.byteLength(label) > 256,
      )
    )
      return yield* invalid();
    return {
      actionSchemaVersion: 1,
      actionType: "question.ask",
      deadlineClass: "background",
      gateClass: "none-requested",
      input: {
        request: {
          allowFreeText: input.allowFreeText,
          options: input.options.map(({ id, label }) => ({ id, label })),
          prompt: input.prompt,
          schemaVersion: 1,
        },
      },
      requestedCapabilities: ["user.question"],
      schemaVersion: 1,
      subject,
    };
  }),
  readOnly: true,
  requestedCapabilities: ["user.question"],
  schemaVersion: 1,
  version: "1.0.0",
};

export const questionPlugin: CuriosityPluginV2 = {
  manifest: {
    capabilities: ["user.question"],
    class: "semantic",
    id: "curiosity.stock.question",
    kernelApi: KERNEL_PLUGIN_API_VERSION,
    provenance: {
      license: "Project-owned",
      revision: "1.0.0",
      source: "apps/custom-harness/src/plugins/question.ts",
    },
    requires: [],
    schemaVersion: 2,
    version: "1.0.0",
  },
  tools: [questionTool],
};
