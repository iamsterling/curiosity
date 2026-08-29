import { Effect, Schema } from "effect";
import { proposeThreadOpen } from "@curiosity/authority";
import { InputRejected } from "../kernel/errors.js";
import {
  KERNEL_PLUGIN_API_VERSION,
  type CuriosityPluginV2,
} from "../kernel/plugin.js";

class OpenThreadPayload extends Schema.Class<OpenThreadPayload>(
  "@curiosity/custom-harness/OpenThreadPayload",
)({
  threadId: Schema.NonEmptyString,
  title: Schema.NonEmptyString,
}) {}

const decodePayload = Schema.decodeUnknownEffect(OpenThreadPayload);

class ClientLifecyclePayload extends Schema.Class<ClientLifecyclePayload>(
  "@curiosity/custom-harness/ClientLifecyclePayload",
)({
  operation: Schema.Literals([
    "new",
    "threads",
    "resume",
    "agent",
    "questions",
    "children",
  ]),
  schemaVersion: Schema.Literal(1),
  target: Schema.optional(Schema.NonEmptyString),
}) {}

const decodeLifecycle = Schema.decodeUnknownEffect(ClientLifecyclePayload, {
  onExcessProperty: "error",
});

export const threadPlugin: CuriosityPluginV2 = {
  manifest: {
    capabilities: [],
    class: "semantic",
    id: "curiosity.stock.thread",
    kernelApi: KERNEL_PLUGIN_API_VERSION,
    provenance: {
      license: "Project-owned",
      revision: "1.0.0",
      source: "apps/custom-harness/src/plugins/thread.ts",
    },
    requires: [],
    schemaVersion: 2,
    version: "1.1.0",
  },
  commandDeciders: [
    {
      commandKinds: ["thread.open"],
      decide: Effect.fn("ThreadPlugin.decide")(function* (command) {
        const payload = yield* decodePayload(command.payload).pipe(
          Effect.mapError(
            () => new InputRejected({ message: "THREAD_OPEN_PAYLOAD_INVALID" }),
          ),
        );
        return proposeThreadOpen(payload);
      }),
      id: "curiosity.stock.thread.commands.open",
      schemaVersion: 1,
    },
    {
      commandKinds: ["client.lifecycle"],
      decide: Effect.fn("ThreadPlugin.clientLifecycle")(
        function* (command, context) {
          const payload = yield* decodeLifecycle(command.payload).pipe(
            Effect.mapError(
              () =>
                new InputRejected({
                  message: "CLIENT_LIFECYCLE_PAYLOAD_INVALID",
                }),
            ),
          );
          const needsTarget = ["resume", "agent", "children"].includes(
            payload.operation,
          );
          if (
            needsTarget !== Boolean(payload.target) ||
            (payload.target?.length ?? 0) > 256
          )
            return yield* new InputRejected({
              message: "CLIENT_LIFECYCLE_TARGET_INVALID",
            });
          if (
            payload.operation === "agent" &&
            !context.enabledPrimaryAgentIds.has(payload.target!)
          )
            return yield* new InputRejected({
              message: "CLIENT_PRIMARY_AGENT_INVALID",
            });
          if (
            payload.operation === "resume" &&
            !context.events.some(
              (event) =>
                event.type === "thread.opened" &&
                event.body !== null &&
                typeof event.body === "object" &&
                !Array.isArray(event.body) &&
                (event.body as Record<string, unknown>).threadId ===
                  payload.target,
            )
          )
            return yield* new InputRejected({
              message: "CLIENT_THREAD_NOT_FOUND",
            });
          return [
            {
              body: {
                operation: payload.operation,
                schemaVersion: 1,
                ...(payload.target ? { target: payload.target } : {}),
              },
              streamId: payload.target ?? `client:${payload.operation}`,
              type: "client.lifecycle-recorded",
            },
          ];
        },
      ),
      id: "curiosity.stock.thread.commands.client-lifecycle",
      schemaVersion: 1,
    },
  ],
};
