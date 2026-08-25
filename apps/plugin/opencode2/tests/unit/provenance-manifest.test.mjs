import assert from "node:assert/strict"
import { execFileSync } from "node:child_process"
import { createHash } from "node:crypto"
import { cp, mkdtemp, readFile, rm, writeFile } from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import test from "node:test"
import { buildProvenance } from "../../tools/provenance-manifest.mjs"
import { findWorkspaceRoot } from "../../tools/workspace-root.mjs"

test("artifact provenance hashes the workspace lock and records its exact OpenCode integrities", async () => {
  const packageRoot = path.resolve(import.meta.dirname, "../..")
  const workspaceRoot = await findWorkspaceRoot(packageRoot)
  const lockBytes = await readFile(path.join(workspaceRoot, "bun.lock"))
  const provenance = await buildProvenance(packageRoot)

  assert.equal(
    provenance.inputs.find(({ file }) => file === "workspace:bun.lock")?.sha256,
    createHash("sha256").update(lockBytes).digest("hex"),
  )
  assert.equal(provenance.resolutions.plugin.integrity, "sha512-tNk/rvUFaKGnuqKdqFbafxjOahFLiJHg10MUyKso6M1W+UZ9JuebW1ggWlgEXCKZ/w5xEpt3vR1wCzaRIeK7yw==")
  assert.equal(provenance.resolutions.host.integrity, "sha512-9lVIZ0fNsNtggMYzNpEW8+/Lh9ph45ZtoUNSVxBw9uFzq7sCjjwuGoMI1e21l/66l15kuaLRWjsvLoAMj4N/0w==")
})

test("provenance includes untracked runtime sources and rejects a stale manifest after one changes", async () => {
  const workspace = await mkdtemp(path.join(os.tmpdir(), "opencode2-provenance-"))
  const root = path.join(workspace, "apps", "plugin", "opencode2")
  try {
    await cp(".", root, {
      recursive: true,
      filter: (source) => !source.includes(`${path.sep}node_modules`) && !source.includes(`${path.sep}dist`),
    })
    await Promise.all([
      cp("dist", path.join(root, "dist"), { recursive: true }),
      writeFile(path.join(workspace, "package.json"), `${JSON.stringify({ private: true, workspaces: ["apps/plugin/*"] })}\n`),
      writeFile(path.join(workspace, "bun.lock"), `{
  "lockfileVersion": 1,
  "workspaces": {
    "apps/plugin/opencode2": {
      "dependencies": { "@opencode-ai/plugin": "0.0.0-beta-17519" },
      "devDependencies": { "@opencode-ai/cli": "0.0.0-beta-17519" }
    }
  },
  "packages": {
    "@opencode-ai/cli": ["@opencode-ai/cli@0.0.0-beta-17519", "", {}, "sha512-host-integrity"],
    "@opencode-ai/plugin": ["@opencode-ai/plugin@0.0.0-beta-17519", "", {}, "sha512-plugin-integrity"]
  }
}\n`),
    ])
    execFileSync("git", ["init", "--quiet"], { cwd: workspace })
    execFileSync("git", ["add", "."], { cwd: workspace })
    const before = await buildProvenance(root)
    assert.ok(before.inputs.some(({ file }) => file === "workspace:bun.lock"))
    assert.equal(before.resolutions.plugin.integrity, "sha512-plugin-integrity")
    assert.equal(before.resolutions.host.integrity, "sha512-host-integrity")
    assert.ok(before.inputs.some(({ file }) => file === "src/plugin/lifecycle.ts"))
    assert.ok(before.inputs.some(({ file }) => file === "src/platform/real-host/index.ts"))
    assert.ok(before.inputs.some(({ file }) => file === "src/features/handoff/compiler.mjs"))

    const target = path.join(root, "src/plugin/untracked-runtime.ts")
    await writeFile(target, "export const runtimeValue = 'one'\n")
    const after = await buildProvenance(root)
    assert.notEqual(after.inputDigest, before.inputDigest)
    assert.ok(after.inputs.some(({ file }) => file === "src/plugin/untracked-runtime.ts"))

    const staleArtifactManifest = after
    await writeFile(target, "export const runtimeValue = 'two'\n")
    const rebuiltManifest = await buildProvenance(root)
    assert.throws(
      () => assert.deepEqual(staleArtifactManifest, rebuiltManifest),
      /Expected values to be strictly deep-equal/u,
      "stale artifact verification must fail until rebuild records the new provenance",
    )
  } finally {
    await rm(workspace, { recursive: true, force: true })
  }
})
