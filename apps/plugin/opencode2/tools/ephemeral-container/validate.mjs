import assert from "node:assert/strict"
import { spawn } from "node:child_process"
import { mkdir, readFile, readdir, symlink, writeFile } from "node:fs/promises"
import path from "node:path"
import { validateRegistryPackageSmoke } from "./registry-validation.mjs"
import { EXPECTED_HOST_VERSION } from "./validation-contract.mjs"
import { verifyInstalledState, verifyPreparedInput } from "./validation-files.mjs"

const validationRoot = "/validation"
const inputRoot = "/input"
const mode = process.argv[2]
const busyDiagnostic = "OPENCODE2_CONFIG_INSTALL_BUSY: retry the installation\n"
const unsafeDestinationDiagnostic = "OPENCODE2_CONFIG_DESTINATION_UNSAFE\n"
const prepared = await verifyPreparedInput({ inputRoot, expectedHost: EXPECTED_HOST_VERSION, mode })
const pluginRoot = prepared.releaseRoot
const installer = pluginRoot ? path.join(pluginRoot, "tools", "install-node.mjs") : undefined

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
  roots.config = path.join(roots["xdg-config"], "opencode")
  for (const name of ["home", "xdg-config", "xdg-data", "xdg-cache", "project", "tmp"]) {
    roots[`disabled-${name}`] = path.join(validationRoot, "disabled", name)
  }
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
  const disabledEnv = {
    ...env,
    BUN_INSTALL_CACHE_DIR: roots["disabled-xdg-cache"],
    BUN_TMPDIR: roots["disabled-tmp"],
    HOME: roots["disabled-home"],
    TMPDIR: roots["disabled-tmp"],
    XDG_CACHE_HOME: roots["disabled-xdg-cache"],
    XDG_CONFIG_HOME: roots["xdg-config"],
    XDG_DATA_HOME: roots["disabled-xdg-data"],
  }
  return { disabledEnv, env, outsideCanary, roots, unrelated }
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
const result = mode === "smoke"
  ? await validateRegistryPackageSmoke({ inputRoot, prepared, validationRoot })
  : mode === "stress"
    ? { input: "host-prepared-local-staged-release", ...await stress() }
    : assert.fail("VALIDATION_MODE_INVALID")
console.log(JSON.stringify({ status: "passed", ...result }))
