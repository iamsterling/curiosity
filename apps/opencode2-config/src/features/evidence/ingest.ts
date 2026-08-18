import { canonicalJSON, digestCanonical } from "../../core/canonical/index.js";
import { readVerifiedAnchor, type ContinuityAnchorPort, type AnchorHead } from "./anchor.js";
import type { DevelopmentFilesystemCustody, ObjectAad, ObjectReceipt } from "./custody.js";
import { fail } from "./diagnostics.js";
import { bytesDigest, createIdentity, deterministicExtract, type ExtractedSpan } from "./identity.js";

export type IngestState =
  | "LOCAL_PREPARED"
  | "EXTERNAL_APPENDED"
  | "LOCAL_COMMITTED"
  | "TOMBSTONE_PENDING_ANCHOR"
  | "TOMBSTONED"
  | "QUARANTINED";
export type IngestFault =
  | "AFTER_RAW_PUBLICATION"
  | "AFTER_DERIVED_PUBLICATION"
  | "BEFORE_LOCAL_COMMIT"
  | "AFTER_LOCAL_COMMIT";
export type EligibilityOperation =
  | "extraction"
  | "validation"
  | "projection"
  | "candidate"
  | "lexical-retrieval"
  | "direct-retrieval"
  | "hydration"
  | "serialization";
export interface FixtureIngest {
  readonly schemaVersion: 1;
  readonly ingestId: string;
  readonly tenant: "fixture";
  readonly sourceLocator: string;
  readonly text: string;
  readonly mediaType: "text/plain";
  readonly capturedAt: string;
  readonly assertionState: "ACTIVE";
}
export interface IngestRecord {
  readonly ingestId: string;
  readonly requestDigest: string;
  readonly request: FixtureIngest;
  state: IngestState;
  expectedHead: AnchorHead;
  anchorHead?: AnchorHead;
  rawReceipt?: ObjectReceipt;
  derivedReceipt?: ObjectReceipt;
  rawAad?: ObjectAad;
  derivedAad?: ObjectAad;
  spans: readonly ExtractedSpan[];
  tombstone: boolean;
  revision: number;
}

export interface TransactionalAuthorityPort {
  transaction<T>(operation: () => Promise<T>): Promise<T>;
  get(id: string): IngestRecord | undefined;
  put(record: IngestRecord): void;
  records(): readonly IngestRecord[];
}

/** Development test authority only; intentionally not a persistence or cross-process fencing claim. */
export class InMemoryTransactionalAuthority implements TransactionalAuthorityPort {
  readonly brand = "TEST/DEVELOPMENT ONLY INJECTED TRANSACTIONAL AUTHORITY";
  readonly #records = new Map<string, IngestRecord>();
  #tail: Promise<void> = Promise.resolve();
  async transaction<T>(operation: () => Promise<T>): Promise<T> {
    const previous = this.#tail;
    let release = (): void => undefined;
    this.#tail = new Promise<void>((resolve) => {
      release = resolve;
    });
    await previous;
    try {
      return await operation();
    } finally {
      release();
    }
  }
  get(id: string): IngestRecord | undefined {
    return this.#records.get(id);
  }
  put(record: IngestRecord): void {
    this.#records.set(record.ingestId, record);
  }
  records(): readonly IngestRecord[] {
    return [...this.#records.values()].sort((left, right) => left.ingestId.localeCompare(right.ingestId));
  }
}

const immutableCanonical = <T>(value: T): T => {
  const clone = JSON.parse(canonicalJSON(value)) as T;
  const freeze = (item: unknown): void => {
    if (!item || typeof item !== "object" || Object.isFrozen(item)) return;
    for (const child of Object.values(item)) freeze(child);
    Object.freeze(item);
  };
  freeze(clone);
  return clone;
};

const RESTRICTIVE_KINDS = new Set(["TOMBSTONE", "HOLD", "AUTHORIZATION_REVOKED", "ERASURE"]);

export const verifyIngestAnchor = (record: IngestRecord, anchor: ContinuityAnchorPort): void => {
  if (!record.anchorHead) return fail("EVIDENCE_INGEST_ANCHOR_UNPROVEN");
  anchor.verifyHead(record.request.tenant, record.expectedHead);
  anchor.verifyHead(record.request.tenant, record.anchorHead);
  const ledger = readVerifiedAnchor(anchor, record.request.tenant);
  const anchored = ledger.records[record.anchorHead.sequence - 1];
  if (!anchored) return fail("EVIDENCE_INGEST_ANCHOR_UNPROVEN");
  const expectedIntent = {
    schemaVersion: 1 as const,
    idempotencyId: record.ingestId,
    kind: "INGEST" as const,
    body: { requestDigest: record.requestDigest },
  };
  if (
    anchored.sequence !== record.anchorHead.sequence ||
    anchored.commitment !== record.anchorHead.recordCommitment ||
    anchored.previousCommitment !== record.expectedHead.recordCommitment ||
    record.anchorHead.previousHeadCommitment !== anchored.previousCommitment ||
    canonicalJSON(anchored.intent) !== canonicalJSON(expectedIntent)
  )
    return fail("EVIDENCE_INGEST_ANCHOR_UNPROVEN");
  for (const later of ledger.records.slice(anchored.sequence)) {
    if (RESTRICTIVE_KINDS.has(later.intent.kind) && later.intent.body.ingestId === record.ingestId)
      return fail("EVIDENCE_INGEST_RESTRICTED");
  }
};

const rawAad = (request: FixtureIngest, ingestId: string): ObjectAad => {
  const representationId = createIdentity("representation", { ingestId, type: "raw", version: 1 });
  const objectId = createIdentity("object", { representationId, digest: bytesDigest(Buffer.from(request.text)) });
  return {
    schemaVersion: 1,
    profile: "development-bootstrap",
    tenant: request.tenant,
    objectId,
    representationId,
    representationType: "raw",
    receiptId: createIdentity("receipt", { objectId }),
    algorithm: "AES-256-GCM",
    keyGeneration: "development-object-key-v1",
    plaintextSize: Buffer.byteLength(request.text),
    plaintextDigest: bytesDigest(Buffer.from(request.text)),
  };
};

const derivedAad = (
  request: FixtureIngest,
  ingestId: string,
  sourceReceiptId: string,
  derived: Uint8Array,
): ObjectAad => {
  const representationId = createIdentity("representation", {
    ingestId,
    type: "fixture-lexical",
    producer: "fixture-extractor",
    version: "1",
  });
  const objectId = createIdentity("object", { representationId, digest: bytesDigest(derived) });
  return {
    schemaVersion: 1,
    profile: "development-bootstrap",
    tenant: request.tenant,
    objectId,
    representationId,
    representationType: "fixture-lexical",
    receiptId: createIdentity("receipt", { objectId }),
    algorithm: "AES-256-GCM",
    keyGeneration: "development-object-key-v1",
    plaintextSize: derived.byteLength,
    plaintextDigest: bytesDigest(derived),
    sourceReceiptId,
    producer: "fixture-extractor",
    producerVersion: "1",
    transformationPolicyVersion: "fixture-policy-v1",
  };
};

export class SynchronousIngest {
  faultBoundary?: (stage: "pre-local-commit", record: IngestRecord) => void | Promise<void>;
  constructor(
    readonly authority: TransactionalAuthorityPort,
    readonly anchor: ContinuityAnchorPort,
    readonly custody: DevelopmentFilesystemCustody,
  ) {}

  async prepare(request: FixtureIngest): Promise<IngestRecord> {
    if (request.schemaVersion !== 1 || request.tenant !== "fixture" || request.mediaType !== "text/plain")
      return fail("EVIDENCE_INGEST_INVALID");
    const canonicalRequest = immutableCanonical(request);
    const requestDigest = digestCanonical(canonicalRequest);
    const existing = this.authority.get(request.ingestId);
    if (existing) {
      if (existing.requestDigest !== requestDigest) return fail("EVIDENCE_INGEST_ID_CONFLICT");
      return existing;
    }
    return this.authority.transaction(async () => {
      const raced = this.authority.get(canonicalRequest.ingestId);
      if (raced) {
        if (raced.requestDigest !== requestDigest) return fail("EVIDENCE_INGEST_ID_CONFLICT");
        return raced;
      }
      const record: IngestRecord = {
        ingestId: canonicalRequest.ingestId,
        requestDigest,
        request: canonicalRequest,
        state: "LOCAL_PREPARED",
        expectedHead: this.anchor.readHead(canonicalRequest.tenant),
        spans: [],
        tombstone: false,
        revision: 1,
      };
      this.authority.put(record);
      return record;
    });
  }

  async append(ingestId: string): Promise<IngestRecord> {
    const record = this.required(ingestId);
    if (record.state === "EXTERNAL_APPENDED" || record.state === "LOCAL_COMMITTED") return record;
    if (record.state !== "LOCAL_PREPARED") return fail("EVIDENCE_INGEST_STATE_INVALID");
    record.anchorHead = this.anchor.appendCAS(record.request.tenant, record.expectedHead, {
      schemaVersion: 1,
      idempotencyId: record.ingestId,
      kind: "INGEST",
      body: { requestDigest: record.requestDigest },
    });
    record.state = "EXTERNAL_APPENDED";
    return record;
  }

  async commit(ingestId: string, fault?: IngestFault): Promise<IngestRecord> {
    const record = this.required(ingestId);
    if (record.state === "LOCAL_COMMITTED") return record;
    if (record.state !== "EXTERNAL_APPENDED" || !record.anchorHead) return fail("EVIDENCE_INGEST_STATE_INVALID");
    return this.authority.transaction(async () => {
      const startingRevision = record.revision;
      verifyIngestAnchor(record, this.anchor);
      const finalGuard = (): void => {
        if (record.state !== "EXTERNAL_APPENDED" || record.tombstone || record.revision !== startingRevision)
          return fail("EVIDENCE_INGEST_STATE_INVALID");
        verifyIngestAnchor(record, this.anchor);
      };
      const raw = record.rawAad ?? rawAad(record.request, record.ingestId);
      if (!record.rawReceipt) {
        const publishedRaw = await this.custody.publish(Buffer.from(record.request.text), raw, finalGuard);
        record.rawAad = raw;
        record.rawReceipt = publishedRaw.receipt;
      } else {
        await this.custody.read(record.rawReceipt, raw);
      }
      if (fault === "AFTER_RAW_PUBLICATION") return fail("EVIDENCE_INGEST_FAULT_INJECTED");
      const spans = deterministicExtract(
        record.request.text,
        createIdentity("representation", {
          ingestId,
          type: "fixture-lexical",
          producer: "fixture-extractor",
          version: "1",
        }),
      );
      const derivedBytes = Buffer.from(canonicalJSON(spans));
      const derived =
        record.derivedAad ?? derivedAad(record.request, record.ingestId, record.rawReceipt.id, derivedBytes);
      if (!record.derivedReceipt) {
        const publishedDerived = await this.custody.publish(derivedBytes, derived, finalGuard);
        record.derivedAad = derived;
        record.derivedReceipt = publishedDerived.receipt;
      } else {
        await this.custody.read(record.derivedReceipt, derived);
      }
      if (fault === "AFTER_DERIVED_PUBLICATION" || fault === "BEFORE_LOCAL_COMMIT")
        return fail("EVIDENCE_INGEST_FAULT_INJECTED");
      await this.faultBoundary?.("pre-local-commit", record);
      finalGuard();
      record.spans = immutableCanonical(spans);
      record.state = "LOCAL_COMMITTED";
      record.revision += 1;
      if (fault === "AFTER_LOCAL_COMMIT") return fail("EVIDENCE_INGEST_FAULT_INJECTED");
      return record;
    });
  }

  async all(request: FixtureIngest): Promise<IngestRecord> {
    const prepared = await this.prepare(request);
    await this.append(prepared.ingestId);
    return this.commit(prepared.ingestId);
  }

  required(ingestId: string): IngestRecord {
    const record = this.authority.get(ingestId);
    if (!record) return fail("EVIDENCE_INGEST_NOT_FOUND");
    return record;
  }
}

export const isEligibleRecord = (
  record: IngestRecord | undefined,
  operation: EligibilityOperation = "lexical-retrieval",
): { eligible: boolean; reason: string } => {
  if (!record || record.state !== "LOCAL_COMMITTED") return { eligible: false, reason: "NOT_LOCAL_COMMITTED" };
  if (record.tombstone) return { eligible: false, reason: "TOMBSTONED_OR_PENDING" };
  if (record.request.assertionState !== "ACTIVE") return { eligible: false, reason: "ASSERTION_NOT_ACTIVE" };
  if (!record.rawReceipt || !record.rawAad)
    return { eligible: false, reason: `${operation.toUpperCase()}_RAW_MISSING` };
  if (operation === "extraction") return { eligible: true, reason: "ACTIVE_COMMITTED_AUTHORIZED" };
  if (!record.derivedReceipt || !record.derivedAad)
    return { eligible: false, reason: `${operation.toUpperCase()}_DERIVED_MISSING` };
  if (
    ["projection", "candidate", "lexical-retrieval", "direct-retrieval", "hydration", "serialization"].includes(
      operation,
    ) &&
    record.spans.length === 0
  )
    return { eligible: false, reason: `${operation.toUpperCase()}_SPANS_MISSING` };
  return { eligible: true, reason: "ACTIVE_COMMITTED_AUTHORIZED" };
};
