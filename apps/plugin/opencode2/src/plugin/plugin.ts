import { Plugin } from "@opencode-ai/plugin";
import { Plugin as EffectPlugin } from "@opencode-ai/plugin/effect";
import { fromPromise } from "@opencode-ai/plugin/promise/adapter";
import { Effect } from "effect";
import { pluginConfigFeature } from "../features/config/index.js";
import { hookFoundationFeature } from "../features/hooks/index.js";
import { structuredToolsFeature } from "../features/tools/index.js";
import { DiagnosticError } from "../core/diagnostics/diagnostic.js";
import { PINNED_REAL_HOST_VERSION } from "../platform/real-host/index.js";
import { composeFeatures } from "./compose.js";
import { projectRootKey } from "./lifecycle.js";
import { createSearchDefinitions, runtimeSearchOptions, type RuntimeSearchOptions } from "../features/search/index.js";

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

const adapted = fromPromise(promisePlugin);
const effectPlugin = EffectPlugin.define({
  id: promisePlugin.id,
  effect: (context) =>
    Effect.gen(function* () {
      let runtimeOptions: RuntimeSearchOptions | undefined;
      try {
        const search = Reflect.get(context.options as object, "search");
        runtimeOptions = runtimeSearchOptions(search);
      } catch {
        throw new DiagnosticError("WEB_SEARCH_RUNTIME_CONFIG_INVALID");
      }
      const definitions = runtimeOptions ? createSearchDefinitions(runtimeOptions) : undefined;
      // Acquire close before any registrations: all scoped registration disposal then runs first (LIFO).
      if (definitions) {
        yield* Effect.orDie(definitions.open!);
        yield* Effect.addFinalizer(() => Effect.sync(() => definitions.cleanup()));
      }
      yield* adapted.effect(context);
      if (!definitions) return;
      yield* context.tool.transform((draft) => {
        for (const definition of definitions) draft.add(definition as never);
      });
    }),
});

export default Object.assign(effectPlugin, { setup });
