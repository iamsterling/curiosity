import type { CommandDeciderContribution } from "./plugin-contract.js";
import {
  exactObjectKeys,
  nonEmptyString,
  plainRecord,
  uniqueStringArray,
} from "./plugin-validation-primitives.js";

const commandDeciderKeys = [
  "commandKinds",
  "decide",
  "id",
  "schemaVersion",
] as const;
const contributionIdPattern =
  /^curiosity\.[a-z0-9][a-z0-9.-]*\.commands\.[a-z0-9][a-z0-9.-]*$/u;

export const validateCommandDecider = (
  value: unknown,
  ownerId: string,
): CommandDeciderContribution => {
  const contribution = plainRecord(
    value,
    `PLUGIN_COMMAND_DECIDER_INVALID:${ownerId}`,
  );
  exactObjectKeys(
    contribution,
    commandDeciderKeys,
    `PLUGIN_COMMAND_DECIDER_UNKNOWN_FIELD:${ownerId}`,
  );
  const id = nonEmptyString(
    contribution.id,
    `PLUGIN_CONTRIBUTION_ID_INVALID:${ownerId}`,
  );
  if (!contributionIdPattern.test(id))
    throw new Error(`PLUGIN_CONTRIBUTION_ID_INVALID:${id}`);
  if (!id.startsWith(`${ownerId}.commands.`))
    throw new Error(`PLUGIN_CONTRIBUTION_OWNER_MISMATCH:${ownerId}:${id}`);
  if (contribution.schemaVersion !== 1)
    throw new Error(`PLUGIN_CONTRIBUTION_SCHEMA_UNSUPPORTED:${id}`);
  if (typeof contribution.decide !== "function")
    throw new Error(`PLUGIN_COMMAND_DECIDER_MISSING:${id}`);
  const commandKinds = uniqueStringArray(
    contribution.commandKinds,
    `PLUGIN_COMMAND_KINDS_INVALID:${id}`,
  );
  if (commandKinds.length === 0)
    throw new Error(`PLUGIN_COMMAND_KIND_REQUIRED:${id}`);
  return {
    commandKinds,
    decide: contribution.decide as CommandDeciderContribution["decide"],
    id: id as CommandDeciderContribution["id"],
    schemaVersion: 1,
  };
};
