import { Effect } from "effect";
import {
  PortableAuthorityError,
  proposeChatTurn,
  validateChatTurnBounds,
} from "@curiosity/authority";
import { decodeChatTurnPayload } from "../domain/chat.js";
import { InputRejected, PluginFailure } from "../kernel/errors.js";
import {
  KERNEL_PLUGIN_API_VERSION,
  type CuriosityPluginV2,
} from "../kernel/plugin.js";
import { projectChatMessages } from "../projection/chat-projection.js";
import {
  actionFailed,
  emptyChatReaction,
  initialChatCorrelation,
  providerSucceeded,
  toolSucceeded,
} from "../semantics/chat-tool-loop.js";
import { stockAgentIds } from "./agents.js";
import { stockPromptCommandDefinitions } from "../product/stock-content.js";

const emptyReaction = emptyChatReaction;
const promptCommandAgents = new Map(
  stockPromptCommandDefinitions.flatMap((command) =>
    command.agentId ? [[command.name, command.agentId] as const] : [],
  ),
);

const body = (value: unknown): Record<string, unknown> | undefined =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;

export const chatPlugin: CuriosityPluginV2 = {
  manifest: {
    capabilities: ["provider.generate"],
    class: "semantic",
    id: "curiosity.stock.chat",
    kernelApi: KERNEL_PLUGIN_API_VERSION,
    provenance: {
      license: "Project-owned",
      revision: "1.8.0",
      source: "apps/custom-harness/src/plugins/chat.ts",
    },
    requires: [
      { pluginId: "curiosity.stock.agents", version: "1.3.0" },
      { pluginId: "curiosity.stock.context", version: "1.1.0" },
      { pluginId: "curiosity.stock.delegation", version: "1.0.0" },
      { pluginId: "curiosity.stock.git", version: "1.1.0" },
      { pluginId: "curiosity.stock.process", version: "1.0.0" },
      { pluginId: "curiosity.stock.question", version: "1.0.0" },
      { pluginId: "curiosity.stock.search", version: "1.2.0" },
      { pluginId: "curiosity.stock.thread", version: "1.1.0" },
      { pluginId: "curiosity.stock.workspace", version: "1.1.0" },
      { pluginId: "curiosity.stock.workspace-mutation", version: "1.0.0" },
    ],
    schemaVersion: 2,
    version: "1.8.0",
  },
  commandDeciders: [
    {
      commandKinds: ["chat.turn"],
      decide: Effect.fn("ChatPlugin.decide")(function* (command, context) {
        const payload = yield* decodeChatTurnPayload(command.payload).pipe(
          Effect.mapError(
            () => new InputRejected({ message: "CHAT_TURN_PAYLOAD_INVALID" }),
          ),
        );
        yield* Effect.try({
          try: () => validateChatTurnBounds(payload),
          catch: (error) =>
            new InputRejected({
              message:
                error instanceof PortableAuthorityError
                  ? error.code
                  : "CHAT_TURN_PAYLOAD_INVALID",
            }),
        });
        const agentId = payload.agentId ?? context.defaultPrimaryRole;
        const roleActivation = [...context.events].reverse().find((event) => {
          const activation = body(event.body);
          return (
            event.type === "skill.activated" &&
            event.streamId === payload.threadId &&
            typeof activation?.commandName === "string" &&
            promptCommandAgents.get(activation.commandName) === agentId
          );
        });
        const roleActivationBody = body(roleActivation?.body);
        if (
          !stockAgentIds.includes(agentId) ||
          !context.enabledAgentIds.has(agentId) ||
          (!context.enabledPrimaryAgentIds.has(agentId) && !roleActivation)
        )
          return yield* new InputRejected({ message: "CHAT_AGENT_UNKNOWN" });

        return proposeChatTurn(
          payload,
          agentId,
          context.events,
          roleActivation && typeof roleActivationBody?.commandName === "string"
            ? {
                commandName: roleActivationBody.commandName,
                eventId: roleActivation.eventId,
              }
            : undefined,
        );
      }),
      id: "curiosity.stock.chat.commands.turn",
      schemaVersion: 1,
    },
  ],
  eventReactors: [
    {
      eventTypes: ["turn.requested"],
      id: "curiosity.stock.chat.reactors.request-provider",
      react: Effect.fn("ChatPlugin.requestProvider")(
        function* (event, context) {
          const requested = body(event.body);
          if (
            typeof requested?.assistantMessageId !== "string" ||
            typeof requested.agentId !== "string" ||
            typeof requested.threadId !== "string" ||
            typeof requested.turnId !== "string" ||
            (requested.roleActivationCommand === undefined) !==
              (requested.roleActivationEventId === undefined) ||
            (requested.roleActivationCommand !== undefined &&
              typeof requested.roleActivationCommand !== "string") ||
            (requested.roleActivationEventId !== undefined &&
              typeof requested.roleActivationEventId !== "string")
          )
            return yield* new PluginFailure({
              message: "CHAT_TURN_REQUEST_EVENT_INVALID",
              pluginId: "curiosity.stock.chat",
            });
          const messages = projectChatMessages(
            context.events,
            requested.threadId,
          )
            .filter((message) => message.sequence <= event.sequence)
            .map((message) => ({ content: message.text, role: message.role }));
          return {
            actions: [
              {
                actionSchemaVersion: 1,
                actionType: "provider.generate",
                deadlineClass: "interactive",
                gateClass: "none-requested",
                input: {
                  agentId: requested.agentId,
                  correlation: initialChatCorrelation({
                    agentId: requested.agentId,
                    assistantMessageId: requested.assistantMessageId,
                    ...(typeof requested.roleActivationCommand === "string" &&
                    typeof requested.roleActivationEventId === "string"
                      ? {
                          roleActivationCommand:
                            requested.roleActivationCommand,
                          roleActivationEventId:
                            requested.roleActivationEventId,
                        }
                      : {}),
                    threadId: requested.threadId,
                    turnId: requested.turnId,
                  }),
                  messages,
                },
                requestedCapabilities: ["provider.generate"],
                schemaVersion: 1,
                subject: {
                  executionId: requested.turnId,
                  resource: `thread:${requested.threadId}`,
                },
              },
            ],
            events: [],
          };
        },
      ),
      schemaVersion: 1,
    },
    {
      eventTypes: ["action.succeeded"],
      id: "curiosity.stock.chat.reactors.provider-succeeded",
      react: providerSucceeded,
      schemaVersion: 1,
    },
    {
      eventTypes: ["action.succeeded"],
      id: "curiosity.stock.chat.reactors.tool-succeeded",
      react: toolSucceeded,
      schemaVersion: 1,
    },
    {
      eventTypes: ["action.failed"],
      id: "curiosity.stock.chat.reactors.provider-failed",
      react: actionFailed,
      schemaVersion: 1,
    },
    {
      eventTypes: ["execution.cancelled"],
      id: "curiosity.stock.chat.reactors.execution-cancelled",
      react: Effect.fn("ChatPlugin.executionCancelled")(
        function* (event, context) {
          const cancelled = body(event.body);
          if (typeof cancelled?.executionId !== "string") return emptyReaction;
          const requested = [...context.events]
            .reverse()
            .find(
              (candidate) =>
                candidate.type === "turn.requested" &&
                body(candidate.body)?.turnId === cancelled.executionId,
            );
          const request = body(requested?.body);
          if (
            typeof request?.threadId !== "string" ||
            typeof request.turnId !== "string"
          )
            return emptyReaction;
          return {
            actions: [],
            events: [
              {
                body: {
                  errorCode: "ACTION_CANCELLED",
                  modelId: "",
                  schemaVersion: 1,
                  threadId: request.threadId,
                  turnId: request.turnId,
                },
                streamId: request.threadId,
                type: "turn.failed",
              },
            ],
          };
        },
      ),
      schemaVersion: 1,
    },
  ],
};
