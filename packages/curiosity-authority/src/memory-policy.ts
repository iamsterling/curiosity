import { canonicalJson } from "./canonical-json.js";
import {
  PortableAuthorityError,
  type ProposedEvent,
  type Sha256,
} from "./domain.js";
import {
  decodeMemoryProposals,
  memoryIdentifier,
  memoryKinds,
  memoryRetentions,
  memorySensitivities,
  normalizeMemoryContent,
  validateActiveMemory,
  type ActiveMemory,
  type MemoryKind,
  type MemoryProposal,
  type MemoryRetention,
  type MemorySensitivity,
} from "./memory-domain.js";

export interface MemoryAdmissionPolicy {
  readonly autoAdmitSensitivities: readonly MemorySensitivity[];
  readonly policyId: string;
  readonly retentionBySensitivity: Readonly<
    Record<MemorySensitivity, readonly MemoryRetention[]>
  >;
  readonly reviewSensitivities: readonly MemorySensitivity[];
  readonly sensitivityFloorByKind: Readonly<
    Record<MemoryKind, MemorySensitivity>
  >;
}

export type MemoryPolicyDecision =
  | { readonly kind: "admitted"; readonly memoryId: string; readonly version: number }
  | { readonly kind: "retained"; readonly memoryId: string; readonly version: number }
  | { readonly code: string; readonly kind: "rejected" }
  | { readonly kind: "review"; readonly reviewId: string };

export interface MemoryPolicyResult {
  readonly decisions: readonly MemoryPolicyDecision[];
  readonly events: readonly ProposedEvent[];
  readonly proposalDigest: string;
}

export interface EvaluateMemoryProposalsInput {
  readonly activeMemories: readonly ActiveMemory[];
  readonly jobId: string;
  readonly policy: MemoryAdmissionPolicy;
  readonly proposals: readonly MemoryProposal[];
  readonly sourceDigest: string;
  readonly sourceMessageIds: readonly string[];
}

const digestPattern = /^[a-f0-9]{64}$/u;
const policyKeys = [
  "autoAdmitSensitivities",
  "policyId",
  "retentionBySensitivity",
  "reviewSensitivities",
  "sensitivityFloorByKind",
] as const;
const sensitivityRank: Readonly<Record<MemorySensitivity, number>> = {
  ordinary: 0,
  private: 1,
  restricted: 2,
};
const secretPatterns = [
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/iu,
  /\b(?:api[_-]?key|password|secret|token)\s*[:=]\s*\S+/iu,
  /\bBearer\s+[a-z0-9._~-]{12,}/iu,
  /\bsk-[a-z0-9_-]{16,}/iu,
] as const;
const privatePatterns = [
  /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/iu,
  /\+?\d[\d ()-]{7,}\d/u,
] as const;

const uniqueEnums = <T extends string>(
  values: readonly T[],
  allowed: readonly T[],
): boolean =>
  new Set(values).size === values.length &&
  values.every((value) => allowed.includes(value));

export const validateMemoryAdmissionPolicy = (
  value: unknown,
): void => {
  const policy =
    value && typeof value === "object" && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : undefined;
  const retention =
    policy?.retentionBySensitivity &&
    typeof policy.retentionBySensitivity === "object" &&
    !Array.isArray(policy.retentionBySensitivity)
      ? (policy.retentionBySensitivity as Record<string, unknown>)
      : undefined;
  const floors =
    policy?.sensitivityFloorByKind &&
    typeof policy.sensitivityFloorByKind === "object" &&
    !Array.isArray(policy.sensitivityFloorByKind)
      ? (policy.sensitivityFloorByKind as Record<string, unknown>)
      : undefined;
  if (
    !policy ||
    Object.keys(policy).sort().join(",") !== [...policyKeys].sort().join(",") ||
    !memoryIdentifier(policy.policyId) ||
    !Array.isArray(policy.autoAdmitSensitivities) ||
    !uniqueEnums(
      policy.autoAdmitSensitivities as MemorySensitivity[],
      memorySensitivities,
    ) ||
    !Array.isArray(policy.reviewSensitivities) ||
    !uniqueEnums(
      policy.reviewSensitivities as MemorySensitivity[],
      memorySensitivities,
    ) ||
    (policy.autoAdmitSensitivities as MemorySensitivity[]).some((sensitivity) =>
      (policy.reviewSensitivities as MemorySensitivity[]).includes(sensitivity),
    ) ||
    !retention ||
    Object.keys(retention).sort().join(",") !==
      [...memorySensitivities].sort().join(",") ||
    memorySensitivities.some(
      (sensitivity) =>
        !Array.isArray(retention[sensitivity]) ||
        !uniqueEnums(
          retention[sensitivity] as MemoryRetention[],
          memoryRetentions,
        ),
    ) ||
    !floors ||
    Object.keys(floors).sort().join(",") !== [...memoryKinds].sort().join(",") ||
    memoryKinds.some(
      (kind) =>
        !memorySensitivities.includes(floors[kind] as MemorySensitivity),
    )
  )
    throw new PortableAuthorityError("MEMORY_POLICY_INVALID");
};

export const freezeMemoryAdmissionPolicy = (
  value: unknown,
): MemoryAdmissionPolicy => {
  validateMemoryAdmissionPolicy(value);
  const policy = value as MemoryAdmissionPolicy;
  return Object.freeze({
    autoAdmitSensitivities: Object.freeze([
      ...policy.autoAdmitSensitivities,
    ]),
    policyId: policy.policyId,
    retentionBySensitivity: Object.freeze({
      ordinary: Object.freeze([...policy.retentionBySensitivity.ordinary]),
      private: Object.freeze([...policy.retentionBySensitivity.private]),
      restricted: Object.freeze([
        ...policy.retentionBySensitivity.restricted,
      ]),
    }),
    reviewSensitivities: Object.freeze([...policy.reviewSensitivities]),
    sensitivityFloorByKind: Object.freeze({
      commitment: policy.sensitivityFloorByKind.commitment,
      decision: policy.sensitivityFloorByKind.decision,
      fact: policy.sensitivityFloorByKind.fact,
      preference: policy.sensitivityFloorByKind.preference,
      "project-summary": policy.sensitivityFloorByKind["project-summary"],
    }),
  });
};

export const memoryContentIsSecretLike = (content: string): boolean =>
  secretPatterns.some((pattern) => pattern.test(content));

const sensitivity = (
  proposal: MemoryProposal,
  policy: MemoryAdmissionPolicy,
): MemorySensitivity => {
  const candidates = [
    proposal.proposedSensitivity,
    policy.sensitivityFloorByKind[proposal.kind],
    ...(privatePatterns.some((pattern) => pattern.test(proposal.content))
      ? (["private"] as const)
      : []),
  ];
  return candidates.reduce((highest, candidate) =>
    sensitivityRank[candidate] > sensitivityRank[highest] ? candidate : highest,
  );
};

const activeVersion = (
  proposal: MemoryProposal,
  activeById: ReadonlyMap<string, ActiveMemory>,
): ActiveMemory | undefined => {
  if (!proposal.observedMemory) return undefined;
  const active = activeById.get(proposal.observedMemory.memoryId);
  if (!active || active.version !== proposal.observedMemory.version)
    return undefined;
  return active;
};

const memoryRecord = (input: {
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
}): ActiveMemory => Object.freeze({ ...input });

export const evaluateMemoryProposals = async (
  input: EvaluateMemoryProposalsInput,
  sha256: Sha256,
): Promise<MemoryPolicyResult> => {
  validateMemoryAdmissionPolicy(input.policy);
  if (
    !memoryIdentifier(input.jobId) ||
    !digestPattern.test(input.sourceDigest) ||
    input.sourceMessageIds.length < 1 ||
    new Set(input.sourceMessageIds).size !== input.sourceMessageIds.length ||
    input.sourceMessageIds.some((id) => !memoryIdentifier(id))
  )
    throw new PortableAuthorityError("MEMORY_CURATION_JOB_INVALID");
  const proposals = decodeMemoryProposals(input.proposals);
  const proposalDigest = await sha256(canonicalJson(proposals));
  if (!digestPattern.test(proposalDigest))
    throw new PortableAuthorityError("MEMORY_PROPOSAL_DIGEST_INVALID");
  const activeMemories = input.activeMemories.map(validateActiveMemory);
  if (
    new Set(activeMemories.map(({ memoryId }) => memoryId)).size !==
    activeMemories.length
  )
    throw new PortableAuthorityError("MEMORY_ACTIVE_SET_INVALID");
  const activeById = new Map(
    activeMemories.map((memory) => [memory.memoryId, memory]),
  );
  const knownDigests = new Set(
    activeMemories.map(({ contentDigest }) => contentDigest),
  );
  const sourceIds = new Set(input.sourceMessageIds);
  const decisions: MemoryPolicyDecision[] = [];
  const events: ProposedEvent[] = [];

  for (const [proposalIndex, proposal] of proposals.entries()) {
    if (proposal.sourceMessageIds.some((id) => !sourceIds.has(id))) {
      decisions.push({ code: "MEMORY_SOURCE_UNKNOWN", kind: "rejected" });
      continue;
    }
    if (memoryContentIsSecretLike(proposal.content)) {
      decisions.push({ code: "MEMORY_SECRET_LIKE", kind: "rejected" });
      continue;
    }
    const observed = activeVersion(proposal, activeById);
    if (proposal.operation !== "create" && !observed) {
      decisions.push({ code: "MEMORY_VERSION_STALE", kind: "rejected" });
      continue;
    }
    const content = normalizeMemoryContent(proposal.content);
    const contentDigest = await sha256(content.toLowerCase());
    if (
      (proposal.operation === "create" || proposal.operation === "supersede") &&
      knownDigests.has(contentDigest)
    ) {
      decisions.push({ code: "MEMORY_DUPLICATE", kind: "rejected" });
      continue;
    }
    if (
      proposal.operation === "retain" &&
      observed?.contentDigest !== contentDigest
    ) {
      decisions.push({ code: "MEMORY_RETAIN_CONTENT_MISMATCH", kind: "rejected" });
      continue;
    }
    if (proposal.operation === "retain") {
      decisions.push({
        kind: "retained",
        memoryId: observed!.memoryId,
        version: observed!.version,
      });
      continue;
    }
    if (proposal.operation === "suggest-retire") {
      const reviewId = `memory-review:${await sha256(
        canonicalJson({
          jobId: input.jobId,
          memoryId: observed!.memoryId,
          observedVersion: observed!.version,
          proposalIndex,
        }),
      )}`;
      events.push({
        body: {
          jobId: input.jobId,
          memoryId: observed!.memoryId,
          observedVersion: observed!.version,
          operation: "suggest-retire",
          policyId: input.policy.policyId,
          proposalIndex,
          reviewId,
          schemaVersion: 1,
        },
        streamId: reviewId,
        type: "memory.review.requested",
      });
      decisions.push({ kind: "review", reviewId });
      continue;
    }
    const effectiveSensitivity = sensitivity(proposal, input.policy);
    if (
      !input.policy.retentionBySensitivity[effectiveSensitivity].includes(
        proposal.proposedRetention,
      )
    ) {
      decisions.push({ code: "MEMORY_RETENTION_DENIED", kind: "rejected" });
      continue;
    }
    const memoryId =
      observed?.memoryId ??
      `memory:${await sha256(
        canonicalJson({ contentDigest, jobId: input.jobId, proposalIndex }),
      )}`;
    const version = observed ? observed.version + 1 : 1;
    const memory = memoryRecord({
      content,
      contentDigest,
      jobId: input.jobId,
      kind: proposal.kind,
      memoryId,
      policyId: input.policy.policyId,
      retention: proposal.proposedRetention,
      sensitivity: effectiveSensitivity,
      sourceDigest: input.sourceDigest,
      sourceMessageIds: proposal.sourceMessageIds,
      version,
    });
    const requiresReview =
      input.policy.reviewSensitivities.includes(effectiveSensitivity);
    if (requiresReview) {
      const reviewId = `memory-review:${await sha256(
        canonicalJson({ jobId: input.jobId, memory, proposalIndex }),
      )}`;
      events.push({
        body: {
          candidate: memory,
          jobId: input.jobId,
          operation: proposal.operation,
          policyId: input.policy.policyId,
          proposalIndex,
          reviewId,
          schemaVersion: 1,
        },
        streamId: reviewId,
        type: "memory.review.requested",
      });
      decisions.push({ kind: "review", reviewId });
      continue;
    }
    if (!input.policy.autoAdmitSensitivities.includes(effectiveSensitivity)) {
      decisions.push({ code: "MEMORY_SENSITIVITY_DENIED", kind: "rejected" });
      continue;
    }
    events.push({
      body:
        proposal.operation === "supersede"
          ? {
              memory,
              previousVersion: observed!.version,
              schemaVersion: 1,
            }
          : { memory, schemaVersion: 1 },
      streamId: memoryId,
      type:
        proposal.operation === "supersede"
          ? "memory.superseded"
          : "memory.recorded",
    });
    knownDigests.add(contentDigest);
    activeById.set(memoryId, memory);
    decisions.push({ kind: "admitted", memoryId, version });
  }
  return Object.freeze({
    decisions: Object.freeze(decisions),
    events: Object.freeze(events),
    proposalDigest,
  });
};
