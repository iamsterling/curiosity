import assert from "node:assert/strict"
import { promises as fs } from "node:fs"
import test from "node:test"

const packageJson = JSON.parse(await fs.readFile(new URL("../package.json", import.meta.url), "utf8"))
const source = await fs.readFile(new URL("../src/features/loop-compat/legacy-runtime.mjs", import.meta.url), "utf8")
const daemonSource = await fs.readFile(new URL("./loopd.mjs", import.meta.url), "utf8")
const expectedCommands = [
  "loop", "loop-ask", "loop-clear", "loop-cmd", "loop-command", "loop-compact", "loop-dev", "loop-doctor",
  "loop-export", "loop-goal", "loop-goal-blocked", "loop-goal-clear", "loop-goal-done", "loop-goal-pause",
  "loop-goal-resume", "loop-goal-status", "loop-help", "loop-init", "loop-logs", "loop-now", "loop-pause",
  "loop-progress", "loop-prompt", "loop-remove", "loop-resume", "loop-safe-dev", "loop-shell", "loop-status",
  "loop-stop", "loop-testfix",
]

test("private package metadata uses the new identity and exact SDK pin", () => {
  assert.equal(packageJson.name, "@iamsterling/opencode2-config")
  assert.equal(packageJson.private, true)
  assert.equal(packageJson.publishConfig, undefined)
  assert.equal(packageJson.dependencies?.["@opencode-ai/plugin"], "0.0.0-beta-17519")
  assert.equal(packageJson.peerDependencies, undefined)
  assert.ok(packageJson.devDependencies?.typescript)
})

test("runtime uses the new plugin and state identities", () => {
  assert.match(source, /const PLUGIN_ID = "iamsterling\.opencode2-config"/)
  assert.match(source, /const STATE_DIR = "\.opencode\/opencode2-config"/)
  assert.doesNotMatch(source, /bybrawe\.opencode-loop/)
})


test("daemon task storage uses the new namespace", () => {
  assert.match(daemonSource, /OPENCODE2_CONFIGD_TASK_DIR/)
  assert.match(daemonSource, /"opencode2-config", "tasks"/)
  assert.doesNotMatch(daemonSource, /OPENCODE_LOOPD_TASK_DIR/)
})

test("command compatibility marker is retained independently of plugin identity", () => {
  assert.match(source, /const COMMAND_MARKER = "\[opencode-loop:"/)
})

test("all imported loop command templates are retained", async () => {
  const commandDirectory = new URL("../assets/commands/", import.meta.url)
  const actual = (await fs.readdir(commandDirectory)).filter((name) => name.startsWith("loop") && name.endsWith(".md")).map((name) => name.slice(0, -3)).sort()
  assert.deepEqual(actual, expectedCommands)
  for (const command of actual) {
    const template = await fs.readFile(new URL(`${command}.md`, commandDirectory), "utf8")
    assert.match(template, new RegExp(`\\[opencode-loop:${command}\\]`))
  }
})
