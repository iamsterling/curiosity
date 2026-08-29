import { canonicalJson } from "./canonical-json.js";
import {
  PortableAuthorityError,
  type ProposedEvent,
  type Sha256,
} from "./domain.js";
import {
  decodeMemoryProposals,
  memoryIdentifier,
  type ActiveMemory,
  type MemoryProposal,
} from "./memory-domain.js";
import type { GenerationRouteReceipt } from "./generation-route.js";
import type {
  MemoryPolicyDecision,
  MemoryPolicyResult,
} from "./memory-policy.js";

export interface MemoryCurationJob {
  readonly jobId: string;
  readonly policyId: string;
  readonly sourceDigest: string;
  readonly sourceMessageIds: readonly string[];
  readonly sourceTurnId: string;
}

export interface MemoryCurationResult {
  readonly jobId: string;
  readonly policyId: string;
  readonly proposals: readonly MemoryProposal[];
  readonly sourceDigest: string;
}

export interface MemoryCurationSourceMessage {
  readonly content: string;
  readonly messageId: string;
  readonly role: "assistant" | "user";
}

export interface MemoryCuratorRequest {
  readonly activeMemories: readonly ActiveMemory[];
  readonly job: MemoryCurationJob;
  readonly messages: readonly MemoryCurationSourceMessage[];
  readonly route: GenerationRouteReceipt;
  readonly signal: AbortSignal;
}

export interface MemoryCuratorPort {
  readonly curate: (
    request: MemoryCuratorRequest,
  ) => Promise<MemoryCurationResult>;
}

export type MemoryCurationJobStatus =
  | "absent"
  | "requested"
  | "completed";

const digestPattern = /^[a-f0-9]{64}$/u;

const record = (value: unknown): Record<string, unknown> | undefined =>
  value &&
  typeof value === "object" &&
  !Array.isArray(value) &&
  Object.getPrototypeOf(value) === Object.prototype
    ? (value as Record<string, unknown>)
    : undefined;

const validateJobFields = (input: {
  readonly policyId: unknown;
  readonly sourceDigest: unknown;
  readonly sourceMessageIds: unknown;
  readonly sourceTurnId: unknown;
}): void => {
  if (
    !memoryIdentifier(input.policyId) ||
    typeof input.sourceDigest !== "string" ||
    !digestPattern.test(input.sourceDigest) ||
    !Array.isArray(input.sourceMessageIds) ||
    input.sourceMessageIds.length < 1 ||
    input.sourceMessageIds.length > 16 ||
    input.sourceMessageIds.some((id) => !memoryIdentifier(id)) ||
    new Set(input.sourceMessageIds).size !== input.sourceMessageIds.length ||
    !memoryIdentifier(input.sourceTurnId)
  )
    throw new PortableAuthorityError("MEMORY_CURATION_JOB_INVALID");
};

export const decodeMemoryCurationJob = (value: unknown): MemoryCurationJob => {
  const job = record(value);
  if (
    !job ||
    Object.keys(job).sort().join(",") !==
      "jobId,policyId,sourceDigest,sourceMessageIds,sourceTurnId" ||
    !memoryIdentifier(job.jobId)
  )
    throw new PortableAuthorityError("MEMORY_CURATION_JOB_INVALID");
  validateJobFields({
    policyId: job.policyId,
    sourceDigest: job.sourceDigest,
    sourceMessageIds: job.sourceMessageIds,
    sourceTurnId: job.sourceTurnId,
  });
  return Object.freeze({
    jobId: job.jobId,
    policyId: job.policyId as string,
    sourceDigest: job.sourceDigest as string,
    sourceMessageIds: Object.freeze([...(job.sourceMessageIds as string[])]),
    sourceTurnId: job.sourceTurnId as string,
  });
};

export const createMemoryCurationJob = async (
  input: Omit<MemoryCurationJob, "jobId">,
  sha256: Sha256,
): Promise<MemoryCurationJob> => {
  validateJobFields(input);
  const jobId = `memory-curation:${await sha256(
    canonicalJson({ ...input, schemaVersion: 1 }),
  )}`;
  if (!memoryIdentifier(jobId))
    throw new PortableAuthorityError("MEMORY_CURATION_JOB_INVALID");
  return Object.freeze({
    jobId,
    policyId: input.policyId,
    sourceDigest: input.sourceDigest,
    sourceMessageIds: Object.freeze([...input.sourceMessageIds]),
    sourceTurnId: input.sourceTurnId,
  });
};

export const decodeMemoryCurationResult = (
  value: unknown,
  expected: MemoryCurationJob,
): MemoryCurationResult => {
  const result = record(value);
  if (
    !result ||
    Object.keys(result).sort().join(",") !==
      "jobId,policyId,proposals,sourceDigest" ||
    !memoryIdentifier(result.jobId) ||
    !memoryIdentifier(result.policyId) ||
    typeof result.sourceDigest !== "string" ||
    !digestPattern.test(result.sourceDigest)
  )
    throw new PortableAuthorityError("MEMORY_CURATION_RESULT_INVALID");
  if (
    result.jobId !== expected.jobId ||
    result.policyId !== expected.policyId ||
    result.sourceDigest !== expected.sourceDigest
  )
    throw new PortableAuthorityError("MEMORY_CURATION_RESULT_STALE");
  return Object.freeze({
    jobId: result.jobId,
    policyId: result.policyId,
    proposals: decodeMemoryProposals(result.proposals),
    sourceDigest: result.sourceDigest,
  });
};

export const memoryCurationRequestedEvent = (
  job: MemoryCurationJob,
): ProposedEvent => ({
  body: { ...job, schemaVersion: 1 },
  streamId: job.jobId,
  type: "memory.curation.requested",
});

const decisionCounts = (
  decisions: readonly MemoryPolicyDecision[],
): Readonly<Record<MemoryPolicyDecision["kind"], number>> => ({
  admitted: decisions.filter(({ kind }) => kind === "admitted").length,
  rejected: decisions.filter(({ kind }) => kind === "rejected").length,
  retained: decisions.filter(({ kind }) => kind === "retained").length,
  review: decisions.filter(({ kind }) => kind === "review").length,
});

export const memoryCurationCompletedEvent = (
  job: MemoryCurationJob,
  result: MemoryPolicyResult,
): ProposedEvent => ({
  body: {
    counts: decisionCounts(result.decisions),
    jobId: job.jobId,
    policyId: job.policyId,
    proposalDigest: result.proposalDigest,
    schemaVersion: 1,
    sourceDigest: job.sourceDigest,
  },
  streamId: job.jobId,
  type: "memory.curation.completed",
});

export const projectMemoryCurationJobStatus = (
  events: readonly Pick<ProposedEvent, "body" | "type">[],
  jobId: string,
): MemoryCurationJobStatus => {
  let status: MemoryCurationJobStatus = "absent";
  for (const event of events) {
    if (
      event.type !== "memory.curation.requested" &&
      event.type !== "memory.curation.completed"
    )
      continue;
    const body = record(event.body);
    if (body?.jobId !== jobId) continue;
    if (event.type === "memory.curation.requested") {
      if (status !== "absent")
        throw new PortableAuthorityError("MEMORY_CURATION_EVENT_CONFLICT");
      status = "requested";
      continue;
    }
    if (status !== "requested")
      throw new PortableAuthorityError("MEMORY_CURATION_EVENT_CONFLICT");
    status = "completed";
  }
  return status;
};

export const projectMemoryCurationJob = (
  events: readonly Pick<ProposedEvent, "body" | "type">[],
  jobId: string,
): MemoryCurationJob | undefined => {
  let selected: MemoryCurationJob | undefined;
  for (const event of events) {
    if (event.type !== "memory.curation.requested") continue;
    const body = record(event.body);
    if (body?.jobId !== jobId) continue;
    const job = decodeMemoryCurationJob({
      jobId: body.jobId,
      policyId: body.policyId,
      sourceDigest: body.sourceDigest,
      sourceMessageIds: body.sourceMessageIds,
      sourceTurnId: body.sourceTurnId,
    });
    if (selected && canonicalJson(selected) !== canonicalJson(job))
      throw new PortableAuthorityError("MEMORY_CURATION_EVENT_CONFLICT");
    selected = job;
  }
  return selected;
};

export const projectMemoryCurationProposalDigest = (
  events: readonly Pick<ProposedEvent, "body" | "type">[],
  jobId: string,
): string | undefined => {
  let digest: string | undefined;
  for (const event of events) {
    if (event.type !== "memory.curation.completed") continue;
    const body = record(event.body);
    if (body?.jobId !== jobId) continue;
    if (
      typeof body.proposalDigest !== "string" ||
      !digestPattern.test(body.proposalDigest)
    )
      throw new PortableAuthorityError("MEMORY_CURATION_EVENT_INVALID");
    if (digest && digest !== body.proposalDigest)
      throw new PortableAuthorityError("MEMORY_CURATION_EVENT_CONFLICT");
    digest = body.proposalDigest;
  }
  return digest;
};
