import { canonicalJSON, digestCanonical } from "../../core/canonical/index.js";
import type { ContinuityAnchorPort } from "./anchor.js";
import type { DevelopmentFilesystemCustody } from "./custody.js";
import { EvidenceDiagnostic } from "./diagnostics.js";
import { lexicalTokens } from "./identity.js";
import type { EligibilityOperation, IngestRecord, TransactionalAuthorityPort } from "./ingest.js";
import { isEligibleRecord, verifyIngestAnchor } from "./ingest.js";

export class InMemoryLexicalProjection {
  readonly #authority: TransactionalAuthorityPort;
  readonly #entries = new Map<string, readonly string[]>();
  snapshot = "projection:v1:empty";
  readCount = 0;
  stale = false;
  tombstoneGap = false;
  constructor(authority: TransactionalAuthorityPort) {
    this.#authority = authority;
  }
  rebuild(): { ids: readonly string[]; snapshot: string } {
    this.#entries.clear();
    for (const record of this.#authority.records())
      if (isEligibleRecord(record).eligible) this.#entries.set(record.ingestId, lexicalTokens(record.request.text));
    const ids = [...this.#entries.keys()].sort();
    this.snapshot = `projection:v1:${digestCanonical(ids)}`;
    this.stale = false;
    this.tombstoneGap = false;
    return { ids, snapshot: this.snapshot };
  }
  clear(): void {
    this.#entries.clear();
    this.snapshot = "projection:v1:empty";
  }
  remove(id: string): void {
    this.#entries.delete(id);
    const ids = [...this.#entries.keys()].sort();
    this.snapshot = `projection:v1:${digestCanonical(ids)}`;
  }
  candidates(text: string): readonly string[] {
    this.readCount += 1;
    const tokens = lexicalTokens(text);
    return [...this.#entries]
      .filter(([, indexed]) => tokens.every((token) => indexed.includes(token)))
      .map(([id]) => id)
      .sort();
  }
}

export interface QueryRequest {
  readonly principal: string;
  readonly purpose: string;
  readonly text: string;
  readonly beforeFinalCheck?: () => void | Promise<void>;
}
export interface QueryResponse {
  readonly schemaVersion: 1;
  readonly requestId: string;
  readonly ledgerCursor: number;
  readonly projectionSnapshot: string;
  readonly authorizationSnapshot: string;
  readonly asOf: string;
  readonly items: readonly unknown[];
  readonly coverage: { readonly kind: "MEASURED" | "UNKNOWN"; readonly requested: number; readonly eligible: number };
  readonly excludedReasons: Readonly<Record<string, number>>;
  readonly partial: boolean;
  readonly partialFailures: readonly { stage: string; code: string }[];
  readonly diagnostic?: string;
}

const authorize = (request: QueryRequest): { allowed: boolean; snapshot: string } => ({
  allowed: request.principal === "fixture-user" && request.purpose === "test",
  snapshot: "fixture-auth-policy-v1",
});

const receiptIdentity = (record: IngestRecord): string =>
  canonicalJSON({
    rawReceipt: record.rawReceipt,
    rawAad: record.rawAad,
    derivedReceipt: record.derivedReceipt,
    derivedAad: record.derivedAad,
  });

const retrieve = async (
  request: QueryRequest,
  ids: readonly string[],
  operation: EligibilityOperation,
  authority: TransactionalAuthorityPort,
  projection: InMemoryLexicalProjection,
  anchor?: ContinuityAnchorPort,
  custody?: DevelopmentFilesystemCustody,
): Promise<{ items: readonly unknown[]; excluded: number }> => {
  const hydrated: {
    id: string;
    revision: number;
    receiptIdentity: string;
  }[] = [];
  let excluded = 0;
  const invalidate = async (id: string, quarantine: boolean): Promise<void> => {
    await authority.transaction(async () => {
      const record = authority.get(id);
      if (quarantine && record && record.state !== "TOMBSTONED") {
        record.state = "QUARANTINED";
        record.revision += 1;
      }
      projection.remove(id);
      projection.stale = true;
    });
  };
  const classify = async (id: string, error: unknown): Promise<void> => {
    if (error instanceof EvidenceDiagnostic && error.code === "EVIDENCE_QUERY_DENIED") throw error;
    const code = error instanceof EvidenceDiagnostic ? error.code : "";
    const provenCorruption = new Set([
      "EVIDENCE_ANCHOR_AUTHENTICATION_FAILED",
      "EVIDENCE_INGEST_ANCHOR_UNPROVEN",
      "EVIDENCE_CUSTODY_UNSAFE_OBJECT",
      "EVIDENCE_OBJECT_AUTHENTICATION_FAILED",
      "EVIDENCE_OBJECT_DIGEST_INVALID",
      "EVIDENCE_OBJECT_MISSING",
      "EVIDENCE_OBJECT_VERSION_UNSUPPORTED",
    ]);
    await invalidate(id, provenCorruption.has(code));
  };
  const requireAuthorization = (): void => {
    if (!authorize(request).allowed) throw new EvidenceDiagnostic("EVIDENCE_QUERY_DENIED");
  };
  const requiredCustody = (): DevelopmentFilesystemCustody => {
    if (!custody) throw new EvidenceDiagnostic("EVIDENCE_QUERY_PROOF_MISSING");
    return custody;
  };
  const requiredAnchor = (): ContinuityAnchorPort => {
    if (!anchor) throw new EvidenceDiagnostic("EVIDENCE_QUERY_PROOF_MISSING");
    return anchor;
  };
  for (const id of ids) {
    try {
      const initial = await authority.transaction(async () => {
        const record = authority.get(id);
        if (!isEligibleRecord(record, operation).eligible || !record) {
          if (record && (record.tombstone || record.state === "TOMBSTONED" || record.state === "QUARANTINED")) {
            projection.remove(id);
            projection.stale = true;
          }
          return undefined;
        }
        if (!anchor || !custody || !record.rawReceipt || !record.rawAad || !record.derivedReceipt || !record.derivedAad)
          throw new Error("EVIDENCE_QUERY_PROOF_MISSING");
        verifyIngestAnchor(record, anchor);
        return {
          revision: record.revision,
          receiptIdentity: receiptIdentity(record),
          rawReceipt: record.rawReceipt,
          rawAad: record.rawAad,
          derivedReceipt: record.derivedReceipt,
          derivedAad: record.derivedAad,
        };
      });
      if (!initial) {
        excluded += 1;
        continue;
      }
      requireAuthorization();
      await requiredCustody().read(initial.rawReceipt, initial.rawAad);
      requireAuthorization();
      await requiredCustody().read(initial.derivedReceipt, initial.derivedAad);
      requireAuthorization();
      hydrated.push({ id, revision: initial.revision, receiptIdentity: initial.receiptIdentity });
    } catch (error) {
      await classify(id, error);
      excluded += 1;
    }
  }
  if (hydrated.length === 0) return { items: [], excluded };
  const items: unknown[] = [];
  for (const candidate of hydrated) {
    try {
      const item = await authority.transaction(async () => {
        requireAuthorization();
        const record = authority.get(candidate.id);
        if (
          !record ||
          record.revision !== candidate.revision ||
          receiptIdentity(record) !== candidate.receiptIdentity ||
          !isEligibleRecord(record, operation).eligible
        )
          throw new EvidenceDiagnostic("EVIDENCE_QUERY_FINAL_STATE_CHANGED");
        verifyIngestAnchor(record, requiredAnchor());
        requireAuthorization();
        return envelope(record);
      });
      requireAuthorization();
      items.push(item);
    } catch (error) {
      await classify(candidate.id, error);
      excluded += 1;
    }
  }
  requireAuthorization();
  return { items, excluded };
};

const denied = (request: QueryRequest, authorizationSnapshot: string): QueryResponse => ({
  schemaVersion: 1,
  requestId: `request:${digestCanonical({ principal: request.principal, purpose: request.purpose, text: request.text })}`,
  ledgerCursor: 0,
  projectionSnapshot: "withheld",
  authorizationSnapshot,
  asOf: new Date().toISOString(),
  items: [],
  coverage: { kind: "UNKNOWN", requested: 0, eligible: 0 },
  excludedReasons: {},
  partial: true,
  partialFailures: [],
  diagnostic: "EVIDENCE_QUERY_DENIED",
});

export const createQuery =
  (
    authority: TransactionalAuthorityPort,
    projection: InMemoryLexicalProjection,
    anchor?: ContinuityAnchorPort,
    custody?: DevelopmentFilesystemCustody,
  ) =>
  async (request: QueryRequest): Promise<QueryResponse> => {
    const auth = authorize(request);
    if (!auth.allowed) return denied(request, auth.snapshot);
    await request.beforeFinalCheck?.();
    const finalAuth = authorize(request);
    if (!finalAuth.allowed) return denied(request, finalAuth.snapshot);
    const deniedBase = {
      schemaVersion: 1 as const,
      requestId: `request:${digestCanonical({ principal: request.principal, purpose: request.purpose, text: request.text })}`,
      ledgerCursor: 0,
      projectionSnapshot: "withheld",
      authorizationSnapshot: auth.snapshot,
      asOf: new Date().toISOString(),
    };
    const base = {
      ...deniedBase,
      ledgerCursor: authority.records().reduce((sum, item) => sum + item.revision, 0),
      projectionSnapshot: projection.snapshot,
    };
    if (!authorize(request).allowed) return denied(request, auth.snapshot);
    const candidates = projection.candidates(request.text);
    let result: { items: readonly unknown[]; excluded: number };
    try {
      result = await retrieve(request, candidates, "lexical-retrieval", authority, projection, anchor, custody);
    } catch (error) {
      if (error instanceof EvidenceDiagnostic && error.code === "EVIDENCE_QUERY_DENIED")
        return denied(request, authorize(request).snapshot);
      throw error;
    }
    const { items, excluded } = result;
    if (!authorize(request).allowed) return denied(request, authorize(request).snapshot);
    return {
      ...base,
      items,
      coverage: {
        kind: projection.stale ? "UNKNOWN" : "MEASURED",
        requested: candidates.length,
        eligible: items.length,
      },
      excludedReasons: excluded ? { FINAL_RECHECK_SUPPRESSED: excluded } : {},
      partial: excluded > 0 || projection.stale,
      partialFailures: projection.stale ? [{ stage: "projection", code: "EVIDENCE_PROJECTION_STALE" }] : [],
    };
  };

/** Internal development harness path; intentionally not exported by the package root ABI. */
export const createExactQuery =
  (
    authority: TransactionalAuthorityPort,
    projection: InMemoryLexicalProjection,
    anchor?: ContinuityAnchorPort,
    custody?: DevelopmentFilesystemCustody,
  ) =>
  async (request: QueryRequest, ingestId: string): Promise<QueryResponse> => {
    const auth = authorize(request);
    if (!auth.allowed) return denied(request, auth.snapshot);
    await request.beforeFinalCheck?.();
    if (!authorize(request).allowed) return denied(request, authorize(request).snapshot);
    let result: { items: readonly unknown[]; excluded: number };
    try {
      result = await retrieve(request, [ingestId], "direct-retrieval", authority, projection, anchor, custody);
    } catch (error) {
      if (error instanceof EvidenceDiagnostic && error.code === "EVIDENCE_QUERY_DENIED")
        return denied(request, authorize(request).snapshot);
      throw error;
    }
    const { items, excluded } = result;
    if (!authorize(request).allowed) return denied(request, authorize(request).snapshot);
    return {
      schemaVersion: 1,
      requestId: `request:${digestCanonical({ principal: request.principal, purpose: request.purpose, ingestId })}`,
      ledgerCursor: authority.records().reduce((sum, item) => sum + item.revision, 0),
      projectionSnapshot: projection.snapshot,
      authorizationSnapshot: auth.snapshot,
      asOf: new Date().toISOString(),
      items,
      coverage: { kind: projection.stale ? "UNKNOWN" : "MEASURED", requested: 1, eligible: items.length },
      excludedReasons: excluded ? { FINAL_RECHECK_SUPPRESSED: excluded } : {},
      partial: excluded > 0 || projection.stale,
      partialFailures: projection.stale ? [{ stage: "projection", code: "EVIDENCE_PROJECTION_STALE" }] : [],
    };
  };

const envelope = (record: IngestRecord): unknown => {
  const first = record.spans[0];
  return {
    schemaVersion: 1,
    sourceObjectId: `source:${digestCanonical(record.request.sourceLocator)}`,
    captureId: `capture:${record.ingestId}`,
    contentId: `content:${record.rawReceipt?.plaintextDigest}`,
    representationId: record.derivedReceipt?.representationId,
    spanId: first?.id,
    span: first ? { start: first.start, end: first.end, digest: first.digest } : null,
    text: first?.text.slice(0, 512) ?? "",
    mediaType: record.request.mediaType,
    captureTime: record.request.capturedAt,
    sourceLocator: record.request.sourceLocator,
    assertionState: "ACTIVE",
    validationPolicyRef: "fixture-policy-v1",
    authorizationSnapshot: "fixture-auth-policy-v1",
    eligibilityReason: "ACTIVE_COMMITTED_AUTHORIZED",
    deletionState: "LIVE",
    warning: "UNTRUSTED_CAPTURED_CONTENT",
  };
};
