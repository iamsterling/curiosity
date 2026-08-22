import assert from "node:assert/strict"
import { createHash } from "node:crypto"
import { access, lstat, readFile, readdir } from "node:fs/promises"
import path from "node:path"

import { verifyPreparedInputManifest } from "./prepared-input.mjs"

const digest = (contents) => createHash("sha256").update(contents).digest("hex")

const files = async (directory, base = directory) => {
  const entries = await readdir(directory, { withFileTypes: true })
  const output = []
  for (const entry of entries) {
    const target = path.join(directory, entry.name)
    const relative = path.relative(base, target).replaceAll("\\", "/")
    const details = await lstat(target)
    assert.equal(details.isSymbolicLink(), false, `symlink is not allowed in installed output: ${relative}`)
    if (details.isDirectory()) output.push(...await files(target, base))
    else if (details.isFile()) output.push(relative)
    else assert.fail(`non-regular installed output: ${relative}`)
  }
  return output.sort()
}

const inventory = async (directory) => Promise.all((await files(directory)).map(async (relative) => {
  const contents = await readFile(path.join(directory, relative))
  return { path: relative, sha256: digest(contents), size: contents.length }
}))

export const verifyPreparedInput = async ({ inputRoot, expectedHost }) => {
  const metadata = await verifyPreparedInputManifest(inputRoot)
  assert.equal(metadata.schemaVersion, 2)
  assert.equal(metadata.release.schemaVersion, 1)
  const releaseRoot = path.join(inputRoot, "release")
  assert.deepEqual(await inventory(releaseRoot), metadata.release.files)
  const manifest = JSON.parse(await readFile(path.join(releaseRoot, "package.json"), "utf8"))
  assert.equal(manifest.private, true)
  assert.equal(manifest.dependencies?.["@opencode-ai/plugin"], expectedHost)
  assert.equal(manifest.devDependencies?.["@opencode-ai/cli"], expectedHost)
  assert.equal(metadata.testEnvironment.architecture, process.arch)
  assert.equal(metadata.testEnvironment.host.version, expectedHost)
  assert.equal(metadata.testEnvironment.host.path, "test-environment/bin/opencode2")
  const host = path.join(inputRoot, metadata.testEnvironment.host.path)
  assert.equal(digest(await readFile(host)), metadata.testEnvironment.host.sha256)
  assert.equal(metadata.testEnvironment.provenance.frozenLockfile, true)
  assert.equal(metadata.testEnvironment.provenance.install.includes("--frozen-lockfile"), true)
  for (const [name, expectedPath] of [["lock", "test-environment/bun.lock"], ["manifest", "test-environment/package.json"]]) {
    const evidence = metadata.testEnvironment.provenance[name]
    assert.equal(evidence.path, expectedPath)
    assert.equal(digest(await readFile(path.join(inputRoot, evidence.path))), evidence.sha256)
  }
  assert.equal(metadata.testEnvironment.runtime.nodeModules, "test-environment/node_modules")
  assert.equal(metadata.validationHarness.entry, "validation-harness/validate.mjs")
  for (const [name, version] of Object.entries(metadata.testEnvironment.runtime.dependencies)) {
    const installed = JSON.parse(await readFile(path.join(inputRoot, "test-environment", "node_modules", ...name.split("/"), "package.json"), "utf8"))
    assert.equal(installed.version, version, name)
  }
  return { host, metadata, releaseRoot }
}

const verifyReleaseDirectory = async ({ directory, expectedFiles, expectedEntry, publishedReceipt }) => {
  const receiptText = await readFile(path.join(directory, "receipt.json"), "utf8")
  const receipt = JSON.parse(receiptText)
  assert.equal(receipt.schemaVersion, 1)
  assert.equal(receipt.entry, expectedEntry)
  assert.deepEqual(receipt.loadPaths, ["plugins/opencode2-config.js"])
  assert.deepEqual(receipt.files, expectedFiles)
  assert.deepEqual(receipt.manifest, { schemaVersion: 1, entry: expectedEntry, files: expectedFiles })
  if (publishedReceipt !== undefined) assert.equal(receiptText, publishedReceipt)
  assert.deepEqual(
    await files(path.join(directory, "dist")),
    expectedFiles.map(({ path: relative }) => relative).sort(),
  )
  for (const file of expectedFiles) {
    assert.equal(digest(await readFile(path.join(directory, "dist", file.path))), file.sha256, file.path)
  }
}

const assetDestination = (configRoot, asset) => {
  if (asset.installDestination === "commands") return path.join(configRoot, "commands", `${asset.id}.md`)
  if (asset.installDestination === "agents") return path.join(configRoot, "agents", `${asset.id}.md`)
  if (asset.installDestination === "skills") {
    const [, , skill, ...resource] = asset.sourcePath.split("/")
    return path.join(configRoot, "skills", skill, ...resource)
  }
  if (asset.installDestination === "config") {
    return path.join(configRoot, "opencode2-config-bundle", "config", asset.sourcePath.slice("assets/config/".length))
  }
  assert.fail(`unknown asset destination: ${asset.installDestination}`)
}

export const verifyInstalledState = async ({ pluginRoot, configRoot, unrelated, outsideCanary }) => {
  const plugins = path.join(configRoot, "plugins")
  const sourceDist = path.join(pluginRoot, "dist")
  const expectedFiles = await Promise.all((await files(sourceDist)).filter((file) => file.endsWith(".js")).map(async (file) => ({
    path: file,
    sha256: digest(await readFile(path.join(sourceDist, file))),
  })))
  expectedFiles.sort((left, right) => left.path.localeCompare(right.path))
  const publishedReceipt = await readFile(path.join(plugins, "opencode2-config.receipt.json"), "utf8")
  await verifyReleaseDirectory({
    directory: path.join(plugins, "opencode2-config"),
    expectedFiles,
    expectedEntry: "index.js",
    publishedReceipt,
  })
  const previous = path.join(plugins, ".opencode2-config.previous")
  if (await access(previous).then(() => true).catch(() => false)) {
    await verifyReleaseDirectory({ directory: previous, expectedFiles, expectedEntry: "index.js" })
  }
  assert.equal(
    await readFile(path.join(plugins, "opencode2-config.js"), "utf8"),
    'export { default } from "./opencode2-config/dist/index.js"\n',
  )
  const assetManifest = JSON.parse(await readFile(path.join(pluginRoot, "assets", "manifest.json"), "utf8"))
  assert.equal(assetManifest.schemaVersion, 1)
  for (const asset of assetManifest.assets) {
    const source = await readFile(path.join(pluginRoot, asset.sourcePath))
    assert.equal(`sha256:${digest(source)}`, asset.digest, asset.sourcePath)
    assert.equal(digest(await readFile(assetDestination(configRoot, asset))), digest(source), asset.sourcePath)
  }
  assert.deepEqual(
    (await readdir(plugins)).filter((name) => name.startsWith(".opencode2-config.stage-")),
    [],
  )
  await assert.rejects(() => access(path.join(configRoot, ".opencode2-config.install.lock")), { code: "ENOENT" })
  assert.equal(await readFile(unrelated.config, "utf8"), "operator-config-canary\n")
  assert.equal(await readFile(unrelated.command, "utf8"), "operator-command-canary\n")
  assert.equal(await readFile(outsideCanary, "utf8"), "outside-root-canary\n")
  return { releaseFiles: expectedFiles.length, assets: assetManifest.assets.length }
}
