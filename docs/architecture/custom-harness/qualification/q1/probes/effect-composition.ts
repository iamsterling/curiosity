import * as Context from "../../../../../../node_modules/.bun/effect@4.0.0-beta.107/node_modules/effect/dist/Context.js";
import * as Effect from "../../../../../../node_modules/.bun/effect@4.0.0-beta.107/node_modules/effect/dist/Effect.js";
import * as Layer from "../../../../../../node_modules/.bun/effect@4.0.0-beta.107/node_modules/effect/dist/Layer.js";
import * as ManagedRuntime from "../../../../../../node_modules/.bun/effect@4.0.0-beta.107/node_modules/effect/dist/ManagedRuntime.js";
import * as PluginContext from "../../../../../../apps/plugin/opencode2/node_modules/effect/dist/Context.js";
import * as PluginEffect from "../../../../../../apps/plugin/opencode2/node_modules/effect/dist/Effect.js";

const assert: (condition: unknown, message: string) => asserts condition = (
  condition,
  message,
) => {
  if (!condition) {
    throw new Error(message);
  }
};

class ApplicationRoot extends Context.Service<
  ApplicationRoot,
  {
    readonly transition: (value: string) => Effect.Effect<string>;
  }
>()("custom-harness/q1/ApplicationRoot") {}

export const runEffectCompositionProbe = async () => {
  let acquisitions = 0;
  let releases = 0;
  let transitions = 0;

  const layer = Layer.effect(
    ApplicationRoot,
    Effect.acquireRelease(
      Effect.sync(() => {
        acquisitions += 1;
        return ApplicationRoot.of({
          transition: (value) =>
            Effect.sync(() => {
              transitions += 1;
              return `${transitions}:${value}`;
            }),
        });
      }),
      () =>
        Effect.sync(() => {
          releases += 1;
        }),
    ),
  );

  const runtime = ManagedRuntime.make(layer);
  const first = await runtime.runPromise(
    ApplicationRoot.use((service) => service.transition("first")),
  );
  const contextOne = await runtime.context();
  const second = await runtime.runPromise(
    ApplicationRoot.use((service) => service.transition("second")),
  );
  const contextTwo = await runtime.context();

  assert(
    first === "1:first",
    "first command did not pass through the one service",
  );
  assert(
    second === "2:second",
    "second command did not pass through the one service",
  );
  assert(acquisitions === 1, "ManagedRuntime rebuilt the application layer");
  assert(
    contextOne === contextTwo,
    "ManagedRuntime did not cache one application context",
  );
  assert(
    Effect.runPromise === PluginEffect.runPromise,
    "Effect resolved as duplicate runtime modules",
  );
  assert(
    Context.ServiceTypeId === PluginContext.ServiceTypeId,
    "Effect service identity was duplicated",
  );

  await runtime.dispose();
  assert(
    releases === 1,
    "application runtime did not release its layer exactly once",
  );

  let rejectedAfterDispose = false;
  try {
    await runtime.runPromise(
      ApplicationRoot.use((service) => service.transition("late")),
    );
  } catch {
    rejectedAfterDispose = true;
  }
  assert(
    rejectedAfterDispose,
    "disposed application runtime accepted later work",
  );

  return {
    acquisitions,
    releases,
    transitions,
    oneCachedContext: true,
    duplicateRuntime: false,
    rejectedAfterDispose,
  };
};
