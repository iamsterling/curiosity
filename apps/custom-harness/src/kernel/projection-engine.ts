import { Effect } from "effect";
import type { StoredEvent } from "../domain/event.js";
import { canonicalJson } from "./canonical-json.js";
import { PluginFailure } from "./errors.js";
import type { StaticPluginCatalog } from "./plugin.js";

const maximumProjectionBytes = 1_048_576;

const schemaVersion = (event: StoredEvent): number | undefined => {
  if (
    !event.body ||
    typeof event.body !== "object" ||
    Array.isArray(event.body)
  )
    return undefined;
  const version = (event.body as Record<string, unknown>).schemaVersion;
  return typeof version === "number" && Number.isInteger(version)
    ? version
    : undefined;
};

export class ProjectionEngine {
  constructor(
    private readonly catalog: StaticPluginCatalog,
    private readonly readEvents: () => readonly StoredEvent[],
  ) {}

  replay = Effect.fn("ProjectionEngine.replay")(function* (
    this: ProjectionEngine,
    projectionId: string,
  ) {
    const projection = this.catalog.projection(projectionId);
    if (!projection)
      return yield* new PluginFailure({
        message: "PROJECTION_NOT_FOUND",
        pluginId: projectionId,
      });
    let state = JSON.parse(canonicalJson(projection.initialState)) as unknown;
    for (const event of this.readEvents()) {
      if (
        event.eventSchemaVersion !== 0 &&
        event.eventSchemaVersion !== 1
      )
        return yield* new PluginFailure({
          message: "PROJECTION_EVENT_SCHEMA_UNSUPPORTED",
          pluginId: projection.pluginId,
        });
      const accepted = projection.eventSchemas.find(
        ({ eventType }) => eventType === event.type,
      );
      if (!accepted) continue;
      const version = schemaVersion(event);
      if (version === undefined || !accepted.schemaVersions.includes(version))
        return yield* new PluginFailure({
          message: "PROJECTION_EVENT_SCHEMA_UNSUPPORTED",
          pluginId: projection.pluginId,
        });
      state = yield* projection.reduce(state, event).pipe(
        Effect.mapError(
          () =>
            new PluginFailure({
              message: "PROJECTION_REDUCER_FAILED",
              pluginId: projection.pluginId,
            }),
        ),
      );
      const encoded = yield* Effect.try({
        try: () => canonicalJson(state),
        catch: () =>
          new PluginFailure({
            message: "PROJECTION_STATE_INVALID",
            pluginId: projection.pluginId,
          }),
      });
      if (Buffer.byteLength(encoded) > maximumProjectionBytes)
        return yield* new PluginFailure({
          message: "PROJECTION_STATE_TOO_LARGE",
          pluginId: projection.pluginId,
        });
      state = JSON.parse(encoded) as unknown;
    }
    return state;
  });
}
