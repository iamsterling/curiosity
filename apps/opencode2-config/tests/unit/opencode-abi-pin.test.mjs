import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"
import path from "node:path"
import { findWorkspaceRoot } from "../../tools/workspace-root.mjs"

const expected = "0.0.0-beta-17519"
const root = path.resolve(import.meta.dirname, "../..")
const json = async (file) => JSON.parse((await readFile(file, "utf8")).replace(/,\s*([}\]])/gu, "$1"))

test("OpenCode host, plugin SDK, installed packages, and lockfile share the reviewed ABI pin", async () => {
  const workspaceRoot = await findWorkspaceRoot(root)
  const workspacePackage = path.relative(workspaceRoot, root).split(path.sep).join("/")
  const [pkg, lock, plugin, cli, realHost] = await Promise.all([
    json(path.join(root, "package.json")),
    json(path.join(workspaceRoot, "bun.lock")),
    json(path.join(root, "node_modules/@opencode-ai/plugin/package.json")),
    json(path.join(root, "node_modules/@opencode-ai/cli/package.json")),
    readFile(new URL("../../src/platform/real-host/index.ts", import.meta.url), "utf8"),
  ])

  assert.equal(pkg.dependencies["@opencode-ai/plugin"], expected)
  assert.equal(pkg.devDependencies["@opencode-ai/cli"], expected)
  assert.equal(lock.workspaces[workspacePackage].dependencies["@opencode-ai/plugin"], expected)
  assert.equal(lock.workspaces[workspacePackage].devDependencies["@opencode-ai/cli"], expected)
  assert.equal(plugin.version, expected)
  assert.equal(cli.version, expected)
  assert.match(realHost, new RegExp(`PINNED_REAL_HOST_VERSION = ${JSON.stringify(expected)}`))
})
