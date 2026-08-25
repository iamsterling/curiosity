import { Effect, Schema } from "effect";
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
    version: "1.0.0",
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
        return [
          {
            type: "thread.opened",
            streamId: payload.threadId,
            body: {
              schemaVersion: 1,
              threadId: payload.threadId,
              title: payload.title,
            },
          },
        ];
      }),
      id: "curiosity.stock.thread.commands.open",
      schemaVersion: 1,
    },
  ],
};
