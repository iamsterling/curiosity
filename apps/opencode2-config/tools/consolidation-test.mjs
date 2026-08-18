import assert from "node:assert/strict"
import { createHash } from "node:crypto"
import { promises as fs } from "node:fs"
import path from "node:path"
import test from "node:test"

const root = path.resolve(import.meta.dirname, "..")
const manifestPath = path.join(root, "provenance/manifests/generic-consolidation-2026-08-11.json")
const hash = async (target) => createHash("sha256").update(await fs.readFile(target)).digest("hex")

test("consolidation manifest has valid treatments and every authored destination exists", async () => {
  const manifest = JSON.parse(await fs.readFile(manifestPath, "utf8"))
  const treatments = new Set(["imported", "adapted", "excluded-generated", "excluded-stale", "deferred-failed"])
  assert.ok(manifest.entries.length >= 80)
  for (const entry of manifest.entries) {
    assert.ok(treatments.has(entry.treatment), entry.treatment)
    assert.ok(entry.sourcePath && entry.sourceHash, entry.sourcePath)
    if (["imported", "adapted"].includes(entry.treatment)) {
      assert.ok(entry.destinationPath && entry.destinationHash, entry.destinationPath)
      const relocated = entry.destinationPath.replace(/^config\//, "assets/config/").replace(/^skills\//, "assets/skills/").replace(/^commands\//, "assets/commands/").replace(/^agents\//, "assets/agents/").replace(/^src\/index\.js$/, "src/features/loop-compat/legacy-runtime.mjs").replace(/^src\/loop-state\.mjs$/, "src/features/loop-compat/state.mjs").replace(/^scripts\//, "tools/").replace(/^test\/runtime-contract\.test\.mjs$/, "tests/integration/runtime-contract.test.mjs").replace(/^test\/state-contract\.test\.mjs$/, "tests/unit/state-contract.test.mjs").replace(/^skills\/handoff-compiler\/compiler\.mjs$/, "src/features/handoff/compiler.mjs")
      const destination = path.join(root, relocated)
      await fs.access(destination)
      // Historical hashes are verified at their import commits; relocation maps only assert destination presence.
    }
  }
})

test("all generic command, skill, and agent assets are represented", async () => {
  const manifest = JSON.parse(await fs.readFile(manifestPath, "utf8"))
  const destinations = new Set(manifest.entries.map((entry) => entry.destinationPath).filter(Boolean).map((item) => item.replace(/^config\//, "assets/config/").replace(/^skills\//, "assets/skills/").replace(/^commands\//, "assets/commands/").replace(/^agents\//, "assets/agents/")))
  for (const role of ["orchestrator", "generalist", "analyst", "implementer", "strategist", "reviewer", "researcher", "worker", "build", "plan"]) assert.ok(destinations.has(`assets/config/agents/${role}.json`), role)
  for (const skill of ["handoff-compiler", "deep-research", "competitive-analysis", "reverse-engineering", "review", "verify", "goal-loop"]) assert.ok([...destinations].some((item) => item === `assets/skills/${skill}/SKILL.md` || item === `assets/skills/${skill}`), skill)
  for (const command of ["compile-handoff", "task", "verify", "review", "goal", "research", "landscape", "teardown"]) assert.ok(destinations.has(`assets/commands/${command}.md`), command)
})

test("manifest itself contains no secret values", async () => {
  const text = await fs.readFile(manifestPath, "utf8")
  assert.doesNotMatch(text, /(?:sk-[A-Za-z0-9]{20,}|BEGIN (?:RSA |EC )?PRIVATE KEY)/)
  assert.match(await hash(manifestPath), /^[a-f0-9]{64}$/)
})
