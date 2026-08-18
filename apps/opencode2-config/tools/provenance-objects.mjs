import assert from "node:assert/strict"
import { createHash } from "node:crypto"
import { readFile } from "node:fs/promises"
import path from "node:path"

export const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex")

export const verifyProvenanceObject = async (root, manifestPath, file, { requireSize = false } = {}) => {
  const label = `${manifestPath}:${file.repositoryPath ?? file.path}`
  const imported = await readFile(path.join(root, "provenance", "objects", "sha256", file.sha256))
  assert.equal(sha256(imported), file.sha256, `${label}:sha256`)
  if (requireSize) assert.ok(Number.isInteger(file.size), `${label}:recorded-size`)
  if (Number.isInteger(file.size)) assert.equal(imported.byteLength, file.size, `${label}:size`)
  return imported
}
