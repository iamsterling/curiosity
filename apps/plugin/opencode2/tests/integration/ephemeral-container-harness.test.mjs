import assert from "node:assert/strict"
import { chmod, mkdtemp, readFile, rm, writeFile } from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import { spawn } from "node:child_process"
import test from "node:test"

const pluginRoot = path.resolve(import.meta.dirname, "../..")
const launcher = path.join(pluginRoot, "tools", "ephemeral-container.mjs")

const runLauncher = (args, env) => new Promise((resolve, reject) => {
  const child = spawn(process.execPath, [launcher, ...args], {
    cwd: pluginRoot,
    env,
    stdio: ["ignore", "pipe", "pipe"],
  })
  const stdout = []
  const stderr = []
  child.stdout.on("data", (chunk) => stdout.push(Buffer.from(chunk)))
  child.stderr.on("data", (chunk) => stderr.push(Buffer.from(chunk)))
  child.once("error", reject)
  child.once("close", (code) => resolve({
    code,
    stderr: Buffer.concat(stderr).toString("utf8"),
    stdout: Buffer.concat(stdout).toString("utf8"),
  }))
})

const fixture = async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "opencode2-container-harness-"))
  const bin = path.join(root, "bin")
  const log = path.join(root, "docker.jsonl")
  const marker = path.join(root, "docker-invoked")
  const token = path.join(root, "git-token")
  await import("node:fs/promises").then(({ mkdir }) => mkdir(bin))
  await writeFile(token, "file-token-sentinel", { mode: 0o600 })
  const docker = path.join(bin, "docker")
  await writeFile(docker, `#!/usr/bin/env node
import { appendFileSync, writeFileSync } from "node:fs"
writeFileSync(process.env.FAKE_DOCKER_MARKER, "invoked\\n")
appendFileSync(process.env.FAKE_DOCKER_LOG, JSON.stringify(process.argv.slice(2)) + "\\n")
`)
  await chmod(docker, 0o700)
  return {
    log,
    marker,
    root,
    token,
    env: {
      ...process.env,
      FAKE_DOCKER_LOG: log,
      FAKE_DOCKER_MARKER: marker,
      PATH: `${bin}${path.delimiter}${process.env.PATH}`,
    },
  }
}

test("private Git acquisition and candidate preparation are separate credential-free containers", async () => {
  const context = await fixture()
  const privateUrl = "https://git.example.invalid/private/repository.git"
  const tokenEnvironmentName = ["OPENCODE2", "GIT", "TOKEN"].join("_")
  try {
    const result = await runLauncher(["smoke"], {
      ...context.env,
      GIT_ASKPASS: "askpass-sentinel",
      OPENCODE2_GIT_REF: "reviewed-ref",
      [tokenEnvironmentName]: "token-env-sentinel",
      OPENCODE2_GIT_TOKEN_FILE: context.token,
      OPENCODE2_GIT_URL: privateUrl,
      SSH_AUTH_SOCK: "/credential/ssh-agent-sentinel",
    })
    assert.equal(result.code, 0, result.stderr)
    const calls = (await readFile(context.log, "utf8")).trim().split("\n").map((line) => JSON.parse(line))
    const runs = calls.filter(([command]) => command === "run")
    const acquisition = runs.find((args) => args.includes("/opt/opencode2-validation/acquire.mjs"))
    const preparation = runs.find((args) => args.includes("/opt/opencode2-validation/prepare.mjs"))
    const validation = runs.find((args) => args.includes("/opt/opencode2-validation/validate.mjs"))
    assert.ok(acquisition, JSON.stringify(runs))
    assert.ok(preparation, JSON.stringify(runs))
    assert.ok(validation, JSON.stringify(runs))
    assert.ok(acquisition.some((arg) => arg.includes("dst=/run/secrets/git_token")))
    assert.ok(acquisition.includes(`OPENCODE2_GIT_URL=${privateUrl}`))
    const candidateBoundary = JSON.stringify(preparation)
    for (const forbidden of [
      privateUrl,
      context.token,
      "/run/secrets/git_token",
      "file-token-sentinel",
      "token-env-sentinel",
      "askpass-sentinel",
      "SSH_AUTH_SOCK",
      "/credential/ssh-agent-sentinel",
    ]) assert.equal(candidateBoundary.includes(forbidden), false, forbidden)
    assert.ok(runs.indexOf(acquisition) < runs.indexOf(preparation))
    assert.ok(runs.indexOf(preparation) < runs.indexOf(validation))
  } finally {
    await rm(context.root, { recursive: true, force: true })
  }
})

test("credential-bearing Git URL components fail before Docker without disclosure", async () => {
  for (const url of [
    "https://query-secret@example.invalid/private.git",
    "https://example.invalid/private.git?token=query-secret",
    "https://example.invalid/private.git#token=fragment-secret",
  ]) {
    const context = await fixture()
    try {
      const result = await runLauncher(["smoke"], {
        ...context.env,
        OPENCODE2_GIT_REF: "reviewed-ref",
        OPENCODE2_GIT_TOKEN_FILE: context.token,
        OPENCODE2_GIT_URL: url,
      })
      assert.equal(result.code, 2)
      assert.equal(result.stdout, "")
      assert.equal(result.stderr, "OPENCODE2_CREDENTIAL_IN_URL_FORBIDDEN\n")
      assert.equal(result.stderr.includes(url), false)
      await assert.rejects(() => readFile(context.marker), { code: "ENOENT" })
    } finally {
      await rm(context.root, { recursive: true, force: true })
    }
  }
})
