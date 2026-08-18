import assert from "node:assert/strict"
import { mkdtemp, rm } from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import test from "node:test"
import {
  DiagnosticError,
  Ledger,
  decodeLedgerEvent,
  digestCanonical,
} from "../../dist/features/ledger/index.js"

const criterion = { id: "c1", revision: 1, observable: "exit status", oracle: "equals zero", requiredEvidence: ["test-green"], scenarios: ["s1"] }
const intent = { id: "i1", objective: "change behavior", invariant: "no regression", scope: ["src/a.ts"], nonGoals: [], rigor: "behavioral", revision: 1 }

const code = async (run) => { try { await run(); return "" } catch (error) { assert.ok(error instanceof DiagnosticError); return error.code } }

test("strict event decoding rejects future versions and unknown nested fields", () => {
  assert.throws(() => decodeLedgerEvent({ schemaVersion: 2 }), /LEDGER_VERSION_UNSUPPORTED/)
  assert.throws(() => decodeLedgerEvent({ schemaVersion: 1, id: "e", sequence: 1, aggregate: "i1", type: "intent.captured", at: "x", actor: { kind: "user", sessionID: "s", extra: true }, data: {} }), /LEDGER_SCHEMA_INVALID/)
})

test("canonical digests are key-order independent", () => {
  assert.equal(digestCanonical({ b: 2, a: 1 }), digestCanonical({ a: 1, b: 2 }))
})

test("activation and claim automation fail closed while commit-bound fencing is unproven", async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "ledger-v1-"))
  try {
    const ledger = await Ledger.open(directory)
    await assert.rejects(
      () => ledger.captureIntent(intent, { kind: "root-user", sessionID: "root" }),
      { code: "PERSISTENCE_AUTOMATION_UNSUPPORTED" },
    )
    await assert.rejects(
      () => ledger.claimReady("w1", { sessionID: "s1", rootSessionID: "root", token: "t1" }),
      { code: "LEDGER_WORK_NOT_READY" },
    )
  } finally { await rm(directory, { recursive: true, force: true }) }
})

test("synthetic approval and artifact-only completion fail closed", async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "ledger-v1-"))
  try {
    const ledger = await Ledger.open(directory)
    assert.equal(await code(() => ledger.captureIntent({ ...intent, rigor: "destructive" }, { kind: "root-user", sessionID: "root" })), "PERSISTENCE_AUTOMATION_UNSUPPORTED")
    assert.equal(await code(() => ledger.reconcile("i1")), "LEDGER_INTENT_NOT_RESOLVABLE")
  } finally { await rm(directory, { recursive: true, force: true }) }
})

test("approval automation cannot create authority without proven persistence", async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "ledger-approval-vectors-"))
  try {
    const ledger = await Ledger.open(directory)
    await assert.rejects(() => ledger.captureIntent(intent, { kind: "model", sessionID: "root" }), { code: "PERSISTENCE_AUTOMATION_UNSUPPORTED" })
    await assert.rejects(() => ledger.requestApproval(intent.id, "security", "root"), { code: "LEDGER_INTENT_MISSING" })
  } finally { await rm(directory, { recursive: true, force: true }) }
})

test("intent revision writes remain disabled without commit-bound fencing", async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "ledger-approval-revision-"))
  try {
    const ledger = await Ledger.open(directory)
    await assert.rejects(() => ledger.captureIntent(intent, { kind: "model", sessionID: "root" }), { code: "PERSISTENCE_AUTOMATION_UNSUPPORTED" })
    await assert.rejects(() => ledger.captureIntent({ ...intent, revision: 2 }, { kind: "model", sessionID: "root" }), { code: "PERSISTENCE_AUTOMATION_UNSUPPORTED" })
  } finally { await rm(directory, { recursive: true, force: true }) }
})
