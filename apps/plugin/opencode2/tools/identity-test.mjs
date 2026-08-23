import assert from "node:assert/strict"
import { execFile } from "node:child_process"
import { promises as fs } from "node:fs"
import test from "node:test"
import { promisify } from "node:util"

const execFileAsync = promisify(execFile)
const root = new URL("../", import.meta.url)
const packageJson = JSON.parse(await fs.readFile(new URL("package.json", root), "utf8"))
const installerSource = await fs.readFile(new URL("tools/install-node.mjs", root), "utf8")

const legacyIdentityPattern = /bybrawe\.opencode-loop|@bybrawe\/opencode-loop|OpenCodeLoop|OpenCode Loop|opencode-loopd|OPENCODE_LOOPD|\.opencode\/opencode-loop|opencode-loop/gi
const historicalProvenanceEvidence = new Set([
  "provenance/evidence/corrective-daemon-identity.md",
  "provenance/evidence/corrective-identity-red.txt",
  "provenance/evidence/corrective-old-identity-allowlist.txt",
  "provenance/evidence/dirty-tracked.patch",
  "provenance/evidence/escalation-branding-note.md",
  "provenance/evidence/escalation-branding-red.txt",
  "provenance/evidence/escalation-branding-sensitivity.txt",
  "provenance/evidence/final-local-gates.txt",
  "provenance/evidence/installed-copy-hashes.json",
  "provenance/evidence/pre-package-lock-removal-tests.txt",
  "provenance/evidence/source-check.txt",
  "provenance/evidence/source-preflight.txt",
  "provenance/evidence/source-test.txt",
])
const classifyLegacyOccurrence = (file, line) => {
  if (file === "provenance/history/opencode-loop-CHANGELOG.md") return "historical-import"
  if (["provenance/manifests/baseline-925b599.json", "provenance/manifests/opencode2-dirty-snapshot.json", "provenance/manifests/generic-consolidation-2026-08-11.json"].includes(file)) return "provenance-manifest"
  if (historicalProvenanceEvidence.has(file)) return "historical-provenance-evidence"
  if (file === "AGENTS.md" && line.includes("imported from OpenCode Loop under MIT")) return "source-attribution"
  if (file === "LICENSE" && line === "Copyright (c) 2026 OpenCode Loop Contributors") return "source-attribution"
  if (file === "package.json" && line.includes('"author": "OpenCode Loop Contributors (implementation)')) return "source-attribution"
  if (file === "docs/provenance.md" && /implementation source|preserved license|imported upstream changelog/.test(line)) return "source-attribution"
  if (file === "tools/verify-provenance.mjs" && line.includes("import opencode-loop baseline")) return "source-attribution"
  if (file === "README.md" && line.includes("MIT-licensed OpenCode Loop implementation")) return "source-attribution"
  if (file === "README.md" && line.includes("`/loop-*`") && line.includes("compatibility/recovery surfaces")) return "documented-command-protocol-compatibility"
  if (file === "README.md" && (/Command compatibility marker: `\[opencode-loop:<command>\]`/.test(line) || /temporarily retained as command-protocol compatibility identifiers/.test(line))) return "documented-command-protocol-compatibility"
  if (file === "README.md" && line.includes("old `.opencode/opencode-loop/` state") && line.includes("migration input")) return "migration"
  if (file === "docs/installation-architecture.md" && line.includes("explicit one-time import from old `.opencode/opencode-loop/` state")) return "migration"
  if (file === "docs/decisions/0001-brand-new-identity-and-state.md" && line.includes("internal command compatibility protocol") && line.includes("future explicit migration input")) return "decision-and-migration"
  if (file === "tools/identity-test.mjs" || file === "tests/characterization/compatibility-surfaces.test.mjs") return "legacy-identity-regression-test"
  if (["tools/generate-asset-manifest.mjs", "tools/verify-architecture.mjs"].includes(file)) return "compatibility-boundary-enforcement"
  if (file === "assets/manifest.json") return "manifested-command-protocol-compatibility"
  if (file === "docs/provenance/relocations.json") return "historical-provenance-relocation"
  if (file === "docs/decisions/0010-loop-compat.md") return "compatibility-retirement-decision"
  if (file === "docs/architecture/preflight-2026-08-12.md") return "documented-command-protocol-compatibility"
  if (file.startsWith("assets/commands/") && (/^agent: opencode-loop-local$/.test(line) || /^\[opencode-loop:loop(?:-[\w-]+)?\]/.test(line))) return "command-protocol-compatibility"
  if (file === "src/features/loop-compat/legacy-runtime.mjs" && (line.includes('"[opencode-loop:') || line.includes('"opencode-loop-local"') || line.includes("[opencode-loop:<name>]") || line.includes("opencode-loop-local agent") || line.includes("text.match(/^\\[opencode-loop:"))) return "command-protocol-compatibility"
  if (["tools/bootstrap-test.mjs", "tools/comprehensive-test.mjs", "tools/install-test.mjs", "tools/smoke-test.mjs"].includes(file) && (line.includes("[opencode-loop:") || line.includes("opencode-loop-local"))) return "command-protocol-compatibility-test"
  if (file === "tools/bootstrap-test.mjs" && ((line.includes("bybrawe") && line.includes("opencode-loop")) || line.includes("OPENCODE_LOOPD"))) return "legacy-identity-regression-test"
  return undefined
}

test("all tracked legacy identity occurrences are explicitly classified", async () => {
  const { stdout } = await execFileAsync("git", ["ls-files", "-z"], { cwd: new URL(".", root).pathname, encoding: "buffer" })
  const files = stdout.toString("utf8").split("\0").filter(Boolean)
  const occurrences = []
  for (const file of files) {
    let text
    try {
      text = await fs.readFile(new URL(file, root), "utf8")
    } catch {
      continue
    }
    for (const match of text.matchAll(legacyIdentityPattern)) {
      const line = text.slice(0, match.index).split("\n").length
      const lineText = text.split("\n")[line - 1]
      occurrences.push({ file, line, token: match[0], category: classifyLegacyOccurrence(file, lineText) })
    }
  }
  const unclassified = occurrences.filter(({ category }) => !category)
  assert.deepEqual(unclassified, [], `Unclassified legacy identity occurrences:\n${unclassified.map(({ file, line, token }) => `${file}:${line}: ${JSON.stringify(token)}`).join("\n")}`)
  assert.ok(occurrences.some(({ token }) => token.toLowerCase() === "opencode loop"), "scanner must exercise documented legacy provenance")
})

test("package binaries use only the new identity", () => {
  assert.deepEqual(packageJson.bin, {
    "opencode2-config": "tools/install-node.mjs",
  })
})

test("installer uses the new identity for its binary, plugin path, and diagnostics", () => {
  assert.doesNotMatch(installerSource, /opencode-loop(?:\.ts|\.js|\b)/)
  assert.match(installerSource, /opencode2-config(?:\.ts|\.js|\b)/)
  assert.match(installerSource, /OpenCode2 Config/)
})
