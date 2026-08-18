import { randomUUID } from "node:crypto";
import { mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import { digestCanonical } from "../../core/canonical/index.js";
import { DiagnosticError } from "../../core/diagnostics/diagnostic.js";
import { atomicWrite, listJSON, withLease } from "../../platform/persistence/atomic-store.js";
import type { FeatureRegistration } from "../../plugin/contracts.js";
import { createArchiveTransaction, type ArchiveFaultBoundary } from "./archive.js";

export {
  LEDGER_ENTITY_TYPES,
  applyCapabilityDelta,
  decodeLedgerEntity,
  explainDependencies,
  explainReadiness,
  replayLedgerEvents,
  validateProposal,
} from "./domain.js";
export type { CapabilityDelta, LedgerEntity, LedgerEntityType } from "./domain.js";
export { createArchiveTransaction } from "./archive.js";
export type { ArchiveBundleInput, ArchiveFaultBoundary } from "./archive.js";

export { digestCanonical, DiagnosticError };
export type ActorKind = "root-user" | "model" | "worker" | "synthetic" | "plugin" | "tool";
export interface Actor {
  readonly kind: ActorKind;
  readonly sessionID: string;
  readonly correlationID?: string;
}
export type Rigor = "mechanical" | "behavioral" | "security" | "schema" | "destructive" | "irreversible";
export interface IntentInput {
  readonly id: string;
  readonly objective: string;
  readonly invariant: string;
  readonly scope: readonly string[];
  readonly nonGoals: readonly string[];
  readonly rigor: Rigor;
  readonly revision: number;
}
export interface Criterion {
  readonly id: string;
  readonly revision: number;
  readonly observable: string;
  readonly oracle: string;
  readonly requiredEvidence: readonly EvidenceKind[];
  readonly scenarios: readonly string[];
}
export interface WorkItem {
  readonly id: string;
  readonly intentID: string;
  readonly intentRevision: number;
  readonly criterionIDs: readonly string[];
  readonly writableScope: readonly string[];
  readonly state: "pending" | "blocked" | "resolved";
}
export type EvidenceKind =
  | "test-red"
  | "test-green"
  | "command-result"
  | "static-analysis"
  | "build-result"
  | "diff-observation"
  | "review-finding"
  | "runtime-probe"
  | "user-observation"
  | "source-citation";
export interface EvidenceInput {
  readonly id: string;
  readonly kind: EvidenceKind;
  readonly intentID: string;
  readonly criterionID: string;
  readonly criterionRevision: number;
  readonly workID: string;
  readonly executionID: string;
  readonly environmentDigest: string;
  readonly inputDigest: string;
  readonly outputDigest: string;
  readonly status: "passed" | "failed" | "observed";
  readonly eventIDs: readonly string[];
  readonly observedAt: string;
  readonly expiresAt?: string;
  readonly producer: Actor;
}
export interface LedgerEvent {
  readonly schemaVersion: 1;
  readonly id: string;
  readonly sequence: number;
  readonly aggregate: string;
  readonly type: string;
  readonly at: string;
  readonly actor: Actor;
  readonly data: Record<string, unknown>;
  readonly previousDigest: string;
  readonly digest: string;
}

const exactKeys = (value: Record<string, unknown>, keys: readonly string[], code = "LEDGER_SCHEMA_INVALID"): void => {
  if (Object.keys(value).some((key) => !keys.includes(key))) throw new DiagnosticError(code);
};
const record = (value: unknown): Record<string, unknown> => {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new DiagnosticError("LEDGER_SCHEMA_INVALID");
  return value as Record<string, unknown>;
};
export const decodeLedgerEvent = (value: unknown): LedgerEvent => {
  const input = record(value);
  if (input.schemaVersion !== 1) throw new DiagnosticError("LEDGER_VERSION_UNSUPPORTED");
  exactKeys(input, [
    "schemaVersion",
    "id",
    "sequence",
    "aggregate",
    "type",
    "at",
    "actor",
    "data",
    "previousDigest",
    "digest",
  ]);
  const actor = record(input.actor);
  exactKeys(actor, ["kind", "sessionID", "correlationID"]);
  if (
    typeof input.id !== "string" ||
    typeof input.sequence !== "number" ||
    typeof input.aggregate !== "string" ||
    typeof input.type !== "string" ||
    typeof input.at !== "string"
  )
    throw new DiagnosticError("LEDGER_SCHEMA_INVALID");
  return input as unknown as LedgerEvent;
};

interface IntentView extends IntentInput {
  lifecycle: "captured" | "framed" | "active" | "resolving" | "reconciled" | "archived" | "blocked";
  criteria: Criterion[];
}
interface ClaimView {
  workID: string;
  token: string;
  sessionID: string;
  rootSessionID: string;
  revision: number;
  scopeFingerprint: string;
  fenceEpoch: number;
  acquiredAt: string;
  expiresAt: string;
  released: boolean;
  releasedAt?: string;
}
interface ApprovalView {
  id: string;
  intentID: string;
  reason: string;
  rootSessionID: string;
  revision: number;
  confirmed: boolean;
}
interface ResolutionView {
  intentID: string;
  verdict: "accept" | "reject" | "blocked";
  rationale: string;
  evidenceIDs: string[];
  actor: Actor;
}
interface View {
  intents: Map<string, IntentView>;
  work: Map<string, WorkItem>;
  claims: Map<string, ClaimView>;
  evidence: EvidenceInput[];
  approvals: Map<string, ApprovalView>;
  resolutions: Map<string, ResolutionView>;
  facts: Map<string, Readonly<Record<string, unknown>>>;
  captureGaps: Map<
    string,
    { id: string; intentID: string; fromSequence: number; toSequence: number; status: "open" | "resolved" }
  >;
  sequence: number;
  digest: string;
}
const emptyView = (): View => ({
  intents: new Map(),
  work: new Map(),
  claims: new Map(),
  evidence: [],
  approvals: new Map(),
  resolutions: new Map(),
  facts: new Map(),
  captureGaps: new Map(),
  sequence: 0,
  digest: "GENESIS",
});

const overlap = (left: readonly string[], right: readonly string[]): boolean =>
  left.some((a) => right.some((b) => a === b || a.startsWith(`${b}/`) || b.startsWith(`${a}/`)));
const reduce = (view: View, event: LedgerEvent): void => {
  const d = event.data;
  if (event.type === "intent.captured")
    view.intents.set(String(d.id), { ...(d as unknown as IntentInput), lifecycle: "captured", criteria: [] });
  if (event.type === "intent.framed") {
    const item = view.intents.get(String(d.intentID));
    if (item) {
      item.criteria = d.criteria as Criterion[];
      item.lifecycle = "framed";
    }
  }
  if (event.type === "intent.activated") {
    const item = view.intents.get(String(d.intentID));
    if (item) item.lifecycle = "active";
  }
  if (event.type === "work.proposed") view.work.set(String(d.id), d as unknown as WorkItem);
  if (event.type === "claim.acquired")
    view.claims.set(String(d.workID), { ...(d as unknown as ClaimView), released: false });
  if (event.type === "claim.released") {
    const claim = view.claims.get(String(d.workID));
    if (claim) {
      claim.released = true;
      claim.releasedAt = String(d.releasedAt ?? event.at);
    }
  }
  if (event.type === "evidence.submitted") view.evidence.push(d as unknown as EvidenceInput);
  if (event.type === "fact.recorded") view.facts.set(String(d.id), Object.freeze({ ...d }));
  if (event.type === "capture-gap.recorded")
    view.captureGaps.set(
      String(d.id),
      d as unknown as {
        id: string;
        intentID: string;
        fromSequence: number;
        toSequence: number;
        status: "open" | "resolved";
      },
    );
  if (event.type === "capture-gap.resolved") {
    const gap = view.captureGaps.get(String(d.id));
    if (gap) gap.status = "resolved";
  }
  if (event.type === "approval.requested")
    view.approvals.set(String(d.id), { ...(d as unknown as ApprovalView), confirmed: false });
  if (event.type === "approval.confirmed") {
    const approval = view.approvals.get(String(d.id));
    if (approval) approval.confirmed = true;
  }
  if (event.type === "resolution.proposed")
    view.resolutions.set(String(d.intentID), {
      ...(d as unknown as Omit<ResolutionView, "actor">),
      actor: event.actor,
    });
  if (event.type === "intent.reconciled") {
    const item = view.intents.get(String(d.intentID));
    if (item) item.lifecycle = "reconciled";
  }
  if (event.type === "intent.archived") {
    const item = view.intents.get(String(d.intentID));
    if (item) item.lifecycle = "archived";
  }
  view.sequence = event.sequence;
  view.digest = event.digest;
};

export class Ledger {
  readonly root: string;
  private constructor(root: string) {
    this.root = root;
  }
  static async open(projectDirectory: string): Promise<Ledger> {
    const root = path.join(projectDirectory, ".opencode/opencode2-config/ledger/v1");
    await mkdir(path.join(root, "events"), { recursive: true });
    const versionPath = path.join(root, "schema-version");
    try {
      if ((await readFile(versionPath, "utf8")).trim() !== "1") throw new DiagnosticError("LEDGER_VERSION_UNSUPPORTED");
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") await atomicWrite(versionPath, "1\n");
      else throw error;
    }
    const ledger = new Ledger(root);
    await ledger.view();
    return ledger;
  }
  private async view(): Promise<View> {
    const result = emptyView();
    for (const file of await listJSON(path.join(this.root, "events"))) {
      let event: LedgerEvent;
      try {
        event = decodeLedgerEvent(JSON.parse(await readFile(path.join(this.root, "events", file), "utf8")));
      } catch {
        throw new DiagnosticError("LEDGER_CORRUPT", file);
      }
      if (
        event.sequence !== result.sequence + 1 ||
        event.previousDigest !== result.digest ||
        digestCanonical({ ...event, digest: undefined }) !== event.digest
      )
        throw new DiagnosticError("LEDGER_REPLAY_INVALID", file);
      reduce(result, event);
    }
    return result;
  }
  private async append(
    type: string,
    aggregate: string,
    actor: Actor,
    data: Record<string, unknown>,
  ): Promise<LedgerEvent> {
    return withLease(this.root, async () => {
      const view = await this.view();
      const base = {
        schemaVersion: 1 as const,
        id: randomUUID(),
        sequence: view.sequence + 1,
        aggregate,
        type,
        at: new Date().toISOString(),
        actor,
        data,
        previousDigest: view.digest,
      };
      const event: LedgerEvent = { ...base, digest: digestCanonical(base) };
      await atomicWrite(
        path.join(this.root, "events", `${String(event.sequence).padStart(12, "0")}-${event.id}.json`),
        `${JSON.stringify(event)}\n`,
      );
      await atomicWrite(
        path.join(this.root, "checkpoint.json"),
        `${JSON.stringify({ schemaVersion: 1, sequence: event.sequence, digest: event.digest })}\n`,
      );
      return event;
    });
  }
  async snapshot(): Promise<Readonly<View>> {
    return this.view();
  }
  async contextProjection(sessionID: string): Promise<Record<string, unknown>> {
    const view = await this.view();
    const claims = [...view.claims.values()].filter((item) => !item.released && item.sessionID === sessionID);
    const rootSessionID = claims[0]?.rootSessionID ?? sessionID;
    const selected = claims.flatMap((claim) => {
      const work = view.work.get(claim.workID);
      return work ? [{ claim, work }] : [];
    });
    const intents = [...view.intents.values()]
      .filter((item) => selected.some(({ work }) => work.intentID === item.id && work.intentRevision === item.revision))
      .filter((item) => ["framed", "active", "resolving"].includes(item.lifecycle));
    return {
      trusted: {
        rootSessionID,
        sessionID,
        intentRevisions: intents.map(({ id, revision }) => ({ id, revision })),
        criterionRevisions: intents.flatMap(({ id: intentID, revision: intentRevision, criteria }) =>
          criteria.map(({ id, revision }) => ({ id, revision, intentID, intentRevision })),
        ),
        claimRevisions: selected.map(({ claim, work }) => ({
          id: claim.workID,
          revision: claim.revision,
          intentID: work.intentID,
          intentRevision: work.intentRevision,
        })),
      },
      source: {
        authority: "ledger-v1",
        intents: intents.map((item) => ({
          id: item.id,
          revision: item.revision,
          objective: item.objective,
          invariant: item.invariant,
          lifecycle: item.lifecycle,
          criteria: item.criteria.map((criterion) => ({
            id: criterion.id,
            revision: criterion.revision,
            observable: criterion.observable,
            oracle: criterion.oracle,
          })),
          scope: item.scope,
          nonGoals: item.nonGoals,
        })),
        claims: selected.map(({ claim, work }) => ({
          id: claim.workID,
          revision: claim.revision,
          intentID: work.intentID,
          intentRevision: work.intentRevision,
          rootSessionID: claim.rootSessionID,
          sessionID: claim.sessionID,
          scopeFingerprint: claim.scopeFingerprint,
        })),
        evidenceRefs: view.evidence
          .flatMap((evidence) => {
            const selectedClaim = selected.find(({ claim }) => claim.workID === evidence.workID);
            const work = selectedClaim?.work;
            if (!selectedClaim || !work || evidence.intentID !== work.intentID) return [];
            return [{ evidence, claim: selectedClaim.claim, work }];
          })
          .map(({ evidence, claim, work }) => ({
            id: evidence.id,
            kind: evidence.kind,
            intentID: work.intentID,
            intentRevision: work.intentRevision,
            claimID: claim.workID,
            claimRevision: claim.revision,
            criterionID: evidence.criterionID,
            criterionRevision: evidence.criterionRevision,
            locator: `ledger:evidence:${evidence.id}`,
            digest: evidence.outputDigest,
            taint: "trusted-metadata",
            freshness: "current",
          })),
      },
    };
  }
  async captureIntent(input: IntentInput, actor: Actor): Promise<void> {
    if (!(["root-user", "model"] as ActorKind[]).includes(actor.kind))
      throw new DiagnosticError("LEDGER_INTENT_AUTHORITY_INVALID");
    if (input.id.startsWith("engineering:") || input.rigor === "security")
      throw new DiagnosticError("LEDGER_ENGINEERING_INTENT_REQUIRES_DEDICATED_API");
    throw new DiagnosticError("PERSISTENCE_AUTOMATION_UNSUPPORTED", "intent.capture");
  }
  async frameIntent(intentID: string, criteria: Criterion[], actor: Actor): Promise<void> {
    if (!criteria.length || criteria.some((item) => !item.scenarios.length))
      throw new DiagnosticError("LEDGER_CRITERIA_REQUIRED");
    await this.append("intent.framed", intentID, actor, { intentID, criteria });
  }
  async activateIntent(intentID: string, actor: Actor): Promise<void> {
    const item = (await this.view()).intents.get(intentID);
    if (!item || item.lifecycle !== "framed") throw new DiagnosticError("LEDGER_INTENT_NOT_FRAMED");
    if (actor.kind !== "root-user") throw new DiagnosticError("LEDGER_ACTIVATION_AUTHORITY_INVALID");
    throw new DiagnosticError("PERSISTENCE_AUTOMATION_UNSUPPORTED", "intent.activation");
  }
  async proposeWork(item: WorkItem): Promise<void> {
    const view = await this.view();
    const intent = view.intents.get(item.intentID);
    if (!intent || item.intentRevision !== intent.revision) throw new DiagnosticError("LEDGER_REVISION_CONFLICT");
    for (const existing of view.work.values())
      if (
        existing.intentID === item.intentID &&
        existing.state !== "resolved" &&
        overlap(existing.writableScope, item.writableScope) &&
        existing.criterionIDs.some((id) => item.criterionIDs.includes(id))
      )
        throw new DiagnosticError("LEDGER_WORK_SCOPE_CONFLICT");
    await this.append("work.proposed", item.intentID, { kind: "model", sessionID: "proposal" }, { ...item });
  }
  async claimReady(
    workID: string,
    input: { sessionID: string; rootSessionID: string; token: string; expiresAt?: string },
  ): Promise<ClaimView> {
    await this.appendClaimCAS(workID, input);
    return (await this.view()).claims.get(workID)!;
  }
  async requireClaim(input: { workID: string; token: string; revision: number; digest: string }): Promise<void> {
    const claim = (await this.view()).claims.get(input.workID);
    if (
      !claim ||
      claim.released ||
      Date.parse(claim.expiresAt) <= Date.now() ||
      claim.token !== input.token ||
      claim.revision !== input.revision
    )
      throw new DiagnosticError("LEDGER_CLAIM_STALE");
    const expected = digestCanonical({
      workID: claim.workID,
      token: claim.token,
      revision: claim.revision,
      scopeFingerprint: claim.scopeFingerprint,
    });
    if (input.digest !== expected) throw new DiagnosticError("LEDGER_CLAIM_DIGEST_INVALID");
  }
  private async appendClaimCAS(
    workID: string,
    input: { sessionID: string; rootSessionID: string; token: string; expiresAt?: string },
  ): Promise<void> {
    await withLease(this.root, async (lease) => {
      const view = await this.view();
      const work = view.work.get(workID);
      const intent = work && view.intents.get(work.intentID);
      if (!work || !intent || intent.lifecycle !== "active" || work.state !== "pending")
        throw new DiagnosticError("LEDGER_WORK_NOT_READY");
      const existing = view.claims.get(workID);
      if (existing && !existing.released && Date.parse(existing.expiresAt) > Date.now())
        throw new DiagnosticError("LEDGER_CLAIM_CONFLICT");
      const acquiredAt = new Date().toISOString();
      const expiresAt = input.expiresAt ?? new Date(Date.parse(acquiredAt) + 60 * 60 * 1000).toISOString();
      if (!Number.isFinite(Date.parse(expiresAt)) || Date.parse(expiresAt) <= Date.parse(acquiredAt))
        throw new DiagnosticError("LEDGER_CLAIM_EXPIRY_INVALID", "claim.expiresAt");
      const data = {
        workID,
        ...input,
        revision: work.intentRevision,
        scopeFingerprint: digestCanonical(work.writableScope),
        fenceEpoch: (existing?.fenceEpoch ?? 0) + 1,
        acquiredAt,
        expiresAt,
      };
      const base = {
        schemaVersion: 1 as const,
        id: randomUUID(),
        sequence: view.sequence + 1,
        aggregate: work.intentID,
        type: "claim.acquired",
        at: new Date().toISOString(),
        actor: { kind: "plugin" as const, sessionID: input.sessionID },
        data,
        previousDigest: view.digest,
      };
      const event = { ...base, digest: digestCanonical(base) };
      await atomicWrite(
        path.join(this.root, "events", `${String(event.sequence).padStart(12, "0")}-${event.id}.json`),
        `${JSON.stringify(event)}\n`,
        lease,
      );
    });
  }
  async releaseClaim(workID: string, token: string, fenceEpoch?: number): Promise<void> {
    const claim = (await this.view()).claims.get(workID);
    if (!claim || claim.released || claim.token !== token) throw new DiagnosticError("LEDGER_CLAIM_TOKEN_INVALID");
    if (fenceEpoch !== undefined && fenceEpoch !== claim.fenceEpoch)
      throw new DiagnosticError("LEDGER_CLAIM_FENCE_STALE", "claim.fenceEpoch");
    throw new DiagnosticError("PERSISTENCE_AUTOMATION_UNSUPPORTED", "claim.release");
  }
  async submitEvidence(input: EvidenceInput): Promise<void> {
    const view = await this.view();
    if (view.evidence.some((item) => item.id === input.id))
      throw new DiagnosticError("LEDGER_EVIDENCE_IMMUTABLE", "evidence.id");
    const intent = view.intents.get(input.intentID);
    const criterion = intent?.criteria.find((item) => item.id === input.criterionID);
    if (!criterion || criterion.revision !== input.criterionRevision)
      throw new DiagnosticError("LEDGER_EVIDENCE_REVISION_STALE");
    if (input.expiresAt && Date.parse(input.expiresAt) <= Date.now())
      throw new DiagnosticError("LEDGER_EVIDENCE_STALE");
    if (input.status !== "passed") throw new DiagnosticError("LEDGER_EVIDENCE_NOT_ACCEPTED");
    if (input.eventIDs.length === 0) throw new DiagnosticError("LEDGER_EVIDENCE_EVENT_REQUIRED");
    const captured = await listJSON(path.join(this.root, "../../capture/v1/events"));
    for (const eventID of input.eventIDs)
      if (!captured.includes(`${digestCanonical(eventID).slice(7)}.json`))
        throw new DiagnosticError("LEDGER_EVIDENCE_EVENT_MISSING");
    await this.append("evidence.submitted", input.intentID, input.producer, { ...input });
  }
  async recordFact(
    input: { id: string; intentID: string; statement: string; provenance: string; digest: string; authority?: "none" },
    actor: Actor,
  ): Promise<void> {
    if (input.authority !== undefined && input.authority !== "none")
      throw new DiagnosticError("LEDGER_FACT_AUTHORITY_INVALID", "fact.authority");
    const view = await this.view();
    if (!view.intents.has(input.intentID)) throw new DiagnosticError("LEDGER_INTENT_MISSING", "fact.intentID");
    if (view.facts.has(input.id)) throw new DiagnosticError("LEDGER_FACT_IMMUTABLE", "fact.id");
    await this.append("fact.recorded", input.intentID, actor, { ...input, authority: "none" });
  }
  async recordCaptureGap(
    input: { id: string; intentID: string; fromSequence: number; toSequence: number },
    actor: Actor,
  ): Promise<void> {
    if (input.fromSequence < 1 || input.toSequence < input.fromSequence)
      throw new DiagnosticError("LEDGER_CAPTURE_GAP_INVALID", "capture-gap.toSequence");
    await this.append("capture-gap.recorded", input.intentID, actor, { ...input, status: "open" });
  }
  async resolveCaptureGap(id: string, actor: Actor): Promise<void> {
    const gap = (await this.view()).captureGaps.get(id);
    if (!gap || gap.status !== "open") throw new DiagnosticError("LEDGER_CAPTURE_GAP_MISSING", "capture-gap.id");
    await this.append("capture-gap.resolved", gap.intentID, actor, { id });
  }
  async proposeResolution(input: Omit<ResolutionView, "actor">, actor: Actor): Promise<void> {
    if (actor.kind !== "model") throw new DiagnosticError("LEDGER_RESOLUTION_ACTOR_INVALID");
    await this.append("resolution.proposed", input.intentID, actor, { ...input });
  }
  async requestApproval(intentID: string, reason: string, rootSessionID: string): Promise<ApprovalView> {
    const intent = (await this.view()).intents.get(intentID);
    if (!intent) throw new DiagnosticError("LEDGER_INTENT_MISSING", "approval.intentID");
    const item = { id: randomUUID(), intentID, reason, rootSessionID, revision: intent.revision, confirmed: false };
    await this.append("approval.requested", intentID, { kind: "model", sessionID: rootSessionID }, item);
    return item;
  }
  async confirmApproval(id: string, actor: Actor): Promise<void> {
    const view = await this.view();
    const approval = view.approvals.get(id);
    if (approval?.confirmed) throw new DiagnosticError("LEDGER_APPROVAL_REPLAYED", "approval.id");
    if (approval && view.intents.get(approval.intentID)?.revision !== approval.revision)
      throw new DiagnosticError("LEDGER_APPROVAL_REVISION_STALE", "approval.revision");
    if (
      !approval ||
      actor.kind !== "root-user" ||
      actor.sessionID !== approval.rootSessionID ||
      actor.correlationID !== id
    )
      throw new DiagnosticError("LEDGER_APPROVAL_AUTHORITY_INVALID");
    await this.append("approval.confirmed", approval.intentID, actor, { id });
  }
  async reconcile(intentID: string): Promise<void> {
    const view = await this.view();
    const intent = view.intents.get(intentID);
    if (!intent || intent.lifecycle !== "active") throw new DiagnosticError("LEDGER_INTENT_NOT_RESOLVABLE");
    const resolution = view.resolutions.get(intentID);
    if (!resolution || resolution.verdict !== "accept") throw new DiagnosticError("LEDGER_RESOLUTION_REQUIRED");
    if (
      ["security", "schema", "destructive", "irreversible"].includes(intent.rigor) &&
      ![...view.approvals.values()].some(
        (item) => item.intentID === intentID && item.revision === intent.revision && item.confirmed,
      )
    )
      throw new DiagnosticError("LEDGER_APPROVAL_REQUIRED");
    if ([...view.captureGaps.values()].some((gap) => gap.intentID === intentID && gap.status === "open"))
      throw new DiagnosticError("LEDGER_CAPTURE_GAP_OPEN", "intent.captureGaps");
    for (const criterion of intent.criteria) {
      const evidence = view.evidence.filter(
        (item) =>
          item.intentID === intentID &&
          item.criterionID === criterion.id &&
          item.criterionRevision === criterion.revision &&
          (!item.expiresAt || Date.parse(item.expiresAt) > Date.now()),
      );
      if (
        !criterion.requiredEvidence.every((kind) =>
          evidence.some(
            (item) => item.kind === kind && item.status === "passed" && resolution.evidenceIDs.includes(item.id),
          ),
        )
      )
        throw new DiagnosticError("LEDGER_EVIDENCE_INSUFFICIENT");
    }
    throw new DiagnosticError("PERSISTENCE_AUTOMATION_UNSUPPORTED", "intent.reconcile");
  }
  async archive(intentID: string, options: { faultAt?: ArchiveFaultBoundary } = {}): Promise<void> {
    if (options.faultAt === undefined)
      throw new DiagnosticError("LEDGER_ARCHIVE_AUTOMATION_UNSUPPORTED", "archive.fence");
    const view = await this.view();
    const intent = view.intents.get(intentID);
    if (!intent || intent.lifecycle !== "reconciled") throw new DiagnosticError("LEDGER_ARCHIVE_NOT_READY");
    const bundle = {
      schemaVersion: 1,
      intent,
      evidence: view.evidence.filter((item) => item.intentID === intentID),
      lineageDigest: view.digest,
    };
    const archived = await createArchiveTransaction(
      path.join(this.root, "archives"),
      {
        schemaVersion: 1,
        intentID,
        intentRevision: intent.revision,
        lineageDigest: bundle.lineageDigest,
        entities: [intent, ...bundle.evidence],
      },
      options,
    );
    JSON.parse(await readFile(archived.path, "utf8"));
    await this.append(
      "intent.archived",
      intentID,
      { kind: "plugin", sessionID: "reducer" },
      { intentID, bundle: path.relative(this.root, archived.path), bundleDigest: archived.digest },
    );
  }
}

export const ledgerFeature: FeatureRegistration = { id: "ledger", register: () => undefined };
