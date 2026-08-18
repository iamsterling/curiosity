import assert from "node:assert/strict"
import { mkdtemp, rm } from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import test from "node:test"
import { decodeLoopJournal, NativeLoopEngine } from "../../dist/features/loop-engine/index.js"

const startInput = {
  claim: { workID: "work", token: "token", revision: 2, digest: "sha256:claim" },
  rootSessionID: "root",
  dispatch: { id: "dispatch", digest: "sha256:dispatch" },
  budgets: { maxIterations: 4, maxNoProgress: 3, maxChildren: 2, maxTools: 4 },
}
const currentAuthority = async () => ({ claim: "current", fence: "current" })

test("strict journal codec rejects unknown and malformed nested state", () => {
  assert.throws(() => decodeLoopJournal({ schemaVersion: 1, surprise: true }), { code: "LOOP_JOURNAL_SCHEMA_INVALID" })
})

test("continuation remains disabled even when preflight authority reports current", async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "native-loop-completion-"))
  const prompts = []
  try {
    const engine = await NativeLoopEngine.open(directory, {
      prompt: async (value) => prompts.push(value),
      interrupt: async () => {},
      validateContinuation: async () => ({ claim: "current", fence: "current" }),
    })
    await assert.rejects(() => engine.start(startInput), { code: "PERSISTENCE_AUTOMATION_UNSUPPORTED" })
    assert.equal(prompts.length, 0)
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})

test("an unpersisted disabled continuation leaves nothing to restart", async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "native-loop-restart-"))
  try {
    const engine = await NativeLoopEngine.open(directory, { prompt: async () => {}, interrupt: async () => {}, validateContinuation: currentAuthority })
    await assert.rejects(() => engine.start(startInput), { code: "PERSISTENCE_AUTOMATION_UNSUPPORTED" })
    const reopened = await NativeLoopEngine.open(directory, { prompt: async () => {}, interrupt: async () => {} })
    await assert.rejects(() => reopened.status(), { code: "LOOP_NOT_STARTED" })
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})

test("a claimed forward transition cannot bypass disabled persistence", async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "native-loop-restart-forward-"))
  const prompts = []
  try {
    const engine = await NativeLoopEngine.open(directory, { prompt: async (value) => prompts.push(value), interrupt: async () => {}, validateContinuation: currentAuthority })
    await assert.rejects(() => engine.start(startInput), { code: "PERSISTENCE_AUTOMATION_UNSUPPORTED" })
    assert.equal(prompts.length, 0)
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})

test("interrupt automation is disabled while host semantics remain unproven", async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "native-loop-interrupt-"))
  try {
    const engine = await NativeLoopEngine.open(directory, { prompt: async () => {}, interrupt: async () => {}, validateContinuation: currentAuthority })
    await assert.rejects(() => engine.stop(), { code: "REAL_HOST_INTERRUPT_UNPROVEN" })
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})

test("resume cannot operate without a persisted journal", async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "native-loop-resume-authority-"))
  const prompts = []
  let current = true
  try {
    const engine = await NativeLoopEngine.open(directory, {
      prompt: async (value) => prompts.push(value), interrupt: async () => {},
      validateContinuation: async () => ({ claim: current ? "current" : "stale", fence: "current" }),
    })
    await assert.rejects(() => engine.start(startInput), { code: "PERSISTENCE_AUTOMATION_UNSUPPORTED" })
    current = false
    await assert.rejects(() => engine.resume(), { code: "LOOP_NOT_STARTED" })
    assert.equal(prompts.length, 0)
  } finally { await rm(directory, { recursive: true, force: true }) }
})

test("resume does not dispatch when persistence is disabled", async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "native-loop-resume-once-"))
  const prompts = []
  try {
    const engine = await NativeLoopEngine.open(directory, {
      prompt: async (value) => prompts.push(value), interrupt: async () => {},
      validateContinuation: async () => ({ claim: "current", fence: "current" }),
    })
    await assert.rejects(() => engine.start(startInput), { code: "PERSISTENCE_AUTOMATION_UNSUPPORTED" })
    assert.equal(prompts.length, 0)
  } finally { await rm(directory, { recursive: true, force: true }) }
})

test("compaction cannot create a journal while persistence is disabled", async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "native-loop-compaction-"))
  const prompts = []
  try {
    const engine = await NativeLoopEngine.open(directory, {
      prompt: async (value) => prompts.push(value), interrupt: async () => {},
      validateContinuation: async () => ({ claim: "current", fence: "current" }),
    })
    await assert.rejects(() => engine.start(startInput), { code: "PERSISTENCE_AUTOMATION_UNSUPPORTED" })
    await assert.rejects(() => engine.prepareCompaction(["evidence:1"], 7), { code: "LOOP_NOT_STARTED" })
    assert.equal(prompts.length, 0)
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})

test("unproved terminality cannot be evaluated without proven persistence", async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "native-loop-breaker-"))
  try {
    const engine = await NativeLoopEngine.open(directory, {
      prompt: async () => {}, interrupt: async () => {},
      validateContinuation: async () => ({ claim: "current", fence: "current" }),
    })
    await assert.rejects(
      () => engine.start({ ...startInput, budgets: { ...startInput.budgets, maxNoProgress: 1 } }),
      { code: "PERSISTENCE_AUTOMATION_UNSUPPORTED" },
    )
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})
