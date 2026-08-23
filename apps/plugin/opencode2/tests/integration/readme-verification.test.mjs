import assert from "node:assert/strict"
import { spawn } from "node:child_process"
import { createServer } from "node:net"
import { chmod, mkdir, mkdtemp, readFile, realpath, rm, symlink, writeFile } from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import { createRequire } from "node:module"
import test from "node:test"

import { verifyManagedReadmePluginList } from "../../tools/ephemeral-container/readme-verification.mjs"
import { createManagedServiceProcessTracker } from "../../tools/ephemeral-container/managed-service-cleanup.mjs"
import { EXPECTED_README_PLUGIN_IDS } from "../../tools/ephemeral-container/validation-contract.mjs"

const argv = ["opencode2", "plugin", "list"]
const cwd = "/isolated/project"
const env = Object.freeze({ HOME: "/isolated/home", PATH: "/isolated/bin:/usr/bin:/bin" })
const expected = `${EXPECTED_README_PLUGIN_IDS.join("\n")}\n`
const empty = "No plugins loaded\n"
const result = (stdout, overrides = {}) => ({ code: 0, signal: null, stderr: "", stdout, ...overrides })
const hostVersion = "0.0.0-beta-17595"
const require = createRequire(import.meta.url)
const pinnedHost = path.join(path.dirname(require.resolve("@opencode-ai/cli/package.json")), "bin", "opencode2.exe")

const deterministic = (outputs, options = {}) => {
  let current = 0
  let cleanupCalls = 0
  const invocations = []
  const processTracker = { observe: async () => undefined }
  return {
    context: {
      argv,
      cwd,
      env,
      execute: async (actual) => {
        invocations.push(actual)
        return outputs[Math.min(invocations.length - 1, outputs.length - 1)]
      },
      cleanup: async (actual) => {
        cleanupCalls += 1
        assert.deepEqual(actual, { argv, cwd, env, processTracker })
        return { stopped: true, survivorPids: [] }
      },
      createProcessTracker: async (actual) => {
        assert.deepEqual(actual, { argv, cwd, env })
        return processTracker
      },
      now: () => current,
      sleep: async (milliseconds) => { current += milliseconds },
      retryIntervalMs: 100,
      timeoutMs: 250,
      ...options,
    },
    get cleanupCalls() { return cleanupCalls },
    invocations,
    processTracker,
  }
}

test("README plugin verification retries exact cold-empty output then accepts only the expected inventory", async () => {
  const fixture = deterministic([result(empty), result(expected)])
  const evidence = await verifyManagedReadmePluginList(fixture.context)
  assert.equal(fixture.cleanupCalls, 1)
  assert.deepEqual(fixture.invocations, [
    { argv, cwd, env, processTracker: fixture.processTracker, timeoutMs: 250 },
    { argv, cwd, env, processTracker: fixture.processTracker, timeoutMs: 150 },
  ])
  assert.deepEqual(evidence, {
    attempts: [
      { attempt: 1, code: 0, outcome: "cold-empty", signal: null, stderrBytes: 0, stdoutBytes: 18 },
      { attempt: 2, code: 0, outcome: "expected-inventory", signal: null, stderrBytes: 0, stdoutBytes: 1_895 },
    ],
    elapsedMs: 100,
    inventory: [...EXPECTED_README_PLUGIN_IDS],
    managedService: { stopped: true, survivorPids: [] },
  })
})

test("README plugin verification retries only a known built-in subset before product activation", async () => {
  const fixture = deterministic([result("opencode.agent\nopencode.command\n"), result(expected)])
  const evidence = await verifyManagedReadmePluginList(fixture.context)
  assert.equal(evidence.attempts[0].outcome, "cold-builtins")
  assert.equal(evidence.attempts[1].outcome, "expected-inventory")
  assert.equal(fixture.cleanupCalls, 1)
})

test("README plugin verification fails after the bounded perpetual-empty interval", async () => {
  const fixture = deterministic([result(empty)])
  await assert.rejects(verifyManagedReadmePluginList(fixture.context), (error) => {
    assert.equal(error.message, 'OPENCODE2_README_VERIFICATION_TIMEOUT:{"attempts":3,"elapsedMs":250}')
    return true
  })
  assert.equal(fixture.invocations.length, 3)
  assert.equal(fixture.cleanupCalls, 1)
})

test("README plugin verification fails immediately on a nonzero command without exposing output", async () => {
  const secret = ["verification", "token", "must", "stay", "redacted"].join("-")
  const fixture = deterministic([result(`unexpected ${secret}\n`, { code: 7, stderr: `failure ${secret}\n` })])
  await assert.rejects(verifyManagedReadmePluginList(fixture.context), (error) => {
    assert.match(error.message, /^OPENCODE2_README_VERIFICATION_COMMAND_FAILED:/u)
    assert.doesNotMatch(error.message, new RegExp(secret, "u"))
    return true
  })
  assert.equal(fixture.invocations.length, 1)
  assert.equal(fixture.cleanupCalls, 1)
})

test("README plugin verification cleans up after bounded output overflow", async () => {
  const fixture = deterministic([result("x".repeat(8_192), { outputOverflow: true })])
  await assert.rejects(verifyManagedReadmePluginList(fixture.context), (error) => {
    assert.equal(error.code, "OPENCODE2_README_VERIFICATION_COMMAND_FAILED")
    assert.match(error.message, /"outputOverflow":true/u)
    return true
  })
  assert.equal(fixture.cleanupCalls, 1)
})

test("README plugin verification fails immediately on an unexpected inventory", async () => {
  const fixture = deterministic([result(`${expected}other.plugin\n`)])
  await assert.rejects(verifyManagedReadmePluginList(fixture.context), (error) => {
    assert.match(error.message, /^OPENCODE2_README_VERIFICATION_INVENTORY_MISMATCH:/u)
    return true
  })
  assert.equal(fixture.invocations.length, 1)
  assert.equal(fixture.cleanupCalls, 1)
})

test("README plugin verification fails immediately when an exit-zero command writes stderr", async () => {
  const fixture = deterministic([result(expected, { stderr: "unexpected diagnostic\n" })])
  await assert.rejects(verifyManagedReadmePluginList(fixture.context), (error) => {
    assert.match(error.message, /^OPENCODE2_README_VERIFICATION_STDERR:/u)
    return true
  })
  assert.equal(fixture.invocations.length, 1)
  assert.equal(fixture.cleanupCalls, 1)
})

test("README plugin verification preserves its original failure and appends bounded cleanup diagnostics", async () => {
  const fixture = deterministic([result("", { code: 7 })], {
    cleanup: async () => {
      const error = new Error("OPENCODE2_README_SERVICE_SURVIVOR:{\"survivorPids\":[123]}")
      error.code = "OPENCODE2_README_SERVICE_SURVIVOR"
      throw error
    },
  })
  await assert.rejects(verifyManagedReadmePluginList(fixture.context), (error) => {
    assert.equal(error.code, "OPENCODE2_README_VERIFICATION_COMMAND_FAILED")
    assert.match(error.message, /^OPENCODE2_README_VERIFICATION_COMMAND_FAILED:/u)
    assert.match(error.message, /cleanup.*OPENCODE2_README_SERVICE_SURVIVOR/u)
    assert.equal(Buffer.byteLength(error.message) <= 2_048, true)
    return true
  })
})

test("managed service tracker excludes baseline services and retains reparented descendants without registration", async () => {
  const temporary = await mkdtemp(path.join(os.tmpdir(), "opencode2-process-tracker-"))
  const executable = path.join(temporary, "opencode2")
  await writeFile(executable, "#!/bin/sh\nexit 0\n", { mode: 0o700 })
  await chmod(executable, 0o700)
  const canonicalExecutable = await realpath(executable)
  const snapshots = [
    [{ command: `${canonicalExecutable} serve --service`, pgid: 10, pid: 10, ppid: 1 }],
    [
      { command: `${canonicalExecutable} serve --service`, pgid: 10, pid: 10, ppid: 1 },
      { command: `${canonicalExecutable} plugin list`, pgid: 20, pid: 20, ppid: 1 },
      { command: `${canonicalExecutable} serve --service`, pgid: 30, pid: 30, ppid: 20 },
      { command: "service-descendant", pgid: 30, pid: 31, ppid: 30 },
    ],
    [
      { command: `${canonicalExecutable} serve --service`, pgid: 10, pid: 10, ppid: 1 },
      { command: `${canonicalExecutable} serve --service`, pgid: 30, pid: 30, ppid: 1 },
      { command: "service-descendant", pgid: 30, pid: 31, ppid: 30 },
    ],
  ]
  let index = 0
  try {
    const tracker = await createManagedServiceProcessTracker({
      argv,
      cwd: temporary,
      env: { HOME: temporary, PATH: temporary },
      inspect: async () => snapshots[Math.min(index++, snapshots.length - 1)],
    })
    await tracker.observe(20)
    assert.deepEqual(tracker.baselineServicePids, [10])
    assert.deepEqual((await tracker.survivors()).map(({ pid }) => pid), [30, 31])
    assert.equal(tracker.trackedCount(), 2)
  } finally {
    await rm(temporary, { recursive: true, force: true })
  }
})

const isolatedPinnedHost = async (name) => {
  const root = await mkdtemp(path.join(os.tmpdir(), `opencode2-readme-${name}-`))
  const roots = Object.fromEntries(["bin", "cache", "config", "data", "home", "install", "project", "state", "tmp"]
    .map((entry) => [entry, path.join(root, entry)]))
  await Promise.all(Object.values(roots).map((directory) => mkdir(directory, { recursive: true })))
  await mkdir(path.join(roots.config, "opencode"), { recursive: true })
  await mkdir(path.join(roots.state, "opencode"), { recursive: true })
  await symlink(await realpath(pinnedHost), path.join(roots.bin, "opencode2"))
  return {
    env: {
      BUN_INSTALL: roots.install,
      BUN_INSTALL_CACHE_DIR: roots.cache,
      BUN_TMPDIR: roots.tmp,
      HOME: roots.home,
      OPENCODE_CONFIG_CONTENT: JSON.stringify({ plugins: [] }),
      OPENCODE_CONFIG_PROJECT_DISABLE: "1",
      OPENCODE_DISABLE_FFF: "1",
      OPENCODE_DISABLE_MODELS_FETCH: "1",
      PATH: `${roots.bin}:/usr/local/bin:/usr/bin:/bin`,
      TMPDIR: roots.tmp,
      XDG_CACHE_HOME: roots.cache,
      XDG_CONFIG_HOME: roots.config,
      XDG_DATA_HOME: roots.data,
      XDG_STATE_HOME: roots.state,
    },
    root,
    roots,
  }
}

const waitForLine = (stream) => new Promise((resolve, reject) => {
  let value = ""
  const timeout = setTimeout(() => reject(new Error("fixture server start timeout")), 5_000)
  stream.on("data", (chunk) => {
    value += chunk
    const newline = value.indexOf("\n")
    if (newline === -1) return
    clearTimeout(timeout)
    resolve(value.slice(0, newline))
  })
})

const startRegisteredFixtureService = async ({ mode, roots }) => {
  const script = `
const http = require("node:http")
const inventory = JSON.parse(process.argv[1])
const mode = process.argv[2]
const server = http.createServer((request, response) => {
  response.setHeader("content-type", "application/json")
  if (request.url.startsWith("/api/health")) return response.end(JSON.stringify({ healthy: true, pid: process.pid, version: ${JSON.stringify(hostVersion)} }))
  if (request.url.startsWith("/api/plugin")) {
    if (mode === "failure") { response.statusCode = 500; return response.end(JSON.stringify({ error: "fixture_failure" })) }
    return response.end(JSON.stringify({ data: inventory.map((id) => ({ id })) }))
  }
  if (request.url.startsWith("/api/service/stop")) {
    response.setHeader("connection", "close")
    return response.end(JSON.stringify({ accepted: true }), () => setTimeout(() => process.exit(0), 10))
  }
  response.statusCode = 404
  response.end(JSON.stringify({ error: "not_found" }))
})
server.listen(0, "127.0.0.1", () => console.log(server.address().port))
`
  const child = spawn(process.execPath, ["-e", script, JSON.stringify(EXPECTED_README_PLUGIN_IDS), mode], {
    stdio: ["ignore", "pipe", "pipe"],
  })
  const port = Number(await waitForLine(child.stdout))
  await writeFile(path.join(roots.state, "opencode", "service.json"), `${JSON.stringify({
    id: "readme-live-fixture",
    pid: child.pid,
    url: `http://127.0.0.1:${port}`,
    version: hostVersion,
  })}\n`, { mode: 0o600 })
  return child
}

for (const mode of ["success", "failure"]) {
  test(`pinned host README command ${mode} path performs managed cleanup without a new service survivor`, { skip: process.platform === "win32" }, async () => {
    const fixture = await isolatedPinnedHost(mode)
    let service
    try {
      const createProcessTracker = async (context) => {
        const tracker = await createManagedServiceProcessTracker(context)
        service = await startRegisteredFixtureService({ mode, roots: fixture.roots })
        return tracker
      }
      if (mode === "success") {
        const evidence = await verifyManagedReadmePluginList({ argv, createProcessTracker, cwd: fixture.roots.project, env: fixture.env, timeoutMs: 5_000 })
        assert.equal(evidence.managedService.discoveredCount > 0, true)
        assert.equal(evidence.managedService.normalStop.succeeded, true)
        assert.deepEqual(evidence.managedService.survivorPids, [])
      } else {
        await assert.rejects(
          verifyManagedReadmePluginList({ argv, createProcessTracker, cwd: fixture.roots.project, env: fixture.env, timeoutMs: 5_000 }),
          (error) => {
            assert.equal(error.code, "OPENCODE2_README_VERIFICATION_COMMAND_FAILED")
            assert.equal(error.cleanup.discoveredCount > 0, true)
            assert.deepEqual(error.cleanup.survivorPids, [])
            return true
          },
        )
      }
      if (service.exitCode === null && service.signalCode === null) await new Promise((resolve) => service.once("close", resolve))
    } finally {
      if (service?.exitCode === null && service.signalCode === null) service.kill("SIGKILL")
      await rm(fixture.root, { recursive: true, force: true })
    }
  })
}

test("pinned host timeout before service registration reaps every new detached service process", { skip: process.platform === "win32" }, async () => {
  const fixture = await isolatedPinnedHost("pre-registration-timeout")
  const occupied = createServer()
  await new Promise((resolve, reject) => {
    occupied.once("error", reject)
    occupied.listen(0, "127.0.0.1", resolve)
  })
  const port = occupied.address().port
  await writeFile(path.join(fixture.roots.config, "opencode", "service.json"), `${JSON.stringify({ port })}\n`, { mode: 0o600 })
  try {
    await assert.rejects(
      verifyManagedReadmePluginList({ argv, cwd: fixture.roots.project, env: fixture.env, timeoutMs: 750 }),
      (error) => {
        assert.equal(error.code, "OPENCODE2_README_VERIFICATION_COMMAND_FAILED")
        assert.equal(error.cleanup.discoveredCount > 0, true)
        assert.deepEqual(error.cleanup.survivorPids, [])
        return true
      },
    )
    await assert.rejects(readFile(path.join(fixture.roots.state, "opencode", "service.json"), "utf8"), { code: "ENOENT" })
  } finally {
    occupied.close()
    await rm(fixture.root, { recursive: true, force: true })
  }
})
