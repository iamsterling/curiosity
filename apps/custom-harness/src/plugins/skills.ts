import { Effect, Schema } from "effect";
import { InputRejected, PluginFailure } from "../kernel/errors.js";
import {
  KERNEL_PLUGIN_API_VERSION,
  type CuriosityPluginV2,
  type PromptCommandContribution,
  type SkillContribution,
} from "../kernel/plugin.js";
import {
  stockPromptCommandDefinitions,
  stockCompatibilityCommandDispositions,
  stockSkillDefinitions,
} from "../product/stock-content.js";

const skill = (
  name: string,
  description: string,
  content: string,
): SkillContribution => ({
  content,
  description,
  id: `curiosity.stock.skills.skills.${name}`,
  name,
  schemaVersion: 1,
  version: "1.0.0",
});

const skills = stockSkillDefinitions.map((definition) =>
  skill(definition.name, definition.description, definition.content),
);

const promptCommand = (
  agentId: string | null,
  name: string,
  description: string,
  instructions: string,
  requiredAnyCapabilities: readonly (readonly string[])[],
  requiredCapabilities: readonly string[],
  skillName: string | null,
  status: PromptCommandContribution["status"],
): PromptCommandContribution => ({
  agentId,
  description,
  id: `curiosity.stock.skills.prompt-commands.${name}`,
  instructions,
  name,
  requiredAnyCapabilities,
  requiredCapabilities,
  schemaVersion: 1,
  skillName,
  status,
  version: "1.0.0",
});

const promptCommands = stockPromptCommandDefinitions.map((definition) =>
  promptCommand(
    definition.agentId,
    definition.name,
    definition.description,
    definition.instructions,
    definition.requiredAnyCapabilities,
    definition.requiredCapabilities,
    definition.skillName,
    definition.status,
  ),
);
const skillsByName = new Map(skills.map((item) => [item.name, item]));
const commandsByName = new Map(
  promptCommands.map((command) => [command.name, command]),
);

class PromptCommandInvocation extends Schema.Class<PromptCommandInvocation>(
  "@curiosity/custom-harness/PromptCommandInvocation",
)({
  activationId: Schema.NonEmptyString,
  arguments: Schema.String,
  name: Schema.NonEmptyString,
  schemaVersion: Schema.Literal(1),
  threadId: Schema.NonEmptyString,
}) {}

class SkillActivated extends Schema.Class<SkillActivated>(
  "@curiosity/custom-harness/SkillActivated",
)({
  activationId: Schema.NonEmptyString,
  arguments: Schema.String,
  commandName: Schema.NonEmptyString,
  commandVersion: Schema.NonEmptyString,
  capabilityDisposition: Schema.optional(
    Schema.Literals(["available", "unavailable"]),
  ),
  missingCapabilities: Schema.optional(Schema.Array(Schema.NonEmptyString)),
  requiredAnyCapabilities: Schema.optional(
    Schema.Array(Schema.Array(Schema.NonEmptyString)),
  ),
  requiredCapabilities: Schema.optional(Schema.Array(Schema.NonEmptyString)),
  schemaVersion: Schema.Literal(1),
  skillName: Schema.optional(Schema.NonEmptyString),
  skillVersion: Schema.optional(Schema.NonEmptyString),
  status: Schema.Literals(["active", "compatibility-deprecated"]),
  threadId: Schema.NonEmptyString,
}) {}

type NormalizedSkillActivation = Omit<
  SkillActivated,
  | "capabilityDisposition"
  | "missingCapabilities"
  | "requiredAnyCapabilities"
  | "requiredCapabilities"
> & {
  readonly capabilityDisposition: "available" | "unavailable";
  readonly missingCapabilities: readonly string[];
  readonly requiredAnyCapabilities: readonly (readonly string[])[];
  readonly requiredCapabilities: readonly string[];
};

const strict = { onExcessProperty: "error" } as const;
const decodeInvocation = Schema.decodeUnknownEffect(
  PromptCommandInvocation,
  strict,
);
const decodeActivation = (input: unknown) =>
  Schema.decodeUnknownEffect(SkillActivated, strict)(input).pipe(
    Effect.map(
      (activation): NormalizedSkillActivation => ({
        ...activation,
        capabilityDisposition: activation.capabilityDisposition ?? "available",
        missingCapabilities: activation.missingCapabilities ?? [],
        requiredAnyCapabilities: activation.requiredAnyCapabilities ?? [],
        requiredCapabilities: activation.requiredCapabilities ?? [],
      }),
    ),
  );

export const skillsPlugin: CuriosityPluginV2 = {
  commandDeciders: [
    {
      commandKinds: ["prompt.command.invoke"],
      decide: Effect.fn("SkillsPlugin.decide")(function* (command, context) {
        const input = yield* decodeInvocation(command.payload).pipe(
          Effect.mapError(
            () =>
              new InputRejected({
                message: "PROMPT_COMMAND_PAYLOAD_INVALID",
              }),
          ),
        );
        if (
          input.activationId.length > 64 ||
          input.threadId.length > 64 ||
          input.arguments.length > 4_096
        )
          return yield* new InputRejected({
            message: "PROMPT_COMMAND_PAYLOAD_INVALID",
          });
        const prompt = commandsByName.get(input.name);
        const selectedSkill = prompt?.skillName
          ? skillsByName.get(prompt.skillName)
          : undefined;
        if (!prompt || (prompt.skillName !== null && !selectedSkill))
          return yield* new InputRejected({
            message: "PROMPT_COMMAND_UNKNOWN",
          });
        if (
          context.events.some(
            (event) =>
              event.type === "skill.activated" &&
              event.body &&
              typeof event.body === "object" &&
              !Array.isArray(event.body) &&
              (event.body as Record<string, unknown>).activationId ===
                input.activationId,
          )
        )
          return yield* new InputRejected({
            message: "SKILL_ACTIVATION_ID_IMMUTABLE",
          });
        const disposition =
          prompt.status === "compatibility-deprecated"
            ? stockCompatibilityCommandDispositions[
                prompt.name as keyof typeof stockCompatibilityCommandDispositions
              ]
            : undefined;
        if (prompt.status === "compatibility-deprecated" && !disposition)
          return yield* new InputRejected({
            message: "COMPATIBILITY_DISPOSITION_MISSING",
          });
        const [resolution, target] = disposition?.split(":", 2) ?? [];
        const missingCapabilities = prompt.requiredCapabilities.filter(
          (capability) => !context.grantedCapabilities.has(capability),
        );
        const missingAnyCapabilities = prompt.requiredAnyCapabilities.filter(
          (group) =>
            !group.some((capability) =>
              context.grantedCapabilities.has(capability),
            ),
        );
        if (
          prompt.status === "active" &&
          (missingCapabilities.length > 0 || missingAnyCapabilities.length > 0)
        )
          return yield* new InputRejected({
            message: `PROMPT_COMMAND_CAPABILITY_UNAVAILABLE:${[
              ...missingCapabilities,
              ...missingAnyCapabilities.map((group) => group.join("|")),
            ].join(",")}`,
          });
        const outcome =
          resolution === "unsupported"
            ? "denied"
            : resolution === "manual-guidance"
              ? "guidance"
              : "mapped-requires-typed-tool-call";
        return [
          {
            body: {
              activationId: input.activationId,
              arguments: input.arguments,
              commandName: prompt.name,
              commandVersion: prompt.version,
              capabilityDisposition:
                missingCapabilities.length === 0 ? "available" : "unavailable",
              missingCapabilities,
              requiredAnyCapabilities: prompt.requiredAnyCapabilities,
              requiredCapabilities: prompt.requiredCapabilities,
              schemaVersion: 1,
              ...(selectedSkill
                ? {
                    skillName: selectedSkill.name,
                    skillVersion: selectedSkill.version,
                  }
                : {}),
              status: prompt.status,
              threadId: input.threadId,
            },
            streamId: input.threadId,
            type: "skill.activated",
          },
          ...(disposition && resolution && target
            ? [
                {
                  body: {
                    activationId: input.activationId,
                    arguments: input.arguments,
                    authority:
                      resolution === "unsupported" ||
                      resolution === "manual-guidance"
                        ? "none"
                        : "signed-command",
                    commandName: prompt.name,
                    disposition,
                    ...(resolution === "unsupported"
                      ? { diagnosticCode: target }
                      : {}),
                    outcome,
                    resolution,
                    schemaVersion: 1,
                    target,
                    threadId: input.threadId,
                  },
                  streamId: input.threadId,
                  type: "compatibility.command.resolved",
                },
              ]
            : []),
        ];
      }),
      id: "curiosity.stock.skills.commands.invoke",
      schemaVersion: 1,
    },
  ],
  context: [
    {
      actionTypes: ["provider.generate"],
      agentIds: [],
      eventTypes: ["skill.activated"],
      id: "curiosity.stock.skills.context.activated",
      maxBlocks: 16,
      maxEvents: 32,
      maxOutputBytes: 65_536,
      project: Effect.fn("SkillsContext.project")(function* (input) {
        const correlation =
          input.correlation &&
          typeof input.correlation === "object" &&
          !Array.isArray(input.correlation)
            ? (input.correlation as Record<string, unknown>)
            : undefined;
        if (typeof correlation?.threadId !== "string") return [];
        const latest = new Map<
          string,
          {
            readonly eventId: string;
            readonly activation: NormalizedSkillActivation;
          }
        >();
        for (const event of input.events) {
          const activation = yield* decodeActivation(event.body).pipe(
            Effect.mapError(
              () =>
                new PluginFailure({
                  message: "SKILL_ACTIVATION_EVENT_INVALID",
                  pluginId: "curiosity.stock.skills",
                }),
            ),
          );
          if (activation.threadId === correlation.threadId)
            latest.set(activation.commandName, {
              activation,
              eventId: event.eventId,
            });
        }
        return [...latest.values()]
          .sort((left, right) =>
            left.activation.commandName.localeCompare(
              right.activation.commandName,
            ),
          )
          .flatMap(({ activation, eventId }) => {
            const command = commandsByName.get(activation.commandName);
            if (
              !command ||
              command.version !== activation.commandVersion ||
              command.status !== activation.status
            )
              return [];
            const selected = activation.skillName
              ? skillsByName.get(activation.skillName)
              : undefined;
            if (
              command.skillName !== (activation.skillName ?? null) ||
              (selected && selected.version !== activation.skillVersion)
            )
              return [];
            return [
              {
                content: command.instructions,
                id: `command:${command.name}@${command.version}`,
                provenance: "trusted-durable" as const,
                sourceEventIds: [eventId],
              },
              {
                content:
                  activation.capabilityDisposition === "available"
                    ? `Command capability disposition: available (${activation.requiredCapabilities.join(",") || "none"}).`
                    : [
                        "Command capability disposition: unavailable.",
                        ...activation.missingCapabilities.map(
                          (capability) =>
                            `CURIOSITY_COMMAND_CAPABILITY_UNAVAILABLE:${capability}`,
                        ),
                        "Do not claim command work requiring these capabilities completed.",
                      ].join("\n"),
                id: `command-capabilities:${command.name}@${command.version}`,
                provenance: "trusted-durable" as const,
                sourceEventIds: [eventId],
              },
              ...(selected
                ? [
                    {
                      content: selected.content,
                      id: `skill:${selected.name}@${selected.version}`,
                      provenance: "trusted-durable" as const,
                      sourceEventIds: [eventId],
                    },
                  ]
                : []),
            ];
          });
      }),
      rank: 100,
      required: false,
      schemaVersion: 1,
      slot: "skills",
    },
  ],
  manifest: {
    capabilities: [],
    class: "semantic",
    id: "curiosity.stock.skills",
    kernelApi: KERNEL_PLUGIN_API_VERSION,
    provenance: {
      license: "Project-owned clean-room translation",
      revision: "1.1.0",
      source: "apps/custom-harness/src/plugins/skills.ts",
    },
        requires: [],
    schemaVersion: 2,
    version: "1.1.0",
  },
  promptCommands,
  projections: [
    {
      eventSchemas: [{ eventType: "skill.activated", schemaVersions: [1] }],
      id: "curiosity.stock.skills.projections.activations",
      initialState: { activations: [], revision: 0, schemaVersion: 1 },
      reduce: Effect.fn("SkillsProjection.reduce")(function* (state, event) {
        const activation = yield* decodeActivation(event.body).pipe(
          Effect.mapError(
            () =>
              new PluginFailure({
                message: "SKILL_ACTIVATION_EVENT_INVALID",
                pluginId: "curiosity.stock.skills",
              }),
          ),
        );
        const current = state as { readonly activations: readonly unknown[] };
        return {
          activations: [
            ...current.activations,
            { ...activation, actorId: event.actorId, eventId: event.eventId },
          ],
          revision: event.sequence,
          schemaVersion: 1,
        };
      }),
      schemaVersion: 1,
    },
  ],
  skills,
};
