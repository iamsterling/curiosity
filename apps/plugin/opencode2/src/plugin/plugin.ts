import { Plugin } from "@opencode-ai/plugin";
import { Plugin as EffectPlugin } from "@opencode-ai/plugin/effect";
import { fromPromise } from "@opencode-ai/plugin/promise/adapter";
import { Effect } from "effect";
import { pluginConfigFeature } from "../features/config/index.js";
import { hookFoundationFeature } from "../features/hooks/index.js";
import { structuredToolsFeature } from "../features/tools/index.js";
import { createSearchDefinitions, runtimeSearchOptions } from "../features/search/index.js";
import { DiagnosticError } from "../core/diagnostics/diagnostic.js";
import { PINNED_REAL_HOST_VERSION } from "../platform/real-host/index.js";
import { composeFeatures } from "./compose.js";
import { projectRootKey } from "./lifecycle.js";

const activeSetups = new Set<string>();
const composed = composeFeatures([pluginConfigFeature, hookFoundationFeature, structuredToolsFeature]);
const setup = async (context: Parameters<typeof composed>[0]) => {
  if (context.app.version !== PINNED_REAL_HOST_VERSION)
    throw new DiagnosticError("REAL_HOST_VERSION_PIN_MISMATCH", `${context.app.version}:${PINNED_REAL_HOST_VERSION}`);
  const key = await projectRootKey(context);
  if (activeSetups.has(key)) return () => undefined;
  activeSetups.add(key);
  try {
    const cleanup = await composed(context);
    let cleaned = false;
    return async () => {
      if (cleaned) return;
      cleaned = true;
      try {
        await cleanup();
      } finally {
        activeSetups.delete(key);
      }
    };
  } catch (error) {
    activeSetups.delete(key);
    throw error;
  }
};

const promisePlugin = Plugin.define({
  id: "iamsterling.opencode2-config",
  setup,
});
const promiseHostPlugin = fromPromise(promisePlugin);
const effectPlugin = EffectPlugin.define({
  id: promisePlugin.id,
  effect: (context) =>
    Effect.gen(function* () {
      const configuredDefinitions = yield* Effect.sync(() => {
        try {
          const configured = Reflect.get(context.options, "search") as unknown;
          const options = runtimeSearchOptions(configured);
          return options ? createSearchDefinitions(options) : undefined;
        } catch {
          throw new DiagnosticError("WEB_SEARCH_RUNTIME_CONFIG_INVALID");
        }
      });
      const searchDefinitions = configuredDefinitions
        ? yield* Effect.acquireRelease(Effect.succeed(configuredDefinitions), (definitions) =>
            Effect.sync(() => definitions.cleanup()),
          )
        : undefined;
      if (searchDefinitions?.open) yield* searchDefinitions.open.pipe(Effect.orDie);
      yield* promiseHostPlugin.effect(context);
      if (searchDefinitions)
        yield* context.tool.transform((draft) => {
          for (const definition of searchDefinitions) draft.add(definition as never);
        });
    }),
});

export default {
  effect: effectPlugin.effect,
  id: promisePlugin.id,
  setup: promisePlugin.setup,
};
