import { spawn } from "node:child_process"
import { access, mkdir, readFile, writeFile } from "node:fs/promises"
import path from "node:path"

const workspace = "/workspace"
const sourceRoot = path.join(workspace, "source")
const cacheRoot = path.join(workspace, "bun-cache")
const acquisitionPath = path.join(workspace, "acquisition.json")
const boundaryProbe = "/opt/opencode2-validation/candidate-boundary-probe.mjs"
const expectedHost = "0.0.0-beta-17595"
const credentialPaths = ["/run/secrets/git_token", "/run/secrets/git_known_hosts", "/run/ssh-agent"]
const credentialEnvironment = ["GIT_ASKPASS", "GIT_SSH_COMMAND", "OPENCODE2_GIT_TOKEN", "OPENCODE2_GIT_TOKEN_FILE", "OPENCODE2_GIT_URL", "SSH_AUTH_SOCK"]

const fail = (code) => {
  throw new Error(code)
}

const run = (command, args, options = {}) => new Promise((resolve, reject) => {
  const child = spawn(command, args, {
    cwd: options.cwd,
    env: options.env,
    stdio: options.capture ? ["ignore", "pipe", "inherit"] : "inherit",
  })
  const stdout = []
  child.stdout?.on("data", (chunk) => stdout.push(Buffer.from(chunk)))
  child.once("error", reject)
  child.once("close", (code) => {
    if (code !== 0) reject(new Error(`${options.code ?? "PREPARATION_COMMAND_FAILED"}:${code}`))
    else resolve(Buffer.concat(stdout).toString("utf8").trim())
  })
})

for (const name of credentialEnvironment) {
  if (process.env[name]) fail("PREPARATION_CREDENTIAL_BOUNDARY_VIOLATION")
}
for (const target of credentialPaths) {
  if (await access(target).then(() => true).catch(() => false)) fail("PREPARATION_CREDENTIAL_BOUNDARY_VIOLATION")
}

const acquisition = JSON.parse(await readFile(acquisitionPath, "utf8").catch(() => fail("PREPARATION_ACQUISITION_MISSING")))
if (!new Set(["private-git", "local-fixture-non-authoritative"]).has(acquisition.source)) fail("PREPARATION_ACQUISITION_INVALID")
const pluginPath = acquisition.pluginPath
if (!pluginPath || path.isAbsolute(pluginPath) || pluginPath.split(/[\\/]/u).includes("..")) fail("PREPARATION_PLUGIN_PATH_INVALID")
const pluginRoot = path.join(sourceRoot, pluginPath)
const manifest = JSON.parse(await readFile(path.join(pluginRoot, "package.json"), "utf8").catch(() => fail("PREPARATION_PLUGIN_NOT_FOUND")))
if (manifest.private !== true) fail("PREPARATION_PACKAGE_MUST_BE_PRIVATE")
if (manifest.dependencies?.["@opencode-ai/plugin"] !== expectedHost || manifest.devDependencies?.["@opencode-ai/cli"] !== expectedHost) {
  fail("PREPARATION_HOST_PIN_MISMATCH")
}

await mkdir(cacheRoot, { recursive: true })
// Candidate-controlled package lifecycle and build scripts receive only this
// allowlisted environment. The launcher runs this file in a new container with
// no Git credential mount, URL environment, token file, or SSH agent socket.
const candidateEnv = {
  BUN_INSTALL_CACHE_DIR: cacheRoot,
  HOME: process.env.HOME ?? "/root",
  LANG: "C.UTF-8",
  PATH: "/usr/local/bin:/usr/bin:/bin",
}
await run(process.execPath, [boundaryProbe], { env: candidateEnv, code: "PREPARATION_CREDENTIAL_BOUNDARY_PROBE_FAILED" })
await run("bun", ["install", "--frozen-lockfile"], { cwd: sourceRoot, env: candidateEnv, code: "PREPARATION_DEPENDENCY_INSTALL_FAILED" })
const dependencyPath = path.join(pluginPath, "node_modules")
await access(path.join(sourceRoot, dependencyPath, "@opencode-ai", "plugin", "package.json"))
  .catch(() => fail("PREPARATION_PLUGIN_DEPENDENCY_MISSING"))
const architecture = process.arch === "arm64" ? "arm64" : process.arch === "x64" ? "x64" : fail("PREPARATION_ARCHITECTURE_UNSUPPORTED")
const host = await run("find", [
  sourceRoot, "-path", `*/@opencode-ai/cli-linux-${architecture}/bin/opencode2`, "-type", "f", "-print", "-quit",
], { env: candidateEnv, capture: true, code: "PREPARATION_HOST_SEARCH_FAILED" })
if (!host) fail("PREPARATION_PINNED_HOST_MISSING")
const hostPath = path.relative(sourceRoot, host)
await run(process.execPath, [boundaryProbe], { env: candidateEnv, code: "PREPARATION_CREDENTIAL_BOUNDARY_PROBE_FAILED" })
await run("bun", ["run", "--cwd", pluginRoot, "build"], { cwd: sourceRoot, env: candidateEnv, code: "PREPARATION_PLUGIN_BUILD_FAILED" })
await writeFile(acquisitionPath, `${JSON.stringify({
  ...acquisition,
  credentialBoundary: "separate-container-without-git-credentials",
  dependencyPath,
  hostPath,
})}\n`, "utf8")
console.log(JSON.stringify({ status: "prepared", source: acquisition.source, pluginPath }))
