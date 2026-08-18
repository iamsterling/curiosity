import assert from "node:assert/strict"
import { mkdir, mkdtemp, readFile, rm, symlink, writeFile, access } from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import test from "node:test"
import { createReleaseManifest } from "../../dist/platform/release/index.js"
import { installStagedRelease, rollbackStagedRelease } from "../../dist/platform/install/index.js"

const fixture = async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "opencode2-release-"))
  const source = path.join(root, "compiled")
  const config = path.join(root, "config")
  await mkdir(source, { recursive: true })
  await mkdir(path.join(config, "commands"), { recursive: true })
  await mkdir(path.join(root, "project", ".opencode", "opencode2-config", "ledger", "v1"), { recursive: true })
  await writeFile(path.join(source, "index.js"), "export default { id: 'test' }\n")
  await writeFile(path.join(source, "plugin.js"), "export const plugin = true\n")
  await writeFile(path.join(config, "commands", "operator.md"), "unrelated\n")
  await writeFile(path.join(root, "project", ".opencode", "opencode2-config", "ledger", "v1", "truth.json"), "ledger\n")
  return { root, source, config }
}

test("manifest-only compiled ESM install preserves unrelated files and records one hashed load path", async () => {
  const { root, source, config } = await fixture()
  try {
    const manifest = await createReleaseManifest({ source, files: ["index.js", "plugin.js"], entry: "index.js" })
    const receipt = await installStagedRelease({ configRoot: config, source, manifest })
    assert.equal(receipt.loadPaths.length, 1)
    assert.equal(receipt.loadPaths[0], "plugins/opencode2-config.js")
    assert.equal(receipt.files.length, 2)
    assert.match(await readFile(path.join(config, "plugins", "opencode2-config.js"), "utf8"), /dist\/index\.js/)
    assert.equal(await readFile(path.join(config, "commands", "operator.md"), "utf8"), "unrelated\n")
    assert.equal(await readFile(path.join(root, "project", ".opencode", "opencode2-config", "ledger", "v1", "truth.json"), "utf8"), "ledger\n")
  } finally { await rm(root, { recursive: true, force: true }) }
})

test("interrupted update restores the previous staged release and explicit rollback preserves ledger", async () => {
  const { root, source, config } = await fixture()
  try {
    const first = await createReleaseManifest({ source, files: ["index.js", "plugin.js"], entry: "index.js" })
    await installStagedRelease({ configRoot: config, source, manifest: first })
    await writeFile(path.join(source, "index.js"), "export default { id: 'updated' }\n")
    const second = await createReleaseManifest({ source, files: ["index.js", "plugin.js"], entry: "index.js" })
    await assert.rejects(
      () => installStagedRelease({ configRoot: config, source, manifest: second, fault: "before-commit" }),
      { code: "RELEASE_INSTALL_INTERRUPTED" },
    )
    assert.match(await readFile(path.join(config, "plugins", "opencode2-config", "dist", "index.js"), "utf8"), /'test'/)
    await installStagedRelease({ configRoot: config, source, manifest: second })
    await rollbackStagedRelease(config)
    assert.match(await readFile(path.join(config, "plugins", "opencode2-config", "dist", "index.js"), "utf8"), /'test'/)
    assert.equal(await readFile(path.join(root, "project", ".opencode", "opencode2-config", "ledger", "v1", "truth.json"), "utf8"), "ledger\n")
  } finally { await rm(root, { recursive: true, force: true }) }
})

test("rollback restores the previous manifest entry and wrapper", async () => {
  const { root, source, config } = await fixture()
  try {
    const first = await createReleaseManifest({ source, files: ["index.js", "plugin.js"], entry: "index.js" })
    await installStagedRelease({ configRoot: config, source, manifest: first })
    const second = await createReleaseManifest({ source, files: ["index.js", "plugin.js"], entry: "plugin.js" })
    await installStagedRelease({ configRoot: config, source, manifest: second })
    assert.match(await readFile(path.join(config, "plugins", "opencode2-config.js"), "utf8"), /dist\/plugin\.js/)
    await rollbackStagedRelease(config)
    assert.match(await readFile(path.join(config, "plugins", "opencode2-config.js"), "utf8"), /dist\/index\.js/)
  } finally { await rm(root, { recursive: true, force: true }) }
})

test("a second plugin wrapper causes staged installation to fail closed", async () => {
  const { root, source, config } = await fixture()
  try {
    await mkdir(path.join(config, "plugins"), { recursive: true })
    await writeFile(path.join(config, "plugins", "opencode2-config.ts"), "export {}\n")
    const manifest = await createReleaseManifest({ source, files: ["index.js", "plugin.js"], entry: "index.js" })
    await assert.rejects(() => installStagedRelease({ configRoot: config, source, manifest }), { code: "RELEASE_LOAD_PATH_DUPLICATE" })
  } finally { await rm(root, { recursive: true, force: true }) }
})

test("release rejects symlinks and derives the wrapper from the manifest entry", async () => {
  const { root, source, config } = await fixture()
  try {
    await symlink(path.join(source, "index.js"), path.join(source, "linked.js"))
    await assert.rejects(
      () => createReleaseManifest({ source, files: ["linked.js"], entry: "linked.js" }),
      { code: "RELEASE_FILE_NOT_REGULAR" },
    )
    const manifest = await createReleaseManifest({ source, files: ["plugin.js"], entry: "plugin.js" })
    await installStagedRelease({ configRoot: config, source, manifest })
    assert.match(await readFile(path.join(config, "plugins", "opencode2-config.js"), "utf8"), /dist\/plugin\.js/)
  } finally { await rm(root, { recursive: true, force: true }) }
})

test("pre-commit faults restore exact managed bytes and remove a new-install stage", async () => {
  const { root, source, config } = await fixture()
  try {
    const first = await createReleaseManifest({ source, files: ["index.js", "plugin.js"], entry: "index.js" })
    await installStagedRelease({ configRoot: config, source, manifest: first })
    const wrapper = path.join(config, "plugins", "opencode2-config.js")
    const receipt = path.join(config, "plugins", "opencode2-config.receipt.json")
    const before = [await readFile(wrapper, "utf8"), await readFile(receipt, "utf8")]
    await writeFile(path.join(source, "index.js"), "export default { id: 'next' }\n")
    const next = await createReleaseManifest({ source, files: ["index.js", "plugin.js"], entry: "index.js" })
    await assert.rejects(() => installStagedRelease({ configRoot: config, source, manifest: next, fault: "config" }), { code: "RELEASE_INSTALL_INTERRUPTED" })
    assert.deepEqual([await readFile(wrapper, "utf8"), await readFile(receipt, "utf8")], before)

    const clean = path.join(root, "clean-config")
    await assert.rejects(() => installStagedRelease({ configRoot: clean, source, manifest: next, fault: "plugin" }), { code: "RELEASE_INSTALL_INTERRUPTED" })
    await assert.rejects(() => access(path.join(clean, "plugins", "opencode2-config")))
  } finally { await rm(root, { recursive: true, force: true }) }
})

test("a post-commit interruption is deterministically repaired from the hashed immutable receipt", async () => {
  const { root, source, config } = await fixture()
  try {
    const manifest = await createReleaseManifest({ source, files: ["index.js", "plugin.js"], entry: "index.js" })
    await assert.rejects(() => installStagedRelease({ configRoot: config, source, manifest, fault: "wrapper" }), { code: "RELEASE_INSTALL_INTERRUPTED" })
    await installStagedRelease({ configRoot: config, source, manifest })
    assert.match(await readFile(path.join(config, "plugins", "opencode2-config.js"), "utf8"), /dist\/index\.js/)
    const persisted = JSON.parse(await readFile(path.join(config, "plugins", "opencode2-config.receipt.json"), "utf8"))
    assert.deepEqual(persisted.manifest, manifest)
  } finally { await rm(root, { recursive: true, force: true }) }
})

test("post-commit repair never substitutes a different requested manifest", async () => {
  const { root, source, config } = await fixture()
  try {
    const first = await createReleaseManifest({ source, files: ["index.js", "plugin.js"], entry: "index.js" })
    await assert.rejects(() => installStagedRelease({ configRoot: config, source, manifest: first, fault: "wrapper" }), { code: "RELEASE_INSTALL_INTERRUPTED" })
    const second = await createReleaseManifest({ source, files: ["index.js", "plugin.js"], entry: "plugin.js" })
    const installed = await installStagedRelease({ configRoot: config, source, manifest: second })
    assert.deepEqual(installed.manifest, second)
    assert.match(await readFile(path.join(config, "plugins", "opencode2-config.js"), "utf8"), /dist\/plugin\.js/)
  } finally { await rm(root, { recursive: true, force: true }) }
})

test("rollback faults preserve exact current release, wrapper, and receipt", async () => {
  for (const fault of ["before-commit", "wrapper", "receipt"]) {
    const { root, source, config } = await fixture()
    try {
      const first = await createReleaseManifest({ source, files: ["index.js", "plugin.js"], entry: "index.js" })
      await installStagedRelease({ configRoot: config, source, manifest: first })
      const second = await createReleaseManifest({ source, files: ["index.js", "plugin.js"], entry: "plugin.js" })
      await installStagedRelease({ configRoot: config, source, manifest: second })
      const managed = [
        path.join(config, "plugins", "opencode2-config", "receipt.json"),
        path.join(config, "plugins", "opencode2-config.js"),
        path.join(config, "plugins", "opencode2-config.receipt.json"),
      ]
      const before = await Promise.all(managed.map((target) => readFile(target, "utf8")))
      await assert.rejects(() => rollbackStagedRelease(config, { fault }), { code: "RELEASE_ROLLBACK_INTERRUPTED" })
      assert.deepEqual(await Promise.all(managed.map((target) => readFile(target, "utf8"))), before)
    } finally { await rm(root, { recursive: true, force: true }) }
  }
})
