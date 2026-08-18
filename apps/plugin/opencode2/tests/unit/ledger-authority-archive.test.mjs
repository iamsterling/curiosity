import assert from "node:assert/strict"
import { mkdtemp, readFile, rm } from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import test from "node:test"
import { DiagnosticError, createArchiveTransaction, replayLedgerEvents } from "../../dist/features/ledger/index.js"

test("replay is deterministic and rejects a changed event", () => {
  const base = { schemaVersion: 1, id: "e1", sequence: 1, aggregate: "i", type: "fact.recorded", at: "2026-08-12T00:00:00.000Z", actor: { kind: "model", sessionID: "s" }, data: { id: "f" }, previousDigest: "GENESIS" }
  const first = replayLedgerEvents([base])
  const second = replayLedgerEvents([base])
  assert.equal(first.digest, second.digest)
  assert.throws(() => replayLedgerEvents([{ ...base, previousDigest: "wrong" }]), (error) => error instanceof DiagnosticError && error.code === "LEDGER_REPLAY_INVALID" && error.path === "events[0].previousDigest")
})

test("archive transaction leaves no committed or partial bundle when a boundary faults", async () => {
  for (const faultAt of ["write", "validate", "commit"]) {
    const root = await mkdtemp(path.join(os.tmpdir(), "ledger-archive-"))
    try {
      await assert.rejects(createArchiveTransaction(root, { schemaVersion: 1, intentID: "i", intentRevision: 1, lineageDigest: "line", entities: [] }, { faultAt }), (error) => error instanceof DiagnosticError && error.code === "LEDGER_ARCHIVE_TRANSACTION_FAILED")
      await assert.rejects(readFile(path.join(root, "i", "1.json")), { code: "ENOENT" })
    } finally { await rm(root, { recursive: true, force: true }) }
  }
})

test("archive transaction commits one digest-verifiable immutable bundle", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "ledger-archive-"))
  try {
    const result = await createArchiveTransaction(root, { schemaVersion: 1, intentID: "i", intentRevision: 1, lineageDigest: "line", entities: [] })
    const stored = JSON.parse(await readFile(result.path, "utf8"))
    assert.equal(stored.digest, result.digest)
    assert.equal(stored.committed, true)
  } finally { await rm(root, { recursive: true, force: true }) }
})
