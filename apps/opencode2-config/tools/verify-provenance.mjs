import assert from "node:assert/strict"
import { promises as fs } from "node:fs"
import { fileURLToPath } from "node:url"
import { sha256, verifyProvenanceObject } from "./provenance-objects.mjs"

const root = new URL("../", import.meta.url)
const stages = [
  "provenance/manifests/baseline-925b599.json",
  "provenance/manifests/opencode2-dirty-snapshot.json",
  "provenance/manifests/resource-baseline-74fe8c5.json",
]

for (const manifestPath of stages) {
  const manifest = JSON.parse(await fs.readFile(new URL(manifestPath, root), "utf8"))
  assert.equal(manifest.schemaVersion, 1)
  for (const file of manifest.files) {
    await verifyProvenanceObject(fileURLToPath(root), manifestPath, file, { requireSize: manifestPath.includes("resource-baseline-") })
  }
}
const patch = await fs.readFile(new URL("provenance/evidence/dirty-tracked.patch", root))
assert.equal(sha256(patch), "d0a0bd3fdefb0b12d6c8a46c4e7f8f6ff104661178b319db337795101a0142d4")
console.log("Provenance manifests, resource baseline, object sizes, and dirty patch verified")
