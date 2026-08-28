import { Effect, Schema } from "effect";
import {
  KERNEL_PLUGIN_API_VERSION,
  type CuriosityPluginV2,
} from "../kernel/plugin.js";

class ChatCorrelation extends Schema.Class<ChatCorrelation>(
  "@curiosity/custom-harness/ChatContextCorrelation",
)({
  agentId: Schema.NonEmptyString,
  assistantMessageId: Schema.NonEmptyString,
  assistantContext: Schema.String,
  finalizationOnly: Schema.Boolean,
  kind: Schema.Literal("curiosity.chat.turn"),
  recoveryAttempts: Schema.optional(Schema.Number),
  recoveryCodes: Schema.optional(Schema.Array(Schema.String)),
  roleActivationCommand: Schema.optional(Schema.NonEmptyString),
  roleActivationEventId: Schema.optional(Schema.NonEmptyString),
  threadId: Schema.NonEmptyString,
  toolCallCount: Schema.Number,
  toolEvidence: Schema.String,
  toolRound: Schema.Number,
  turnId: Schema.NonEmptyString,
}) {}

class ThreadOpenedContext extends Schema.Class<ThreadOpenedContext>(
  "@curiosity/custom-harness/ThreadOpenedContext",
)({
  threadId: Schema.NonEmptyString,
  title: Schema.NonEmptyString,
}) {}

const decodeCorrelation = Schema.decodeUnknownEffect(ChatCorrelation, {
  onExcessProperty: "error",
});
const decodeThread = Schema.decodeUnknownSync(ThreadOpenedContext);

export const contextPlugin: CuriosityPluginV2 = {
  context: [
    {
      actionTypes: ["provider.generate"],
      agentIds: [],
      eventTypes: ["thread.opened", "turn.failed"],
      id: "curiosity.stock.context.context.conversation",
      maxBlocks: 1,
      maxEvents: 32,
      maxOutputBytes: 4_096,
      project: Effect.fn("ConversationContext.project")(function* (input) {
        const correlation = yield* decodeCorrelation(input.correlation).pipe(
          Effect.catch(() => Effect.succeed(undefined)),
        );
        if (!correlation) return [];
        const opened = [...input.events]
          .reverse()
          .find(
            (event) =>
              event.type === "thread.opened" &&
              event.streamId === correlation.threadId,
          );
        if (!opened) return [];
        const thread = yield* Effect.try({
          try: () => decodeThread(opened.body),
          catch: () => undefined,
        }).pipe(Effect.catch(() => Effect.succeed(undefined)));
        if (!thread) return [];
        const failures = input.events.filter(
          (event) =>
            event.type === "turn.failed" &&
            event.streamId === correlation.threadId,
        ).length;
        return [
          {
            content: `Durable conversation context\nThread: ${thread.threadId}\nTitle: ${thread.title}\nPrior failed turns: ${failures}`,
            id: `conversation:${thread.threadId}`,
            provenance: "trusted-durable" as const,
            sourceEventIds: [opened.eventId],
          },
        ];
      }),
      rank: 100,
      required: false,
      schemaVersion: 1,
      slot: "durable-context",
    },
  ],
  manifest: {
    capabilities: [],
    class: "semantic",
    id: "curiosity.stock.context",
    kernelApi: KERNEL_PLUGIN_API_VERSION,
    provenance: {
      license: "Project-owned",
      revision: "1.1.0",
      source: "apps/custom-harness/src/plugins/context.ts",
    },
    requires: [],
    schemaVersion: 2,
    version: "1.1.0",
  },
};
