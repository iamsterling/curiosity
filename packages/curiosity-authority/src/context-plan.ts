import { canonicalJson, utf8ByteLength } from "./canonical-json.js";
import { PortableAuthorityError, type Sha256 } from "./domain.js";

export const contextBlockKinds = [
  "agent-policy",
  "conversation",
  "memory",
  "tool-evidence",
  "workflow",
  "kernel-notice",
] as const;

export type ContextBlockKind = (typeof contextBlockKinds)[number];
export type ContextBlockProvenance =
  | "trusted-durable"
  | "untrusted-evidence";

export interface ContextBlockInput {
  readonly blockId: string;
  readonly content: string;
  readonly kind: ContextBlockKind;
  readonly provenance: ContextBlockProvenance;
  readonly sourceEventIds: readonly string[];
}

export interface ContextBlock extends ContextBlockInput {
  readonly contentDigest: string;
}

export interface ContextPlan {
  readonly blocks: readonly ContextBlock[];
  readonly contextPlanId: string;
  readonly estimatedTokens: number;
  readonly policyId: string;
  readonly schemaVersion: 1;
  readonly utf8Bytes: number;
}

const maximumBlocks = 32;
const maximumBlockBytes = 64 * 1_024;
const maximumPlanBytes = 1_048_576;
const maximumSourceEvents = 64;
const identifierPattern = /^[a-zA-Z0-9][a-zA-Z0-9._:/-]{0,255}$/u;
const digestPattern = /^[a-f0-9]{64}$/u;
const blockKeys = [
  "blockId",
  "content",
  "contentDigest",
  "kind",
  "provenance",
  "sourceEventIds",
] as const;
const planKeys = [
  "blocks",
  "contextPlanId",
  "estimatedTokens",
  "policyId",
  "schemaVersion",
  "utf8Bytes",
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
  keys: readonly string[],
): boolean => Object.keys(value).sort().join(",") === [...keys].sort().join(",");

const identifier = (value: unknown): value is string =>
  typeof value === "string" && identifierPattern.test(value);

const validateBlock = (value: unknown): ContextBlock => {
  const block = record(value);
  if (
    !block ||
    !exactKeys(block, blockKeys) ||
    !identifier(block.blockId) ||
    typeof block.content !== "string" ||
    utf8ByteLength(block.content) > maximumBlockBytes ||
    typeof block.contentDigest !== "string" ||
    !digestPattern.test(block.contentDigest) ||
    !contextBlockKinds.includes(block.kind as ContextBlockKind) ||
    (block.provenance !== "trusted-durable" &&
      block.provenance !== "untrusted-evidence") ||
    !Array.isArray(block.sourceEventIds) ||
    block.sourceEventIds.length > maximumSourceEvents ||
    block.sourceEventIds.some((eventId) => !identifier(eventId)) ||
    new Set(block.sourceEventIds).size !== block.sourceEventIds.length
  )
    throw new PortableAuthorityError("CONTEXT_BLOCK_INVALID");
  return Object.freeze({
    blockId: block.blockId,
    content: block.content,
    contentDigest: block.contentDigest,
    kind: block.kind as ContextBlockKind,
    provenance: block.provenance,
    sourceEventIds: Object.freeze([...(block.sourceEventIds as string[])]),
  });
};

export const validateContextPlan = (value: unknown): ContextPlan => {
  const plan = record(value);
  if (
    !plan ||
    !exactKeys(plan, planKeys) ||
    !Array.isArray(plan.blocks) ||
    plan.blocks.length > maximumBlocks ||
    typeof plan.contextPlanId !== "string" ||
    !digestPattern.test(plan.contextPlanId) ||
    !Number.isSafeInteger(plan.estimatedTokens) ||
    (plan.estimatedTokens as number) < 0 ||
    !identifier(plan.policyId) ||
    plan.schemaVersion !== 1 ||
    !Number.isSafeInteger(plan.utf8Bytes) ||
    (plan.utf8Bytes as number) < 0
  )
    throw new PortableAuthorityError("CONTEXT_PLAN_INVALID");
  const blocks = plan.blocks.map(validateBlock);
  if (new Set(blocks.map(({ blockId }) => blockId)).size !== blocks.length)
    throw new PortableAuthorityError("CONTEXT_BLOCK_ID_DUPLICATE");
  const utf8Bytes = blocks.reduce(
    (total, block) => total + utf8ByteLength(block.content),
    0,
  );
  if (
    utf8Bytes !== plan.utf8Bytes ||
    utf8Bytes > maximumPlanBytes ||
    plan.estimatedTokens !== Math.ceil(utf8Bytes / 3)
  )
    throw new PortableAuthorityError("CONTEXT_PLAN_SIZE_INVALID");
  return Object.freeze({
    blocks: Object.freeze(blocks),
    contextPlanId: plan.contextPlanId,
    estimatedTokens: plan.estimatedTokens as number,
    policyId: plan.policyId,
    schemaVersion: 1,
    utf8Bytes,
  });
};

export const createContextPlan = async (
  inputs: readonly ContextBlockInput[],
  policyId: string,
  sha256: Sha256,
): Promise<ContextPlan> => {
  if (!identifier(policyId) || inputs.length > maximumBlocks)
    throw new PortableAuthorityError("CONTEXT_PLAN_INVALID");
  const blocks: ContextBlock[] = [];
  for (const input of inputs) {
    const contentDigest = await sha256(input.content);
    blocks.push(validateBlock({ ...input, contentDigest }));
  }
  const utf8Bytes = blocks.reduce(
    (total, block) => total + utf8ByteLength(block.content),
    0,
  );
  const estimatedTokens = Math.ceil(utf8Bytes / 3);
  const contextPlanId = await sha256(
    canonicalJson({
      blocks,
      estimatedTokens,
      policyId,
      schemaVersion: 1,
      utf8Bytes,
    }),
  );
  return validateContextPlan({
    blocks,
    contextPlanId,
    estimatedTokens,
    policyId,
    schemaVersion: 1,
    utf8Bytes,
  });
};

export const verifyContextPlan = async (
  value: unknown,
  sha256: Sha256,
): Promise<ContextPlan> => {
  const plan = validateContextPlan(value);
  for (const block of plan.blocks) {
    if ((await sha256(block.content)) !== block.contentDigest)
      throw new PortableAuthorityError("CONTEXT_BLOCK_DIGEST_MISMATCH");
  }
  const contextPlanId = await sha256(
    canonicalJson({
      blocks: plan.blocks,
      estimatedTokens: plan.estimatedTokens,
      policyId: plan.policyId,
      schemaVersion: 1,
      utf8Bytes: plan.utf8Bytes,
    }),
  );
  if (contextPlanId !== plan.contextPlanId)
    throw new PortableAuthorityError("CONTEXT_PLAN_DIGEST_MISMATCH");
  return plan;
};
