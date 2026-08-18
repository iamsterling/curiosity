import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { canonicalJSON } from "../../core/canonical/index.js";
import { fail } from "./diagnostics.js";

export type AnchorKind =
  | "INGEST"
  | "TOMBSTONE"
  | "HOLD"
  | "AUTHORIZATION_REVOKED"
  | "ERASURE"
  | "KEY_GENERATION"
  | "TOMBSTONE_REVERSED"
  | "ASSERTION_ACTIVATED";
export interface AnchorIntent {
  readonly schemaVersion: 1;
  readonly idempotencyId: string;
  readonly kind: AnchorKind;
  readonly body: Readonly<Record<string, unknown>>;
}
export interface AnchorHead {
  readonly protocolVersion: 1;
  readonly stream: string;
  readonly sequence: number;
  readonly recordCommitment: string;
  readonly previousHeadCommitment: string;
  readonly keyGeneration: "development-hmac-v1";
  readonly authentication: string;
}
export interface AnchorRecord {
  readonly sequence: number;
  readonly intent: AnchorIntent;
  readonly previousCommitment: string;
  readonly commitment: string;
  readonly authentication: string;
}
export interface ContinuityAnchorPort {
  readHead(stream: string): AnchorHead;
  readAfter(
    stream: string,
    cursor: number,
    boundedLimit: number,
  ): { records: readonly AnchorRecord[]; head: AnchorHead; hasMore: boolean };
  appendCAS(stream: string, expectedHead: AnchorHead, intent: AnchorIntent): AnchorHead;
  verifyHead(stream: string, head: AnchorHead): void;
  verifyRecord(stream: string, record: AnchorRecord): void;
}

const ZERO = "sha256:" + "0".repeat(64);
const hash = (value: unknown): string => `sha256:${createHash("sha256").update(canonicalJSON(value)).digest("hex")}`;
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

/** Local, same-process protocol emulator. It provides no external continuity or tamper-evidence claim. */
export class InMemoryAnchorEmulator implements ContinuityAnchorPort {
  readonly brand = "TEST/DEVELOPMENT ONLY LOCAL HMAC-SHA-256 EMULATOR";
  readonly #secret: Buffer;
  readonly #streams = new Map<string, AnchorRecord[]>();
  readonly #keyStates = new Map<string, string>();

  constructor(secret: Uint8Array) {
    if (secret.byteLength < 32) fail("EVIDENCE_ANCHOR_SECRET_INVALID");
    this.#secret = Buffer.from(secret);
  }

  #authenticate(value: unknown): string {
    return createHmac("sha256", this.#secret).update(canonicalJSON(value)).digest("base64url");
  }

  #head(stream: string, records: readonly AnchorRecord[]): AnchorHead {
    const last = records.at(-1);
    const unsigned = {
      protocolVersion: 1 as const,
      stream,
      sequence: last?.sequence ?? 0,
      recordCommitment: last?.commitment ?? ZERO,
      previousHeadCommitment: last?.previousCommitment ?? ZERO,
      keyGeneration: "development-hmac-v1" as const,
    };
    return immutableCanonical({ ...unsigned, authentication: this.#authenticate(unsigned) });
  }

  #verifyHeadAuthentication(head: AnchorHead): void {
    const { authentication, ...unsigned } = head;
    const expected = Buffer.from(this.#authenticate(unsigned));
    const supplied = Buffer.from(authentication);
    if (expected.length !== supplied.length || !timingSafeEqual(expected, supplied))
      fail("EVIDENCE_ANCHOR_AUTHENTICATION_FAILED");
  }

  verifyHead(stream: string, head: AnchorHead): void {
    this.#verifyHeadAuthentication(head);
    if (head.stream !== stream) fail("EVIDENCE_ANCHOR_WRONG_STREAM");
  }

  verifyRecord(stream: string, record: AnchorRecord): void {
    const { authentication, commitment, ...unsigned } = record;
    if (hash({ stream, ...unsigned }) !== commitment) return fail("EVIDENCE_ANCHOR_AUTHENTICATION_FAILED");
    const expected = Buffer.from(this.#authenticate({ stream, ...unsigned, commitment }));
    const supplied = Buffer.from(authentication);
    if (expected.length !== supplied.length || !timingSafeEqual(expected, supplied))
      fail("EVIDENCE_ANCHOR_AUTHENTICATION_FAILED");
  }

  readHead(stream: string): AnchorHead {
    if (!stream) return fail("EVIDENCE_ANCHOR_STREAM_INVALID");
    return this.#head(stream, this.#streams.get(stream) ?? []);
  }

  readAfter(
    stream: string,
    cursor: number,
    boundedLimit: number,
  ): { records: readonly AnchorRecord[]; head: AnchorHead; hasMore: boolean } {
    if (
      !Number.isSafeInteger(cursor) ||
      cursor < 0 ||
      !Number.isSafeInteger(boundedLimit) ||
      boundedLimit < 1 ||
      boundedLimit > 100
    )
      return fail("EVIDENCE_ANCHOR_PAGE_INVALID");
    const records = this.#streams.get(stream) ?? [];
    if (cursor > records.length) return fail("EVIDENCE_ANCHOR_CURSOR_GAP");
    const page = records.slice(cursor, cursor + boundedLimit).map((record) => immutableCanonical(record));
    return { records: page, head: this.#head(stream, records), hasMore: cursor + page.length < records.length };
  }

  appendCAS(stream: string, expectedHead: AnchorHead, intent: AnchorIntent): AnchorHead {
    if (intent.schemaVersion !== 1 || !intent.idempotencyId) return fail("EVIDENCE_ANCHOR_MALFORMED");
    this.#verifyHeadAuthentication(expectedHead);
    if (expectedHead.stream !== stream) return fail("EVIDENCE_ANCHOR_WRONG_STREAM");
    const canonicalIntent = immutableCanonical(intent);
    const records = this.#streams.get(stream) ?? [];
    const previous = records.find((record) => record.intent.idempotencyId === canonicalIntent.idempotencyId);
    if (previous) {
      if (canonicalJSON(previous.intent) !== canonicalJSON(canonicalIntent))
        return fail("EVIDENCE_ANCHOR_IDEMPOTENCY_CONFLICT");
      return this.#head(stream, records.slice(0, previous.sequence));
    }
    const current = this.#head(stream, records);
    if (expectedHead.sequence !== current.sequence || expectedHead.recordCommitment !== current.recordCommitment)
      return fail("EVIDENCE_ANCHOR_STALE_HEAD");
    this.#validateRestriction(stream, canonicalIntent);
    const unsigned = immutableCanonical({
      sequence: records.length + 1,
      intent: canonicalIntent,
      previousCommitment: current.recordCommitment,
    });
    const commitment = hash({ stream, ...unsigned });
    const record: AnchorRecord = immutableCanonical({
      ...unsigned,
      commitment,
      authentication: this.#authenticate({ stream, ...unsigned, commitment }),
    });
    this.#streams.set(stream, [...records, record]);
    return this.#head(stream, [...records, record]);
  }

  #validateRestriction(stream: string, intent: AnchorIntent): void {
    if (intent.kind === "TOMBSTONE_REVERSED" || intent.kind === "ASSERTION_ACTIVATED")
      fail("EVIDENCE_ANCHOR_RESTRICTION_REVERSAL");
    if (intent.kind !== "KEY_GENERATION") return;
    const generation = intent.body.generation;
    const action = intent.body.action;
    if (typeof generation !== "string") return fail("EVIDENCE_ANCHOR_KEY_COMMITMENT_INVALID");
    if (!["CREATED", "ACTIVE", "RETIRED", "REVOKED", "DESTROYED"].includes(String(action)))
      return fail("EVIDENCE_ANCHOR_KEY_COMMITMENT_INVALID");
    const key = `${stream}\u0000${generation}`;
    const previous = this.#keyStates.get(key);
    if (previous && action === "CREATED") fail("EVIDENCE_ANCHOR_KEY_REACTIVATION");
    if (["RETIRED", "REVOKED", "DESTROYED"].includes(previous ?? "") && action === "ACTIVE")
      fail("EVIDENCE_ANCHOR_KEY_REACTIVATION");
    this.#keyStates.set(key, String(action));
  }
}

export const readVerifiedAnchor = (
  anchor: ContinuityAnchorPort,
  stream: string,
  totalBound = 10_000,
): { records: readonly AnchorRecord[]; head: AnchorHead } => {
  if (!Number.isSafeInteger(totalBound) || totalBound < 1) return fail("EVIDENCE_ANCHOR_TOTAL_BOUND_INVALID");
  const records: AnchorRecord[] = [];
  let cursor = 0;
  let previous = ZERO;
  let finalHead: AnchorHead | undefined;
  while (true) {
    const page = anchor.readAfter(stream, cursor, Math.min(100, totalBound - cursor || 1));
    anchor.verifyHead(stream, page.head);
    if (page.head.sequence > totalBound) return fail("EVIDENCE_ANCHOR_TOTAL_BOUND_EXCEEDED");
    for (const record of page.records) {
      anchor.verifyRecord(stream, record);
      if (record.sequence !== cursor + 1 || record.previousCommitment !== previous)
        return fail("EVIDENCE_ANCHOR_CONTINUITY_INVALID");
      records.push(record);
      cursor += 1;
      previous = record.commitment;
    }
    finalHead = page.head;
    if (!page.hasMore) break;
    if (page.records.length === 0 || cursor >= totalBound) return fail("EVIDENCE_ANCHOR_TOTAL_BOUND_EXCEEDED");
  }
  if (
    !finalHead ||
    finalHead.sequence !== records.length ||
    finalHead.recordCommitment !== (records.at(-1)?.commitment ?? ZERO)
  )
    return fail("EVIDENCE_ANCHOR_CONTINUITY_INVALID");
  return { records: immutableCanonical(records), head: immutableCanonical(finalHead) };
};
