import type { EventReactorContribution } from "./plugin-contract.js";
import {
  exactObjectKeys,
  nonEmptyString,
  plainRecord,
  uniqueStringArray,
} from "./plugin-validation-primitives.js";

const reactorKeys = ["eventTypes", "id", "react", "schemaVersion"] as const;
const reactorIdPattern =
  /^curiosity\.[a-z0-9][a-z0-9.-]*\.reactors\.[a-z0-9][a-z0-9.-]*$/u;

export const validateEventReactor = (
  value: unknown,
  ownerId: string,
): EventReactorContribution => {
  const reactor = plainRecord(value, `PLUGIN_EVENT_REACTOR_INVALID:${ownerId}`);
  exactObjectKeys(
    reactor,
    reactorKeys,
    `PLUGIN_EVENT_REACTOR_UNKNOWN_FIELD:${ownerId}`,
  );
  const id = nonEmptyString(
    reactor.id,
    `PLUGIN_CONTRIBUTION_ID_INVALID:${ownerId}`,
  );
  if (!reactorIdPattern.test(id))
    throw new Error(`PLUGIN_CONTRIBUTION_ID_INVALID:${id}`);
  if (!id.startsWith(`${ownerId}.reactors.`))
    throw new Error(`PLUGIN_CONTRIBUTION_OWNER_MISMATCH:${ownerId}:${id}`);
  if (reactor.schemaVersion !== 1)
    throw new Error(`PLUGIN_CONTRIBUTION_SCHEMA_UNSUPPORTED:${id}`);
  if (typeof reactor.react !== "function")
    throw new Error(`PLUGIN_EVENT_REACTOR_MISSING:${id}`);
  const eventTypes = uniqueStringArray(
    reactor.eventTypes,
    `PLUGIN_REACTOR_EVENT_TYPES_INVALID:${id}`,
  );
  if (eventTypes.length === 0)
    throw new Error(`PLUGIN_REACTOR_EVENT_TYPE_REQUIRED:${id}`);
  return {
    eventTypes,
    id: id as EventReactorContribution["id"],
    react: reactor.react as EventReactorContribution["react"],
    schemaVersion: 1,
  };
};
