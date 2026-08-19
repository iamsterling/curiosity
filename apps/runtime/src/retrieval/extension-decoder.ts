import { RETRIEVAL_LIMITS, type ExtensionValue, type NamespacedExtensions } from "./contracts.js";
import { validHttpUrl } from "./validation.js";

type ExtensionBudget = { bytes: number; nodes: number };
type SchemaDecoder = (input: unknown, budget: ExtensionBudget) => ExtensionValue;

const fail = (): never => { throw new Error("RETRIEVAL_CONTRACT_INVALID"); };
const consume = (budget: ExtensionBudget, bytes: number, node = false): void => {
  budget.bytes += bytes;
  if (node) budget.nodes += 1;
  if (budget.bytes > RETRIEVAL_LIMITS.extensionBytes || budget.nodes > RETRIEVAL_LIMITS.extensionNodes) fail();
};
const record = (input: unknown): Record<string, unknown> => {
  if (typeof input !== "object" || input === null || Array.isArray(input) || Object.getPrototypeOf(input) !== Object.prototype) return fail();
  return input as Record<string, unknown>;
};
const exact = (value: Record<string, unknown>, allowed: readonly string[], required: readonly string[]): void => {
  if (Reflect.ownKeys(value).some((key) => typeof key !== "string" || !allowed.includes(key)) || required.some((key) => !Object.hasOwn(value, key))) fail();
};
const sensitive = (value: string): boolean =>
  /(?:^|[^a-z0-9])(?:secret|sentinel|credential|token|authorization|password|cookie|api[-_. ]?key)(?:[^a-z0-9]|$)/iu.test(value) ||
  /^(?:ACTIVE|PENDING|DISPUTED|QUARANTINED|REJECTED|ALLOW|DENY|ELIGIBLE|SUPPRESSED|CURRENT|STALE|REVOKED|LIVE|TOMBSTONED|ERASURE_PENDING|ERASED)$/u.test(value);
const stringValue = (input: unknown, maximum: number, budget: ExtensionBudget): string => {
  if (typeof input !== "string" || input.length < 1 || Buffer.byteLength(input) > maximum || /[\u0000-\u001f\u007f]/u.test(input) || sensitive(input)) return fail();
  consume(budget, Buffer.byteLength(input), true);
  return input;
};
const integerValue = (input: unknown, budget: ExtensionBudget): number => {
  if (!Number.isSafeInteger(input)) return fail();
  consume(budget, Buffer.byteLength(String(input)), true);
  return input as number;
};
const field = (name: string, budget: ExtensionBudget): void => consume(budget, Buffer.byteLength(name));
const schemaObject = (input: unknown, allowed: readonly string[], required: readonly string[], budget: ExtensionBudget): Record<string, unknown> => {
  const value = record(input);
  exact(value, allowed, required);
  consume(budget, 0, true);
  return value;
};

const m2: SchemaDecoder = (input, budget) => {
  const allowed = ["documentId", "version", "sourceUrl", "snapshotId", "analyzerVersion", "score"];
  const value = schemaObject(input, allowed, ["documentId", "version", "sourceUrl"], budget);
  const output: Record<string, ExtensionValue> = {};
  for (const key of allowed) if (Object.hasOwn(value, key)) {
    field(key, budget);
    if (key === "score") output[key] = integerValue(value[key], budget);
    else output[key] = stringValue(value[key], key === "sourceUrl" ? RETRIEVAL_LIMITS.locator : RETRIEVAL_LIMITS.id, budget);
  }
  if (!validHttpUrl(output.sourceUrl as string)) fail();
  return output;
};

const m6: SchemaDecoder = (input, budget) => {
  const allowed = ["documentId", "snapshotId", "captureId", "citation", "score"];
  const value = schemaObject(input, allowed, ["documentId", "snapshotId", "captureId", "citation"], budget);
  const output: Record<string, ExtensionValue> = {};
  for (const key of ["documentId", "snapshotId", "captureId"] as const) { field(key, budget); output[key] = stringValue(value[key], RETRIEVAL_LIMITS.id, budget); }
  field("citation", budget);
  const citation = schemaObject(value.citation, ["captureId", "url", "sha256"], ["captureId", "url", "sha256"], budget);
  const decodedCitation: Record<string, ExtensionValue> = {};
  for (const key of ["captureId", "url", "sha256"] as const) { field(key, budget); decodedCitation[key] = stringValue(citation[key], key === "url" ? RETRIEVAL_LIMITS.locator : RETRIEVAL_LIMITS.id, budget); }
  if (decodedCitation.captureId !== output.captureId || !validHttpUrl(decodedCitation.url as string) || !/^[a-f0-9]{64}$/u.test(decodedCitation.sha256 as string)) fail();
  output.citation = decodedCitation;
  if (Object.hasOwn(value, "score")) { field("score", budget); output.score = integerValue(value.score, budget); }
  return output;
};

const flatSchema = (allowed: readonly string[], required: readonly string[], digests: readonly string[] = []): SchemaDecoder => (input, budget) => {
  const value = schemaObject(input, allowed, required, budget);
  const output: Record<string, ExtensionValue> = {};
  for (const key of allowed) if (Object.hasOwn(value, key)) {
    field(key, budget);
    output[key] = typeof value[key] === "number" ? integerValue(value[key], budget) : stringValue(value[key], RETRIEVAL_LIMITS.id, budget);
    if (digests.includes(key) && !/^[a-f0-9]{64}$/u.test(output[key] as string)) fail();
  }
  return output;
};

const SCHEMAS = new Map<string, SchemaDecoder>([
  ["org.curiosity.legacy.m2/v1", m2],
  ["org.curiosity.legacy.m6/v1", m6],
  ["org.curiosity.legacy.event_capture/v1", flatSchema(["eventId", "payloadDigest", "watermark", "taint"], ["eventId", "payloadDigest"], ["payloadDigest"])],
  ["org.curiosity.legacy.ledger_v1/v1", flatSchema(["entityType", "id", "outputDigest"], ["entityType", "id", "outputDigest"], ["outputDigest"])],
  ["org.curiosity.legacy.development_evidence/v1", flatSchema(["captureId", "representationId", "spanId"], ["captureId", "representationId", "spanId"])],
]);
const DANGEROUS_NAMESPACES = new Set(["constructor", "toString", "__proto__"]);

export const newExtensionBudget = (): ExtensionBudget => ({ bytes: 0, nodes: 0 });
export const allowedExtensionNamespace = (value: string): boolean => !DANGEROUS_NAMESPACES.has(value) && SCHEMAS.has(value);

export const decodeExtensions = (input: unknown, budget: ExtensionBudget): NamespacedExtensions => {
  const value = record(input);
  consume(budget, 0, true);
  const ownKeys = Reflect.ownKeys(value);
  if (ownKeys.some((key) => typeof key !== "string") || ownKeys.length > RETRIEVAL_LIMITS.extensions) return fail();
  return Object.fromEntries(Object.entries(value).map(([namespace, item]) => {
    if (!allowedExtensionNamespace(namespace)) return fail();
    const decoder = SCHEMAS.get(namespace)!;
    consume(budget, Buffer.byteLength(namespace));
    return [namespace, decoder(item, budget)];
  })) as NamespacedExtensions;
};
