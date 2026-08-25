import { canonicalJson } from "./canonical-json.js";
import type {
  ProjectionContribution,
  ProjectionEventSchema,
} from "./plugin-contract.js";
import {
  exactObjectKeys,
  nonEmptyString,
  plainRecord,
} from "./plugin-validation-primitives.js";

const projectionKeys = [
  "eventSchemas",
  "id",
  "initialState",
  "reduce",
  "schemaVersion",
] as const;
const eventSchemaKeys = ["eventType", "schemaVersions"] as const;
const projectionIdPattern =
  /^curiosity\.[a-z0-9][a-z0-9.-]*\.projections\.[a-z0-9][a-z0-9.-]*$/u;

const validateEventSchema = (
  value: unknown,
  projectionId: string,
): ProjectionEventSchema => {
  const schema = plainRecord(
    value,
    `PLUGIN_PROJECTION_EVENT_SCHEMA_INVALID:${projectionId}`,
  );
  exactObjectKeys(
    schema,
    eventSchemaKeys,
    `PLUGIN_PROJECTION_EVENT_SCHEMA_UNKNOWN_FIELD:${projectionId}`,
  );
  const eventType = nonEmptyString(
    schema.eventType,
    `PLUGIN_PROJECTION_EVENT_TYPE_INVALID:${projectionId}`,
  );
  if (
    !Array.isArray(schema.schemaVersions) ||
    schema.schemaVersions.length === 0 ||
    schema.schemaVersions.some(
      (version) =>
        typeof version !== "number" ||
        !Number.isInteger(version) ||
        version < 1,
    )
  )
    throw new Error(`PLUGIN_PROJECTION_EVENT_VERSIONS_INVALID:${projectionId}`);
  const schemaVersions = [...new Set(schema.schemaVersions as number[])].sort(
    (left, right) => left - right,
  );
  if (schemaVersions.length !== schema.schemaVersions.length)
    throw new Error(
      `PLUGIN_PROJECTION_EVENT_VERSION_DUPLICATE:${projectionId}`,
    );
  return { eventType, schemaVersions };
};

export const validateProjection = (
  value: unknown,
  ownerId: string,
): ProjectionContribution => {
  const projection = plainRecord(value, `PLUGIN_PROJECTION_INVALID:${ownerId}`);
  exactObjectKeys(
    projection,
    projectionKeys,
    `PLUGIN_PROJECTION_UNKNOWN_FIELD:${ownerId}`,
  );
  const id = nonEmptyString(
    projection.id,
    `PLUGIN_CONTRIBUTION_ID_INVALID:${ownerId}`,
  );
  if (!projectionIdPattern.test(id))
    throw new Error(`PLUGIN_CONTRIBUTION_ID_INVALID:${id}`);
  if (!id.startsWith(`${ownerId}.projections.`))
    throw new Error(`PLUGIN_CONTRIBUTION_OWNER_MISMATCH:${ownerId}:${id}`);
  if (projection.schemaVersion !== 1)
    throw new Error(`PLUGIN_CONTRIBUTION_SCHEMA_UNSUPPORTED:${id}`);
  if (typeof projection.reduce !== "function")
    throw new Error(`PLUGIN_PROJECTION_REDUCER_MISSING:${id}`);
  if (
    !Array.isArray(projection.eventSchemas) ||
    projection.eventSchemas.length === 0
  )
    throw new Error(`PLUGIN_PROJECTION_EVENT_SCHEMAS_INVALID:${id}`);
  const eventSchemas = projection.eventSchemas.map((schema) =>
    validateEventSchema(schema, id),
  );
  if (
    new Set(eventSchemas.map(({ eventType }) => eventType)).size !==
    eventSchemas.length
  )
    throw new Error(`PLUGIN_PROJECTION_EVENT_TYPE_DUPLICATE:${id}`);
  if (Buffer.byteLength(canonicalJson(projection.initialState)) > 1_048_576)
    throw new Error(`PLUGIN_PROJECTION_INITIAL_STATE_TOO_LARGE:${id}`);
  return {
    eventSchemas,
    id: id as ProjectionContribution["id"],
    initialState: projection.initialState,
    reduce: projection.reduce as ProjectionContribution["reduce"],
    schemaVersion: 1,
  };
};
