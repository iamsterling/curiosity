import assert from "node:assert/strict"
import { mkdtemp, readFile, readdir, rm } from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import test from "node:test"
import { createHash } from "node:crypto"
import plugin from "../../dist/index.js"
import { NativeLoopEngine } from "../../dist/features/loop-engine/index.js"

const contextFor = (directory, log, definitions, permissionsByAgent = {}) => {
  const registration = (id) => {
    log.push(`register:${id}`)
    return { dispose: async () => log.push(`dispose:${id}`) }
  }
  return {
    app: { name: "opencode2", version: "0.0.0-beta-17595", channel: "beta" },
    options: { directory },
    agent: {
      transform: async (callback) => {
        callback({
          default: (id) => definitions.set("agent:default", id),
          remove: (id) => definitions.set(`agent:removed:${id}`, true),
          update: (id, update) => {
            const agent = {
              id,
              name: id,
              request: { settings: {}, headers: {}, body: {} },
              mode: "primary",
              hidden: false,
              permissions: [...(permissionsByAgent[id] ?? [])],
            }
            update(agent)
            definitions.set(`agent:${id}`, agent)
          },
        })
        return registration("agent:transform")
      },
    },
    session: {
      hook: async (id, callback) => { definitions.set(`session:${id}`, callback); return registration(`session:${id}`) },
      prompt: async (input) => log.push(["prompt", input]),
      interrupt: async (input) => log.push(["interrupt", input]),
    },
    tool: {
      hook: async (id, callback) => { definitions.set(`tool:${id}`, callback); return registration(`tool:${id}`) },
      transform: async (callback) => {
        callback({ add: (definition) => definitions.set(`definition:${definition.name}`, definition) })
        return registration("tool:transform")
      },
    },
    event: {
      subscribe: ({ signal }) => ({ async *[Symbol.asyncIterator]() {
        await new Promise((resolve) => signal.addEventListener("abort", resolve, { once: true }))
      } }),
    },
  }
}

const EXPECTED_TOOL_IDS = [
  "formerhuman_search",
  "ledger_approval_request", "ledger_approval_status", "ledger_claim_release", "ledger_claim_request",
  "ledger_evidence_submit", "ledger_fact_record", "ledger_intent_activate", "ledger_intent_frame",
  "ledger_intent_propose", "ledger_progress_propose", "ledger_resolution_propose", "ledger_review_propose",
  "ledger_work_propose", "native_loop_pause", "native_loop_resume", "native_loop_start", "native_loop_status",
  "native_loop_stop", "web_search",
]

test("setup installs the bundled agent suite and selects orchestrator without user config", async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "plugin-agents-"))
  const definitions = new Map()
  try {
    const cleanup = await plugin.setup(contextFor(directory, [], definitions))
    assert.equal(definitions.get("agent:default"), "orchestrator")
    assert.equal(definitions.get("agent:orchestrator").mode, "primary")
    assert.match(definitions.get("agent:orchestrator").system, /Delegate-only coordinator/)
    assert.equal("model" in definitions.get("agent:orchestrator"), false)
    for (const id of ["analyst", "generalist", "implementer", "researcher", "reviewer", "strategist", "worker"])
      assert.equal(definitions.get(`agent:${id}`).mode, "subagent", id)
    assert.deepEqual(definitions.get("agent:researcher").permissions.slice(-2), [
      { action: "web_search", resource: "*", effect: "allow" },
      { action: "formerhuman_search", resource: "*", effect: "allow" },
    ])
    for (const id of ["analyst", "generalist", "implementer", "orchestrator", "reviewer", "strategist", "worker"])
      assert.deepEqual(definitions.get(`agent:${id}`).permissions.slice(-2).map(({ effect }) => effect), ["deny", "deny"], id)
    assert.equal(definitions.has("agent:removed:build"), false)
    assert.equal(definitions.has("agent:removed:plan"), false)
    await cleanup?.()
  } finally { await rm(directory, { recursive: true, force: true }) }
})

test("user search permissions retain last-match override authority", async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "plugin-agent-permissions-"))
  const definitions = new Map()
  const researcherDeny = { action: "web_search", resource: "*", effect: "deny" }
  const analystAllow = { action: "web_search", resource: "*", effect: "allow" }
  try {
    const cleanup = await plugin.setup(contextFor(directory, [], definitions, {
      researcher: [researcherDeny],
      analyst: [analystAllow],
    }))
    assert.equal(definitions.get("agent:researcher").permissions.at(-1), researcherDeny)
    assert.equal(definitions.get("agent:analyst").permissions.at(-1), analystAllow)
    await cleanup?.()
  } finally { await rm(directory, { recursive: true, force: true }) }
})

test("setup rejects an unreviewed host ABI before registering behavior", async () => {
  const log = []
  const context = contextFor("/tmp/opencode2-config-abi-mismatch", log, new Map())
  context.app.version = "0.0.0-next-17431"
  context.session.hook = async () => {
    throw new Error("REGISTRATION_OCCURRED_BEFORE_ABI_CHECK")
  }

  await assert.rejects(plugin.setup(context), { code: "REAL_HOST_VERSION_PIN_MISMATCH" })
  assert.deepEqual(log, [])
})

test("setup accepts the reviewed beta-17595 host ABI", async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "plugin-beta-17595-"))
  const definitions = new Map()
  try {
    const context = contextFor(directory, [], definitions)
    context.app.version = "0.0.0-beta-17595"
    const cleanup = await plugin.setup(context)
    assert.equal(definitions.get("agent:default"), "orchestrator")
    await cleanup?.()
  } finally { await rm(directory, { recursive: true, force: true }) }
})

test("setup registers functional Promise hooks and every product tool once", async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "plugin-setup-"))
  const log = []
  const definitions = new Map()
  try {
    const context = contextFor(directory, log, definitions)
    const cleanup1 = await plugin.setup(context)
    const cleanup2 = await plugin.setup(context)
    const system = []
    await definitions.get("session:context")({ sessionID: "session", system })
    assert.equal(system.at(-1)?.type, "text")
    assert.equal(typeof system.at(-1)?.text, "string")
    assert.deepEqual([...definitions.keys()].filter((key) => key.startsWith("definition:")).map((key) => key.slice(11)).sort(), EXPECTED_TOOL_IDS)
    assert.deepEqual(log.filter((entry) => typeof entry === "string" && entry.startsWith("register:")), [
      "register:agent:transform", "register:session:context", "register:tool:execute.before", "register:tool:execute.after", "register:tool:transform",
    ])
    const fact = await definitions.get("definition:ledger_fact_record").execute(
      { intentID: "intent", statement: "observed", provenance: "test", digest: "sha256:test" },
      { sessionID: "session" },
    )
    assert.match(fact.content, /"accepted":true/)
    const approval = await definitions.get("definition:ledger_approval_status").execute({}, { sessionID: "session" })
    assert.deepEqual(JSON.parse(approval.content), { authority: "bounded-root-input", confirmationViaTool: false })
    const progress = await definitions.get("definition:ledger_progress_propose").execute(
      { workID: "work", state: "progress", summary: "observed", next: "verify" },
      { sessionID: "session" },
    )
    assert.deepEqual(JSON.parse(progress.content).proposal, { workID: "work", state: "progress", summary: "observed", next: "verify" })
    await assert.rejects(definitions.get("definition:native_loop_start").execute({
      claim: { workID: "work", token: "token", revision: 1, digest: "sha256:claim" },
      dispatch: { id: "dispatch", digest: "sha256:dispatch" },
      budgets: { maxIterations: 2, maxNoProgress: 1, maxChildren: 0, maxTools: 2 },
    }, { sessionID: "session" }), { code: "LEDGER_CLAIM_STALE" })
    assert.equal(log.some((entry) => Array.isArray(entry) && entry[0] === "prompt"), false)
    const canary="PRIVATE-TOOL-CANARY-7d91"; const canaryDigest=createHash("sha256").update(canary).digest("hex")
    await definitions.get("tool:execute.before")({ tool: "read", sessionID: "session", messageID: "message", agent: "test", id: "call", input: { path: canary } })
    await definitions.get("tool:execute.after")({ tool: "read", sessionID: "session", messageID: "message", agent: "test", id: "call", input: {}, status: "completed", result: { content: canary } })
    const captured = await Promise.all((await readdir(path.join(directory, ".opencode/opencode2-config/capture/v1/events"))).map((name) => readFile(path.join(directory, ".opencode/opencode2-config/capture/v1/events", name), "utf8")))
    assert.equal(captured.join("\n").includes(canary),false); assert.equal(captured.join("\n").includes(canaryDigest),false)
    assert.equal([...definitions.keys()].some((key) => key.includes("engineering_")), false)
    await cleanup2?.()
    await cleanup1?.()
    await cleanup1?.()
    assert.deepEqual(log.filter((entry) => typeof entry === "string" && entry.startsWith("dispose:")), [
      "dispose:tool:transform", "dispose:tool:execute.after", "dispose:tool:execute.before", "dispose:session:context",
    ])
  } finally { await rm(directory, { recursive: true, force: true }) }
})

test("project-root aliases and projectDirectory share one concurrent guard while independent projects register", async () => {
  const parent = await mkdtemp(path.join(os.tmpdir(), "plugin-guards-"))
  const first = path.join(parent, "first")
  const second = path.join(parent, "second")
  await Promise.all([import("node:fs/promises").then(({ mkdir }) => mkdir(first)), import("node:fs/promises").then(({ mkdir }) => mkdir(second))])
  const linked = path.join(parent, "first-link")
  await import("node:fs/promises").then(({ symlink }) => symlink(first, linked))
  const log = []
  try {
    const alias = path.join(first, "..", "first")
    const a = contextFor(alias, log, new Map())
    const b = contextFor(undefined, log, new Map())
    b.options = { projectDirectory: linked }
    const c = contextFor(second, log, new Map())
    const [cleanupA, cleanupB, cleanupC] = await Promise.all([plugin.setup(a), plugin.setup(b), plugin.setup(c)])
    assert.equal(log.filter((entry) => typeof entry === "string" && entry.startsWith("register:")).length, 10)
    await Promise.all([cleanupA?.(), cleanupB?.(), cleanupC?.()])
  } finally { await rm(parent, { recursive: true, force: true }) }
})

test("failed setup rolls registrations back in reverse and releases duplicate guard", async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "plugin-rollback-"))
  const log = []
  const definitions = new Map()
  const context = contextFor(directory, log, definitions)
  context.tool.hook = async (id, callback) => {
    if (id === "execute.after") throw new Error("TEST_REGISTRATION_FAILURE")
    definitions.set(`tool:${id}`, callback)
    log.push(`register:tool:${id}`)
    return { dispose: async () => log.push(`dispose:tool:${id}`) }
  }
  try {
    await assert.rejects(plugin.setup(context), /TEST_REGISTRATION_FAILURE/)
    assert.deepEqual(log.slice(-2), ["dispose:tool:execute.before", "dispose:session:context"])
    const retryLog = []
    const retry = await plugin.setup(contextFor(directory, retryLog, new Map()))
    assert.equal(retryLog.filter((entry) => typeof entry === "string" && entry.startsWith("register:")).length, 5)
    await retry?.()
  } finally { await rm(directory, { recursive: true, force: true }) }
})

test("rejecting disposers do not stop reverse cleanup and the root remains retryable", async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "plugin-cleanup-reject-"))
  const log = []
  const definitions = new Map()
  const context = contextFor(directory, log, definitions)
  context.session.hook = async (id, callback) => {
    definitions.set(`session:${id}`, callback)
    log.push(`register:session:${id}`)
    return { dispose: async () => { log.push(`dispose:session:${id}`); throw new Error("SESSION_DISPOSE_FAILED") } }
  }
  context.tool.hook = async (id, callback) => {
    definitions.set(`tool:${id}`, callback)
    log.push(`register:tool:${id}`)
    return { dispose: async () => { log.push(`dispose:tool:${id}`); if (id === "execute.after") throw new Error("AFTER_DISPOSE_FAILED") } }
  }
  try {
    const cleanup = await plugin.setup(context)
    await assert.rejects(cleanup(), AggregateError)
    assert.deepEqual(log.filter((entry) => typeof entry === "string" && entry.startsWith("dispose:")), [
      "dispose:tool:transform", "dispose:tool:execute.after", "dispose:tool:execute.before", "dispose:session:context",
    ])
    const retryLog = []
    const retry = await plugin.setup(contextFor(directory, retryLog, new Map()))
    assert.equal(retryLog.filter((entry) => typeof entry === "string" && entry.startsWith("register:")).length, 5)
    await retry?.()
  } finally { await rm(directory, { recursive: true, force: true }) }
})

test("rollback preserves registration failure while attempting every rejecting disposer", async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "plugin-rollback-reject-"))
  const log = []
  const context = contextFor(directory, log, new Map())
  context.session.hook = async (id) => ({ dispose: async () => { log.push(`dispose:session:${id}`); throw new Error("SESSION_DISPOSE_FAILED") } })
  context.tool.hook = async (id) => {
    if (id === "execute.after") throw new Error("TEST_REGISTRATION_FAILURE")
    return { dispose: async () => { log.push(`dispose:tool:${id}`); throw new Error("TOOL_DISPOSE_FAILED") } }
  }
  try {
    await assert.rejects(plugin.setup(context), (error) => {
      assert.equal(error.message, "TEST_REGISTRATION_FAILURE")
      assert.ok(error.cause instanceof AggregateError)
      return true
    })
    assert.deepEqual(log.filter((entry) => entry.startsWith("dispose:")), [
      "dispose:tool:execute.before", "dispose:session:context",
    ])
    const retry = await plugin.setup(contextFor(directory, [], new Map()))
    await retry?.()
  } finally { await rm(directory, { recursive: true, force: true }) }
})

test("continuation dispatch preserves id, metadata, and resume through the actual prompt path", async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "plugin-continuation-"))
  const prompts = []
  try {
    const engine = await NativeLoopEngine.open(directory, {
      prompt: async (input) => prompts.push(input),
      interrupt: async () => {},
      validateContinuation: async () => ({ claim: "current", fence: "current" }),
    })
    const dispatch = {
      schemaVersion: 1,
      revision: 1,
      claim: { workID: "work", token: "token", revision: 2, digest: "sha256:claim" },
      rootSessionID: "root-session",
      dispatch: { id: "dispatch", digest: "sha256:dispatch" },
      budgets: { maxIterations: 2, maxNoProgress: 1, maxChildren: 0, maxTools: 2 },
      dispatchState: "prepared",
      mode: "running",
      usageBudgetsDisabled: true,
      iteration: 1,
      currentIterationID: "sha256:iteration",
      promptID: "opencode2-loop-work-1",
      noProgress: 0,
      evidenceCursor: 0,
      ledgerRevision: 2,
      terminalEventIDs: [],
      childSessionIDs: [],
      captureWatermark: 0,
      compaction: { state: "none", references: [], beforeWatermark: 0, afterWatermark: 0 },
      breaker: { repeatedFailures: 0, repeatedActions: 0 },
    }
    await assert.rejects(engine.dispatchPrepared(dispatch), { code: "LOOP_NOT_STARTED" })
    assert.deepEqual(prompts, [{
      sessionID: "root-session",
      text: "Continue accepted claim work at revision 2. Use Ledger tools for all lifecycle proposals.",
      id: "opencode2-loop-work-1",
      metadata: {
        "opencode2-config": "native-loop-v1",
        iteration: "1",
        claim: "sha256:claim",
        causation: prompts[0].metadata.causation,
      },
      resume: true,
    }])
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})
