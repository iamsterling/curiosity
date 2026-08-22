import { spawn } from "node:child_process"
import { access, chmod, mkdir, rm, writeFile } from "node:fs/promises"
import path from "node:path"

const workspace = "/workspace"
const sourceRoot = path.join(workspace, "source")

const fail = (code) => {
  throw new Error(code)
}

const run = (command, args, options = {}) => new Promise((resolve, reject) => {
  const child = spawn(command, args, {
    cwd: options.cwd,
    env: options.env ?? process.env,
    stdio: options.sensitive ? ["ignore", "ignore", "ignore"] : options.capture ? ["ignore", "pipe", "inherit"] : "inherit",
  })
  const stdout = []
  child.stdout?.on("data", (chunk) => stdout.push(Buffer.from(chunk)))
  child.once("error", reject)
  child.once("close", (code) => {
    if (code !== 0) reject(new Error(`${options.code ?? "ACQUISITION_COMMAND_FAILED"}:${code}`))
    else resolve(Buffer.concat(stdout).toString("utf8").trim())
  })
})

const safePluginPath = (value) => {
  if (!value || path.isAbsolute(value) || value.split(/[\\/]/u).includes("..")) fail("ACQUISITION_PLUGIN_PATH_INVALID")
  return value
}

const preparePrivateGit = async () => {
  const url = process.env.OPENCODE2_GIT_URL ?? ""
  const ref = process.env.OPENCODE2_GIT_REF ?? ""
  if (!/^[A-Za-z0-9][A-Za-z0-9._/-]*$/u.test(ref) || ref.includes("..") || ref.includes("@{")) {
    fail("ACQUISITION_GIT_REF_INVALID")
  }

  const env = { ...process.env, GIT_TERMINAL_PROMPT: "0" }
  let askpass
  if (url.startsWith("https://")) {
    let parsed
    try { parsed = new URL(url) } catch { fail("ACQUISITION_PRIVATE_GIT_URL_INVALID") }
    if (parsed.username || parsed.password || parsed.search || parsed.hash) fail("ACQUISITION_CREDENTIAL_IN_URL_FORBIDDEN")
    await access("/run/secrets/git_token").catch(() => fail("ACQUISITION_HTTPS_TOKEN_FILE_REQUIRED"))
    askpass = "/tmp/opencode2-git-askpass"
    await writeFile(askpass, "#!/bin/sh\ncase \"$1\" in *Username*) printf %s x-access-token ;; *) cat /run/secrets/git_token ;; esac\n")
    await chmod(askpass, 0o700)
    env.GIT_ASKPASS = askpass
  } else if (url.startsWith("ssh://")) {
    let parsed
    try { parsed = new URL(url) } catch { fail("ACQUISITION_PRIVATE_GIT_URL_INVALID") }
    if (parsed.username || parsed.password || parsed.search || parsed.hash) fail("ACQUISITION_CREDENTIAL_IN_URL_FORBIDDEN")
    await access("/run/ssh-agent").catch(() => fail("ACQUISITION_SSH_AGENT_REQUIRED"))
    await access("/run/secrets/git_known_hosts").catch(() => fail("ACQUISITION_SSH_KNOWN_HOSTS_REQUIRED"))
    env.SSH_AUTH_SOCK = "/run/ssh-agent"
    env.GIT_SSH_COMMAND = "ssh -o BatchMode=yes -o StrictHostKeyChecking=yes -o UserKnownHostsFile=/run/secrets/git_known_hosts"
  } else if (/^git@[^:?#]+:[^?#]+$/u.test(url)) {
    await access("/run/ssh-agent").catch(() => fail("ACQUISITION_SSH_AGENT_REQUIRED"))
    await access("/run/secrets/git_known_hosts").catch(() => fail("ACQUISITION_SSH_KNOWN_HOSTS_REQUIRED"))
    env.SSH_AUTH_SOCK = "/run/ssh-agent"
    env.GIT_SSH_COMMAND = "ssh -o BatchMode=yes -o StrictHostKeyChecking=yes -o UserKnownHostsFile=/run/secrets/git_known_hosts"
  } else {
    fail("ACQUISITION_PRIVATE_GIT_URL_REQUIRED")
  }

  try {
    await mkdir(sourceRoot, { recursive: true })
    await run("git", ["init", "--quiet", sourceRoot], { env, sensitive: true, code: "ACQUISITION_GIT_INIT_FAILED" })
    await run("git", ["-C", sourceRoot, "remote", "add", "origin", url], { env, sensitive: true, code: "ACQUISITION_GIT_REMOTE_FAILED" })
    await run("git", ["-C", sourceRoot, "fetch", "--quiet", "--depth=1", "origin", ref], { env, sensitive: true, code: "ACQUISITION_GIT_FETCH_FAILED" })
    await run("git", ["-C", sourceRoot, "checkout", "--quiet", "--detach", "FETCH_HEAD"], { env, sensitive: true, code: "ACQUISITION_GIT_CHECKOUT_FAILED" })
    const commit = await run("git", ["-C", sourceRoot, "rev-parse", "HEAD"], { env, capture: true, code: "ACQUISITION_GIT_COMMIT_FAILED" })
    await rm(path.join(sourceRoot, ".git"), { recursive: true, force: true })
    return { source: "private-git", ref, commit }
  } finally {
    if (askpass) await rm(askpass, { force: true })
  }
}

const prepareLocalFixture = async () => {
  await access("/fixture/package.json").catch(() => fail("ACQUISITION_LOCAL_FIXTURE_REQUIRED"))
  await mkdir(sourceRoot, { recursive: true })
  const archive = spawn("tar", [
    "-C", "/fixture", "--exclude=.git", "--exclude=node_modules", "--exclude=dist", "--exclude=.turbo",
    "--exclude=target", "-cf", "-", ".",
  ], { stdio: ["ignore", "pipe", "inherit"] })
  const extract = spawn("tar", ["-C", sourceRoot, "-xf", "-"], { stdio: ["pipe", "inherit", "inherit"] })
  archive.stdout.pipe(extract.stdin)
  const statuses = await Promise.all([archive, extract].map((child) => new Promise((resolve, reject) => {
    child.once("error", reject)
    child.once("close", resolve)
  })))
  if (statuses.some((status) => status !== 0)) fail("ACQUISITION_LOCAL_COPY_FAILED")
  return { source: "local-fixture-non-authoritative" }
}

const mode = process.argv[2]
const pluginPath = safePluginPath(process.env.OPENCODE2_PLUGIN_PATH ?? "apps/plugin/opencode2")
await rm(sourceRoot, { recursive: true, force: true })
const acquisition = mode === "private-git" ? await preparePrivateGit()
  : mode === "local-fixture" ? await prepareLocalFixture()
    : fail("ACQUISITION_MODE_INVALID")
await writeFile(path.join(workspace, "acquisition.json"), `${JSON.stringify({ ...acquisition, pluginPath })}\n`, "utf8")
console.log(JSON.stringify({ status: "acquired", ...acquisition, pluginPath }))
