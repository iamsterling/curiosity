import assert from "node:assert/strict"
import { promises as fs } from "node:fs"
import os from "node:os"
import path from "node:path"

import { dispatchEvent, makeClient, registerLegacyLoopCompatibility } from "../src/features/loop-compat/legacy-runtime.mjs"

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
let harnessNumber = 0

function admittedUserInput(sessionID, inputID, text) {
  return {
    type: "session.input.admitted",
    location: { directory: sessionDirectories.get(sessionID) },
    data: {
      sessionID,
      inputID,
      input: { type: "user", data: { text }, delivery: "steer" },
    },
  }
}

// Tests run against one directory per harness; the plugin resolves the
// project directory from event locations, so remember the mapping the same
// way the plugin does (defaultDirectory is module-global and last-write-wins).
const sessionDirectories = new Map()

async function createHarness(options = {}) {
  harnessNumber++
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), `opencode2-config-comprehensive-${harnessNumber}-`))
  const sessionID = `ses_comprehensive_${harnessNumber}`
  sessionDirectories.set(sessionID, directory)
  const records = {
    aborts: [],
    commands: [],
    interrupts: [],
    prompts: [],
    synthetics: [],
  }
  const statuses = new Map([[sessionID, "idle"]])
  const ctx = {
    app: { name: "cli", version: "0.0.0-test", channel: "next" },
    options: {},
    session: {
      get: async (args) => ({ id: args.sessionID, agent: "build", model: { id: "test-model", providerID: "test-provider" }, location: { directory } }),
      prompt: async (args) => {
        records.prompts.push({ text: args.text, sessionID: args.sessionID })
        if (options.failPrompt) {
          await delay(options.promptFailureDelayMs ?? 20)
          throw new Error(options.promptFailureMessage || "simulated prompt dispatch failure")
        }
        return { id: `msg_${Date.now()}`, sessionID, timeCreated: Date.now(), type: "user", data: { text: args.text }, delivery: "steer" }
      },
      synthetic: async (args) => {
        records.synthetics.push({ text: args.text, sessionID: args.sessionID })
        return { id: `msg_${Date.now()}`, sessionID, timeCreated: Date.now(), type: "synthetic", data: { text: args.text }, delivery: "steer" }
      },
      command: async (args) => {
        if (args.command === "compact" || args.command === "summarize") throw new Error("Command not found: " + args.command)
        records.commands.push(args)
        return { id: `msg_${Date.now()}`, sessionID, timeCreated: Date.now(), type: "user", data: { text: "" }, delivery: "steer" }
      },
      interrupt: async (args) => { records.interrupts.push(args.sessionID) },
      generate: async (args) => ({ text: "" }),
    },
    tool: {
      transform: async (fn) => { await fn({ add: (tool) => records.tools.push(tool) }) },
      hook: async (name, fn) => { records.toolHooks[name] = fn },
    },
    event: {
      subscribe: async function* () { yield* [] },
    },
  }
  records.tools = []
  records.toolHooks = {}

  const client = makeClient(ctx)
  const cleanup = await registerLegacyLoopCompatibility(ctx)
  const stateFile = path.join(directory, ".opencode", "opencode2-config", `${sessionID}.json`)
  return {
    client,
    ctx,
    directory,
    records,
    sessionID,
    stateFile,
    statuses,
    async command(command, argumentsText = "") {
      await dispatchEvent(client, admittedUserInput(sessionID, `inp_${command}_${Date.now()}_${Math.random()}`, `[opencode-loop:${command}] ${argumentsText}`))
    },
    async event(event) {
      if (!event.location) event.location = { directory }
      await dispatchEvent(client, event)
    },
    async idle() {
      statuses.set(sessionID, "idle")
      await dispatchEvent(client, { type: "session.idle", location: { directory }, data: { sessionID } })
    },
    async readState() {
      try {
        return JSON.parse(await fs.readFile(stateFile, "utf8"))
      } catch (error) {
        if (error?.code === "ENOENT") return { version: 1, jobs: [] }
        throw error
      }
    },
    reportTexts() {
      return records.synthetics.map((item) => item.text)
    },
    actionTexts() {
      return records.prompts.map((item) => item.text)
    },
    async loopLogText() {
      try {
        return await fs.readFile(path.join(directory, ".opencode", "opencode2-config", "loop.log"), "utf8")
      } catch {
        return ""
      }
    },
    async cleanup() {
      await cleanup?.()
      await fs.rm(directory, { recursive: true, force: true })
      sessionDirectories.delete(sessionID)
    },
  }
}

function jsonReport(harness) {
  const report = [...harness.reportTexts()].reverse().find((text) => text.includes("```json"))
  assert.ok(report, "expected a JSON report")
  const match = report.match(/```json\s*([\s\S]*?)\s*```/)
  assert.ok(match, "expected a fenced JSON object")
  return JSON.parse(match[1])
}

async function testParserAndPresets() {
  const h = await createHarness()
  try {
    await h.command("loop", "3m --name matrix --no-now --allow-overlap --safe --quiet --ask-never --git-checkpoint --checkpoint-only --pause-on-verify-fail --multi --prompt --max-runs 4 --max-no-progress 2 --timeout 7s --max-runtime 2h --max-failures 3 --until \"2030-01-01T00:00:00Z\" --stop-file stop.txt --progress-file progress.md --prompt-file prompt.md --goal-file goal.md --evidence-file evidence.md --test \"npm test\" --verify \"npm run verify\" --preflight \"npm run preflight\" --postrun \"npm run postrun\" --notify \"node notify.js\" --branch feature/test --batch 2 --compact-every 5 --watch one.txt --watch two.txt --include-file context.md --acceptance \"criterion A\" --success \"criterion B\" --check \"npm test\" --dry-run perform matrix work")
    const job = jsonReport(h)
    assert.equal(job.intervalMs, 180_000)
    assert.equal(job.name, "matrix")
    assert.equal(job.action, "perform matrix work")
    assert.equal(job.kind, "prompt")
    assert.equal(job.immediate, false)
    assert.equal(job.noOverlap, false)
    assert.equal(job.safe, true)
    assert.equal(job.quiet, true)
    assert.equal(job.askNever, true)
    assert.equal(job.gitCheckpoint, true)
    assert.equal(job.checkpointOnly, true)
    assert.equal(job.pauseOnVerifyFail, true)
    assert.equal(job.multi, true)
    assert.equal(job.maxRuns, 4)
    assert.equal(job.maxNoProgress, 2)
    assert.equal(job.timeoutMs, 7_000)
    assert.equal(job.maxRuntimeMs, 7_200_000)
    assert.equal(job.maxFailures, 3)
    assert.equal(job.stopFile, "stop.txt")
    assert.equal(job.testCommand, "npm test")
    assert.equal(job.verifyCommand, "npm run verify")
    assert.equal(job.preflightCommand, "npm run preflight")
    assert.equal(job.postrunCommand, "npm run postrun")
    assert.equal(job.notifyCommand, "node notify.js")
    assert.equal(job.branch, "feature/test")
    assert.equal(job.batch, 2)
    assert.equal(job.compactEveryRuns, 5)
    assert.deepEqual(job.watchPaths, ["one.txt", "two.txt"])
    assert.deepEqual(job.includeFiles, ["context.md"])
    assert.deepEqual(job.goalAcceptance, ["criterion A", "criterion B"])
    assert.deepEqual(job.goalChecks, ["npm test"])

    await h.command("loop-compact", "0s --dry-run")
    let preset = jsonReport(h)
    assert.equal(preset.intervalMs, 0, "explicit 0s must not become the 200m default")
    assert.equal(preset.action, "/compact")
    assert.equal(preset.kind, "compact")

    await h.command("loop-compact", "--dry-run")
    preset = jsonReport(h)
    assert.equal(preset.intervalMs, 12_000_000)
    assert.equal(preset.action, "/compact", "a flag-only preset must keep its real default action")

    await h.command("loop-safe-dev", "--dry-run --safe")
    preset = jsonReport(h)
    assert.match(preset.action, /Develop the project/)
    assert.notEqual(preset.action, "--safe")

    await h.command("loop-testfix", "5m pnpm test --dry-run")
    preset = jsonReport(h)
    assert.equal(preset.intervalMs, 300_000)
    assert.equal(preset.verifyCommand, "pnpm test")
    assert.match(preset.action, /Test command hint: pnpm test/)

    await h.command("loop-testfix", "--verify \"npm run ci\" --dry-run")
    preset = jsonReport(h)
    assert.equal(preset.verifyCommand, "npm run ci")
    assert.match(preset.action, /Test command hint: npm run ci/)

    const toastCount = (await (await h.loopLogText()).match(/"line":"toast"/g) || []).length
    await h.command("loop", "nonsense")
    await h.command("loop", "5m")
    assert.equal((await (await h.loopLogText()).match(/"line":"toast"/g) || []).length, toastCount + 2, "invalid loops must still produce diagnostics")
  } finally {
    await h.cleanup()
  }
}

async function testLifecycleAndCommandHandling() {
  const h = await createHarness()
  try {
    await h.command("loop", "10m --no-now --name same first action")
    await h.command("loop", "10m --no-now --name same replacement action")
    let state = await h.readState()
    assert.equal(state.jobs.length, 1)
    assert.equal(state.jobs[0].action, "replacement action")

    await h.command("loop", "10m --no-now --multi --name extra additional action")
    state = await h.readState()
    assert.equal(state.jobs.length, 2)

    await h.command("loop-pause", "same")
    state = await h.readState()
    assert.equal(state.jobs.find((item) => item.name === "same").paused, true)
    await h.command("loop-resume", "same")
    state = await h.readState()
    assert.equal(state.jobs.find((item) => item.name === "same").paused, false)

    const beforeReports = h.reportTexts().length
    await h.command("loop-status")
    assert.equal(h.reportTexts().length, beforeReports + 1, "an admitted command must produce one report")
    await h.command("loop-status")
    assert.equal(h.reportTexts().length, beforeReports + 2, "an intentional repeated command must not be swallowed")

    await h.event({ type: "session.input.admitted", data: { sessionID: h.sessionID, inputID: "inp_dup", input: { type: "user", data: { text: "[opencode-loop:loop-status] " } } } })
    await h.event({ type: "session.input.admitted", data: { sessionID: h.sessionID, inputID: "inp_dup", input: { type: "user", data: { text: "[opencode-loop:loop-status] " } } } })
    assert.equal(h.reportTexts().length, beforeReports + 3, "the same admitted input must only be handled once")

    await h.command("loop-stop", "same")
    state = await h.readState()
    assert.deepEqual(state.jobs.map((item) => item.name), ["extra"])
    await h.command("loop-clear")
    state = await h.readState()
    assert.equal(state.jobs.length, 0)

    await h.command("loop-init")
    const progress = path.join(h.directory, "progress.md")
    assert.match(await fs.readFile(progress, "utf8"), /Active TODO/)
    await fs.writeFile(progress, "custom progress", "utf8")
    await h.command("loop-init")
    assert.equal(await fs.readFile(progress, "utf8"), "custom progress", "loop-init must not overwrite user progress")

    for (const command of ["loop-help", "loop-doctor", "loop-export", "loop-logs"]) await h.command(command)
    assert.ok(h.reportTexts().some((text) => text.includes("OpenCode2 Config help")))
    assert.ok(h.reportTexts().some((text) => text.includes("OpenCode2 Config doctor")))
    assert.ok(h.reportTexts().some((text) => text.includes("state export")))
  } finally {
    await h.cleanup()
  }
}

async function testWatchScheduling() {
  const h = await createHarness()
  try {
    const watched = path.join(h.directory, "watched.txt")
    await fs.writeFile(watched, "one", "utf8")
    await h.command("loop", "0s --watch watched.txt --max-runs 1 react to watched file")
    await h.idle()
    await delay(1_400)
    assert.equal(h.actionTexts().length, 0, "watch loop must not run until a watched file changes")

    await fs.writeFile(watched, "two and changed size", "utf8")
    await h.idle()
    await delay(1_500)
    assert.equal(h.actionTexts().length, 1, "watch loop must run after a watched file changes")
    assert.match(h.actionTexts()[0], /react to watched file/)
  } finally {
    await h.cleanup()
  }
}

async function testActionRoutingAndSafety() {
  let h = await createHarness()
  try {
    await h.command("loop-shell", "0s --safe npm run format")
    await h.command("loop-now", "shell")
    await delay(50)
    // The V2 plugin API exposes no session.shell; the command runs directly
    // and the attempt is recorded in the loop log.
    assert.match(await h.loopLogText(), /shell-direct/)
  } finally {
    await h.cleanup()
  }

  h = await createHarness()
  try {
    await h.command("loop-shell", "0s --safe Remove-Item -Recurse ./important")
    await h.command("loop-now", "shell")
    await delay(50)
    const state = await h.readState()
    assert.equal(state.jobs[0].paused, true, "a blocked synchronous action must pause instead of retrying forever")
    assert.equal(state.jobs[0].failureCount, 1)
    assert.equal(state.jobs[0].lastFailureReason, "safe_shell_blocked")

    await h.command("loop-clear")
    await h.command("loop-shell", "0s --safe rm -r -f ./important")
    await h.command("loop-now", "shell")
    const separateFlagsState = await h.readState()
    assert.equal(separateFlagsState.jobs[0].lastFailureReason, "safe_shell_blocked", "separate rm -r -f flags must be blocked")
  } finally {
    await h.cleanup()
  }

  h = await createHarness()
  try {
    await fs.writeFile(path.join(h.directory, "empty.md"), "fallback context", "utf8")
    await h.command("loop-command", "0s --prompt-file empty.md")
    await h.command("loop-now", "command")
    const state = await h.readState()
    assert.equal(state.jobs[0].paused, true)
    assert.equal(state.jobs[0].lastFailureReason, "empty_command")
  } finally {
    await h.cleanup()
  }

  h = await createHarness()
  try {
    // The OpenCode 2 plugin API does not expose session.compact and "compact"
    // is not a registry command, so compact loops pause with a diagnostic.
    await h.command("loop-compact", "0s")
    await h.command("loop-now", "compact")
    const state = await h.readState()
    assert.equal(state.jobs[0].paused, true)
    assert.equal(state.jobs[0].lastFailureReason, "OPENCODE2_COMPACTION_MANUAL_REQUIRED")
    assert.match(await h.loopLogText(), /OPENCODE2_COMPACTION_MANUAL_REQUIRED/)
  } finally {
    await h.cleanup()
  }

  h = await createHarness()
  try {
    await h.command("loop-command", "0s /custom-command alpha beta")
    await h.command("loop-now", "command")
    await delay(25)
    const dispatched = h.records.commands[0]
    assert.equal(dispatched.command, "custom-command")
    assert.equal(dispatched.arguments, "alpha beta")
    assert.equal(dispatched.agent, "build")
    assert.deepEqual(dispatched.model, { id: "test-model", providerID: "test-provider" })
    assert.equal(dispatched.sessionID, h.sessionID)
  } finally {
    await h.cleanup()
  }
}

async function testCompactDegradationAndEvents() {
  const h = await createHarness()
  try {
    await h.command("loop", "5m --no-now --name compact-chain --compact-every 1 --verify 'node -e process.exitCode=7' --pause-on-verify-fail continue after compaction")
    const seeded = await h.readState()
    seeded.jobs[0].runCount = 1
    seeded.jobs[0].lastRunAt = 0
    await fs.writeFile(h.stateFile, JSON.stringify(seeded, null, 2), "utf8")

    await h.command("loop-now", "compact-chain")
    const state = await h.readState()
    assert.equal(state.jobs[0].runCount, 2, "a manual-required compact-every attempt may continue the configured action")
    assert.equal(state.jobs[0].paused, false, "compact-every manual requirement must not pretend compaction ran")
    assert.equal(state.jobs[0].lastCompactionDiagnostic.code, "OPENCODE2_COMPACTION_MANUAL_REQUIRED")
    assert.match(await h.loopLogText(), /OPENCODE2_COMPACTION_MANUAL_REQUIRED/)

    // The compaction lifecycle events remain wired for auto-compaction: a
    // started/ended pair without a pending loop request must not crash the
    // dispatcher (there is no pending request after the failed attempt, so
    // no compact-event log is expected).
    await h.event({ type: "session.compaction.started", data: { sessionID: h.sessionID } })
    await h.event({ type: "session.compaction.ended", data: { sessionID: h.sessionID } })
    assert.doesNotMatch(await h.loopLogText(), /compact-event/, "no pending loop compaction request after the degraded attempt")
  } finally {
    await h.cleanup()
  }
}

async function testStaleBusyUsesCompletedExecutionTail() {
  let h = await createHarness()
  try {
    await h.command("loop", "5m --no-now --name stale-complete continue safely")
    await h.command("loop-now", "stale-complete")
    h.statuses.set(h.sessionID, "busy")
    const completedAt = Date.now() + 5
    await h.event({ type: "session.step.started", created: completedAt - 1, data: { sessionID: h.sessionID, assistantMessageID: "asst_tail", agent: "build", model: { id: "m", providerID: "p" } } })
    await h.event({ type: "session.step.ended", created: completedAt, data: { sessionID: h.sessionID, assistantMessageID: "asst_tail", finish: "stop", cost: 0, tokens: { input: 0, output: 0, reasoning: 0, cache: { read: 0, write: 0 } } } })
    await h.event({ type: "session.execution.succeeded", created: completedAt, data: { sessionID: h.sessionID } })
    await h.command("loop-now", "stale-complete")
    const state = await h.readState()
    assert.ok(state.jobs[0].lastFinishedAt > 0, "a completed execution tail must override a stale busy status")
  } finally {
    await h.cleanup()
  }

  h = await createHarness()
  try {
    await h.command("loop", "5m --no-now --name stale-incomplete continue safely")
    const seeded = await h.readState()
    seeded.jobs[0].staleActiveRecoveryMs = 1
    await fs.writeFile(h.stateFile, JSON.stringify(seeded, null, 2), "utf8")
    await h.command("loop-now", "stale-incomplete")
    await delay(10)
    h.statuses.set(h.sessionID, "busy")
    const createdAt = Date.now()
    await h.event({ type: "session.step.started", created: createdAt, data: { sessionID: h.sessionID, assistantMessageID: "asst_running", agent: "build", model: { id: "m", providerID: "p" } } })
    await h.command("loop-now", "stale-incomplete")
    const state = await h.readState()
    assert.equal(state.jobs[0].lastFinishedAt, undefined, "an in-flight step must never be force-finalized just because the active-run timeout elapsed")
    assert.equal(h.actionTexts().length, 1, "unfinished work must not be overlapped by a replacement prompt")
  } finally {
    await h.cleanup()
  }
}

async function testPromptDispatchFailureRecovery() {
  const h = await createHarness({ failPrompt: true, promptFailureDelayMs: 25 })
  try {
    await h.command("loop", "0s --no-now --name dispatch-failure --max-failures 1 recover from a rejected prompt dispatch")
    await h.command("loop-now", "dispatch-failure")

    let state
    for (let attempt = 0; attempt < 40; attempt++) {
      state = await h.readState()
      if (state.jobs[0]?.lastFailureReason === "dispatch_failed") break
      await delay(25)
    }

    const job = state.jobs[0]
    assert.equal(job.failureCount, 1, "a rejected prompt dispatch must count as a scheduler failure")
    assert.equal(job.paused, true, "--max-failures must pause after a rejected prompt dispatch")
    assert.equal(job.lastFailureReason, "dispatch_failed")
    assert.match(job.lastDispatchFailure, /simulated prompt dispatch failure/)
    assert.ok(job.lastDispatchFailureAt > 0)
    assert.equal(h.actionTexts().length, 1, "dispatch recovery must never replay the prompt automatically")
    assert.match(await h.loopLogText(), /session\.prompt failed/, "the SDK rejection must remain observable")
  } finally {
    await h.cleanup()
  }
}

async function testStopsPreflightAndGoalLifecycle() {
  let h = await createHarness()
  try {
    await h.command("loop", "5m --no-now --stop-file STOP continue")
    await fs.writeFile(path.join(h.directory, "STOP"), "stop", "utf8")
    await h.command("loop-now")
    assert.equal((await h.readState()).jobs.length, 0)
  } finally {
    await h.cleanup()
  }

  h = await createHarness()
  try {
    await h.command("loop", "5m --no-now --preflight \"node -e process.exitCode=7\" continue")
    await h.command("loop-now")
    const state = await h.readState()
    assert.equal(state.jobs[0].paused, true)
    assert.equal(state.jobs[0].failureCount, 1)
    assert.match(state.jobs[0].lastPreflightFailure, /exit=7/)
  } finally {
    await h.cleanup()
  }

  h = await createHarness()
  try {
    await h.command("loop-goal", "Ship the feature --acceptance \"tests pass\" --max-turns 3")
    await h.command("loop-now", "goal")
    await delay(25)
    assert.match(h.actionTexts()[0], /Goal objective:\nShip the feature/)
    const goalTools = Object.fromEntries(h.records.tools.map((tool) => [tool.name, tool]))
    const progress = await goalTools.opencode_loop_goal_progress.execute(
      { summary: "Implemented the first part", next: "Run verification" },
      { sessionID: h.sessionID },
    )
    assert.match(progress.content, /Goal progress/)
    let state = await h.readState()
    assert.equal(state.jobs[0].goalProgress.length, 1)
    const blocked = await goalTools.opencode_loop_goal_blocked.execute(
      { reason: "Credential is missing", needed: "Provide a test credential" },
      { sessionID: h.sessionID },
    )
    assert.match(blocked.content, /Goal blocked/)
    state = await h.readState()
    assert.equal(state.jobs[0].goalStatus, "blocked")
    assert.equal(state.jobs[0].paused, true)
    await h.command("loop-goal-resume")
    state = await h.readState()
    assert.equal(state.jobs[0].goalStatus, "active")
    assert.equal(state.jobs[0].paused, false)
    await h.command("loop-goal-clear")
    assert.equal((await h.readState()).jobs.length, 0)
  } finally {
    await h.cleanup()
  }
}

async function testAckAgentDoesNotStick() {
  const h = await createHarness()
  try {
    // The /loop command's acknowledgement turn runs under the tool-denied
    // opencode-loop-local agent; its agent.selected event must not become the
    // agent of subsequent scheduled iterations (v0.5.17 regression class).
    await h.event({ type: "session.agent.selected", data: { sessionID: h.sessionID, agent: "opencode-loop-local" } })
    await h.command("loop", "0s --max-runs 1 continue safely")
    await h.command("loop-now")
    await delay(50)
    assert.equal(h.actionTexts().length, 1, "the loop must run")
    await h.event({ type: "session.agent.selected", data: { sessionID: h.sessionID, agent: "build" } })
    await h.command("loop-clear")
    assert.equal((await h.readState()).jobs.length, 0)
  } finally {
    await h.cleanup()
  }
}

async function testLoopOwnedGoalInputsDoNotSelfInterrupt() {
  const h = await createHarness()
  const originalDateNow = Date.now
  let fakeNow = originalDateNow()
  Date.now = () => fakeNow
  try {
    await h.command("loop-goal", "--no-now Keep working until the objective is complete")
    // A delayed duplicate of the loop-owned command input must stay ignored.
    const loopOwned = { type: "session.input.admitted", location: { directory: h.directory }, data: { sessionID: h.sessionID, inputID: "inp_loop_owned", input: { type: "user", data: { text: "[opencode-loop:loop-goal] --no-now Keep working until the objective is complete" } } } }
    await h.event(loopOwned)
    fakeNow += 60_000
    await h.event(loopOwned)
    let state = await h.readState()
    assert.equal(state.jobs[0].paused, false, "a delayed duplicate of the same loop-owned input must remain ignored")

    await h.event({ type: "session.input.admitted", location: { directory: h.directory }, data: { sessionID: h.sessionID, inputID: "inp_real_user", input: { type: "user", data: { text: "user typed a real message" } } } })
    state = await h.readState()
    assert.equal(state.jobs[0].paused, true, "a distinct real user input must still pause an active goal")
  } finally {
    Date.now = originalDateNow
    await h.cleanup()
  }
}

async function testInitializationDoesNotWaitForLocalApi() {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "opencode2-config-init-deadlock-"))
  const never = new Promise(() => {})
  const ctx = {
    app: { name: "cli", version: "test", channel: "next" },
    options: {},
    session: { get: async () => never, prompt: async () => never, synthetic: async () => never, command: async () => never, interrupt: async () => {}, generate: async () => ({ text: "" }) },
    tool: { transform: async (fn) => { await fn({ add: () => {} }) }, hook: async () => {} },
    event: { subscribe: async function* () { yield* [] } },
  }
  try {
    const cleanup = await Promise.race([
      registerLegacyLoopCompatibility(ctx),
      delay(500).then(() => { throw new Error("plugin initialization waited for the local OpenCode API") }),
    ])
    assert.equal(typeof cleanup, "function")
    await cleanup()
  } finally {
    await fs.rm(directory, { recursive: true, force: true })
  }
}

async function testWindowsSafeStatePersistence() {
  const h = await createHarness()
  try {
    const stateDir = path.join(h.directory, ".opencode", "opencode2-config")

    // Rapid replacements exercise atomic overwrite of an existing state file.
    // On Windows this used to fail with EPERM when rename targeted a locked file
    // next to a project-local *.tmp, leaving jobs empty and the heartbeat stuck.
    for (let index = 0; index < 25; index++) {
      await h.command("loop", `10m --no-now --name sticky action-${index}`)
    }

    const state = await h.readState()
    assert.equal(state.jobs.length, 1)
    assert.equal(state.jobs[0].name, "sticky")
    assert.equal(state.jobs[0].action, "action-24")

    // Temp payloads must live outside the project so OpenCode git snapshots and
    // Windows file locks do not see opencode2-config/*.tmp pathspecs.
    const leftovers = (await fs.readdir(stateDir)).filter((name) => name.endsWith(".tmp"))
    assert.deepEqual(leftovers, [], "state writes must not leave project-local temp files")

    await h.command("loop-clear")
    const cleared = await h.readState()
    assert.equal(cleared.jobs.length, 0)
  } finally {
    await h.cleanup()
  }
}

async function testWindowsStateRenameRetriesBeforeFallback() {
  const h = await createHarness()
  const originalRename = fs.rename
  const originalCopyFile = fs.copyFile
  let renameAttempts = 0
  let fallbackCopies = 0
  fs.rename = async (source, target) => {
    if (target === h.stateFile && renameAttempts++ < 2) {
      const error = new Error("simulated Windows destination lock")
      error.code = "EPERM"
      throw error
    }
    return await originalRename(source, target)
  }
  fs.copyFile = async (source, target, ...rest) => {
    if (target === h.stateFile) fallbackCopies++
    return await originalCopyFile(source, target, ...rest)
  }
  try {
    await h.command("loop", "10m --no-now --name retry-safe keep-state")
    const state = await h.readState()
    assert.equal(state.jobs[0]?.name, "retry-safe")
    assert.equal(renameAttempts, 3, "transient EPERM should retry rename")
    assert.equal(fallbackCopies, 0, "successful rename retry should avoid non-atomic copy fallback")
  } finally {
    fs.rename = originalRename
    fs.copyFile = originalCopyFile
    await h.cleanup()
  }
}

async function testStateReadRetriesTransientPartialJson() {
  const h = await createHarness()
  const originalReadFile = fs.readFile
  try {
    await h.command("loop", "10m --no-now --name sticky survive-partial-read")
    let partialReads = 0
    fs.readFile = async (filePath, ...rest) => {
      if (filePath === h.stateFile && partialReads++ < 2) return "{"
      return await originalReadFile(filePath, ...rest)
    }
    await h.command("loop-status")
    assert.equal(partialReads, 3, "partial JSON should be retried before treating state as corrupt")
    assert.match(await h.loopLogText(), /toast.*1 loop job\(s\)/)
  } finally {
    fs.readFile = originalReadFile
    await h.cleanup()
  }
}

await testParserAndPresets()
await testLifecycleAndCommandHandling()
await testWatchScheduling()
await testActionRoutingAndSafety()
await testCompactDegradationAndEvents()
await testStaleBusyUsesCompletedExecutionTail()
await testPromptDispatchFailureRecovery()
await testStopsPreflightAndGoalLifecycle()
await testAckAgentDoesNotStick()
await testLoopOwnedGoalInputsDoNotSelfInterrupt()
await testInitializationDoesNotWaitForLocalApi()
await testWindowsSafeStatePersistence()
await testWindowsStateRenameRetriesBeforeFallback()
await testStateReadRetriesTransientPartialJson()

console.log("OpenCode2 Config comprehensive test passed")
// Importing @opencode-ai/plugin leaves a dangling socket in plain Node; the
// opencode2 host owns the runtime, so tests exit explicitly.
process.exit(0)
