import { digestCanonical } from "../../core/canonical/index.js";
import { DiagnosticError } from "../../core/diagnostics/diagnostic.js";
import type { Actor, LedgerEvent } from "./index.js";

export const LEDGER_ENTITY_TYPES = [
  "intent",
  "capability",
  "criterion",
  "scenario",
  "work",
  "dependency",
  "claim",
  "evidence",
  "fact",
  "resolution",
  "approval",
  "capture-gap",
  "audit",
  "archive",
] as const;
export type LedgerEntityType = (typeof LEDGER_ENTITY_TYPES)[number];
export type LedgerEntity = Readonly<
  Record<string, unknown> & { schemaVersion: 1; entityType: LedgerEntityType; id: string }
>;

const keys: Record<LedgerEntityType, readonly string[]> = {
  intent: [
    "schemaVersion",
    "entityType",
    "id",
    "revision",
    "objective",
    "invariant",
    "scope",
    "nonGoals",
    "rigor",
    "lifecycle",
  ],
  capability: ["schemaVersion", "entityType", "id", "revision", "scenarios"],
  criterion: [
    "schemaVersion",
    "entityType",
    "id",
    "intentID",
    "revision",
    "observable",
    "oracle",
    "requiredEvidence",
    "scenarios",
  ],
  scenario: [
    "schemaVersion",
    "entityType",
    "id",
    "capabilityID",
    "revision",
    "parentRevision",
    "strength",
    "destructive",
  ],
  work: ["schemaVersion", "entityType", "id", "intentID", "intentRevision", "criterionIDs", "writableScope", "state"],
  dependency: ["schemaVersion", "entityType", "id", "fromWorkID", "toWorkID", "kind"],
  claim: [
    "schemaVersion",
    "entityType",
    "id",
    "workID",
    "token",
    "sessionID",
    "rootSessionID",
    "revision",
    "scopeFingerprint",
    "fenceEpoch",
    "acquiredAt",
    "expiresAt",
    "releasedAt",
  ],
  evidence: [
    "schemaVersion",
    "entityType",
    "id",
    "kind",
    "intentID",
    "criterionID",
    "criterionRevision",
    "workID",
    "executionID",
    "environmentDigest",
    "inputDigest",
    "outputDigest",
    "status",
    "eventIDs",
    "observedAt",
    "expiresAt",
    "producer",
  ],
  fact: ["schemaVersion", "entityType", "id", "intentID", "statement", "provenance", "digest", "authority"],
  resolution: ["schemaVersion", "entityType", "id", "intentID", "verdict", "rationale", "evidenceIDs"],
  approval: ["schemaVersion", "entityType", "id", "intentID", "reason", "rootSessionID", "revision", "confirmed"],
  "capture-gap": ["schemaVersion", "entityType", "id", "intentID", "fromSequence", "toSequence", "status"],
  audit: ["schemaVersion", "entityType", "id", "action", "actor", "subjectID", "at"],
  archive: [
    "schemaVersion",
    "entityType",
    "id",
    "intentID",
    "intentRevision",
    "lineageDigest",
    "bundleDigest",
    "committed",
  ],
};

const object = (value: unknown, path: string): Record<string, unknown> => {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new DiagnosticError("LEDGER_SCHEMA_INVALID", path);
  return value as Record<string, unknown>;
};
const strings = (value: unknown): value is readonly string[] =>
  Array.isArray(value) && value.every((item) => typeof item === "string");
const requireString = (entity: Record<string, unknown>, key: string, path: string): void => {
  if (typeof entity[key] !== "string" || entity[key] === "")
    throw new DiagnosticError("LEDGER_SCHEMA_INVALID", `${path}.${key}`);
};
const requireNumber = (entity: Record<string, unknown>, key: string, path: string): void => {
  if (!Number.isInteger(entity[key]) || Number(entity[key]) < 0)
    throw new DiagnosticError("LEDGER_SCHEMA_INVALID", `${path}.${key}`);
};

export const decodeLedgerEntity = (value: unknown, path = "entity"): LedgerEntity => {
  const entity = object(value, path);
  if (entity.schemaVersion !== 1) throw new DiagnosticError("LEDGER_VERSION_UNSUPPORTED", "schemaVersion");
  if (!LEDGER_ENTITY_TYPES.includes(entity.entityType as LedgerEntityType))
    throw new DiagnosticError("LEDGER_ENTITY_TYPE_INVALID", `${path}.entityType`);
  const type = entity.entityType as LedgerEntityType;
  for (const key of Object.keys(entity))
    if (!keys[type].includes(key)) throw new DiagnosticError("LEDGER_SCHEMA_INVALID", `${type}.${key}`);
  for (const key of keys[type]) {
    if (!(key in entity) && !(type === "evidence" && key === "expiresAt"))
      throw new DiagnosticError("LEDGER_SCHEMA_INVALID", `${type}.${key}`);
  }
  requireString(entity, "id", type);
  if ("revision" in entity) requireNumber(entity, "revision", type);
  if ("intentRevision" in entity) requireNumber(entity, "intentRevision", type);
  if (type === "claim") requireNumber(entity, "fenceEpoch", type);
  if (type === "capture-gap") {
    requireNumber(entity, "fromSequence", type);
    requireNumber(entity, "toSequence", type);
    if (Number(entity.toSequence) < Number(entity.fromSequence))
      throw new DiagnosticError("LEDGER_SCHEMA_INVALID", `${type}.toSequence`);
  }
  for (const key of [
    "scope",
    "nonGoals",
    "scenarios",
    "requiredEvidence",
    "criterionIDs",
    "writableScope",
    "eventIDs",
    "evidenceIDs",
  ])
    if (key in entity && !strings(entity[key])) throw new DiagnosticError("LEDGER_SCHEMA_INVALID", `${type}.${key}`);
  if (type === "fact" && entity.authority !== "none")
    throw new DiagnosticError("LEDGER_FACT_AUTHORITY_INVALID", "fact.authority");
  if (type === "evidence" || type === "audit") {
    const actor = object(entity.producer ?? entity.actor, `${type}.${type === "evidence" ? "producer" : "actor"}`);
    for (const key of Object.keys(actor))
      if (!["kind", "sessionID", "correlationID"].includes(key))
        throw new DiagnosticError(
          "LEDGER_SCHEMA_INVALID",
          `${type}.${type === "evidence" ? "producer" : "actor"}.${key}`,
        );
    requireString(actor, "kind", `${type}.${type === "evidence" ? "producer" : "actor"}`);
    requireString(actor, "sessionID", `${type}.${type === "evidence" ? "producer" : "actor"}`);
  }
  return Object.freeze({ ...entity }) as LedgerEntity;
};

export interface CapabilityDelta {
  readonly id: string;
  readonly capabilityID: string;
  readonly baseRevision: number;
  readonly targetRevision: number;
  readonly upsertScenarios: readonly Record<string, unknown>[];
  readonly removeScenarioIDs: readonly string[];
  readonly approvalID?: string;
}

export const applyCapabilityDelta = (
  capability: Readonly<Record<string, unknown>>,
  scenarios: readonly Readonly<Record<string, unknown>>[],
  delta: CapabilityDelta,
  confirmedApprovals: ReadonlySet<string> = new Set(),
): { capability: LedgerEntity; scenarios: readonly LedgerEntity[] } => {
  if (
    delta.capabilityID !== capability.id ||
    delta.baseRevision !== capability.revision ||
    delta.targetRevision !== delta.baseRevision + 1
  )
    throw new DiagnosticError("LEDGER_DELTA_BASE_CONFLICT", "delta.baseRevision");
  const next = new Map(scenarios.map((scenario) => [String(scenario.id), scenario]));
  const consequential =
    delta.removeScenarioIDs.length > 0 ||
    delta.upsertScenarios.some((candidate) => {
      const prior = next.get(String(candidate.id));
      return (
        prior !== undefined && (Number(candidate.strength) < Number(prior.strength) || candidate.destructive === true)
      );
    });
  if (consequential && (!delta.approvalID || !confirmedApprovals.has(delta.approvalID))) {
    const index = delta.upsertScenarios.findIndex((candidate) => {
      const prior = next.get(String(candidate.id));
      return (
        prior !== undefined && (Number(candidate.strength) < Number(prior.strength) || candidate.destructive === true)
      );
    });
    throw new DiagnosticError(
      "LEDGER_SCENARIO_APPROVAL_REQUIRED",
      index >= 0 ? `delta.upsertScenarios[${index}]` : "delta.removeScenarioIDs",
    );
  }
  for (const id of delta.removeScenarioIDs) next.delete(id);
  for (const candidate of delta.upsertScenarios) {
    const prior = next.get(String(candidate.id));
    if (
      candidate.capabilityID !== capability.id ||
      candidate.revision !== delta.targetRevision ||
      candidate.parentRevision !== (prior?.revision ?? null)
    )
      throw new DiagnosticError(
        "LEDGER_SCENARIO_LINEAGE_INVALID",
        `delta.upsertScenarios[${delta.upsertScenarios.indexOf(candidate)}]`,
      );
    next.set(String(candidate.id), candidate);
  }
  const scenarioIDs = [...next.keys()].sort();
  return {
    capability: decodeLedgerEntity(
      {
        ...capability,
        schemaVersion: 1,
        entityType: "capability",
        revision: delta.targetRevision,
        scenarios: scenarioIDs,
      },
      "capability",
    ),
    scenarios: [...next.values()]
      .sort((a, b) => String(a.id).localeCompare(String(b.id)))
      .map((item) => decodeLedgerEntity({ ...item, schemaVersion: 1, entityType: "scenario" }, "scenario")),
  };
};

const scopesOverlap = (left: readonly string[], right: readonly string[]): boolean =>
  left.some((a) => right.some((b) => a === b || a.startsWith(`${b}/`) || b.startsWith(`${a}/`)));

export const explainDependencies = (
  work: readonly { id: string; writableScope: readonly string[]; state: string }[],
  dependencies: readonly { id: string; fromWorkID: string; toWorkID: string; kind: string }[],
  workID: string,
): {
  ready: boolean;
  edges: readonly string[];
  blockers: readonly string[];
  conflicts: readonly string[];
  cycle: readonly string[];
} => {
  const byID = new Map(work.map((item) => [item.id, item]));
  const edges = dependencies.filter((edge) => edge.fromWorkID === workID).sort((a, b) => a.id.localeCompare(b.id));
  const blockers = edges
    .filter((edge) => edge.kind === "blocks" && byID.get(edge.toWorkID)?.state !== "resolved")
    .map((edge) => edge.toWorkID)
    .sort();
  const current = byID.get(workID);
  const conflicts = current
    ? work
        .filter(
          (item) =>
            item.id !== workID && item.state !== "resolved" && scopesOverlap(current.writableScope, item.writableScope),
        )
        .map((item) => item.id)
        .sort()
    : [];
  const visit = (id: string, route: string[]): string[] => {
    const repeated = route.indexOf(id);
    if (repeated >= 0) return [...route.slice(repeated), id];
    for (const edge of dependencies.filter((item) => item.fromWorkID === id).sort((a, b) => a.id.localeCompare(b.id))) {
      const found = visit(edge.toWorkID, [...route, id]);
      if (found.length > 0) return found;
    }
    return [];
  };
  const cycle = visit(workID, []);
  return {
    ready: current?.state === "pending" && blockers.length === 0 && conflicts.length === 0 && cycle.length === 0,
    edges: edges.map((edge) => edge.id),
    blockers,
    conflicts,
    cycle,
  };
};

export const validateProposal = (
  kind: "fact" | "intent" | "resolution" | "work",
  proposal: unknown,
  actor: Actor,
): Readonly<Record<string, unknown>> => {
  const value = object(proposal, "proposal");
  if (kind === "fact" && value.authority !== undefined && value.authority !== "none")
    throw new DiagnosticError("LEDGER_FACT_AUTHORITY_INVALID", "proposal.authority");
  if (
    kind === "intent" &&
    ["active", "reconciled", "archived"].includes(String(value.lifecycle)) &&
    actor.kind !== "root-user"
  )
    throw new DiagnosticError("LEDGER_PROPOSAL_AUTHORITY_INVALID", "proposal.lifecycle");
  if (kind === "resolution" && actor.kind !== "model")
    throw new DiagnosticError("LEDGER_RESOLUTION_ACTOR_INVALID", "proposal");
  return Object.freeze({ ...value });
};

export const replayLedgerEvents = (
  inputs: readonly Omit<LedgerEvent, "digest">[] | readonly LedgerEvent[],
): {
  digest: string;
  events: readonly LedgerEvent[];
  entities: ReadonlyMap<string, Readonly<Record<string, unknown>>>;
} => {
  let previousDigest = "GENESIS";
  const events: LedgerEvent[] = [];
  const entities = new Map<string, Readonly<Record<string, unknown>>>();
  inputs.forEach((input, index) => {
    if (input.schemaVersion !== 1)
      throw new DiagnosticError("LEDGER_VERSION_UNSUPPORTED", `events[${index}].schemaVersion`);
    if (input.sequence !== index + 1) throw new DiagnosticError("LEDGER_REPLAY_INVALID", `events[${index}].sequence`);
    if (input.previousDigest !== previousDigest)
      throw new DiagnosticError("LEDGER_REPLAY_INVALID", `events[${index}].previousDigest`);
    const base = { ...input, digest: undefined };
    const digest = digestCanonical(base);
    if ("digest" in input && input.digest !== digest)
      throw new DiagnosticError("LEDGER_REPLAY_INVALID", `events[${index}].digest`);
    const event = Object.freeze({ ...input, digest }) as LedgerEvent;
    events.push(event);
    previousDigest = digest;
    if (event.data.entityType && event.data.id) {
      const entity = decodeLedgerEntity(event.data, `events[${index}].data`);
      entities.set(`${entity.entityType}:${entity.id}`, entity);
    }
  });
  return { digest: previousDigest, events: Object.freeze(events), entities };
};

export const explainReadiness = (input: {
  dependency: ReturnType<typeof explainDependencies>;
  openCaptureGaps?: readonly string[];
  expiredClaim?: boolean;
  evidenceConflicts?: readonly string[];
}) => {
  const reasons = [
    ...(input.dependency.cycle.length ? ["dependency-cycle"] : []),
    ...input.dependency.blockers.map((id) => `blocked-by:${id}`),
    ...input.dependency.conflicts.map((id) => `scope-conflict:${id}`),
    ...(input.openCaptureGaps ?? []).map((id) => `capture-gap:${id}`),
    ...(input.expiredClaim ? ["claim-expired"] : []),
    ...(input.evidenceConflicts ?? []).map((id) => `evidence-conflict:${id}`),
  ].sort();
  return { ready: reasons.length === 0 && input.dependency.ready, reasons };
};
