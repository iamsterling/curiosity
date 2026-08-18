import { readVerifiedAnchor, type ContinuityAnchorPort } from "./anchor.js";
import type { DevelopmentFilesystemCustody } from "./custody.js";
import type { TransactionalAuthorityPort } from "./ingest.js";
import { InMemoryLexicalProjection } from "./query.js";

export interface ReconciliationFinding {
  readonly code: string;
  readonly identity: string;
  readonly action: "BLOCKED" | "QUARANTINED" | "REBUILT";
}

export class BlockingReconciler {
  danglingSpans = new Set<string>();
  danglingRelationships = new Set<string>();
  constructor(
    readonly authority: TransactionalAuthorityPort,
    readonly custody: DevelopmentFilesystemCustody,
    readonly anchor: ContinuityAnchorPort,
    readonly projection: InMemoryLexicalProjection,
  ) {}

  async run(): Promise<{ findings: readonly ReconciliationFinding[]; promoted: 0 }> {
    return this.authority.transaction(async () => {
      const findings: ReconciliationFinding[] = [];
      let eligibilityChanged = false;
      const add = (code: string, identity: string, action: ReconciliationFinding["action"] = "BLOCKED"): void => {
        findings.push({ code, identity, action });
      };
      const quarantine = (ingestId: string): void => {
        const record = this.authority.get(ingestId);
        if (!record) return;
        if (record.state !== "QUARANTINED") {
          record.state = "QUARANTINED";
          record.revision += 1;
        }
        eligibilityChanged = true;
      };
      for (const record of this.authority.records()) {
        if (record.state === "LOCAL_PREPARED" || record.state === "EXTERNAL_APPENDED")
          add("EVIDENCE_PREPARATION_STUCK", record.ingestId);
        if (record.state !== "LOCAL_COMMITTED" && record.state !== "TOMBSTONED") continue;
        for (const pair of [
          [record.rawReceipt, record.rawAad],
          [record.derivedReceipt, record.derivedAad],
        ] as const) {
          if (!pair[0] || !pair[1]) {
            add("EVIDENCE_RECEIPT_MISSING", record.ingestId, "QUARANTINED");
            quarantine(record.ingestId);
            continue;
          }
          try {
            await this.custody.read(pair[0], pair[1]);
          } catch (error) {
            const code = error instanceof Error ? error.message : "";
            add(
              code === "EVIDENCE_OBJECT_MISSING"
                ? "EVIDENCE_RECEIPT_OBJECT_MISSING"
                : "EVIDENCE_RECEIPT_OBJECT_DIGEST_INVALID",
              record.ingestId,
              "QUARANTINED",
            );
            quarantine(record.ingestId);
          }
        }
      }
      for (const identity of [...this.danglingSpans].sort()) add("EVIDENCE_DANGLING_SPAN", identity);
      for (const identity of [...this.danglingRelationships].sort()) add("EVIDENCE_DANGLING_RELATIONSHIP", identity);
      const projectionStale = this.projection.stale;
      const tombstoneGap = this.projection.tombstoneGap;
      if (projectionStale) add("EVIDENCE_PROJECTION_STALE", this.projection.snapshot, "REBUILT");
      if (tombstoneGap) add("EVIDENCE_TOMBSTONE_UNPROPAGATED", this.projection.snapshot, "REBUILT");
      const known = new Set(this.authority.records().map((record) => record.ingestId));
      for (const record of readVerifiedAnchor(this.anchor, "fixture", 10_000).records) {
        if (!["TOMBSTONE", "HOLD", "AUTHORIZATION_REVOKED", "ERASURE"].includes(record.intent.kind)) continue;
        const ingestId = String(record.intent.body.ingestId);
        if (!known.has(ingestId)) {
          add("EVIDENCE_ANCHOR_ORPHAN_RESTRICTIVE", record.intent.idempotencyId, "QUARANTINED");
          continue;
        }
        add("EVIDENCE_ANCHOR_RESTRICTIVE", ingestId, "QUARANTINED");
        eligibilityChanged = true;
        const restricted = this.authority.get(ingestId);
        if (record.intent.kind === "TOMBSTONE" && restricted) {
          if (restricted.state !== "TOMBSTONED" || !restricted.tombstone) {
            restricted.tombstone = true;
            restricted.state = "TOMBSTONED";
            restricted.revision += 1;
            eligibilityChanged = true;
          }
        } else {
          quarantine(ingestId);
        }
      }
      if (projectionStale || tombstoneGap || eligibilityChanged) this.projection.rebuild();
      return {
        findings: findings.sort(
          (left, right) => left.code.localeCompare(right.code) || left.identity.localeCompare(right.identity),
        ),
        promoted: 0,
      };
    });
  }
}
