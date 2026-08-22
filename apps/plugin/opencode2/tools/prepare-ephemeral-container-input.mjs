import { createHash } from "node:crypto"
import { spawn } from "node:child_process"
import { chmod, copyFile, lstat, mkdir, readFile, readdir, rm } from "node:fs/promises"
import path from "node:path"

import { writePreparedInputManifest } from "./ephemeral-container/prepared-input.mjs"
import { prepareRegistry } from "./ephemeral-container/prepare-registry.mjs"

const digest = (contents) => createHash("sha256").update(contents).digest("hex")

const fail = (code) => {
  throw new Error(code)
}

const run = (command, args, options = {}) => new Promise((resolve, reject) => {
  const child = spawn(command, args, { cwd: options.cwd, env: process.env, stdio: "inherit" })
  child.once("error", reject)
  child.once("close", (code) => {
    if (code === 0) resolve()
    else reject(new Error(`${options.code ?? "OPENCODE2_HOST_PREPARATION_FAILED"}:${code}`))
  })
})

const copyTree = async (source, destination) => {
  const details = await lstat(source).catch(() => fail("OPENCODE2_RELEASE_INPUT_MISSING"))
  if (details.isSymbolicLink()) fail("OPENCODE2_RELEASE_INPUT_SYMLINK_FORBIDDEN")
  if (details.isFile()) {
    await mkdir(path.dirname(destination), { recursive: true })
    await copyFile(source, destination)
    return
  }
  if (!details.isDirectory()) fail("OPENCODE2_RELEASE_INPUT_TYPE_INVALID")
  await mkdir(destination, { recursive: true })
  for (const entry of await readdir(source)) await copyTree(path.join(source, entry), path.join(destination, entry))
}

const inventoryFiles = async (directory, base = directory) => {
  const output = []
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const target = path.join(directory, entry.name)
    const relative = path.relative(base, target).replaceAll("\\", "/")
    const details = await lstat(target)
    if (details.isSymbolicLink()) fail("OPENCODE2_RELEASE_INPUT_SYMLINK_FORBIDDEN")
    if (details.isDirectory()) output.push(...await inventoryFiles(target, base))
    else if (details.isFile()) {
      const contents = await readFile(target)
      output.push({ path: relative, sha256: digest(contents), size: contents.length })
    } else fail("OPENCODE2_RELEASE_INPUT_TYPE_INVALID")
  }
  return output.sort((left, right) => left.path < right.path ? -1 : left.path > right.path ? 1 : 0)
}

export const stageReleaseInput = async ({ pluginRoot, release }) => {
  await rm(release, { recursive: true, force: true })
  await mkdir(release, { recursive: true })
  for (const relative of ["LICENSE", "README.md", "package.json", "assets", "dist", "tools/install-node.mjs"]) {
    await copyTree(path.join(pluginRoot, relative), path.join(release, relative))
  }
  return { schemaVersion: 1, files: await inventoryFiles(release) }
}

const exactVersion = (value, code) => {
  if (typeof value !== "string" || !/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/u.test(value)) fail(code)
  return value
}

const provisionTestEnvironment = async ({ architecture, inputRoot, keepNodeModules, manifest, pluginRoot }) => {
  const environment = path.join(inputRoot, "test-environment")
  const frozenEnvironment = path.join(pluginRoot, "tools", "ephemeral-container", "test-environment")
  const pluginVersion = exactVersion(manifest.dependencies?.["@opencode-ai/plugin"], "OPENCODE2_PLUGIN_PIN_INVALID")
  const effectVersion = exactVersion(manifest.dependencies?.effect, "OPENCODE2_EFFECT_PIN_INVALID")
  const hostVersion = exactVersion(manifest.devDependencies?.["@opencode-ai/cli"], "OPENCODE2_HOST_PIN_INVALID")
  await mkdir(environment, { recursive: true })
  for (const file of ["package.json", "bun.lock"]) await copyTree(path.join(frozenEnvironment, file), path.join(environment, file))
  const runtimeManifest = JSON.parse(await readFile(path.join(environment, "package.json"), "utf8"))
  if (runtimeManifest.dependencies?.["@opencode-ai/plugin"] !== pluginVersion || runtimeManifest.dependencies?.effect !== effectVersion) {
    fail("OPENCODE2_TEST_ENVIRONMENT_RUNTIME_PIN_MISMATCH")
  }
  if (runtimeManifest.dependencies?.["@opencode-ai/cli"] !== hostVersion) fail("OPENCODE2_TEST_ENVIRONMENT_HOST_PIN_MISMATCH")
  const installArguments = [
    "install", "--cwd", environment, "--production", "--ignore-scripts", "--frozen-lockfile",
    "--backend=copyfile", "--os=linux", `--cpu=${architecture}`,
  ]
  const lockBefore = digest(await readFile(path.join(environment, "bun.lock")))
  await run("bun", installArguments, {
    code: "OPENCODE2_LINUX_RUNTIME_PROVISION_FAILED",
  })
  const lock = path.join(environment, "bun.lock")
  if (digest(await readFile(lock)) !== lockBefore) fail("OPENCODE2_TEST_ENVIRONMENT_LOCK_CHANGED")
  const sourceHost = path.join(environment, "node_modules", "@opencode-ai", `cli-linux-${architecture}`, "bin", "opencode2")
  const host = path.join(environment, "bin", "opencode2")
  await copyTree(sourceHost, host)
  await chmod(host, 0o755)
  const result = {
    architecture,
    host: { path: "test-environment/bin/opencode2", sha256: digest(await readFile(host)), version: hostVersion },
    provenance: {
      frozenLockfile: true,
      install: ["bun", ...installArguments.map((argument) => argument === environment ? "test-environment" : argument)],
      lock: { path: "test-environment/bun.lock", sha256: digest(await readFile(lock)) },
      manifest: { path: "test-environment/package.json", sha256: digest(await readFile(path.join(environment, "package.json"))) },
    },
    runtime: {
      dependencies: {
        "@opencode-ai/plugin": pluginVersion,
        effect: effectVersion,
      },
      ...(keepNodeModules ? { nodeModules: "test-environment/node_modules" } : {}),
    },
  }
  return result
}

export const stageValidationHarness = async ({ inputRoot, pluginRoot }) => {
  const source = path.join(pluginRoot, "tools", "ephemeral-container")
  const destination = path.join(inputRoot, "validation-harness")
  await mkdir(destination, { recursive: true })
  for (const file of [
    "functional-validation.mjs",
    "package-archive.mjs",
    "prepared-input.mjs",
    "readme-setup.mjs",
    "registry-server.mjs",
    "registry-validation.mjs",
    "validate.mjs",
    "validation-contract.mjs",
    "validation-files.mjs",
  ]) {
    await copyTree(path.join(source, file), path.join(destination, file))
  }
  return { entry: "validation-harness/validate.mjs" }
}

export const prepareEphemeralContainerInput = async ({ architecture, inputRoot, mode, pluginRoot }) => {
  if (!new Set(["arm64", "x64"]).has(architecture)) fail("OPENCODE2_CONTAINER_ARCHITECTURE_UNSUPPORTED")
  if (!new Set(["smoke", "stress"]).has(mode)) fail("OPENCODE2_CONTAINER_MODE_INVALID")
  const manifest = JSON.parse(await readFile(path.join(pluginRoot, "package.json"), "utf8"))
  if (manifest.private === true || manifest.publishConfig?.access !== "public") fail("OPENCODE2_RELEASE_PACKAGE_NOT_REGISTRY_READY")
  const testEnvironment = await provisionTestEnvironment({ architecture, inputRoot, keepNodeModules: mode === "stress", manifest, pluginRoot })
  let release
  let registry
  if (mode === "stress") {
    const releaseRoot = path.join(inputRoot, "release")
    release = await stageReleaseInput({ pluginRoot, release: releaseRoot })
  } else {
    registry = await prepareRegistry({
      environment: path.join(inputRoot, "test-environment"),
      inputRoot,
      lockPath: path.join(inputRoot, "test-environment", "bun.lock"),
      pluginRoot,
      sourceManifest: manifest,
    })
    await rm(path.join(inputRoot, "test-environment", "node_modules"), { recursive: true, force: true })
  }
  const validationHarness = await stageValidationHarness({ inputRoot, pluginRoot })
  return writePreparedInputManifest({
    inputRoot,
    metadata: {
      mode,
      ...(registry ? { registry } : {}),
      ...(release ? { release } : {}),
      testEnvironment,
      validationHarness,
    },
  })
}
