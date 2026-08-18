import assert from "node:assert/strict"
import test from "node:test"
import {
  DiagnosticError,
  applyCapabilityDelta,
  decodeLedgerEntity,
  explainDependencies,
  validateProposal,
} from "../../dist/features/ledger/index.js"

const fails = (code, path, run) => {
  assert.throws(run, (error) => error instanceof DiagnosticError && error.code === code && error.path === path)
}

test("the closed v1 domain strictly decodes all fourteen canonical entities", () => {
  const entities = [
    { entityType: "intent", id: "i", revision: 1, objective: "ship", invariant: "safe", scope: ["src"], nonGoals: [], rigor: "behavioral", lifecycle: "active" },
    { entityType: "capability", id: "cap", revision: 1, scenarios: ["s"] },
    { entityType: "criterion", id: "c", intentID: "i", revision: 1, observable: "exit", oracle: "zero", requiredEvidence: ["test-green"], scenarios: ["s"] },
    { entityType: "scenario", id: "s", capabilityID: "cap", revision: 1, parentRevision: null, strength: 2, destructive: false },
    { entityType: "work", id: "w", intentID: "i", intentRevision: 1, criterionIDs: ["c"], writableScope: ["src/a"], state: "pending" },
    { entityType: "dependency", id: "d", fromWorkID: "w", toWorkID: "w0", kind: "blocks" },
    { entityType: "claim", id: "cl", workID: "w", token: "t", sessionID: "s", rootSessionID: "r", revision: 1, scopeFingerprint: "x", fenceEpoch: 2, acquiredAt: "2026-08-12T00:00:00.000Z", expiresAt: "2026-08-13T00:00:00.000Z", releasedAt: null },
    { entityType: "evidence", id: "e", kind: "test-green", intentID: "i", criterionID: "c", criterionRevision: 1, workID: "w", executionID: "x", environmentDigest: "a", inputDigest: "b", outputDigest: "c", status: "passed", eventIDs: ["event"], observedAt: "2026-08-12T00:00:00.000Z", producer: { kind: "tool", sessionID: "s" } },
    { entityType: "fact", id: "f", intentID: "i", statement: "observed", provenance: "probe", digest: "d", authority: "none" },
    { entityType: "resolution", id: "r", intentID: "i", verdict: "accept", rationale: "proved", evidenceIDs: ["e"] },
    { entityType: "approval", id: "a", intentID: "i", reason: "destructive", rootSessionID: "root", revision: 1, confirmed: false },
    { entityType: "capture-gap", id: "g", intentID: "i", fromSequence: 2, toSequence: 3, status: "open" },
    { entityType: "audit", id: "au", action: "proposal", actor: { kind: "model", sessionID: "s" }, subjectID: "i", at: "2026-08-12T00:00:00.000Z" },
    { entityType: "archive", id: "ar", intentID: "i", intentRevision: 1, lineageDigest: "d", bundleDigest: "b", committed: true },
  ]
  for (const entity of entities) assert.equal(decodeLedgerEntity({ schemaVersion: 1, ...entity }).entityType, entity.entityType)
  fails("LEDGER_SCHEMA_INVALID", "intent.extra", () => decodeLedgerEntity({ schemaVersion: 1, ...entities[0], extra: true }))
  fails("LEDGER_VERSION_UNSUPPORTED", "schemaVersion", () => decodeLedgerEntity({ schemaVersion: 2, ...entities[0] }))
})

test("capability deltas require the exact base and scenario weakening requires bounded approval", () => {
  const base = { entityType: "capability", id: "cap", revision: 2, scenarios: ["s"] }
  const scenario = { entityType: "scenario", id: "s", capabilityID: "cap", revision: 2, parentRevision: 1, strength: 2, destructive: false }
  fails("LEDGER_DELTA_BASE_CONFLICT", "delta.baseRevision", () => applyCapabilityDelta(base, [scenario], { id: "d", capabilityID: "cap", baseRevision: 1, targetRevision: 2, upsertScenarios: [], removeScenarioIDs: [] }))
  fails("LEDGER_SCENARIO_APPROVAL_REQUIRED", "delta.upsertScenarios[0]", () => applyCapabilityDelta(base, [scenario], { id: "d", capabilityID: "cap", baseRevision: 2, targetRevision: 3, upsertScenarios: [{ ...scenario, revision: 3, parentRevision: 2, strength: 1 }], removeScenarioIDs: [] }))
  const changed = applyCapabilityDelta(base, [scenario], { id: "d", capabilityID: "cap", baseRevision: 2, targetRevision: 3, upsertScenarios: [{ ...scenario, revision: 3, parentRevision: 2, strength: 1 }], removeScenarioIDs: [], approvalID: "a" }, new Set(["a"]))
  assert.equal(changed.capability.revision, 3)
})

test("dependency explanations are deterministic and expose cycles, blockers, and conflicts", () => {
  const work = [
    { id: "a", writableScope: ["src/a"], state: "pending" },
    { id: "b", writableScope: ["src/a/x"], state: "blocked" },
  ]
  const result = explainDependencies(work, [{ id: "ab", fromWorkID: "a", toWorkID: "b", kind: "blocks" }, { id: "ba", fromWorkID: "b", toWorkID: "a", kind: "blocks" }], "a")
  assert.deepEqual(result.cycle, ["a", "b", "a"])
  assert.deepEqual(result.blockers, ["b"])
  assert.deepEqual(result.conflicts, ["b"])
  assert.equal(result.ready, false)
})

test("facts cannot claim authority and proposal validation rejects fabricated completion", () => {
  fails("LEDGER_FACT_AUTHORITY_INVALID", "proposal.authority", () => validateProposal("fact", { authority: "ledger-v1" }, { kind: "model", sessionID: "s" }))
  fails("LEDGER_PROPOSAL_AUTHORITY_INVALID", "proposal.lifecycle", () => validateProposal("intent", { lifecycle: "reconciled" }, { kind: "model", sessionID: "s" }))
})
