#!/usr/bin/env node
import { spawn } from "node:child_process"
import { mkdtemp, rm } from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"

import { runVerifiedValidationContainer } from "./ephemeral-container/container-command.mjs"
import { prepareEphemeralContainerInput } from "./prepare-ephemeral-container-input.mjs"

const pluginRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const image = "oven/bun:1.3.14@sha256:e10577f0db68676a7024391c6e5cb4b879ebd17188ab750cf10024a6d700e5c4"
const mode = process.argv[2]

const fail = (code) => {
  console.error(code)
  process.exit(2)
}

const run = (command, args, options = {}) => new Promise((resolve, reject) => {
  const child = spawn(command, args, {
    cwd: options.cwd,
    env: process.env,
    stdio: options.capture ? ["ignore", "pipe", "pipe"] : "inherit",
  })
  const stdout = []
  const stderr = []
  child.stdout?.on("data", (chunk) => stdout.push(Buffer.from(chunk)))
  child.stderr?.on("data", (chunk) => stderr.push(Buffer.from(chunk)))
  child.once("error", reject)
  child.once("close", (code) => {
    const result = { code, stderr: Buffer.concat(stderr).toString("utf8"), stdout: Buffer.concat(stdout).toString("utf8") }
    if (code !== 0) reject(Object.assign(new Error(`${options.code ?? "OPENCODE2_CONTAINER_COMMAND_FAILED"}:${code}`), result))
    else resolve(result)
  })
})

const architectureFromDocker = async () => {
  const result = await run("docker", ["info", "--format", "{{.Architecture}}"], { capture: true, code: "OPENCODE2_DOCKER_INFO_FAILED" })
  const architecture = result.stdout.trim()
  if (new Set(["arm64", "aarch64"]).has(architecture)) return "arm64"
  if (new Set(["amd64", "x86_64"]).has(architecture)) return "x64"
  throw new Error("OPENCODE2_CONTAINER_ARCHITECTURE_UNSUPPORTED")
}

if (!new Set(["smoke", "stress"]).has(mode) || process.argv.length !== 3) fail("Usage: ephemeral-container.mjs <smoke|stress>")
await run("docker", ["version"], { capture: true, code: "OPENCODE2_DOCKER_UNAVAILABLE" })
const architecture = await architectureFromDocker()
const preparedInput = await mkdtemp(path.join(os.tmpdir(), "opencode2-prepared-input-"))
try {
  await run("bun", ["run", "build"], { cwd: pluginRoot, code: "OPENCODE2_HOST_RELEASE_BUILD_FAILED" })
  await prepareEphemeralContainerInput({ architecture, inputRoot: preparedInput, mode, pluginRoot })
  await runVerifiedValidationContainer({
    execute: (args) => run("docker", args, { code: `OPENCODE2_CONTAINER_${mode.toUpperCase()}_FAILED` }),
    image,
    mode,
    preparedInput,
  })
} finally {
  await rm(preparedInput, { recursive: true, force: true })
}
