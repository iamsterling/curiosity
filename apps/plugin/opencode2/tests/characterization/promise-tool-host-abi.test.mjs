import assert from "node:assert/strict"
import { mkdtemp, readFile, rm } from "node:fs/promises"
import { createRequire } from "node:module"
import path from "node:path"
import test from "node:test"
import { fileURLToPath, pathToFileURL } from "node:url"
import { execFileSync } from "node:child_process"

const require = createRequire(import.meta.url)
const pluginEntry = fileURLToPath(import.meta.resolve("@opencode-ai/plugin"))
const pluginPackage = path.resolve(path.dirname(pluginEntry), "../../package.json")
const pluginRoot = new URL("./", pathToFileURL(pluginPackage))
const adapterFile = new URL("dist/promise/adapter.js", pluginRoot)
const toolDeclarationFile = new URL("dist/promise/tool.d.ts", pluginRoot)
const pluginRequire = createRequire(pluginEntry)
const schemaToolDeclarationFile = pathToFileURL(path.resolve(path.dirname(pluginPackage), "../schema/dist/tool.d.ts"))
const effectEntry = pluginRequire.resolve("effect")
const { Effect, Exit, Fiber, Scope, Stream } = await import(pathToFileURL(effectEntry).href)
const { default: exportedPlugin } = await import("../../dist/index.js")

const unused = new Proxy(() => Effect.void, {
  apply: () => Effect.void,
  get: () => unused,
})

const adapterFixture = async (execute) => {
  let registered
  let disposed = 0
  const tool = {
    transform: (callback) =>
      Effect.acquireRelease(
        Effect.sync(() => {
          callback({ add: (definition) => { registered = definition } })
          return { dispose: Effect.sync(() => { disposed += 1 }) }
        }),
        (registration) => registration.dispose,
      ),
    hook: unused,
  }
  const host = new Proxy(
    { app: { name: "opencode2", version: "0.0.0-beta-17595", channel: "beta" }, options: {}, tool },
    { get: (target, key) => key in target ? target[key] : unused },
  )
  const { fromPromise } = await import(adapterFile.href)
  const plugin = fromPromise({
    id: "m3-host-abi-characterization",
    setup: async (context) => {
      await context.tool.transform((draft) => draft.add({
        name: "m3_probe",
        description: "M3 host ABI probe",
        input: { type: "object", properties: {}, additionalProperties: false },
        execute,
      }))
    },
  })
  const scope = await Effect.runPromise(Scope.make())
  await Effect.runPromise(Scope.provide(scope)(plugin.effect(host)))
  return {
    execute: (context) => registered.execute({}, context),
    close: () => Effect.runPromise(Scope.close(scope, Exit.void)),
    disposed: () => disposed,
  }
}

test("pinned Promise tool ABI exposes trusted agent identity but no AbortSignal", async () => {
  const pkg = JSON.parse(await readFile(pluginPackage, "utf8"))
  const [toolDeclaration, schemaToolDeclaration, adapter] = await Promise.all([
    readFile(toolDeclarationFile, "utf8"),
    readFile(schemaToolDeclarationFile, "utf8"),
    readFile(adapterFile, "utf8"),
  ])
  assert.equal(pkg.version, "0.0.0-beta-18138")
  assert.match(schemaToolDeclaration, /readonly agent: Agent\.ID;/)
  assert.doesNotMatch(schemaToolDeclaration, /AbortSignal|readonly signal:/)
  assert.doesNotMatch(toolDeclaration, /AbortSignal|readonly signal:/)
  assert.match(adapter, /\.\.\.context,/)
  assert.doesNotMatch(adapter.match(/const executePromiseTool[\s\S]*$/)?.[0] ?? "", /AbortSignal|signal:/)

  let observed
  const fixture = await adapterFixture(async (_input, context) => {
    observed = context
    return { content: "ok" }
  })
  try {
    await Effect.runPromise(fixture.execute({
      sessionID: "session",
      agent: "researcher",
      messageID: "message",
      id: "call",
      progress: () => Effect.void,
    }))
    assert.equal(observed.agent, "researcher")
    assert.equal("signal" in observed, false)
  } finally {
    await fixture.close()
  }
})

test("pinned adapter cancellation skips a not-started call but cannot abort an executing Promise tool", async () => {
  let started = 0
  let completed = 0
  let release
  const gate = new Promise((resolve) => { release = resolve })
  const fixture = await adapterFixture(async () => {
    started += 1
    await gate
    completed += 1
    return { content: "done" }
  })
  const context = {
    sessionID: "session",
    agent: "researcher",
    messageID: "message",
    id: "call",
    progress: () => Effect.void,
  }
  try {
    await Effect.runPromise(Effect.flatMap(Effect.interrupt, () => fixture.execute(context)))
      .catch(() => undefined)
    assert.equal(started, 0)

    const fiber = Effect.runFork(fixture.execute(context))
    while (started === 0) await new Promise((resolve) => setImmediate(resolve))
    await Effect.runPromise(Fiber.interrupt(fiber))
    assert.equal(completed, 0)
    release()
    await new Promise((resolve) => setImmediate(resolve))
    assert.equal(completed, 1)
  } finally {
    release()
    await fixture.close()
  }
})

test("registration is disposed when the pinned adapter plugin scope closes", async () => {
  const fixture = await adapterFixture(async () => ({ content: "ok" }))
  assert.equal(fixture.disposed(), 0)
  await fixture.close()
  assert.equal(fixture.disposed(), 1)
})

test("exported plugin.effect owns runtime search registration, execution, interruption, and teardown", async () => {
  const directory = await mkdtemp(path.join(process.cwd(), ".m3-effect-"))
  const definitions = []
  const lifecycle = []
  let calls = 0
  const registration = (name, acquire) => Effect.acquireRelease(
    Effect.sync(() => {
      acquire()
      lifecycle.push(`register:${name}`)
      return { dispose: Effect.sync(() => lifecycle.push(`dispose:${name}`)) }
    }),
    (value) => value.dispose,
  )
  const transform = (name, draft) => (callback) => registration(name, () => callback(draft))
  const hook = (name) => registration(name, () => undefined)
  const agentDraft = { default: () => {}, get: () => undefined, remove: () => {}, update: () => {} }
  const toolDraft = { add: (definition) => definitions.push(definition) }
  const runtime = {
    webSearch: () => { calls += 1; return { status: "ok", results: [] } },
    close: () => lifecycle.push("close:runtime"),
  }
  const host = new Proxy({
    app: { name: "opencode2", version: "0.0.0-beta-18138", channel: "beta" },
    options: {
      directory,
      search: {
        backend: "runtime",
        runtime: { stateRoot: "/operator/state", workspaceScope: "/operator/workspace", queryCapability: new Uint8Array([1]), instance: runtime },
        controlledPluginIds: ["iamsterling.opencode2-config"],
      },
    },
    agent: { transform: transform("agent:transform", agentDraft) },
    session: { hook: (name) => hook(`session:${name}`) },
    tool: {
      hook: (name) => hook(`tool:${name}`),
      transform: transform("tool:transform", toolDraft),
    },
    event: { subscribe: () => Stream.empty },
  }, { get: (target, key) => key in target ? target[key] : unused })
  const scope = await Effect.runPromise(Scope.make())
  try {
    await Effect.runPromise(Scope.provide(scope)(exportedPlugin.effect(host)))
    const searches = definitions.filter(({ name }) => ["web_search", "formerhuman_search"].includes(name))
    assert.deepEqual(searches.map(({ name }) => name).sort(), ["formerhuman_search", "web_search"])
    assert.equal(searches[0].execute, searches[1].execute)
    const context = { sessionID: "session", agent: "researcher", messageID: "message", id: "call", progress: () => Effect.void }
    await Effect.runPromise(Effect.flatMap(Effect.interrupt, () => searches[0].execute({ query: "x" }, context))).catch(() => undefined)
    assert.equal(calls, 0)
    await Effect.runPromise(searches[0].execute({ query: "x" }, context))
    assert.equal(calls, 1)
  } finally {
    await Effect.runPromise(Scope.close(scope, Exit.void))
    await rm(directory, { recursive: true, force: true })
  }
  assert.ok(lifecycle.lastIndexOf("dispose:tool:transform") < lifecycle.indexOf("close:runtime"), lifecycle.join(","))
  assert.equal(lifecycle.filter((entry) => entry === "close:runtime").length, 1)
})

test("the private query-only workspace package loads under the pinned Bun host runtime", () => {
  const output = execFileSync("bun", ["-e", "import('@curiosity/runtime/query').then(m=>console.log(Object.keys(m).sort().join(',')))"], {
    cwd: fileURLToPath(new URL("../../", import.meta.url)),
    encoding: "utf8",
  }).trim()
  assert.equal(output, "createQueryRuntime,queryRuntimeCapabilities")
})
