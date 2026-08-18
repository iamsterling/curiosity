import assert from "node:assert/strict"
import { spawnSync } from "node:child_process"
import { cp, mkdtemp, readFile, rm, writeFile } from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import test from "node:test"

test("provenance verification rejects a corrupted resource-only object", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "opencode2-resource-provenance-"))
  try {
    await Promise.all([
      cp("tools/verify-provenance.mjs", path.join(root, "tools/verify-provenance.mjs")),
      cp("tools/provenance-objects.mjs", path.join(root, "tools/provenance-objects.mjs")),
      cp("provenance", path.join(root, "provenance"), { recursive: true }),
    ])
    const manifests = path.join(root, "provenance", "manifests")
    const resource = JSON.parse(await readFile(path.join(manifests, "resource-baseline-74fe8c5.json"), "utf8"))
    const standard = await Promise.all([
      "baseline-925b599.json",
      "opencode2-dirty-snapshot.json",
    ].map(async (name) => JSON.parse(await readFile(path.join(manifests, name), "utf8"))))
    const standardObjects = new Set(standard.flatMap(({ files }) => files.map(({ sha256 }) => sha256)))
    const target = resource.files.find(({ sha256 }) => !standardObjects.has(sha256))
    assert.ok(target, "fixture must include a resource-only object")
    await writeFile(path.join(root, "provenance", "objects", "sha256", target.sha256), "substituted resource\n")

    const result = spawnSync(process.execPath, ["tools/verify-provenance.mjs"], { cwd: root, encoding: "utf8" })
    assert.notEqual(result.status, 0, `verification unexpectedly passed:\n${result.stdout}${result.stderr}`)
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})
