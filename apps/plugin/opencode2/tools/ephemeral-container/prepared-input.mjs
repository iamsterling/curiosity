import { createHash } from "node:crypto"
import { isDeepStrictEqual } from "node:util"
import { lstat, readFile, readdir, readlink, realpath, rm, writeFile } from "node:fs/promises"
import path from "node:path"

export const preparedInputManifest = "prepared-input.json"

const digest = (contents) => createHash("sha256").update(contents).digest("hex")
const fail = (code) => { throw new Error(code) }
const portable = (value) => value.replaceAll("\\", "/")
const contained = (root, target) => {
  const relative = path.relative(root, target)
  return relative === "" || (!relative.startsWith(`..${path.sep}`) && relative !== ".." && !path.isAbsolute(relative))
}

const symlinkEntry = async ({ inputRoot, relative, target }) => {
  const link = await readlink(target)
  if (path.isAbsolute(link)) fail("OPENCODE2_PREPARED_INPUT_SYMLINK_ESCAPE")
  const lexicalTarget = path.resolve(path.dirname(target), link)
  if (!contained(inputRoot, lexicalTarget)) fail("OPENCODE2_PREPARED_INPUT_SYMLINK_ESCAPE")
  const [realRoot, realTarget] = await Promise.all([
    realpath(inputRoot),
    realpath(lexicalTarget).catch(() => fail("OPENCODE2_PREPARED_INPUT_INTEGRITY_INVALID")),
  ])
  if (!contained(realRoot, realTarget)) fail("OPENCODE2_PREPARED_INPUT_SYMLINK_ESCAPE")
  const contents = Buffer.from(link)
  return { path: relative, type: "symlink", target: portable(link), sha256: digest(contents), size: contents.length }
}

const inventoryDirectory = async ({ directory, inputRoot }) => {
  const output = []
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const target = path.join(directory, entry.name)
    const relative = portable(path.relative(inputRoot, target))
    if (relative === preparedInputManifest) continue
    const details = await lstat(target)
    if (details.isSymbolicLink()) output.push(await symlinkEntry({ inputRoot, relative, target }))
    else if (details.isDirectory()) output.push(...await inventoryDirectory({ directory: target, inputRoot }))
    else if (details.isFile()) {
      const contents = await readFile(target)
      output.push({ path: relative, type: "file", mode: details.mode & 0o777, sha256: digest(contents), size: contents.length })
    } else fail("OPENCODE2_PREPARED_INPUT_TYPE_INVALID")
  }
  return output
}

export const inventoryPreparedInput = async (inputRoot) => {
  const absoluteRoot = path.resolve(inputRoot)
  const details = await lstat(absoluteRoot).catch(() => fail("OPENCODE2_PREPARED_INPUT_INTEGRITY_INVALID"))
  if (!details.isDirectory() || details.isSymbolicLink()) fail("OPENCODE2_PREPARED_INPUT_INTEGRITY_INVALID")
  const entries = await inventoryDirectory({ directory: absoluteRoot, inputRoot: absoluteRoot })
  return entries.sort((left, right) => left.path < right.path ? -1 : left.path > right.path ? 1 : 0)
}

export const writePreparedInputManifest = async ({ inputRoot, metadata }) => {
  const manifestPath = path.join(inputRoot, preparedInputManifest)
  await rm(manifestPath, { force: true })
  const manifest = {
    ...metadata,
    schemaVersion: 2,
    inventory: { schemaVersion: 1, entries: await inventoryPreparedInput(inputRoot) },
  }
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`)
  return manifest
}

export const verifyPreparedInputManifest = async (inputRoot) => {
  let manifest
  try {
    manifest = JSON.parse(await readFile(path.join(inputRoot, preparedInputManifest), "utf8"))
  } catch {
    fail("OPENCODE2_PREPARED_INPUT_INTEGRITY_INVALID")
  }
  if (manifest?.schemaVersion !== 2 || manifest.inventory?.schemaVersion !== 1 || !Array.isArray(manifest.inventory.entries)) {
    fail("OPENCODE2_PREPARED_INPUT_INTEGRITY_INVALID")
  }
  const actual = await inventoryPreparedInput(inputRoot)
  if (!isDeepStrictEqual(actual, manifest.inventory.entries)) fail("OPENCODE2_PREPARED_INPUT_INTEGRITY_INVALID")
  return manifest
}
