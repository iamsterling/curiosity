import { canonicalJson, utf8ByteLength } from "./canonical-json.js";
import { PortableAuthorityError, type Sha256 } from "./domain.js";

export interface ActionGateReceipt {
  readonly gateId: string;
  readonly payloadDigest: string;
  readonly proposalRevision: number;
}

export interface ActionGrantInput {
  readonly actionId: string;
  readonly attemptId: string;
  readonly callId: string;
  readonly catalogDigest: string;
  readonly deadlineAt: string;
  readonly executionId: string;
  readonly gateReceipt?: ActionGateReceipt;
  readonly generation: number;
  readonly inputDigest: string;
  readonly requestDigest: string;
  readonly requestedCapabilities: readonly string[];
  readonly resource: string;
  readonly toolId: string;
  readonly toolVersion: string;
}

export interface ActionGrant extends ActionGrantInput {
  readonly grantId: string;
  readonly schemaVersion: 1;
}

const identifierPattern = /^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$/u;
const digestPattern = /^[a-f0-9]{64}$/u;
const grantKeys = [
  "actionId",
  "attemptId",
  "callId",
  "catalogDigest",
  "deadlineAt",
  "executionId",
  "generation",
  "grantId",
  "inputDigest",
  "requestDigest",
  "requestedCapabilities",
  "resource",
  "schemaVersion",
  "toolId",
  "toolVersion",
] as const;
const gateKeys = ["gateId", "payloadDigest", "proposalRevision"] as const;

const record = (value: unknown): Record<string, unknown> | undefined =>
  value &&
  typeof value === "object" &&
  !Array.isArray(value) &&
  Object.getPrototypeOf(value) === Object.prototype
    ? (value as Record<string, unknown>)
    : undefined;

const exactKeys = (
  value: Record<string, unknown>,
  required: readonly string[],
  optional: readonly string[] = [],
): boolean => {
  const keys = Object.keys(value);
  return (
    required.every((key) => keys.includes(key)) &&
    keys.every((key) => required.includes(key) || optional.includes(key))
  );
};

const identifier = (value: unknown): value is string =>
  typeof value === "string" && identifierPattern.test(value);

const digest = (value: unknown): value is string =>
  typeof value === "string" && digestPattern.test(value);

const timestamp = (value: unknown): value is string =>
  typeof value === "string" &&
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/u.test(value) &&
  Number.isFinite(Date.parse(value));

const decodeGate = (value: unknown): ActionGateReceipt => {
  const gate = record(value);
  if (
    !gate ||
    !exactKeys(gate, gateKeys) ||
    !identifier(gate.gateId) ||
    !digest(gate.payloadDigest) ||
    !Number.isSafeInteger(gate.proposalRevision) ||
    (gate.proposalRevision as number) < 1
  )
    throw new PortableAuthorityError("ACTION_GRANT_INVALID");
  return Object.freeze({
    gateId: gate.gateId,
    payloadDigest: gate.payloadDigest,
    proposalRevision: gate.proposalRevision as number,
  });
};

export const validateActionGrant = (value: unknown): ActionGrant => {
  const grant = record(value);
  if (
    !grant ||
    !exactKeys(grant, grantKeys, ["gateReceipt"]) ||
    grant.schemaVersion !== 1 ||
    !identifier(grant.actionId) ||
    !identifier(grant.attemptId) ||
    !identifier(grant.callId) ||
    !digest(grant.catalogDigest) ||
    !timestamp(grant.deadlineAt) ||
    !identifier(grant.executionId) ||
    !Number.isSafeInteger(grant.generation) ||
    (grant.generation as number) < 1 ||
    !digest(grant.grantId) ||
    !digest(grant.inputDigest) ||
    !digest(grant.requestDigest) ||
    !Array.isArray(grant.requestedCapabilities) ||
    grant.requestedCapabilities.length > 32 ||
    grant.requestedCapabilities.some((item) => !identifier(item)) ||
    [...(grant.requestedCapabilities as string[])].sort().join("\u0000") !==
      (grant.requestedCapabilities as string[]).join("\u0000") ||
    new Set(grant.requestedCapabilities).size !==
      grant.requestedCapabilities.length ||
    typeof grant.resource !== "string" ||
    !grant.resource ||
    utf8ByteLength(grant.resource) > 2_048 ||
    !identifier(grant.toolId) ||
    !identifier(grant.toolVersion)
  )
    throw new PortableAuthorityError("ACTION_GRANT_INVALID");
  return Object.freeze({
    actionId: grant.actionId,
    attemptId: grant.attemptId,
    callId: grant.callId,
    catalogDigest: grant.catalogDigest,
    deadlineAt: grant.deadlineAt,
    executionId: grant.executionId,
    ...(grant.gateReceipt === undefined
      ? {}
      : { gateReceipt: decodeGate(grant.gateReceipt) }),
    generation: grant.generation as number,
    grantId: grant.grantId,
    inputDigest: grant.inputDigest,
    requestDigest: grant.requestDigest,
    requestedCapabilities: Object.freeze([
      ...(grant.requestedCapabilities as string[]),
    ]),
    resource: grant.resource,
    schemaVersion: 1,
    toolId: grant.toolId,
    toolVersion: grant.toolVersion,
  });
};

export const createActionGrant = async (
  input: ActionGrantInput,
  sha256: Sha256,
): Promise<ActionGrant> => {
  const base = {
    actionId: input.actionId,
    attemptId: input.attemptId,
    callId: input.callId,
    catalogDigest: input.catalogDigest,
    deadlineAt: input.deadlineAt,
    executionId: input.executionId,
    ...(input.gateReceipt === undefined
      ? {}
      : { gateReceipt: input.gateReceipt }),
    generation: input.generation,
    inputDigest: input.inputDigest,
    requestDigest: input.requestDigest,
    requestedCapabilities: [...input.requestedCapabilities],
    resource: input.resource,
    schemaVersion: 1 as const,
    toolId: input.toolId,
    toolVersion: input.toolVersion,
  };
  const grantId = await sha256(canonicalJson(base));
  return validateActionGrant({ ...base, grantId });
};

export const verifyActionGrant = async (
  value: unknown,
  sha256: Sha256,
  now: number,
): Promise<ActionGrant> => {
  const grant = validateActionGrant(value);
  const { grantId: _, ...base } = grant;
  if (
    (await sha256(canonicalJson(base))) !== grant.grantId ||
    Date.parse(grant.deadlineAt) <= now
  )
    throw new PortableAuthorityError("ACTION_GRANT_STALE");
  return grant;
};

export const createToolRequestDigest = (
  toolId: string,
  toolVersion: string,
  input: unknown,
  sha256: Sha256,
): Promise<string> =>
  sha256(canonicalJson({ input, toolId, toolVersion }));
