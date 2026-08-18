import assert from "node:assert/strict"
import { spawn } from "node:child_process"
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import test from "node:test"
import { acquireLease, assertLease, atomicWrite, readJSON, releaseLease, withLease, writeObservation } from "../../dist/platform/persistence/atomic-store.js"

const temporary = async (name) => mkdtemp(path.join(os.tmpdir(), `${name}-`))
const runWriter = (root, target) => new Promise((resolve) => {
  const child = spawn(process.execPath, ["tests/fixtures/process-writer.mjs", root, target], { cwd: process.cwd() })
  let output = ""
  child.stdout.on("data", (chunk) => { output += chunk })
  child.on("close", (code) => resolve({ code, output: output.trim() }))
})

test("only one real process enters a material transition", async () => {
  const root = await temporary("persistence-race")
  try {
    const target = path.join(root, "state.json")
    const results = await Promise.all([runWriter(root, target), runWriter(root, target)])
    assert.equal(results.filter((result) => result.output === "entered").length, 1)
    assert.equal(results.filter((result) => result.output === "LEDGER_WRITER_BUSY").length, 1)
  } finally { await rm(root, { recursive: true, force: true }) }
})

test("stale lease cannot commit or remove a recovered writer lease", async () => {
  const root = await temporary("persistence-stale")
  try {
    const stale = await acquireLease(root)
    await rm(path.join(root, ".writer-lock"), { recursive: true, force: true })
    const current = await acquireLease(root)
    await assert.rejects(() => assertLease(stale), { code: "PERSISTENCE_LEASE_STALE" })
    await assert.rejects(() => atomicWrite(path.join(root, "state.json"), "{}\n", stale), { code: "PERSISTENCE_LEASE_STALE" })
    await releaseLease(stale)
    await assertLease(current)
    await releaseLease(current)
  } finally { await rm(root, { recursive: true, force: true }) }
})

test("lease replacement immediately before rename prevents stale commit", async () => {
  const root = await temporary("persistence-rename-race")
  try {
    const target = path.join(root, "state.json")
    await atomicWrite(target, '{"owner":"initial"}\n')
    const stale = await acquireLease(root)
    await rm(path.join(root, ".writer-lock"), { recursive: true, force: true })
    const current = await acquireLease(root)
    await assert.rejects(() => atomicWrite(target, '{"owner":"stale"}\n', stale), { code: "PERSISTENCE_LEASE_STALE" })
    assert.deepEqual(JSON.parse(await readFile(target, "utf8")), { owner: "initial" })
    await releaseLease(current)
  } finally { await rm(root, { recursive: true, force: true }) }
})

test("lease-protected atomic publication fails closed when rename cannot bind the lease", async () => {
  const root = await temporary("persistence-unprovable-rename")
  try {
    const lease = await acquireLease(root)
    await assert.rejects(
      () => atomicWrite(path.join(root, "state.json"), '{"owner":"writer"}\n', lease),
      { code: "PERSISTENCE_AUTOMATION_UNSUPPORTED" },
    )
    await assert.rejects(readFile(path.join(root, "state.json")), { code: "ENOENT" })
    await releaseLease(lease)
  } finally { await rm(root, { recursive: true, force: true }) }
})

test("observation publication remains available without authoritative fencing", async () => {
  const root = await temporary("persistence-observation")
  try {
    const target = path.join(root, "observation.json")
    await withLease(root, async () => writeObservation(target, '{"status":"observed"}\n'))
    assert.deepEqual(JSON.parse(await readFile(target, "utf8")), { status: "observed" })
  } finally { await rm(root, { recursive: true, force: true }) }
})

test("malformed nested JSON is quarantined and reports its persisted path", async () => {
  const root = await temporary("persistence-corrupt")
  try {
    const target = path.join(root, "state.json")
    await writeFile(target, '{"outer":{"items":[{"id":1}]}}')
    await assert.rejects(
      () => readJSON(target, (value, at) => {
        const record = value
        if (typeof record !== "object" || record === null) throw new Error(at)
        const id = record.outer?.items?.[0]?.id
        if (typeof id !== "string") throw new Error(`${at}.outer.items[0].id`)
        return record
      }),
      (error) => error.code === "PERSISTENCE_SCHEMA_INVALID" && error.path === `${target}.outer.items[0].id`,
    )
    await assert.rejects(() => withLease(root, async () => atomicWrite(target, "{}\n")), { code: "PERSISTENCE_CORRUPT_BLOCKED" })
  } finally { await rm(root, { recursive: true, force: true }) }
})

test("a direct mutation quarantines malformed JSON rather than replacing it", async () => {
  const root = await temporary("persistence-direct-corrupt")
  try {
    const target = path.join(root, "state.json")
    await writeFile(target, "{malformed")
    await assert.rejects(() => withLease(root, async () => atomicWrite(target, "{}\n")), { code: "PERSISTENCE_CORRUPT" })
    await assert.rejects(() => withLease(root, async () => atomicWrite(target, "{}\n")), { code: "PERSISTENCE_CORRUPT_BLOCKED" })
  } finally { await rm(root, { recursive: true, force: true }) }
})

test("valid checkpoint recovers a torn pointer without accepting corrupt truth", async () => {
  const root = await temporary("persistence-checkpoint")
  try {
    const target = path.join(root, "state.json")
    await atomicWrite(target, '{"revision":1}\n')
    await atomicWrite(target, '{"revision":2}\n')
    await writeFile(target, "{torn")
    assert.deepEqual(await readJSON(target), { revision: 1 })
    assert.deepEqual(JSON.parse(await readFile(target, "utf8")), { revision: 1 })
  } finally { await rm(root, { recursive: true, force: true }) }
})

test("a missing pointer recovers from its valid checkpoint", async () => {
  const root = await temporary("persistence-missing-pointer")
  try {
    const target = path.join(root, "state.json")
    await atomicWrite(target, '{"revision":1}\n')
    await atomicWrite(target, '{"revision":2}\n')
    await rm(target)
    assert.deepEqual(await readJSON(target), { revision: 1 })
  } finally { await rm(root, { recursive: true, force: true }) }
})
