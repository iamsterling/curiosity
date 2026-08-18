import assert from "node:assert/strict"
import { promises as fs } from "node:fs"
import os from "node:os"
import path from "node:path"

import OpenCodeLoopPlugin, { dispatchEvent, makeClient } from "../src/index.js"

const directory = await fs.mkdtemp(path.join(os.tmpdir(), "opencode-loop-smoke-"))
const sessionID = "ses_smoke_goal"
const prompts = []
const toolHooks = {}
let tools = []
let cleanup

function event(type, data = {}, extra = {}) {
  return { type, location: { directory }, data, ...extra }
}

async function command(name, args) {
  await dispatchEvent(client, event("session.input.admitted", {
    sessionID,
    inputID: `inp_${name}_${Date.now()}_${Math.random()}`,
    input: { type: "user", data: { text: `[opencode-loop:${name}] ${args}` }, delivery: "steer" },
  }))
}

async function waitFor(predicate, timeoutMs = 2_000) {
  const deadline = Date.now() + timeoutMs
  while (!predicate()) {
    if (Date.now() >= deadline) return false
    await new Promise((resolve) => setTimeout(resolve, 10))
  }
  return true
}

const ctx = {
  app: { name: "cli", version: "0.0.0-test", channel: "next" },
  options: {},
  session: {
    get: async (args) => ({ id: args.sessionID, agent: "build", model: { id: "test-model", providerID: "test-provider" }, location: { directory } }),
    prompt: async (args) => {
      prompts.push(args.text)
      return { id: `msg_${Date.now()}`, sessionID, timeCreated: Date.now(), type: "user", data: { text: args.text }, delivery: "steer" }
    },
    synthetic: async (args) => ({ id: `msg_${Date.now()}`, sessionID, timeCreated: Date.now(), type: "synthetic", data: { text: args.text }, delivery: "steer" }),
    command: async (args) => {
      assert.ok(args.command)
      return { id: `msg_${Date.now()}`, sessionID, timeCreated: Date.now(), type: "user", data: { text: "" }, delivery: "steer" }
    },
    interrupt: async () => {},
    generate: async (args) => ({ text: "" }),
  },
  tool: {
    transform: async (fn) => { await fn({ add: (tool) => tools.push(tool) }) },
    hook: async (name, fn) => { toolHooks[name] = fn },
  },
  event: {
    subscribe: async function* () { yield* [] },
  },
}

const client = makeClient(ctx)

try {
  cleanup = await OpenCodeLoopPlugin.setup(ctx)
  const goalTools = Object.fromEntries(tools.map((tool) => [tool.name, tool]))
  assert.deepEqual(Object.keys(goalTools).sort(), [
    "opencode_loop_goal_blocked",
    "opencode_loop_goal_complete",
    "opencode_loop_goal_progress",
  ])

  await command("loop-goal", "Create proof.txt and verify it --max-turns 3")

  await command("loop-now", "goal")
  assert.equal(
    await waitFor(() => prompts.some((prompt) => prompt.includes(path.resolve(directory)))),
    true,
    "goal prompt must include the working directory",
  )
  assert.ok(prompts.some((prompt) => prompt.includes("never turn a relative path into a root path")))

  const stateFile = path.join(directory, ".opencode", "opencode-loop", `${sessionID}.json`)
  const activeState = JSON.parse(await fs.readFile(stateFile, "utf8"))
  assert.equal(activeState.jobs[0].activeRecoveryMs, 180_000)

  const rejected = await goalTools.opencode_loop_goal_complete.execute({ summary: "Done", evidence: "done" }, { sessionID })
  assert.match(rejected.content, /rejected/)

  const completed = await goalTools.opencode_loop_goal_complete.execute({
    summary: "Created and verified proof.txt",
    evidence: "Created proof.txt and read the file back; its exact content matched the requested value.",
  }, { sessionID })
  assert.match(completed.content, /Goal completed/)

  const completedState = JSON.parse(await fs.readFile(stateFile, "utf8"))
  assert.equal(completedState.jobs[0].goalStatus, "completed")
  assert.equal(completedState.jobs[0].paused, true)
  assert.equal(completedState.jobs[0].enabled, false)

  await dispatchEvent(client, event("session.idle", { sessionID }))
  await command("loop-clear")

  const promptCountBeforeAutoGoal = prompts.length
  await command("loop-goal", "--no-now --check \"node -e process.exitCode=0\" --complete-when-checks-pass make the configured checks pass")
  await command("loop-now", "goal")
  assert.equal(
    await waitFor(() => prompts.length === promptCountBeforeAutoGoal + 1),
    true,
    "a Goal Mode check-gated run must start when forced",
  )
  await new Promise((resolve) => setTimeout(resolve, 25))
  await dispatchEvent(client, event("session.idle", { sessionID }))
  let autoCompletedState
  for (let attempt = 0; attempt < 400; attempt++) {
    autoCompletedState = JSON.parse(await fs.readFile(stateFile, "utf8"))
    if (autoCompletedState.jobs[0]?.goalStatus === "completed") break
    await new Promise((resolve) => setTimeout(resolve, 10))
  }
  assert.equal(autoCompletedState.jobs[0].goalStatus, "completed", "--complete-when-checks-pass must complete the goal after successful configured checks")
  assert.equal(autoCompletedState.jobs[0].paused, true)
  assert.equal(autoCompletedState.jobs[0].enabled, false)
  assert.ok(autoCompletedState.jobs[0].lastGoalChecks?.every((item) => item.code === 0), "auto-completed Goal Mode must persist passing check evidence")

  await command("loop-clear")

  const promptCountBeforeBackgroundTool = prompts.length
  toolHooks["execute.before"]({ tool: "bash", sessionID, id: "call_background", input: {} })
  await command("loop", "0s --max-runs 1 continue after the background task")
  await new Promise((resolve) => setTimeout(resolve, 1_400))
  assert.equal(prompts.length, promptCountBeforeBackgroundTool, "an active tool call must keep the loop busy even when the session says idle")

  toolHooks["execute.after"]({ tool: "bash", sessionID, id: "call_background", input: {}, status: "completed", result: { content: "done" } })
  await dispatchEvent(client, event("session.idle", { sessionID }))
  assert.equal(
    await waitFor(() => prompts.length === promptCountBeforeBackgroundTool + 1, 5_000),
    true,
    "the due loop must resume after the active tool finishes and the session becomes idle",
  )

  await command("loop-clear")

  const childSessionID = "ses_background_child"
  await dispatchEvent(client, event("session.created", { sessionID: childSessionID, parentID: sessionID, location: { directory } }))
  await dispatchEvent(client, event("session.status", { sessionID: childSessionID, status: { type: "busy" } }))
  const promptCountBeforeBackgroundChild = prompts.length
  await command("loop", "0s --max-runs 1 continue after the background subtask")
  await new Promise((resolve) => setTimeout(resolve, 2_700))
  assert.equal(prompts.length, promptCountBeforeBackgroundChild, "a running background child session must keep its parent loop busy")

  await dispatchEvent(client, event("session.status", { sessionID: childSessionID, status: { type: "idle" } }))
  await dispatchEvent(client, event("session.idle", { sessionID }))
  assert.equal(
    await waitFor(() => prompts.length === promptCountBeforeBackgroundChild + 1, 5_000),
    true,
    "the parent loop must resume after its background child becomes idle",
  )

  await command("loop-clear")
  assert.ok(prompts.length >= 1)
  console.log("OpenCode 2 Loop smoke test passed")
} finally {
  await cleanup?.()
  await fs.rm(directory, { recursive: true, force: true })
}
// Importing @opencode-ai/plugin leaves a dangling socket in plain Node; the
// opencode2 host owns the runtime, so tests exit explicitly.
process.exit(0)
