import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import path from "node:path"
import test from "node:test"
import { findWorkspaceRoot } from "../../tools/workspace-root.mjs"

const host = "0.0.0-beta-18138"
const effect = "4.0.0-rc.111"
const root = path.resolve(import.meta.dirname, "../..")
const json = async (file) => JSON.parse((await readFile(file, "utf8")).replace(/,\s*([}\]])/gu, "$1"))

test("the active beta-18138 service ABI is exact while the historical release profile stays pinned", async () => {
  const workspaceRoot = await findWorkspaceRoot(root)
  const workspacePackage = path.relative(workspaceRoot, root).split(path.sep).join("/")
  const [pkg, lock, guard, realHost, releaseLib, releaseTool] = await Promise.all([
    json(path.join(root, "package.json")),
    json(path.join(workspaceRoot, "bun.lock")),
    readFile(path.join(root, "tools/check-opencode-abi.mjs"), "utf8"),
    readFile(path.join(root, "src/platform/real-host/index.ts"), "utf8"),
    readFile(path.join(workspaceRoot, "apps/runtime/tools/m7-release-lib.mjs"), "utf8"),
    readFile(path.join(workspaceRoot, "apps/runtime/tools/m7-release.mjs"), "utf8"),
  ])

  assert.equal(pkg.dependencies["@opencode-ai/plugin"], host)
  assert.equal(pkg.devDependencies["@opencode-ai/cli"], host)
  assert.equal(pkg.dependencies.effect, effect)
  assert.equal(lock.workspaces[workspacePackage].dependencies["@opencode-ai/plugin"], host)
  assert.equal(lock.workspaces[workspacePackage].devDependencies["@opencode-ai/cli"], host)
  assert.equal(lock.workspaces[workspacePackage].dependencies.effect, effect)
  assert.match(guard, /reviewed exact beta-18138 build/u)
  assert.match(realHost, /PINNED_REAL_HOST_VERSION = "0\.0\.0-beta-18138"/u)
  assert.match(releaseLib, /opencode: "0\.0\.0-beta-17595"/u)
  assert.match(releaseLib, /effect: "4\.0\.0-beta\.107"/u)
  assert.doesNotMatch(releaseTool, /beta-17519/u)
})
