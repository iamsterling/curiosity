import assert from "node:assert/strict"
import { access, copyFile, mkdir, mkdtemp, readFile, rm, symlink, unlink, writeFile } from "node:fs/promises"
import { spawn } from "node:child_process"
import os from "node:os"
import path from "node:path"
import test from "node:test"

import { runVerifiedValidationContainer, validationContainerArguments } from "../../tools/ephemeral-container/container-command.mjs"
import { writePreparedInputManifest } from "../../tools/ephemeral-container/prepared-input.mjs"
import { EXPECTED_AGENTS, EXPECTED_COMMAND_IDS, EXPECTED_SKILL_IDS, EXPECTED_TOOL_IDS } from "../../tools/ephemeral-container/validation-contract.mjs"
import { stageReleaseInput, stageValidationHarness } from "../../tools/prepare-ephemeral-container-input.mjs"

const pluginRoot = path.resolve(import.meta.dirname, "../..")
const testEnvironmentSource = path.join(pluginRoot, "tools", "ephemeral-container", "test-environment")

const run = (command, args) => new Promise((resolve, reject) => {
  const child = spawn(command, args, { stdio: ["ignore", "pipe", "pipe"] })
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

test("validation container has no network and exactly one read-only prepared bind mount", () => {
  const preparedInput = "/host/prepared-input"
  const args = validationContainerArguments({
    image: "oven/bun:exact-digest",
    mode: "smoke",
    preparedInput,
  })

  assert.equal(args[0], "run")
  assert.ok(args.includes("--rm"))
  assert.ok(args.includes("--read-only"))
  assert.deepEqual(args.slice(args.indexOf("--network"), args.indexOf("--network") + 2), ["--network", "none"])
  assert.deepEqual(args.slice(args.indexOf("--workdir"), args.indexOf("--workdir") + 2), ["--workdir", "/tmp"])
  assert.ok(args.includes(`type=bind,src=${preparedInput},dst=/input,readonly`))
  const bindMounts = args.filter((argument) => argument.startsWith("type=bind,"))
  assert.deepEqual(bindMounts, [`type=bind,src=${preparedInput},dst=/input,readonly`])
  assert.equal(args.some((argument) => argument.includes(pluginRoot) || argument.includes("/workspace")), false)
  assert.equal(args.at(-3), "bun")
  assert.equal(args.at(-2), "/input/validation-harness/validate.mjs")
  assert.equal(args.at(-1), "smoke")
})

test("host staging creates an inventoried release input without repository build surfaces", async () => {
  const temporary = await mkdtemp(path.join(os.tmpdir(), "opencode2-release-input-"))
  try {
    const release = path.join(temporary, "release")
    const inventory = await stageReleaseInput({ pluginRoot, release })
    assert.equal(inventory.schemaVersion, 1)
    assert.equal(inventory.files.length > 0, true)
    assert.deepEqual(inventory.files.map(({ path: file }) => file), [...inventory.files.map(({ path: file }) => file)].sort())
    for (const required of ["package.json", "tools/install-node.mjs", "dist/index.js", "assets/manifest.json"]) {
      assert.equal(inventory.files.some(({ path: file }) => file === required), true, required)
    }
    for (const excluded of ["src", "tests", "tsconfig.json", "bun.lock", "node_modules"]) {
      assert.equal(inventory.files.some(({ path: file }) => file === excluded || file.startsWith(`${excluded}/`)), false, excluded)
    }
  } finally {
    await rm(temporary, { recursive: true, force: true })
  }
})

test("host staging copies only the inventoried validation harness into prepared input", async () => {
  const temporary = await mkdtemp(path.join(os.tmpdir(), "opencode2-validation-input-"))
  try {
    await stageValidationHarness({ inputRoot: temporary, pluginRoot })
    const manifest = await writePreparedInputManifest({ inputRoot: temporary, metadata: { purpose: "test" } })
    assert.deepEqual(
      manifest.inventory.entries.map(({ path: file }) => file),
      [
        "validation-harness/functional-validation.mjs",
        "validation-harness/package-archive.mjs",
        "validation-harness/prepared-input.mjs",
        "validation-harness/readme-setup.mjs",
        "validation-harness/registry-server.mjs",
        "validation-harness/registry-validation.mjs",
        "validation-harness/validate.mjs",
        "validation-harness/validation-contract.mjs",
        "validation-harness/validation-files.mjs",
      ],
    )
  } finally {
    await rm(temporary, { recursive: true, force: true })
  }
})

test("functional setup contract is explicit, unique, and aligned with checked-in release assets", async () => {
  const manifest = JSON.parse(await readFile(path.join(pluginRoot, "assets", "manifest.json"), "utf8"))
  const commands = manifest.assets.filter(({ kind }) => kind === "command")
  assert.deepEqual(commands.map(({ id }) => id), EXPECTED_COMMAND_IDS)
  assert.equal(commands.filter(({ status }) => status === "active").length, 11)
  assert.equal(commands.filter(({ status }) => status === "compatibility-deprecated").length, 30)
  assert.deepEqual(manifest.assets.filter(({ kind }) => kind === "skill").map(({ id }) => id), EXPECTED_SKILL_IDS)
  assert.deepEqual(Object.keys(EXPECTED_AGENTS).sort(), ["analyst", "generalist", "implementer", "orchestrator", "researcher", "reviewer", "strategist", "worker"])
  assert.equal(EXPECTED_TOOL_IDS.length, 20)
  for (const values of [EXPECTED_COMMAND_IDS, EXPECTED_SKILL_IDS, EXPECTED_TOOL_IDS]) assert.equal(new Set(values).size, values.length)
})

const preparedFixture = async (temporary) => {
  const dependency = path.join(temporary, "test-environment", "node_modules", "effect", "dist", "Array.js")
  const harness = path.join(temporary, "validation-harness", "validate.mjs")
  await mkdir(path.dirname(dependency), { recursive: true })
  await mkdir(path.dirname(harness), { recursive: true })
  await mkdir(path.join(temporary, "release"), { recursive: true })
  await writeFile(dependency, "export const sentinel = true\n")
  await writeFile(harness, "console.log('validate')\n")
  await writeFile(path.join(temporary, "release", "package.json"), "{\"private\":true}\n")
  await symlink("dist/Array.js", path.join(temporary, "test-environment", "node_modules", "effect", "Array-link.js"))
  await writePreparedInputManifest({ inputRoot: temporary, metadata: { purpose: "test" } })
  return { dependency, harness }
}

for (const target of ["transitive runtime dependency", "validation harness"]) {
  test(`prepared-input ${target} tampering fails before Docker execution`, async () => {
    const temporary = await mkdtemp(path.join(os.tmpdir(), "opencode2-prepared-tamper-"))
    try {
      const fixture = await preparedFixture(temporary)
      await writeFile(target === "validation harness" ? fixture.harness : fixture.dependency, "tampered\n")
      let dockerExecuted = false
      await assert.rejects(
        () => runVerifiedValidationContainer({
          execute: async () => { dockerExecuted = true },
          image: "oven/bun:exact-digest",
          mode: "smoke",
          preparedInput: temporary,
        }),
        { message: "OPENCODE2_PREPARED_INPUT_INTEGRITY_INVALID" },
      )
      assert.equal(dockerExecuted, false)
    } finally {
      await rm(temporary, { recursive: true, force: true })
    }
  })
}

test("prepared-input symlink escape fails before Docker execution", async () => {
  const temporary = await mkdtemp(path.join(os.tmpdir(), "opencode2-prepared-symlink-"))
  const outside = await mkdtemp(path.join(os.tmpdir(), "opencode2-prepared-outside-"))
  try {
    await preparedFixture(temporary)
    const link = path.join(temporary, "test-environment", "node_modules", "effect", "Array-link.js")
    await unlink(link)
    await writeFile(path.join(outside, "outside.js"), "outside\n")
    await symlink(path.join(outside, "outside.js"), link)
    let dockerExecuted = false
    await assert.rejects(
      () => runVerifiedValidationContainer({
        execute: async () => { dockerExecuted = true },
        image: "oven/bun:exact-digest",
        mode: "smoke",
        preparedInput: temporary,
      }),
      { message: "OPENCODE2_PREPARED_INPUT_SYMLINK_ESCAPE" },
    )
    assert.equal(dockerExecuted, false)
  } finally {
    await rm(temporary, { recursive: true, force: true })
    await rm(outside, { recursive: true, force: true })
  }
})

test("test-environment dependency provisioning is frozen-lockfile enforced", async () => {
  const temporary = await mkdtemp(path.join(os.tmpdir(), "opencode2-frozen-environment-"))
  try {
    await copyFile(path.join(testEnvironmentSource, "package.json"), path.join(temporary, "package.json"))
    await copyFile(path.join(testEnvironmentSource, "bun.lock"), path.join(temporary, "bun.lock"))
    const originalLock = await readFile(path.join(temporary, "bun.lock"), "utf8")
    const manifest = JSON.parse(await readFile(path.join(temporary, "package.json"), "utf8"))
    manifest.dependencies.effect = "4.0.0-beta.106"
    await writeFile(path.join(temporary, "package.json"), `${JSON.stringify(manifest, null, 2)}\n`)
    const result = await run("bun", ["install", "--cwd", temporary, "--lockfile-only", "--frozen-lockfile", "--ignore-scripts"])
    assert.notEqual(result.code, 0, `${result.stdout}\n${result.stderr}`)
    assert.equal(await readFile(path.join(temporary, "bun.lock"), "utf8"), originalLock)
  } finally {
    await rm(temporary, { recursive: true, force: true })
  }
})

test("obsolete container preparation programs are absent", async () => {
  for (const file of ["acquire.mjs", "candidate-boundary-probe.mjs", "prepare.mjs", "Dockerfile"]) {
    await assert.rejects(() => access(path.join(pluginRoot, "tools", "ephemeral-container", file)), { code: "ENOENT" })
  }
})
