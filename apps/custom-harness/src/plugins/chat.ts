import { Effect } from "effect";
import { decodeChatTurnPayload } from "../domain/chat.js";
import type { ProposedEvent } from "../domain/event.js";
import { InputRejected, PluginFailure } from "../kernel/errors.js";
import {
  KERNEL_PLUGIN_API_VERSION,
  type CuriosityPluginV2,
} from "../kernel/plugin.js";
import { projectChatMessages } from "../projection/chat-projection.js";

const maximumMessageBytes = 64 * 1_024;
const maximumIdentifierBytes = 256;
const emptyReaction = { actions: [], events: [] } as const;

const titleFrom = (text: string): string => {
  const firstLine = text.split(/\r?\n/u, 1)[0]?.trim() ?? "";
  return Array.from(firstLine || "New conversation")
    .slice(0, 80)
    .join("");
};

const validatePayloadBounds = (payload: {
  readonly assistantMessageId: string;
  readonly text: string;
  readonly threadId: string;
  readonly turnId: string;
  readonly userMessageId: string;
}): Effect.Effect<void, InputRejected> => {
  const identifiers = [
    payload.assistantMessageId,
    payload.threadId,
    payload.turnId,
    payload.userMessageId,
  ];
  if (
    identifiers.some(
      (value) => Buffer.byteLength(value) > maximumIdentifierBytes,
    )
  )
    return Effect.fail(
      new InputRejected({ message: "CHAT_IDENTIFIER_TOO_LARGE" }),
    );
  if (Buffer.byteLength(payload.text) > maximumMessageBytes)
    return Effect.fail(
      new InputRejected({ message: "CHAT_MESSAGE_TOO_LARGE" }),
    );
  return Effect.void;
};

const body = (value: unknown): Record<string, unknown> | undefined =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;

const chatCorrelation = (
  value: unknown,
):
  | {
      readonly assistantMessageId: string;
      readonly kind: "curiosity.chat.turn";
      readonly threadId: string;
      readonly turnId: string;
    }
  | undefined => {
  const candidate = body(value);
  if (
    candidate?.kind !== "curiosity.chat.turn" ||
    typeof candidate.assistantMessageId !== "string" ||
    typeof candidate.threadId !== "string" ||
    typeof candidate.turnId !== "string"
  )
    return undefined;
  return {
    assistantMessageId: candidate.assistantMessageId,
    kind: "curiosity.chat.turn",
    threadId: candidate.threadId,
    turnId: candidate.turnId,
  };
};

export const chatPlugin: CuriosityPluginV2 = {
  manifest: {
    capabilities: ["provider.generate"],
    class: "semantic",
    id: "curiosity.stock.chat",
    kernelApi: KERNEL_PLUGIN_API_VERSION,
    provenance: {
      license: "Project-owned",
      revision: "1.2.0",
      source: "apps/custom-harness/src/plugins/chat.ts",
    },
    requires: [
      { pluginId: "curiosity.stock.agents", version: "1.0.0" },
      { pluginId: "curiosity.stock.context", version: "1.0.0" },
      { pluginId: "curiosity.stock.thread", version: "1.0.0" },
    ],
    schemaVersion: 2,
    version: "1.2.0",
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
        yield* validatePayloadBounds(payload);

        const events: ProposedEvent[] = [];
        const threadExists = context.events.some(
          (event) =>
            event.type === "thread.opened" &&
            event.streamId === payload.threadId,
        );
        if (!threadExists) {
          events.push({
            body: {
              schemaVersion: 1,
              threadId: payload.threadId,
              title: titleFrom(payload.text),
            },
            streamId: payload.threadId,
            type: "thread.opened",
          });
        }
        events.push(
          {
            body: {
              messageId: payload.userMessageId,
              role: "user",
              schemaVersion: 1,
              text: payload.text,
              threadId: payload.threadId,
              turnId: payload.turnId,
            },
            streamId: payload.threadId,
            type: "message.appended",
          },
          {
            body: {
              assistantMessageId: payload.assistantMessageId,
              schemaVersion: 1,
              threadId: payload.threadId,
              turnId: payload.turnId,
            },
            streamId: payload.threadId,
            type: "turn.requested",
          },
        );
        return events;
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
            typeof requested.threadId !== "string" ||
            typeof requested.turnId !== "string"
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
                  agentId: "generalist",
                  correlation: {
                    assistantMessageId: requested.assistantMessageId,
                    kind: "curiosity.chat.turn",
                    threadId: requested.threadId,
                    turnId: requested.turnId,
                  },
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
      react: Effect.fn("ChatPlugin.providerSucceeded")(function* (event) {
        const receipt = body(event.body);
        const correlation = chatCorrelation(receipt?.correlation);
        if (receipt?.actionType !== "provider.generate" || !correlation)
          return emptyReaction;
        const output = body(receipt.output);
        if (
          typeof output?.text !== "string" ||
          typeof output.durationMs !== "number" ||
          typeof output.effort !== "string" ||
          typeof output.modelId !== "string"
        )
          return yield* new PluginFailure({
            message: "CHAT_PROVIDER_RECEIPT_INVALID",
            pluginId: "curiosity.stock.chat",
          });
        return {
          actions: [],
          events: [
            {
              body: {
                durationMs: output.durationMs,
                effort: output.effort,
                messageId: correlation.assistantMessageId,
                modelId: output.modelId,
                role: "assistant",
                schemaVersion: 1,
                text: output.text,
                threadId: correlation.threadId,
                turnId: correlation.turnId,
              },
              streamId: correlation.threadId,
              type: "message.appended",
            },
          ],
        };
      }),
      schemaVersion: 1,
    },
    {
      eventTypes: ["action.failed"],
      id: "curiosity.stock.chat.reactors.provider-failed",
      react: Effect.fn("ChatPlugin.providerFailed")(function* (event) {
        const receipt = body(event.body);
        const correlation = chatCorrelation(receipt?.correlation);
        if (receipt?.actionType !== "provider.generate" || !correlation)
          return emptyReaction;
        return {
          actions: [],
          events: [
            {
              body: {
                errorCode:
                  typeof receipt.errorCode === "string"
                    ? receipt.errorCode
                    : "TEXT_GENERATION_FAILED",
                modelId:
                  typeof receipt.modelId === "string" ? receipt.modelId : "",
                schemaVersion: 1,
                threadId: correlation.threadId,
                turnId: correlation.turnId,
              },
              streamId: correlation.threadId,
              type: "turn.failed",
            },
          ],
        };
      }),
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
