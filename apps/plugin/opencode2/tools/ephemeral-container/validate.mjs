import assert from "node:assert/strict"
import { randomBytes } from "node:crypto"
import { spawn } from "node:child_process"
import { access, mkdir, readFile, readdir, symlink, writeFile } from "node:fs/promises"
import path from "node:path"
import { verifyInstalledState, verifyPreparedInput } from "./validation-files.mjs"

const validationRoot = "/validation"
const inputRoot = "/input"
const expectedHost = "0.0.0-beta-17595"
const expectedPlugin = "iamsterling.opencode2-config"
const busyDiagnostic = "OPENCODE2_CONFIG_INSTALL_BUSY: retry the installation\n"
const unsafeDestinationDiagnostic = "OPENCODE2_CONFIG_DESTINATION_UNSAFE\n"
const prepared = await verifyPreparedInput({ inputRoot, expectedHost })
const pluginRoot = prepared.releaseRoot
const installer = path.join(pluginRoot, "tools", "install-node.mjs")

const capture = (command, args, options = {}) => new Promise((resolve, reject) => {
  const child = spawn(command, args, {
    cwd: options.cwd,
    env: options.env,
    detached: options.detached ?? false,
    stdio: ["ignore", "pipe", "pipe"],
  })
  const stdout = []
  const stderr = []
  child.stdout.on("data", (chunk) => stdout.push(Buffer.from(chunk)))
  child.stderr.on("data", (chunk) => stderr.push(Buffer.from(chunk)))
  child.once("error", reject)
  child.once("close", (code, signal) => resolve({
    code,
    signal,
    stderr: Buffer.concat(stderr).toString("utf8"),
    stdout: Buffer.concat(stdout).toString("utf8"),
  }))
})

const fixture = async () => {
  const roots = Object.fromEntries(["home", "xdg-config", "xdg-data", "xdg-cache", "config", "project", "tmp", "bun-install"]
    .map((name) => [name, path.join(validationRoot, name)]))
  await Promise.all(Object.values(roots).map((directory) => mkdir(directory, { recursive: true })))
  const unrelated = {
    config: path.join(roots.config, "operator-config-canary.txt"),
    command: path.join(roots.config, "commands", "operator-command.md"),
  }
  await mkdir(path.dirname(unrelated.command), { recursive: true })
  const outsideCanary = path.join(validationRoot, "outside-root-canary.txt")
  await writeFile(unrelated.config, "operator-config-canary\n", { flag: "wx" })
  await writeFile(unrelated.command, "operator-command-canary\n", { flag: "wx" })
  await writeFile(outsideCanary, "outside-root-canary\n", { flag: "wx" })
  const env = {
    BUN_INSTALL_CACHE_DIR: roots["xdg-cache"],
    BUN_INSTALL: roots["bun-install"],
    BUN_TMPDIR: roots.tmp,
    HOME: roots.home,
    LANG: "C.UTF-8",
    OPENCODE_CONFIG_DIR: roots.config,
    PATH: "/usr/local/bin:/usr/bin:/bin",
    TMPDIR: roots.tmp,
    XDG_CACHE_HOME: roots["xdg-cache"],
    XDG_CONFIG_HOME: roots["xdg-config"],
    XDG_DATA_HOME: roots["xdg-data"],
  }
  return { env, outsideCanary, roots, unrelated }
}

const runInstaller = (env) => capture(process.execPath, [installer], { cwd: pluginRoot, env })
const assertWinner = (result) => {
  assert.equal(result.code, 0, result.stderr)
  assert.match(result.stdout, /Installed OpenCode2 Config plugin/)
  assert.equal(result.stderr, "")
}

const assertDestinationConfinement = async (context) => {
  const config = path.join(validationRoot, "symlink-attack-config")
  const outside = path.join(validationRoot, "symlink-attack-outside")
  const canary = path.join(outside, "operator-canary.txt")
  await mkdir(config, { recursive: true })
  await mkdir(outside, { recursive: true })
  await writeFile(canary, "operator-canary\n", { flag: "wx" })
  await symlink(outside, path.join(config, "skills"), "dir")
  const before = await readdir(outside)
  const result = await runInstaller({ ...context.env, OPENCODE_CONFIG_DIR: config })
  assert.equal(result.code, 1)
  assert.equal(result.stdout, "")
  assert.equal(result.stderr, unsafeDestinationDiagnostic)
  assert.deepEqual(await readdir(outside), before)
  assert.equal(await readFile(canary, "utf8"), "operator-canary\n")
}

const assertNetworkNamespaceDisabled = async () => {
  const routes = (await readFile("/proc/net/route", "utf8")).trim().split("\n").slice(1).filter(Boolean)
  assert.deepEqual(routes.filter((line) => line.trim().split(/\s+/u)[0] !== "lo"), [], "validation must run with Docker --network none")
  const interfaces = (await readFile("/proc/net/dev", "utf8")).split("\n").slice(2).map((line) => line.split(":", 1)[0].trim()).filter(Boolean)
  const activeExternal = []
  for (const name of interfaces.filter((value) => value !== "lo")) {
    const state = (await readFile(path.join("/sys/class/net", name, "operstate"), "utf8")).trim()
    if (state !== "down") activeExternal.push({ name, state })
  }
  assert.deepEqual(activeExternal, [], "validation must have no active external interface")
  const ipv6Routes = (await readFile("/proc/net/ipv6_route", "utf8")).trim().split("\n").filter(Boolean)
  assert.deepEqual(ipv6Routes.filter((line) => line.trim().split(/\s+/u).at(-1) !== "lo"), [], "validation must have no external IPv6 route")
}

const findHost = async () => access(prepared.host).then(() => prepared.host, () => { throw new Error("CONTAINER_PINNED_HOST_NOT_FOUND") })

const waitFor = async (operation, timeout = 15_000) => {
  const deadline = Date.now() + timeout
  let lastError
  while (Date.now() < deadline) {
    try {
      const value = await operation()
      if (value !== undefined) return value
    } catch (error) {
      lastError = error
    }
    await new Promise((resolve) => setTimeout(resolve, 50))
  }
  throw lastError ?? new Error("CONTAINER_HOST_TIMEOUT")
}

const terminate = async (child) => {
  const exited = new Promise((resolve) => child.once("close", resolve))
  process.kill(-child.pid, "SIGTERM")
  const graceful = await Promise.race([exited.then(() => true), new Promise((resolve) => setTimeout(() => resolve(false), 10_000))])
  if (!graceful) {
    process.kill(-child.pid, "SIGKILL")
    await exited
    throw new Error("CONTAINER_HOST_CLEAN_SHUTDOWN_FAILED")
  }
  const survivors = []
  for (const entry of (await readdir("/proc", { withFileTypes: true })).filter((item) => item.isDirectory() && /^\d+$/u.test(item.name))) {
    const stat = await readFile(path.join("/proc", entry.name, "stat"), "utf8").catch(() => "")
    const fields = stat.slice(stat.lastIndexOf(")") + 1).trim().split(/\s+/u)
    if (fields[2] === String(child.pid)) survivors.push(entry.name)
  }
  assert.deepEqual(survivors, [], `host process-group survivors: ${JSON.stringify(survivors)}`)
}

const activate = async ({ env, roots }) => {
  const host = await findHost()
  const version = await capture(host, ["--version"], { cwd: roots.project, env })
  assert.equal(version.code, 0, version.stderr)
  assert.equal(version.stdout.trim(), `opencode2 v${expectedHost}`)
  const password = randomBytes(24).toString("base64url")
  const authorization = `Basic ${Buffer.from(`opencode:${password}`).toString("base64")}`
  const hostEnv = {
    ...env,
    OPENCODE_CONFIG_CONTENT: JSON.stringify({ plugins: ["-opencode.*"] }),
    OPENCODE_PASSWORD: password,
  }
  const child = spawn(host, ["serve", "--hostname", "127.0.0.1", "--port", "0", "--log-level", "all"], {
    cwd: roots.project,
    env: hostEnv,
    detached: true,
    stdio: ["ignore", "pipe", "pipe"],
  })
  const output = []
  child.stdout.on("data", (chunk) => output.push(Buffer.from(chunk)))
  child.stderr.on("data", (chunk) => output.push(Buffer.from(chunk)))
  try {
    const baseURL = await waitFor(() => Buffer.concat(output).toString("utf8").match(/server listening on (http:\/\/127\.0\.0\.1:\d+)/u)?.[1])
    const url = new URL("/api/plugin", baseURL)
    url.searchParams.set("location[directory]", roots.project)
    const inventory = await waitFor(async () => {
      const response = await fetch(url, { headers: { Authorization: authorization }, signal: AbortSignal.timeout(1_000) })
      if (!response.ok) throw new Error(`CONTAINER_HOST_HTTP_${response.status}`)
      const payload = await response.json()
      return Array.isArray(payload?.data) && payload.data.length > 0 ? payload.data : undefined
    })
    assert.deepEqual(inventory, [{ id: expectedPlugin }])
    return { hostVersion: expectedHost, pluginRegistrations: inventory.map(({ id }) => id) }
  } finally {
    await terminate(child)
  }
}

const smoke = async () => {
  const context = await fixture()
  await assertDestinationConfinement(context)
  assertWinner(await runInstaller(context.env))
  await symlink(path.join(inputRoot, prepared.metadata.testEnvironment.runtime.nodeModules), path.join(context.roots.config, "node_modules"), "dir")
  assertWinner(await runInstaller(context.env))
  const state = await verifyInstalledState({ pluginRoot, configRoot: context.roots.config, ...context })
  const runtime = await activate(context)
  return { mode: "smoke", ...state, ...runtime, serialReinstall: true }
}

const stress = async () => {
  const context = await fixture()
  await assertDestinationConfinement(context)
  const results = await Promise.all(Array.from({ length: 12 }, () => runInstaller(context.env)))
  const winners = results.filter(({ code }) => code === 0)
  const losers = results.filter(({ code }) => code !== 0)
  assert.equal(winners.length, 1, JSON.stringify(results))
  assertWinner(winners[0])
  assert.equal(losers.length, 11)
  for (const loser of losers) {
    assert.equal(loser.code, 75)
    assert.equal(loser.stdout, "")
    assert.equal(loser.stderr, busyDiagnostic)
  }
  const state = await verifyInstalledState({ pluginRoot, configRoot: context.roots.config, ...context })
  return { mode: "stress", ...state, writers: 1, retryableBusy: losers.length }
}

await assertNetworkNamespaceDisabled()
await assert.rejects(() => writeFile(path.join(inputRoot, ".mutation-probe"), "forbidden\n"), { code: "EROFS" })
const mode = process.argv[2]
const result = mode === "smoke" ? await smoke() : mode === "stress" ? await stress() : assert.fail("VALIDATION_MODE_INVALID")
console.log(JSON.stringify({ status: "passed", input: "host-prepared", ...result }))
