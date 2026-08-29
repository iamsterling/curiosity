import { utf8ByteLength } from "./canonical-json.js";
import { PortableAuthorityError } from "./domain.js";

export const memoryKinds = [
  "commitment",
  "decision",
  "fact",
  "preference",
  "project-summary",
] as const;
export const memorySensitivities = [
  "ordinary",
  "private",
  "restricted",
] as const;
export const memoryRetentions = ["session", "bounded", "durable"] as const;
export const memoryOperations = [
  "create",
  "retain",
  "supersede",
  "suggest-retire",
] as const;

export type MemoryKind = (typeof memoryKinds)[number];
export type MemorySensitivity = (typeof memorySensitivities)[number];
export type MemoryRetention = (typeof memoryRetentions)[number];
export type MemoryOperation = (typeof memoryOperations)[number];

export interface ObservedMemoryVersion {
  readonly memoryId: string;
  readonly version: number;
}

export interface MemoryProposal {
  readonly confidence: number;
  readonly content: string;
  readonly kind: MemoryKind;
  readonly observedMemory?: ObservedMemoryVersion;
  readonly operation: MemoryOperation;
  readonly proposedRetention: MemoryRetention;
  readonly proposedSensitivity: MemorySensitivity;
  readonly sourceMessageIds: readonly string[];
}

export interface ActiveMemory {
  readonly content: string;
  readonly contentDigest: string;
  readonly jobId: string;
  readonly kind: MemoryKind;
  readonly memoryId: string;
  readonly policyId: string;
  readonly retention: MemoryRetention;
  readonly sensitivity: MemorySensitivity;
  readonly sourceDigest: string;
  readonly sourceMessageIds: readonly string[];
  readonly version: number;
}

const maximumProposals = 8;
const maximumContentBytes = 4_096;
const maximumSourceMessages = 16;
const identifierPattern = /^[a-zA-Z0-9][a-zA-Z0-9._:/-]{0,255}$/u;
const digestPattern = /^[a-f0-9]{64}$/u;
const proposalKeys = [
  "confidence",
  "content",
  "kind",
  "observedMemory",
  "operation",
  "proposedRetention",
  "proposedSensitivity",
  "sourceMessageIds",
] as const;

const record = (value: unknown): Record<string, unknown> | undefined =>
  value &&
  typeof value === "object" &&
  !Array.isArray(value) &&
  Object.getPrototypeOf(value) === Object.prototype
    ? (value as Record<string, unknown>)
    : undefined;

const exactKeys = (
  value: Record<string, unknown>,
  allowed: readonly string[],
  required: readonly string[],
): boolean => {
  const keys = Object.keys(value);
  return (
    keys.every((key) => allowed.includes(key)) &&
    required.every((key) => keys.includes(key))
  );
};

export const memoryIdentifier = (value: unknown): value is string =>
  typeof value === "string" && identifierPattern.test(value);

export const normalizeMemoryContent = (value: string): string =>
  value.normalize("NFC").trim().replace(/\s+/gu, " ");

export const validateActiveMemory = (value: unknown): ActiveMemory => {
  const item = record(value);
  if (
    !item ||
    Object.keys(item).sort().join(",") !==
      "content,contentDigest,jobId,kind,memoryId,policyId,retention,sensitivity,sourceDigest,sourceMessageIds,version" ||
    typeof item.content !== "string" ||
    !normalizeMemoryContent(item.content) ||
    normalizeMemoryContent(item.content) !== item.content ||
    utf8ByteLength(item.content) > maximumContentBytes ||
    typeof item.contentDigest !== "string" ||
    !digestPattern.test(item.contentDigest) ||
    !memoryIdentifier(item.jobId) ||
    !memoryKinds.includes(item.kind as MemoryKind) ||
    !memoryIdentifier(item.memoryId) ||
    !memoryIdentifier(item.policyId) ||
    !memoryRetentions.includes(item.retention as MemoryRetention) ||
    !memorySensitivities.includes(item.sensitivity as MemorySensitivity) ||
    typeof item.sourceDigest !== "string" ||
    !digestPattern.test(item.sourceDigest) ||
    !Array.isArray(item.sourceMessageIds) ||
    item.sourceMessageIds.length < 1 ||
    item.sourceMessageIds.length > maximumSourceMessages ||
    item.sourceMessageIds.some((id) => !memoryIdentifier(id)) ||
    new Set(item.sourceMessageIds).size !== item.sourceMessageIds.length ||
    !Number.isSafeInteger(item.version) ||
    (item.version as number) < 1
  )
    throw new PortableAuthorityError("MEMORY_RECORD_INVALID");
  return Object.freeze({
    content: item.content,
    contentDigest: item.contentDigest,
    jobId: item.jobId,
    kind: item.kind as MemoryKind,
    memoryId: item.memoryId,
    policyId: item.policyId,
    retention: item.retention as MemoryRetention,
    sensitivity: item.sensitivity as MemorySensitivity,
    sourceDigest: item.sourceDigest,
    sourceMessageIds: Object.freeze([...(item.sourceMessageIds as string[])]),
    version: item.version as number,
  });
};

const decodeObserved = (value: unknown): ObservedMemoryVersion | undefined => {
  if (value === undefined) return undefined;
  const observed = record(value);
  if (
    !observed ||
    Object.keys(observed).sort().join(",") !== "memoryId,version" ||
    !memoryIdentifier(observed.memoryId) ||
    !Number.isSafeInteger(observed.version) ||
    (observed.version as number) < 1
  )
    throw new PortableAuthorityError("MEMORY_OBSERVED_VERSION_INVALID");
  return Object.freeze({
    memoryId: observed.memoryId,
    version: observed.version as number,
  });
};

const decodeProposal = (value: unknown): MemoryProposal => {
  const proposal = record(value);
  const required = proposalKeys.filter((key) => key !== "observedMemory");
  if (
    !proposal ||
    !exactKeys(proposal, proposalKeys, required) ||
    typeof proposal.confidence !== "number" ||
    !Number.isFinite(proposal.confidence) ||
    proposal.confidence < 0 ||
    proposal.confidence > 1 ||
    typeof proposal.content !== "string" ||
    !normalizeMemoryContent(proposal.content) ||
    utf8ByteLength(proposal.content) > maximumContentBytes ||
    !memoryKinds.includes(proposal.kind as MemoryKind) ||
    !memoryOperations.includes(proposal.operation as MemoryOperation) ||
    !memoryRetentions.includes(proposal.proposedRetention as MemoryRetention) ||
    !memorySensitivities.includes(
      proposal.proposedSensitivity as MemorySensitivity,
    ) ||
    !Array.isArray(proposal.sourceMessageIds) ||
    proposal.sourceMessageIds.length < 1 ||
    proposal.sourceMessageIds.length > maximumSourceMessages ||
    proposal.sourceMessageIds.some((id) => !memoryIdentifier(id)) ||
    new Set(proposal.sourceMessageIds).size !==
      proposal.sourceMessageIds.length
  )
    throw new PortableAuthorityError("MEMORY_PROPOSAL_INVALID");
  const observedMemory = decodeObserved(proposal.observedMemory);
  if (
    (proposal.operation === "create" && observedMemory) ||
    (proposal.operation !== "create" && !observedMemory)
  )
    throw new PortableAuthorityError("MEMORY_OBSERVED_VERSION_REQUIRED");
  return Object.freeze({
    confidence: proposal.confidence,
    content: normalizeMemoryContent(proposal.content),
    kind: proposal.kind as MemoryKind,
    ...(observedMemory ? { observedMemory } : {}),
    operation: proposal.operation as MemoryOperation,
    proposedRetention: proposal.proposedRetention as MemoryRetention,
    proposedSensitivity: proposal.proposedSensitivity as MemorySensitivity,
    sourceMessageIds: Object.freeze([...(proposal.sourceMessageIds as string[])]),
  });
};

export const decodeMemoryProposals = (
  value: unknown,
): readonly MemoryProposal[] => {
  if (!Array.isArray(value) || value.length > maximumProposals)
    throw new PortableAuthorityError("MEMORY_PROPOSALS_INVALID");
  return Object.freeze(value.map(decodeProposal));
};
