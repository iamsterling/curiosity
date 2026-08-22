import { createHash } from "node:crypto"
import { readFile } from "node:fs/promises"
import { isDeepStrictEqual } from "node:util"
import { gunzipSync } from "node:zlib"

const fail = (code, detail) => {
  const suffix = detail === undefined ? "" : `:${JSON.stringify(detail)}`
  throw new Error(`${code}${suffix}`)
}
const hash = (algorithm, contents, encoding = "hex") => createHash(algorithm).update(contents).digest(encoding)
const text = (buffer, start, length) => buffer.subarray(start, start + length).toString("utf8").replace(/\0.*$/su, "")
const octal = (value, code) => {
  const normalized = value.replaceAll("\0", "").trim()
  if (!/^[0-7]+$/u.test(normalized)) fail(code)
  return Number.parseInt(normalized, 8)
}
const safePath = (value) => {
  const normalized = value.replace(/^\.\//u, "").replace(/\/$/u, "")
  if (!normalized || normalized.startsWith("/") || normalized.split("/").includes("..") || normalized.includes("\\")) {
    fail("OPENCODE2_PACKAGE_ARCHIVE_PATH_INVALID", value)
  }
  return normalized
}

const paxValues = (contents) => {
  const values = {}
  let offset = 0
  while (offset < contents.length) {
    const separator = contents.indexOf(0x20, offset)
    if (separator < 0) fail("OPENCODE2_PACKAGE_ARCHIVE_PAX_INVALID")
    const length = Number(contents.subarray(offset, separator).toString("ascii"))
    if (!Number.isSafeInteger(length) || length < 3 || offset + length > contents.length) fail("OPENCODE2_PACKAGE_ARCHIVE_PAX_INVALID")
    const record = contents.subarray(separator + 1, offset + length - 1).toString("utf8")
    const equals = record.indexOf("=")
    if (equals > 0) values[record.slice(0, equals)] = record.slice(equals + 1)
    offset += length
  }
  return values
}

const readTar = (compressed) => {
  let archive
  try {
    archive = gunzipSync(compressed)
  } catch {
    fail("OPENCODE2_PACKAGE_ARCHIVE_GZIP_INVALID")
  }
  const entries = []
  let globalPax = {}
  let nextPax = {}
  let nextLongName
  for (let offset = 0; offset + 512 <= archive.length;) {
    const header = archive.subarray(offset, offset + 512)
    if (header.every((byte) => byte === 0)) break
    const expectedChecksum = octal(text(header, 148, 8), "OPENCODE2_PACKAGE_ARCHIVE_HEADER_INVALID")
    const checksumHeader = Buffer.from(header)
    checksumHeader.fill(0x20, 148, 156)
    const actualChecksum = checksumHeader.reduce((sum, byte) => sum + byte, 0)
    if (expectedChecksum !== actualChecksum) fail("OPENCODE2_PACKAGE_ARCHIVE_CHECKSUM_INVALID")
    const size = octal(text(header, 124, 12), "OPENCODE2_PACKAGE_ARCHIVE_HEADER_INVALID")
    const bodyStart = offset + 512
    const bodyEnd = bodyStart + size
    if (bodyEnd > archive.length) fail("OPENCODE2_PACKAGE_ARCHIVE_TRUNCATED")
    const contents = archive.subarray(bodyStart, bodyEnd)
    const type = text(header, 156, 1) || "0"
    const prefix = text(header, 345, 155)
    const headerName = [prefix, text(header, 0, 100)].filter(Boolean).join("/")
    if (type === "x" || type === "g") {
      const values = paxValues(contents)
      if (type === "g") globalPax = { ...globalPax, ...values }
      else nextPax = values
    } else if (type === "L") nextLongName = contents.toString("utf8").replace(/\0.*$/su, "").replace(/\n$/u, "")
    else {
      const attributes = { ...globalPax, ...nextPax }
      const path = safePath(attributes.path ?? nextLongName ?? headerName)
      const mode = octal(text(header, 100, 8), "OPENCODE2_PACKAGE_ARCHIVE_HEADER_INVALID")
      const link = attributes.linkpath ?? (text(header, 157, 100) || undefined)
      entries.push({ contents: Buffer.from(contents), link, mode, path, size, type })
      nextPax = {}
      nextLongName = undefined
    }
    offset = bodyStart + Math.ceil(size / 512) * 512
  }
  if (entries.length === 0) fail("OPENCODE2_PACKAGE_ARCHIVE_EMPTY")
  return entries
}

export const inspectPackageArchive = async (tarball, options = {}) => {
  const compressed = await readFile(tarball)
  const entries = readTar(compressed)
  const manifestEntries = entries.filter(({ path, type }) => path === "package/package.json" && type === "0")
  if (manifestEntries.length !== 1) fail("OPENCODE2_PACKAGE_MANIFEST_COUNT_INVALID", manifestEntries.length)
  let manifest
  try {
    manifest = JSON.parse(manifestEntries[0].contents.toString("utf8"))
  } catch {
    fail("OPENCODE2_PACKAGE_MANIFEST_JSON_INVALID")
  }
  if (typeof manifest?.name !== "string" || typeof manifest?.version !== "string") fail("OPENCODE2_PACKAGE_MANIFEST_IDENTITY_INVALID")
  const inventory = entries
    .filter(({ type }) => type === "0" || type === "2")
    .map(({ contents, link, mode, path, size, type }) => ({
      path,
      type: type === "2" ? "symlink" : "file",
      mode,
      size,
      ...(type === "2" ? { target: link } : { sha256: hash("sha256", contents) }),
    }))
    .sort((left, right) => left.path.localeCompare(right.path))
  if (options.rejectLinks && inventory.some(({ type }) => type === "symlink")) fail("OPENCODE2_PACKAGE_ARCHIVE_SYMLINK_FORBIDDEN")
  return {
    archive: {
      integrity: `sha512-${hash("sha512", compressed, "base64")}`,
      sha1: hash("sha1", compressed),
      sha256: hash("sha256", compressed),
      size: compressed.length,
    },
    entries,
    inventory,
    manifest,
  }
}

const dependencySections = ["dependencies", "optionalDependencies", "peerDependencies", "devDependencies", "runtimeDependencies"]
const dependencyListSections = ["bundledDependencies", "bundleDependencies", "trustedDependencies"]
const dependencyKeySections = ["peerDependenciesMeta", "dependenciesMeta", "patchedDependencies"]
const dependencySelectorTreeSections = ["overrides", "resolutions", "catalog", "catalogs"]
const runtimePackage = "@curiosity/runtime"
const runtimeDirectReference = /^(?:(?:npm:)|\$)?@curiosity\/runtime(?:@|$)/u
const runtimeSelectorReference = /(?:^|[\/>$])@curiosity\/runtime(?=@|$|[\/>])/u
const unsupportedDependency = /^(?:workspace:|file:|link:|git(?:\+[^:]+)?:|https?:)|(?:^|[/])\.\.(?:[/]|$)/u
const allowedPackagePath = /^package\/(?:package\.json|README\.md|LICENSE|tools\/install-node\.mjs|dist\/|assets\/)/u
const excludedPackagePath = /^package\/(?:src|tests|node_modules|docs|provenance)(?:\/|$)|(?:^|\/)bun\.lock$|(?:^|\/)tsconfig(?:\.build)?\.json$/u
const expectedBin = { "opencode2-config": "tools/install-node.mjs" }
const expectedExports = {
  ".": { types: "./dist/index.d.ts", import: "./dist/index.js" },
  "./server": { types: "./dist/index.d.ts", import: "./dist/index.js" },
}
const expectedTypes = "./dist/index.d.ts"
const expectedFiles = ["dist", "assets", "tools/install-node.mjs", "README.md", "LICENSE"]
const unorderedManifestArrays = new Set(["files", "keywords", "bundledDependencies", "bundleDependencies", "trustedDependencies", "os", "cpu"])

const semanticManifest = (value, key) => {
  if (Array.isArray(value)) {
    const normalized = value.map((entry) => semanticManifest(entry))
    return unorderedManifestArrays.has(key) ? normalized.sort((left, right) => JSON.stringify(left).localeCompare(JSON.stringify(right))) : normalized
  }
  if (typeof value !== "object" || value === null) return value
  return Object.fromEntries(Object.keys(value).sort().map((name) => [name, semanticManifest(value[name], name)]))
}

const normalizedSelector = (value) => String(value).trim().replace(/\s*([\/>])\s*/gu, "$1")
const selectorReferencesRuntime = (value) => typeof value === "string" && runtimeSelectorReference.test(normalizedSelector(value))
const specifierReferencesRuntime = (value) => typeof value === "string" && runtimeDirectReference.test(value.trim())

const dependencyMapReferencePath = (value, path) => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return undefined
  for (const name of Object.keys(value).sort()) {
    if (selectorReferencesRuntime(name) || specifierReferencesRuntime(value[name])) return [...path, name]
  }
  return undefined
}

const dependencyListReferencePath = (value, path) => {
  if (!Array.isArray(value)) return undefined
  for (let index = 0; index < value.length; index += 1) {
    if (selectorReferencesRuntime(value[index])) return [...path, index]
  }
  return undefined
}

const dependencyKeyReferencePath = (value, path) => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return undefined
  for (const name of Object.keys(value).sort()) {
    if (selectorReferencesRuntime(name)) return [...path, name]
  }
  return undefined
}

const dependencySelectorTreeReferencePath = (value, path) => {
  if (typeof value === "string") return specifierReferencesRuntime(value) ? path : undefined
  if (Array.isArray(value)) {
    for (let index = 0; index < value.length; index += 1) {
      const found = dependencySelectorTreeReferencePath(value[index], [...path, index])
      if (found) return found
    }
    return undefined
  }
  if (typeof value !== "object" || value === null) return undefined
  for (const name of Object.keys(value).sort()) {
    if (selectorReferencesRuntime(name)) return [...path, name]
    const found = dependencySelectorTreeReferencePath(value[name], [...path, name])
    if (found) return found
  }
  return undefined
}

const validateRuntimeMetadata = (manifest, manifestKind) => {
  const sectionValidators = [
    [dependencySections, dependencyMapReferencePath],
    [dependencyListSections, dependencyListReferencePath],
    [dependencyKeySections, dependencyKeyReferencePath],
    [dependencySelectorTreeSections, dependencySelectorTreeReferencePath],
  ]
  for (const [sections, validator] of sectionValidators) {
    for (const section of sections) {
      if (manifest[section] === undefined) continue
      const referencePath = validator(manifest[section], [section])
      if (!referencePath) continue
      fail("OPENCODE2_PACKED_RUNTIME_DEPENDENCY_FORBIDDEN", {
        manifest: manifestKind,
        package: runtimePackage,
        path: referencePath,
        section,
      })
    }
  }
}

const validateManifestSurface = (manifest, manifestKind) => {
  if (manifest.name !== "@iamsterling/opencode2-config" || manifest.version !== "0.1.0") {
    fail("OPENCODE2_PACKED_IDENTITY_INVALID", { manifest: manifestKind })
  }
  if (manifest.private === true || manifest.publishConfig?.access !== "public") {
    fail("OPENCODE2_PACKED_PUBLIC_METADATA_INVALID", { manifest: manifestKind })
  }
  if (!isDeepStrictEqual(manifest.bin, expectedBin)) {
    fail("OPENCODE2_PACKED_BIN_INVALID", { actual: manifest.bin, expected: expectedBin, manifest: manifestKind })
  }
  if (!isDeepStrictEqual(manifest.exports, expectedExports)) {
    fail("OPENCODE2_PACKED_EXPORTS_INVALID", { actual: manifest.exports, expected: expectedExports, manifest: manifestKind })
  }
  if (manifest.types !== expectedTypes) {
    fail("OPENCODE2_PACKED_TYPES_INVALID", { actual: manifest.types, expected: expectedTypes, manifest: manifestKind })
  }
  const files = manifest.files
  if (
    !Array.isArray(files) ||
    files.some((entry) => typeof entry !== "string") ||
    files.length !== expectedFiles.length ||
    new Set(files).size !== files.length ||
    expectedFiles.some((entry) => !files.includes(entry))
  ) {
    fail("OPENCODE2_PACKED_FILES_INVALID", { actual: files, expected: expectedFiles, manifest: manifestKind })
  }
  validateRuntimeMetadata(manifest, manifestKind)
  for (const section of dependencySections) {
    for (const [name, specifier] of Object.entries(manifest[section] ?? {})) {
      if (unsupportedDependency.test(String(specifier))) {
        fail("OPENCODE2_PACKED_DEPENDENCY_SPEC_INVALID", { manifest: manifestKind, name, section })
      }
    }
  }
}

const requireRegularTarget = (inventory, surface, target) => {
  const entry = inventory.find(({ path }) => path === target)
  if (!entry) fail("OPENCODE2_PACKED_TARGET_MISSING", { surface, target })
  if (entry.type !== "file") fail("OPENCODE2_PACKED_TARGET_NOT_REGULAR", { actual: entry.type, surface, target })
  if (!Number.isSafeInteger(entry.size) || entry.size < 1) fail("OPENCODE2_PACKED_TARGET_EMPTY", { surface, target })
  return entry
}

export const validatePackedProduct = ({ inspected, sourceManifest }) => {
  const { inventory, manifest } = inspected
  validateManifestSurface(sourceManifest, "source")
  validateManifestSurface(manifest, "packed")
  if (!isDeepStrictEqual(semanticManifest(manifest), semanticManifest(sourceManifest))) fail("OPENCODE2_PACKED_MANIFEST_REWRITTEN")
  const paths = inventory.map(({ path }) => path)
  for (const [surface, target] of [
    ["manifest", "package/package.json"],
    ["files:README.md", "package/README.md"],
    ["files:LICENSE", "package/LICENSE"],
    ["files:assets", "package/assets/manifest.json"],
    ["bin:opencode2-config", "package/tools/install-node.mjs"],
    ["exports:import", "package/dist/index.js"],
    ["exports:types", "package/dist/index.d.ts"],
  ]) requireRegularTarget(inventory, surface, target)
  const bin = requireRegularTarget(inventory, "bin:opencode2-config", "package/tools/install-node.mjs")
  if ((bin.mode & 0o111) === 0) fail("OPENCODE2_PACKED_BIN_NOT_EXECUTABLE", { mode: bin.mode, target: bin.path })
  for (const path of paths) {
    if (!allowedPackagePath.test(path) || excludedPackagePath.test(path)) fail("OPENCODE2_PACKED_FILE_FORBIDDEN", path)
  }
  return inspected
}
