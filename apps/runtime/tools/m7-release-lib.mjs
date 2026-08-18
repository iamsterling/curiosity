import { createHash, randomBytes, timingSafeEqual } from "node:crypto"
import { execFileSync } from "node:child_process"
import {
  closeSync, constants, copyFileSync, existsSync, fstatSync, lstatSync, mkdirSync, openSync, readFileSync, readSync,
  readdirSync, readlinkSync, realpathSync, renameSync, rmSync, symlinkSync, unlinkSync, writeFileSync,
} from "node:fs"
import { basename, dirname, isAbsolute, join, relative, resolve, sep } from "node:path"
import { gzipSync, gunzipSync } from "node:zlib"

export const M7_PROFILE = Object.freeze({
  platform: "darwin", architecture: "arm64", macOS: "27.0", bun: "1.3.14",
  rustc: "1.97.1", cargo: "1.97.1", opencode: "0.0.0-beta-17519",
  effect: "4.0.0-beta.101", stateSchema: "curiosity-query-state/v1",
})
export const M7_NATIVE_INSTALL_ID = "@rpath/libcuriosity_runtime_native.dylib"
const M7_NATIVE_RUSTFLAGS = [
  "-C", `link-arg=-Wl,-install_name,${M7_NATIVE_INSTALL_ID}`,
  "-C", "link-arg=-Wl,-no_uuid",
].join("\x1f")

const METADATA = new Set(["manifest.json", "SHA256SUMS"])
const fail = (code) => { throw new Error(code) }
const safeRelative = (value) => typeof value === "string" && value.length > 0 && !isAbsolute(value) &&
  value.split(/[\\/]/u).every((part) => part && part !== "." && part !== "..")
const digestBytes = (value) => createHash("sha256").update(value).digest("hex")
const digest = (path) => digestBytes(readFileSync(path))

export const assertCleanReleaseInput = ({ head, dirty, tracked }) => {
  if (dirty) return fail("M7_RELEASE_SOURCE_DIRTY")
  if (!tracked || typeof head !== "string" || !/^[0-9a-f]{40}$/u.test(head)) return fail("M7_RELEASE_COMMIT_REQUIRED")
  return `m7-${head}`
}

export const m7NativeCargoEnvironment = (environment) => {
  const { RUSTFLAGS: _rustflags, CARGO_ENCODED_RUSTFLAGS: _encodedRustflags, ...clean } = environment
  return { ...clean, CARGO_ENCODED_RUSTFLAGS: M7_NATIVE_RUSTFLAGS }
}

export const darwinLinkedLibraries = (path) => {
  let output
  try { output = execFileSync("otool", ["-L", path], { encoding: "utf8" }) }
  catch { fail("M7_NATIVE_LINK_INVALID") }
  return output.split("\n").slice(1).map((line) => line.trim().split(" ")[0]).filter(Boolean)
}

export const assertM7NativeLinks = (linked) => {
  const expected = [M7_NATIVE_INSTALL_ID, "/usr/lib/libSystem.B.dylib"]
  if (!Array.isArray(linked) || linked.length !== expected.length || expected.some((path) => !linked.includes(path))) fail("M7_NATIVE_LINK_INVALID")
  return true
}

export const assertM7NativeHasNoUuid = (path) => {
  let output
  try { output = execFileSync("otool", ["-l", path], { encoding: "utf8" }) }
  catch { fail("M7_NATIVE_UUID_INVALID") }
  if (output.includes("LC_UUID")) fail("M7_NATIVE_UUID_INVALID")
  return true
}

const entries = (root, directory = root) => readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
  const absolute = join(directory, entry.name)
  const path = relative(root, absolute).split(sep).join("/")
  const status = lstatSync(absolute)
  if (status.isSymbolicLink() || (!status.isDirectory() && !status.isFile())) fail("M7_ARTIFACT_TYPE_INVALID")
  return status.isDirectory() ? entries(root, absolute) : [{ absolute, path, status }]
})

const payloadEntries = (root) => entries(root).filter(({ path }) => !METADATA.has(path))
export const manifestFor = (root) => ({ files: payloadEntries(root).map(({ absolute, path, status }) => ({
  path, sha256: digest(absolute), mode: (status.mode & 0o777).toString(8).padStart(4, "0"),
})).sort((a, b) => a.path < b.path ? -1 : a.path > b.path ? 1 : 0) })

const parseManifest = (value) => {
  if (!value || !Array.isArray(value.files)) fail("M7_ARTIFACT_MANIFEST_INVALID")
  const listed = new Map()
  for (const file of value.files) {
    if (!safeRelative(file?.path) || METADATA.has(file.path) || listed.has(file.path)) fail("M7_ARTIFACT_PATH_INVALID")
    if (!/^[0-9a-f]{64}$/u.test(file.sha256) || !/^0[0-7]{3}$/u.test(file.mode)) fail("M7_ARTIFACT_MANIFEST_INVALID")
    listed.set(file.path, file)
  }
  return listed
}

const parseSums = (text) => {
  if (typeof text !== "string" || !text.endsWith("\n")) fail("M7_ARTIFACT_CHECKSUM_INVALID")
  const sums = new Map()
  for (const line of text.slice(0, -1).split("\n")) {
    const match = /^([0-9a-f]{64})  ([^\n]+)$/u.exec(line)
    if (!match || !safeRelative(match[2]) || match[2] === "SHA256SUMS" || sums.has(match[2])) fail("M7_ARTIFACT_CHECKSUM_INVALID")
    sums.set(match[2], match[1])
  }
  return sums
}

export const writeArtifactMetadata = (root) => {
  rmSync(join(root, "manifest.json"), { force: true }); rmSync(join(root, "SHA256SUMS"), { force: true })
  const manifest = manifestFor(root)
  writeFileSync(join(root, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n", { mode: 0o644 })
  const checksums = [{ path: "manifest.json", sha256: digest(join(root, "manifest.json")) }, ...manifest.files]
  writeFileSync(join(root, "SHA256SUMS"), checksums.map(({ path, sha256 }) => `${sha256}  ${path}`).join("\n") + "\n", { mode: 0o644 })
  return manifest
}

export const validateArtifactTree = (root) => {
  if (!isAbsolute(root) || resolve(root) !== root || !lstatSync(root).isDirectory() || lstatSync(root).isSymbolicLink()) fail("M7_ARTIFACT_PATH_INVALID")
  if (!existsSync(join(root, "manifest.json")) || !existsSync(join(root, "SHA256SUMS"))) fail("M7_ARTIFACT_METADATA_REQUIRED")
  const manifestBytes = readFileSync(join(root, "manifest.json")); let manifest
  try { manifest = JSON.parse(manifestBytes.toString("utf8")) } catch { fail("M7_ARTIFACT_MANIFEST_INVALID") }
  const listed = parseManifest(manifest)
  const sums = parseSums(readFileSync(join(root, "SHA256SUMS"), "utf8"))
  const actual = payloadEntries(root)
  const expectedSumPaths = new Set(["manifest.json", ...listed.keys()])
  if (sums.size !== expectedSumPaths.size || [...sums.keys()].some((path) => !expectedSumPaths.has(path))) fail("M7_ARTIFACT_CHECKSUM_INVALID")
  if (sums.get("manifest.json") !== digestBytes(manifestBytes)) fail("M7_ARTIFACT_CHECKSUM_INVALID")
  for (const entry of actual) {
    const expected = listed.get(entry.path)
    if (!expected) fail("M7_ARTIFACT_MANIFEST_INVALID")
    const mode = (entry.status.mode & 0o777).toString(8).padStart(4, "0")
    if (mode !== expected.mode) fail("M7_ARTIFACT_MODE_INVALID")
    const hash = digest(entry.absolute)
    if (hash !== expected.sha256) fail("M7_ARTIFACT_HASH_INVALID")
    if (sums.get(entry.path) !== hash) fail("M7_ARTIFACT_CHECKSUM_INVALID")
    listed.delete(entry.path)
  }
  if (listed.size) fail("M7_ARTIFACT_MANIFEST_INVALID")
  return true
}

export const validateReleaseInventory = (root) => {
  let sbom
  try { sbom = JSON.parse(readFileSync(join(root, "SBOM.json"), "utf8")) } catch { fail("M7_SBOM_INVALID") }
  if (sbom?.bomFormat !== "CycloneDX" || sbom.specVersion !== "1.6" || !Array.isArray(sbom.components) || sbom.components.length === 0) fail("M7_SBOM_INVALID")
  const names = new Set(); const covered = new Set()
  for (const component of sbom.components) {
    if (typeof component?.name !== "string" || names.has(component.name) || typeof component.version !== "string" || !component.version || component.license !== "MIT" || !Array.isArray(component.files) || component.files.length === 0 || !safeRelative(component.licenseFile)) fail("M7_SBOM_INVALID")
    names.add(component.name); secureFile(join(root, component.licenseFile), "M7_LICENSE_INVENTORY_INVALID")
    for (const path of component.files) { if (!safeRelative(path)) fail("M7_SBOM_INVALID"); secureFile(join(root, path), "M7_SBOM_INVALID"); covered.add(path) }
  }
  for (const required of ["curiosity-m7-release", "curiosity-runtime-native", "@curiosity/runtime", "@iamsterling/opencode2-config", "opencode2", "@opencode-ai/plugin", "@opencode-ai/protocol", "@opencode-ai/schema", "effect", "fast-check", "pure-rand"]) if (!names.has(required)) fail("M7_SBOM_COVERAGE_INVALID")
  for (const { path } of payloadEntries(root)) {
    if (["SBOM.json", "DEPENDENCIES-LICENSES.md", "RELEASE.json", "provenance.json"].includes(path) || path.startsWith("licenses/")) continue
    if (!covered.has(path)) fail("M7_SBOM_COVERAGE_INVALID")
  }
  return true
}

const copyTree = (source, destination) => {
  const status = lstatSync(source)
  if (status.isSymbolicLink() || (!status.isDirectory() && !status.isFile())) fail("M7_ARTIFACT_TYPE_INVALID")
  if (status.isFile()) { copyFileSync(source, destination); return }
  mkdirSync(destination, { mode: 0o700 })
  for (const entry of readdirSync(source)) copyTree(join(source, entry), join(destination, entry))
}

const secureDirectory = (path, code) => {
  let status
  try { status = lstatSync(path) } catch { fail(code) }
  if (status.isSymbolicLink() || !status.isDirectory() || status.uid !== process.getuid?.() || (status.mode & 0o022) !== 0) fail(code)
  return path
}
const secureFile = (path, code) => {
  let status
  try { status = lstatSync(path) } catch { fail(code) }
  if (status.isSymbolicLink() || !status.isFile()) fail(code)
  return path
}
const compatibleState = (prefix) => {
  const state = join(prefix, "state"); if (!existsSync(state)) return true
  try { secureDirectory(state, "M7_STATE_INCOMPATIBLE"); const file = join(state, "schema.json"); if (!existsSync(file)) return true; secureFile(file, "M7_STATE_INCOMPATIBLE"); return JSON.parse(readFileSync(file, "utf8")).schema === M7_PROFILE.stateSchema } catch { return false }
}

const withLock = (prefix, operation) => {
  if (!isAbsolute(prefix) || resolve(prefix) !== prefix) fail("M7_INSTALL_PREFIX_INVALID")
  let existing = prefix
  while (!existsSync(existing)) { const parent = dirname(existing); if (parent === existing) break; existing = parent }
  if (realpathSync(existing) !== existing) fail("M7_INSTALL_PREFIX_INVALID")
  if (!existsSync(prefix)) mkdirSync(prefix, { recursive: true, mode: 0o700 })
  secureDirectory(prefix, "M7_INSTALL_PREFIX_INVALID")
  if (realpathSync(prefix) !== prefix) fail("M7_INSTALL_PREFIX_INVALID")
  const lock = join(prefix, ".m7-release.lock")
  let descriptor; let ownership; let acquired = false
  try {
    descriptor = openSync(lock, "wx", 0o600); acquired = true
    const token = randomBytes(32); writeFileSync(descriptor, token)
    const status = fstatSync(descriptor, { bigint: true })
    if (!status.isFile()) fail("M7_RELEASE_LOCK_INVALID")
    ownership = { dev: status.dev, ino: status.ino, token }
    return operation()
  } catch (error) {
    if (!acquired && error?.code === "EEXIST") fail("M7_RELEASE_LOCKED")
    throw error
  } finally {
    if (descriptor !== undefined) closeSync(descriptor)
    if (acquired && ownership) {
      let check
      try {
        const status = lstatSync(lock, { bigint: true })
        if (status.isFile() && !status.isSymbolicLink() && status.dev === ownership.dev && status.ino === ownership.ino) {
          check = openSync(lock, constants.O_RDONLY | constants.O_NOFOLLOW)
          const opened = fstatSync(check, { bigint: true })
          const bytes = Buffer.alloc(ownership.token.length + 1)
          const length = opened.dev === ownership.dev && opened.ino === ownership.ino
            ? readSync(check, bytes, 0, bytes.length, 0) : 0
          const current = lstatSync(lock, { bigint: true })
          if (length === ownership.token.length && current.dev === ownership.dev && current.ino === ownership.ino &&
            timingSafeEqual(bytes.subarray(0, length), ownership.token)) unlinkSync(lock)
        }
      } catch (error) {
        if (error?.code !== "ENOENT") throw error
      } finally { if (check !== undefined) closeSync(check) }
      // Node/Bun has no inode-conditional unlink: a malicious same-user process can still swap
      // the path after the final lstat. Identity + token checks prevent accidental replacement loss.
    }
  }
}

const pointCurrent = (prefix, releaseId) => {
  const temporary = join(prefix, `.current-${process.pid}`); rmSync(temporary, { force: true })
  symlinkSync(`releases/${releaseId}`, temporary); renameSync(temporary, join(prefix, "current"))
}
const releaseIdentity = (artifact) => {
  validateArtifactTree(artifact); validateReleaseInventory(artifact)
  let release
  try { release = JSON.parse(readFileSync(secureFile(join(artifact, "RELEASE.json"), "M7_RELEASE_ID_INVALID"), "utf8")) } catch { fail("M7_RELEASE_ID_INVALID") }
  if (!/^m7-[0-9a-z-]+$/u.test(release.releaseId)) fail("M7_RELEASE_ID_INVALID")
  return release
}
const receiptFor = (artifact, releaseId) => ({ releaseId, manifestSha256: digest(join(artifact, "manifest.json")) })

export const installRelease = (artifact, prefix) => withLock(prefix, () => {
  if (!isAbsolute(artifact) || resolve(artifact) !== artifact || realpathSync(artifact) !== artifact) fail("M7_ARTIFACT_PATH_INVALID")
  if (!compatibleState(prefix)) fail("M7_STATE_INCOMPATIBLE")
  const release = releaseIdentity(artifact)
  const releases = join(prefix, "releases"); if (!existsSync(releases)) mkdirSync(releases, { mode: 0o700 }); secureDirectory(releases, "M7_INSTALL_PREFIX_INVALID")
  const receipts = join(prefix, "receipts"); if (!existsSync(receipts)) mkdirSync(receipts, { mode: 0o700 }); secureDirectory(receipts, "M7_INSTALL_PREFIX_INVALID")
  const destination = join(releases, release.releaseId); const staging = join(releases, `.${release.releaseId}.stage-${process.pid}`)
  if (existsSync(destination)) fail("M7_RELEASE_ALREADY_INSTALLED")
  try {
    copyTree(artifact, staging); renameSync(staging, destination); validateArtifactTree(destination)
    writeFileSync(join(receipts, `${release.releaseId}.json`), JSON.stringify(receiptFor(destination, release.releaseId)) + "\n", { mode: 0o600, flag: "wx" })
    pointCurrent(prefix, release.releaseId)
  } finally { rmSync(staging, { recursive: true, force: true }) }
  return destination
})

export const rollbackRelease = (prefix, releaseId) => withLock(prefix, () => {
  if (!compatibleState(prefix)) fail("M7_STATE_INCOMPATIBLE")
  if (!safeRelative(releaseId)) fail("M7_ROLLBACK_RELEASE_INVALID")
  const releases = secureDirectory(join(prefix, "releases"), "M7_ROLLBACK_RELEASE_INVALID")
  const receipts = secureDirectory(join(prefix, "receipts"), "M7_ROLLBACK_RELEASE_INVALID")
  const target = secureDirectory(join(releases, releaseId), "M7_ROLLBACK_RELEASE_INVALID")
  if (realpathSync(target) !== target) fail("M7_ROLLBACK_RELEASE_INVALID")
  let receipt
  try { receipt = JSON.parse(readFileSync(secureFile(join(receipts, `${releaseId}.json`), "M7_ROLLBACK_RELEASE_INVALID"), "utf8")) } catch { fail("M7_ROLLBACK_RELEASE_INVALID") }
  validateArtifactTree(target)
  validateReleaseInventory(target)
  const expected = receiptFor(target, releaseId)
  if (receipt.releaseId !== expected.releaseId || receipt.manifestSha256 !== expected.manifestSha256) fail("M7_ROLLBACK_RELEASE_INVALID")
  pointCurrent(prefix, releaseId)
})

export const uninstallRelease = (prefix, { purgeState = false } = {}) => withLock(prefix, () => {
  rmSync(join(prefix, "current"), { force: true }); rmSync(join(prefix, "releases"), { recursive: true, force: true }); rmSync(join(prefix, "receipts"), { recursive: true, force: true })
  if (purgeState) rmSync(join(prefix, "state"), { recursive: true, force: true })
})

const scriptRoot = 'CURIOSITY_RUNTIME_RELEASE_ROOT="$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd -P)"\nexport CURIOSITY_RUNTIME_RELEASE_ROOT'
export const writeReleaseScripts = (stage) => {
  mkdirSync(join(stage, "scripts"), { recursive: true, mode: 0o755 })
  const script = (name, body) => writeFileSync(join(stage, "scripts", name), `#!/bin/sh\nset -eu\n${scriptRoot}\n${body}\n`, { mode: 0o755 })
  script("verify", 'exec bun "$CURIOSITY_RUNTIME_RELEASE_ROOT/tools/m7-release.mjs" verify "$CURIOSITY_RUNTIME_RELEASE_ROOT"')
  script("preflight", 'exec bun "$CURIOSITY_RUNTIME_RELEASE_ROOT/tools/m7-release.mjs" verify "$CURIOSITY_RUNTIME_RELEASE_ROOT"')
  script("install", 'exec bun "$CURIOSITY_RUNTIME_RELEASE_ROOT/tools/m7-release.mjs" install "$CURIOSITY_RUNTIME_RELEASE_ROOT" "${1:?prefix}"')
  script("upgrade", 'exec bun "$CURIOSITY_RUNTIME_RELEASE_ROOT/tools/m7-release.mjs" install "$CURIOSITY_RUNTIME_RELEASE_ROOT" "${1:?prefix}"')
  script("rollback", 'exec bun "$CURIOSITY_RUNTIME_RELEASE_ROOT/tools/m7-release.mjs" rollback "${1:?prefix}" "${2:?release-id}"')
  script("uninstall", 'exec bun "$CURIOSITY_RUNTIME_RELEASE_ROOT/tools/m7-release.mjs" uninstall "${1:?prefix}"')
  script("launch", 'export OPENCODE_CONFIG_DIR="${CURIOSITY_M7_CONFIG_DIR:?isolated config directory}"; exec "$CURIOSITY_RUNTIME_RELEASE_ROOT/bin/opencode2" "$@"')
  script("smoke", '"$CURIOSITY_RUNTIME_RELEASE_ROOT/bin/opencode2" --version | grep -Fx "opencode2 v0.0.0-beta-17519" >/dev/null; cd "$CURIOSITY_RUNTIME_RELEASE_ROOT"; exec bun -e \'import("./runtime/query.js").then(m=>{if(Object.keys(m).sort().join(",")!=="createQueryRuntime,queryRuntimeCapabilities")process.exit(1)})\'')
}

const tarName = (path) => {
  const bytes = Buffer.from(path); if (bytes.length <= 100) return { name: path, prefix: "" }
  const split = path.lastIndexOf("/", 155); if (split < 1 || Buffer.byteLength(path.slice(split + 1)) > 100 || Buffer.byteLength(path.slice(0, split)) > 155) fail("M7_ARCHIVE_PATH_INVALID")
  return { name: path.slice(split + 1), prefix: path.slice(0, split) }
}
const octal = (value, width) => `${value.toString(8).padStart(width - 1, "0")}\0`
const tarHeader = (path, status) => {
  const header = Buffer.alloc(512); const { name, prefix } = tarName(path)
  header.write(name, 0, 100); header.write(octal(status.mode & 0o777, 8), 100, 8); header.write(octal(0, 8), 108, 8); header.write(octal(0, 8), 116, 8)
  header.write(octal(status.isFile() ? status.size : 0, 12), 124, 12); header.write(octal(0, 12), 136, 12); header.fill(0x20, 148, 156)
  header.write(status.isDirectory() ? "5" : "0", 156, 1); header.write("ustar\0", 257, 6); header.write("00", 263, 2); header.write("root", 265, 32); header.write("root", 297, 32); header.write(prefix, 345, 155)
  header.write(octal([...header].reduce((sum, byte) => sum + byte, 0), 8), 148, 8); return header
}
const archiveEntries = (source, path = basename(source)) => {
  const status = lstatSync(source); if (status.isSymbolicLink() || (!status.isDirectory() && !status.isFile())) fail("M7_ARTIFACT_TYPE_INVALID")
  const own = [{ source, path: status.isDirectory() ? `${path}/` : path, status }]
  return status.isDirectory() ? own.concat(readdirSync(source).sort().flatMap((name) => archiveEntries(join(source, name), `${path}/${name}`))) : own
}
export const createReleaseArchive = (source, destination, rootName = basename(source)) => {
  const blocks = []
  if (!safeRelative(rootName)) fail("M7_ARCHIVE_PATH_INVALID")
  for (const entry of archiveEntries(source, rootName)) {
    blocks.push(tarHeader(entry.path, entry.status))
    if (entry.status.isFile()) { const bytes = readFileSync(entry.source); blocks.push(bytes, Buffer.alloc((512 - (bytes.length % 512)) % 512)) }
  }
  blocks.push(Buffer.alloc(1024)); writeFileSync(destination, gzipSync(Buffer.concat(blocks), { level: 9, mtime: 0 }), { flag: "wx" })
  return destination
}
const tarString = (block, start, length) => block.subarray(start, start + length).toString("utf8").replace(/\0.*$/su, "")
const parseReleaseArchive = (archive) => {
  const input = readFileSync(archive); const tar = input[0] === 0x1f && input[1] === 0x8b ? gunzipSync(input) : input
  const members = []; let offset = 0
  while (offset + 512 <= tar.length) {
    const header = tar.subarray(offset, offset + 512); offset += 512
    if (header.every((byte) => byte === 0)) break
    const name = [tarString(header, 345, 155), tarString(header, 0, 100)].filter(Boolean).join("/"); if (!safeRelative(name.replace(/\/$/u, ""))) fail("M7_ARCHIVE_PATH_INVALID")
    const storedChecksum = Number.parseInt(tarString(header, 148, 8).trim(), 8); const checkHeader = Buffer.from(header); checkHeader.fill(0x20, 148, 156)
    if (!Number.isSafeInteger(storedChecksum) || storedChecksum !== [...checkHeader].reduce((sum, byte) => sum + byte, 0)) fail("M7_ARCHIVE_INVALID")
    const type = tarString(header, 156, 1) || "0"; if (type !== "0" && type !== "5") fail("M7_ARCHIVE_TYPE_INVALID")
    const size = Number.parseInt(tarString(header, 124, 12).trim() || "0", 8); if (!Number.isSafeInteger(size) || size < 0 || offset + size > tar.length) fail("M7_ARCHIVE_INVALID")
    members.push({ name: name.replace(/\/$/u, ""), type, mode: Number.parseInt(tarString(header, 100, 8), 8), bytes: tar.subarray(offset, offset + size) }); offset += Math.ceil(size / 512) * 512
  }
  if (members.length === 0 || new Set(members.map(({ name }) => name)).size !== members.length) fail("M7_ARCHIVE_INVALID")
  const rootName = members[0].name; if (members[0].type !== "5" || members.some(({ name }) => name !== rootName && !name.startsWith(`${rootName}/`))) fail("M7_ARCHIVE_PATH_INVALID")
  return members
}
export const listReleaseArchive = (archive) => parseReleaseArchive(archive).map(({ name }) => name)
export const extractReleaseArchive = (archive, destination) => {
  if (existsSync(destination)) fail("M7_ARCHIVE_DESTINATION_INVALID")
  const members = parseReleaseArchive(archive)
  mkdirSync(destination, { recursive: true, mode: 0o700 })
  for (const member of members) {
    const target = join(destination, ...member.name.split("/")); if (resolve(target).startsWith(`${resolve(destination)}${sep}`) === false) fail("M7_ARCHIVE_PATH_INVALID")
    if (member.type === "5") mkdirSync(target, { recursive: true, mode: member.mode }); else { mkdirSync(dirname(target), { recursive: true, mode: 0o700 }); writeFileSync(target, member.bytes, { mode: member.mode, flag: "wx" }) }
  }
  return destination
}
