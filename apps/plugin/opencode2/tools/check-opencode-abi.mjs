#!/usr/bin/env node
import assert from "node:assert/strict"
import { execFile } from "node:child_process"
import { readFile } from "node:fs/promises"
import path from "node:path"
import { promisify } from "node:util"
import { findWorkspaceRoot } from "./workspace-root.mjs"

const execute = promisify(execFile)
const root = path.resolve(import.meta.dirname, "..")
const readJSON = async (file) => JSON.parse((await readFile(file, "utf8")).replace(/,\s*([}\]])/gu, "$1"))

export const checkOpenCodeAbi = async ({ active = false, binary = "opencode2" } = {}) => {
  const workspaceRoot = await findWorkspaceRoot(root)
  const workspacePackage = path.relative(workspaceRoot, root).split(path.sep).join("/")
  const [pkg, lock, plugin, cli, realHost] = await Promise.all([
    readJSON(path.join(root, "package.json")),
    readJSON(path.join(workspaceRoot, "bun.lock")),
    readJSON(path.join(root, "node_modules/@opencode-ai/plugin/package.json")),
    readJSON(path.join(root, "node_modules/@opencode-ai/cli/package.json")),
    readFile(path.join(root, "src/platform/real-host/index.ts"), "utf8"),
  ])
  const expected = pkg.dependencies?.["@opencode-ai/plugin"]
  assert.match(expected ?? "", /^0\.0\.0-(?:next|beta)-\d+$/u, "plugin ABI must use an exact prerelease build")
  assert.equal(pkg.devDependencies?.["@opencode-ai/cli"], expected, "repository CLI and plugin SDK pins differ")
  assert.equal(lock.workspaces?.[workspacePackage]?.dependencies?.["@opencode-ai/plugin"], expected, "plugin lock pin differs")
  assert.equal(lock.workspaces?.[workspacePackage]?.devDependencies?.["@opencode-ai/cli"], expected, "CLI lock pin differs")
  assert.equal(plugin.version, expected, "installed plugin SDK differs from package pin; run bun install")
  assert.equal(cli.version, expected, "installed CLI differs from package pin; run bun install")
  assert.match(
    realHost,
    new RegExp(`PINNED_REAL_HOST_VERSION = ${JSON.stringify(expected)}`),
    "runtime host capability pin differs from package pin",
  )
  if (active) {
    const localBin = path.join(root, "node_modules", ".bin")
    const activePath = (process.env.PATH ?? "")
      .split(path.delimiter)
      .filter((entry) => path.resolve(entry) !== localBin)
      .join(path.delimiter)
    const output = (
      await execute("/bin/zsh", ["-lc", '"$1" --version', "check-opencode-abi", binary], {
        env: { ...process.env, PATH: activePath },
      })
    ).stdout
    const observed = output.match(/\d+\.\d+\.\d+(?:-[A-Za-z0-9.-]+)?/u)?.[0]
    assert.equal(observed, expected, `active ${binary} ABI differs from repository pin`)
  }
  return expected
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(import.meta.filename)) {
  const active = process.argv.includes("--active")
  const expected = await checkOpenCodeAbi({ active, binary: process.env.OPENCODE2_BIN ?? "opencode2" })
  console.log(`OpenCode ABI pin verified: ${expected}${active ? " (active host included)" : ""}`)
}
