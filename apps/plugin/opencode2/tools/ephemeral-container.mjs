#!/usr/bin/env node
import { randomBytes } from "node:crypto"
import { spawn } from "node:child_process"
import { access, lstat } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

const pluginRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const repositoryRoot = path.resolve(pluginRoot, "../../..")
const buildContext = path.join(pluginRoot, "tools", "ephemeral-container")
const mode = process.argv[2]
const localFixture = process.argv.slice(3).includes("--local-fixture")
const nonce = randomBytes(8).toString("hex")
const image = `opencode2-validation:${nonce}`
const volume = `opencode2-validation-${nonce}`

const fail = (code) => {
  console.error(code)
  process.exit(2)
}

const run = (command, args, options = {}) => new Promise((resolve, reject) => {
  const child = spawn(command, args, { env: options.env ?? process.env, stdio: options.capture ? ["ignore", "pipe", "pipe"] : "inherit" })
  const stdout = []
  const stderr = []
  child.stdout?.on("data", (chunk) => stdout.push(Buffer.from(chunk)))
  child.stderr?.on("data", (chunk) => stderr.push(Buffer.from(chunk)))
  child.once("error", reject)
  child.once("close", (code) => {
    const result = { code, stderr: Buffer.concat(stderr).toString("utf8"), stdout: Buffer.concat(stdout).toString("utf8") }
    if (code !== 0 && !options.allowFailure) reject(Object.assign(new Error(`${options.code ?? "CONTAINER_COMMAND_FAILED"}:${code}`), result))
    else resolve(result)
  })
})

const requireFile = async (target, code) => {
  if (!target) fail(code)
  const details = await lstat(target).catch(() => undefined)
  if (!details?.isFile()) fail(code)
  return path.resolve(target)
}

const privateGitArguments = async () => {
  const url = process.env.OPENCODE2_GIT_URL ?? ""
  const ref = process.env.OPENCODE2_GIT_REF ?? ""
  if (!url) fail("OPENCODE2_PRIVATE_GIT_URL_REQUIRED")
  if (!ref) fail("OPENCODE2_PRIVATE_GIT_REF_REQUIRED")
  let transport
  if (url.startsWith("https://") || url.startsWith("ssh://")) {
    let parsed
    try { parsed = new URL(url) } catch { fail("OPENCODE2_PRIVATE_GIT_URL_INVALID") }
    if (parsed.username || parsed.password || parsed.search || parsed.hash) fail("OPENCODE2_CREDENTIAL_IN_URL_FORBIDDEN")
    if (!parsed.hostname || !new Set(["https:", "ssh:"]).has(parsed.protocol)) fail("OPENCODE2_PRIVATE_GIT_URL_INVALID")
    transport = parsed.protocol === "https:" ? "https" : "ssh"
  } else if (/^git@[^:?#]+:[^?#]+$/u.test(url)) transport = "ssh"
  else if (/[?#]/u.test(url)) fail("OPENCODE2_CREDENTIAL_IN_URL_FORBIDDEN")
  else fail("OPENCODE2_PRIVATE_GIT_URL_INVALID")

  const args = ["--env", `OPENCODE2_GIT_URL=${url}`, "--env", `OPENCODE2_GIT_REF=${ref}`]
  if (transport === "https") {
    const token = await requireFile(process.env.OPENCODE2_GIT_TOKEN_FILE, "OPENCODE2_GIT_TOKEN_FILE_REQUIRED")
    args.push("--mount", `type=bind,src=${token},dst=/run/secrets/git_token,readonly`)
    return args
  }
  if (transport === "ssh") {
    const agent = process.env.SSH_AUTH_SOCK
    await access(agent ?? "").catch(() => fail("OPENCODE2_SSH_AGENT_REQUIRED"))
    const knownHosts = await requireFile(process.env.OPENCODE2_GIT_KNOWN_HOSTS_FILE, "OPENCODE2_GIT_KNOWN_HOSTS_FILE_REQUIRED")
    args.push("--mount", `type=bind,src=${path.resolve(agent)},dst=/run/ssh-agent`)
    args.push("--mount", `type=bind,src=${knownHosts},dst=/run/secrets/git_known_hosts,readonly`)
    return args
  }
  fail("OPENCODE2_PRIVATE_GIT_URL_INVALID")
}

if (!new Set(["smoke", "stress"]).has(mode)) fail("Usage: ephemeral-container.mjs <smoke|stress> [--local-fixture]")
if (process.argv.slice(3).some((arg) => arg !== "--local-fixture")) fail("OPENCODE2_CONTAINER_ARGUMENT_INVALID")
await access(path.join(buildContext, "Dockerfile"))
const authenticationArguments = localFixture ? [] : await privateGitArguments()
await run("docker", ["version"], { capture: true, code: "OPENCODE2_DOCKER_UNAVAILABLE" })

let volumeCreated = false
let imageCreated = false
try {
  await run("docker", ["build", "--tag", image, buildContext], { code: "OPENCODE2_CONTAINER_IMAGE_BUILD_FAILED" })
  imageCreated = true
  await run("docker", ["volume", "create", volume], { capture: true, code: "OPENCODE2_CONTAINER_VOLUME_CREATE_FAILED" })
  volumeCreated = true
  const pluginPath = process.env.OPENCODE2_PLUGIN_PATH ?? "apps/plugin/opencode2"
  const acquisition = ["run", "--rm", "--mount", `type=volume,src=${volume},dst=/workspace`, "--env", `OPENCODE2_PLUGIN_PATH=${pluginPath}`]
  if (localFixture) {
    console.error("NON-AUTHORITATIVE: acquiring the current local working tree fixture; this does not validate private Git distribution.")
    acquisition.push("--mount", `type=bind,src=${repositoryRoot},dst=/fixture,readonly`, image, "/opt/opencode2-validation/acquire.mjs", "local-fixture")
  } else {
    acquisition.push(...authenticationArguments, image, "/opt/opencode2-validation/acquire.mjs", "private-git")
  }
  await run("docker", acquisition, { code: "OPENCODE2_CONTAINER_ACQUISITION_FAILED" })
  await run("docker", [
    "run", "--rm", "--security-opt", "no-new-privileges",
    "--mount", `type=volume,src=${volume},dst=/workspace`,
    image, "/opt/opencode2-validation/prepare.mjs",
  ], { code: "OPENCODE2_CONTAINER_PREPARATION_FAILED" })
  await run("docker", [
    "run", "--rm", "--network", "none", "--read-only",
    "--security-opt", "no-new-privileges", "--pids-limit", "256",
    "--mount", `type=volume,src=${volume},dst=/workspace,readonly`,
    "--tmpfs", "/validation:rw,exec,nosuid,nodev,mode=1777,size=768m",
    "--tmpfs", "/tmp:rw,exec,nosuid,nodev,mode=1777,size=128m",
    image, "/opt/opencode2-validation/validate.mjs", mode,
  ], { code: `OPENCODE2_CONTAINER_${mode.toUpperCase()}_FAILED` })
} finally {
  if (volumeCreated) await run("docker", ["volume", "rm", "--force", volume], { capture: true, allowFailure: true })
  if (imageCreated) await run("docker", ["image", "rm", "--force", image], { capture: true, allowFailure: true })
}
