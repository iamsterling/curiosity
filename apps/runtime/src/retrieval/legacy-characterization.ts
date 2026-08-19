import { RETRIEVAL_LIMITS, type ExtensionValue, type LegacyCharacterization } from "./contracts.js";
import { decodeExtensions, newExtensionBudget } from "./extension-decoder.js";

type LegacySourceKind = LegacyCharacterization["sourceKind"];
const fail = (): never => { throw new Error("RETRIEVAL_LEGACY_MAPPING_BLOCKED"); };
const definitions: Record<LegacySourceKind, { keys: readonly string[]; required: readonly string[]; finding: string }> = {
  M2: { keys: ["documentId", "version", "sourceUrl", "snapshotId", "analyzerVersion", "score"], required: ["documentId", "version", "sourceUrl"], finding: "LEGACY_PROJECTION_CANDIDATE" },
  M6: { keys: ["documentId", "snapshotId", "captureId", "citation", "score"], required: ["documentId", "snapshotId", "captureId", "citation"], finding: "LEGACY_ACQUISITION_LOCATOR_ONLY" },
  EVENT_CAPTURE: { keys: ["eventId", "payloadDigest", "watermark", "taint"], required: ["eventId", "payloadDigest"], finding: "DIGEST_ONLY_NO_PAYLOAD" },
  LEDGER_V1: { keys: ["entityType", "id", "outputDigest", "authority"], required: ["entityType", "id", "outputDigest", "authority"], finding: "TASK_EVIDENCE_NOT_RETRIEVED_TRUTH" },
  DEVELOPMENT_EVIDENCE: { keys: ["captureId", "representationId", "spanId", "assertion"], required: ["captureId", "representationId", "spanId", "assertion"], finding: "DEVELOPMENT_ONLY_NO_PRODUCTION_CONTINUITY" },
};

const boundedJson = (value: unknown, depth = 0): ExtensionValue => {
  if (depth > 3) return fail();
  if (value === null || typeof value === "boolean") return value;
  if (typeof value === "number") return Number.isSafeInteger(value) ? value : fail();
  if (typeof value === "string") return value.length > RETRIEVAL_LIMITS.title || /[\u0000-\u001f\u007f]/u.test(value) ? fail() : value;
  if (Array.isArray(value)) return value.length > 16 ? fail() : value.map((item) => boundedJson(item, depth + 1));
  if (typeof value !== "object" || value === null) return fail();
  const record = value as Record<string, unknown>;
  if (Object.getPrototypeOf(value) !== Object.prototype || Object.keys(record).length > 16) return fail();
  return Object.fromEntries(Object.entries(record).map(([key, item]) => {
    if (!/^[A-Za-z0-9._:-]{1,64}$/u.test(key)) return fail();
    return [key, boundedJson(item, depth + 1)];
  }));
};

export const characterizeLegacyRecord = (sourceKind: LegacySourceKind, input: unknown): LegacyCharacterization => {
  const definition = definitions[sourceKind];
  if (!definition || typeof input !== "object" || input === null || Array.isArray(input) || Object.getPrototypeOf(input) !== Object.prototype) return fail();
  const value = input as Record<string, unknown>;
  if (Reflect.ownKeys(value).some((key) => typeof key !== "string" || !definition.keys.includes(key))) return fail();
  if (definition.required.some((key) => !(key in value))) return fail();
  for (const key of definition.required) {
    const item = value[key];
    if (key === "citation") {
      if (typeof item !== "object" || item === null || Array.isArray(item)) return fail();
      continue;
    }
    if (typeof item !== "string" || item.length < 1 || Buffer.byteLength(item) > RETRIEVAL_LIMITS.id) return fail();
  }
  if (sourceKind === "M2") {
    try { const url = new URL(value.sourceUrl as string); if (!(["http:", "https:"] as string[]).includes(url.protocol) || url.username || url.password) return fail(); } catch { return fail(); }
  }
  if (sourceKind === "M6") {
    const citation = value.citation as Record<string, unknown>;
    if (Object.keys(citation).sort().join(",") !== "captureId,sha256,url" || citation.captureId !== value.captureId || typeof citation.url !== "string" || !/^[a-f0-9]{64}$/u.test(String(citation.sha256))) return fail();
  }
  if ((sourceKind === "EVENT_CAPTURE" && !/^[a-f0-9]{64}$/u.test(String(value.payloadDigest))) || (sourceKind === "LEDGER_V1" && !/^[a-f0-9]{64}$/u.test(String(value.outputDigest)))) return fail();
  if (sourceKind === "LEDGER_V1" && value.authority !== "none") return fail();
  if (sourceKind === "DEVELOPMENT_EVIDENCE" && !["PENDING", "ACTIVE", "DISPUTED", "QUARANTINED", "REJECTED"].includes(String(value.assertion))) return fail();
  const safeValue = Object.fromEntries(Object.entries(value).filter(([key]) => key !== "authority" && key !== "assertion"));
  const namespace = `org.curiosity.legacy.${sourceKind.toLowerCase()}/v1`;
  let extensions: LegacyCharacterization["extensions"];
  try {
    extensions = decodeExtensions({ [namespace]: boundedJson(safeValue) }, newExtensionBudget());
  } catch {
    return fail();
  }
  return {
    schemaVersion: 1,
    contract: "curiosity.retrieval/legacy-characterization/v1",
    sourceKind,
    authority: "none",
    uncertainty: "UNVALIDATED",
    findings: [definition.finding],
    extensions,
  };
};
