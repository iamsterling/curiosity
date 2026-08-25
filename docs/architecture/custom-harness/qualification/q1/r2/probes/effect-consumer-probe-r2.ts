import * as Context from "effect/Context";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as ManagedRuntime from "effect/ManagedRuntime";

const selectedImports = [
  "effect/Context",
  "effect/Effect",
  "effect/Layer",
  "effect/ManagedRuntime",
] as const;

const assert: (condition: unknown, message: string) => asserts condition = (
  condition,
  message,
) => {
  if (!condition) throw new Error(message);
};

class ApplicationRoot extends Context.Service<
  ApplicationRoot,
  {
    readonly transition: (value: string) => Effect.Effect<string>;
  }
>()("custom-harness/q1/r2/ApplicationRoot") {}

export const runPublicConsumerProbe = async () => {
  let acquisitions = 0;
  let releases = 0;
  let transitions = 0;
  const resolutions = await Promise.all(
    selectedImports.map(async (specifier) => ({
      specifier,
      resolved: import.meta.resolve(specifier),
    })),
  );
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
  assert(first === "1:first", "first transition did not use the service");
  assert(second === "2:second", "second transition did not use the service");
  assert(
    acquisitions === 1,
    "the application layer was acquired more than once",
  );
  assert(contextOne === contextTwo, "the application context was not cached");
  await runtime.dispose();
  assert(releases === 1, "the application layer was not released exactly once");
  let rejectedAfterDispose = false;
  try {
    await runtime.runPromise(
      ApplicationRoot.use((service) => service.transition("late")),
    );
  } catch {
    rejectedAfterDispose = true;
  }
  assert(rejectedAfterDispose, "the disposed runtime accepted later work");
  return {
    packageVersion: "4.0.0-beta.107",
    selectedImports,
    resolutions,
    acquisitions,
    releases,
    transitions,
    oneCachedContext: true,
    activeManagedRuntimeCount: 1,
    rejectedAfterDispose,
  };
};
