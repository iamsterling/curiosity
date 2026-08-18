import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"

const manifest = JSON.parse(await readFile(new URL("../../assets/manifest.json", import.meta.url), "utf8"))

test("every loop compatibility command has one explicit native disposition", () => {
  const commands = manifest.assets.filter((asset) => asset.kind === "command" && asset.id.startsWith("loop"))
  assert.ok(commands.length > 0)
  for (const command of commands) {
    assert.match(command.compatibilityDisposition, /^(native-tool|ledger-proposal|manual-guidance|unsupported):[A-Za-z0-9_./-]+$/)
  }
  assert.equal(new Set(commands.map((command) => command.id)).size, commands.length)
})

test("shell compatibility is fail-closed and lifecycle aliases use native authority", () => {
  const dispositions = Object.fromEntries(manifest.assets.map((asset) => [asset.id, asset.compatibilityDisposition]))
  assert.equal(dispositions["loop-shell"], "unsupported:OPENCODE2_COMPAT_SHELL_UNSUPPORTED")
  assert.equal(dispositions["loop-status"], "native-tool:native_loop_status")
  assert.equal(dispositions["loop-progress"], "ledger-proposal:ledger_progress_propose")
  assert.equal(dispositions["loop-compact"], "manual-guidance:HOST_COMPACTION_CONTROL")
})
