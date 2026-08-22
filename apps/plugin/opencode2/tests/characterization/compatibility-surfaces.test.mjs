import assert from "node:assert/strict"
import { promises as fs } from "node:fs"
import path from "node:path"
import test from "node:test"

const root = path.resolve(import.meta.dirname, "../..")
const loopCommands = ["loop","loop-ask","loop-clear","loop-cmd","loop-command","loop-compact","loop-dev","loop-doctor","loop-export","loop-goal","loop-goal-blocked","loop-goal-clear","loop-goal-done","loop-goal-pause","loop-goal-resume","loop-goal-status","loop-help","loop-init","loop-logs","loop-now","loop-pause","loop-progress","loop-prompt","loop-remove","loop-resume","loop-safe-dev","loop-shell","loop-status","loop-stop","loop-testfix"]

test("every compatibility name is a thin native adapter or stable unsupported diagnostic", async () => {
  for (const id of loopCommands) {
    const command = await fs.readFile(path.join(root, `assets/commands/${id}.md`), "utf8")
    assert.doesNotMatch(command, /opencode-loop-local|\[opencode-loop:/)
    assert.match(command, /native_loop_|ledger_|OPENCODE2_COMPAT_CAPABILITY_UNSUPPORTED|manual|package doctor|Ledger\/native-loop tools/)
  }
})

test("legacy runtime, daemon, mutable state authority, and marker agent are absent", async () => {
  for (const target of ["src/features/loop-compat", "tools/loopd.mjs", "tools/state-tool.mjs", "assets/agents/opencode-loop-local.md"])
    assert.equal(await fs.stat(path.join(root, target)).then(() => true, () => false), false, target)
  const source = await fs.readdir(path.join(root, "src"), { recursive: true })
  for (const relative of source.filter((item) => /\.(?:ts|mjs)$/.test(item))) {
    const text = await fs.readFile(path.join(root, "src", relative), "utf8")
    assert.doesNotMatch(text, /child_process|spawn\(|execFile\(|setInterval\(|nodegit|simple-git|fs\.watch/)
    assert.equal((text.match(/setTimeout\(/gu) ?? []).length, relative === "features/search/searxng-adapter.ts" ? 1 : 0, relative)
    if (relative === "features/search/searxng-adapter.ts") {
      assert.match(text, /const controller = new AbortController\(\)/u)
      assert.match(text, /timer\.ref\(\)/u)
      assert.match(text, /finally \{\s+clearTimeout\(timer\)/u)
    }
  }
})
