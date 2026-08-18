import assert from "node:assert/strict"
import { mkdtemp, rm } from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import test from "node:test"
import { NativeLoopEngine } from "../../dist/features/loop-engine/index.js"

test("unproved terminal events cannot begin disabled continuation", async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "loop-v1-"))
  const prompts = []
  try {
    const engine = await NativeLoopEngine.open(directory, { prompt: async (value) => prompts.push(value), interrupt: async () => {}, validateContinuation: async () => ({ claim: "current", fence: "current" }) })
    await assert.rejects(() => engine.start({ claim: { workID: "w", token: "t", revision: 1, digest: "sha256:x" }, rootSessionID: "root", dispatch: { id: "d", digest: "sha256:d" }, budgets: { maxIterations: 3, maxNoProgress: 1, maxChildren: 2, maxTools: 4 } }), { code: "PERSISTENCE_AUTOMATION_UNSUPPORTED" })
    assert.equal(prompts.length, 0)
  } finally { await rm(directory, { recursive: true, force: true }) }
})

test("user input cannot mutate an absent disabled continuation", async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "loop-v1-"))
  try {
    const engine = await NativeLoopEngine.open(directory, { prompt: async () => {}, interrupt: async () => {}, validateContinuation: async () => ({ claim: "current", fence: "current" }) })
    await assert.rejects(() => engine.start({ claim: { workID: "w", token: "t", revision: 1, digest: "sha256:x" }, rootSessionID: "root", dispatch: { id: "d", digest: "sha256:d" }, budgets: { maxIterations: 3, maxNoProgress: 2, maxChildren: 2, maxTools: 4 } }), { code: "PERSISTENCE_AUTOMATION_UNSUPPORTED" })
    await assert.rejects(() => engine.observeUserInput({ sessionID: "root", inputID: "human", type: "user" }), { code: "LOOP_NOT_STARTED" })
  } finally { await rm(directory, { recursive: true, force: true }) }
})

test("continuation fails closed when its journal transition cannot be fence-bound", async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "loop-v1-"))
  try {
    const engine = await NativeLoopEngine.open(directory, { prompt: async () => {}, interrupt: async () => {} })
    await assert.rejects(
      () => engine.start({ claim: { workID: "w", token: "t", revision: 1, digest: "sha256:x" }, rootSessionID: "root", dispatch: { id: "d", digest: "sha256:d" }, budgets: { maxIterations: 3, maxNoProgress: 1, maxChildren: 2, maxTools: 4 } }),
      { code: "PERSISTENCE_AUTOMATION_UNSUPPORTED" },
    )
  } finally { await rm(directory, { recursive: true, force: true }) }
})
