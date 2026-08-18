import { createHash, randomBytes, timingSafeEqual } from "node:crypto"
import { execFileSync } from "node:child_process"
import {
  closeSync, constants, copyFileSync, existsSync, fchmodSync, fstatSync, fsyncSync, linkSync, lstatSync, mkdirSync, openSync, readFileSync, readSync,
  readdirSync, readlinkSync, realpathSync, renameSync, rmSync, symlinkSync, unlinkSync, writeFileSync, writeSync,
} from "node:fs"
import { basename, dirname, isAbsolute, join, relative, resolve, sep } from "node:path"
import { gzipSync, gunzipSync } from "node:zlib"

export const M7_RIPGREP = Object.freeze({
  version: "15.1.0",
  architecture: "arm64",
  sha256: "4fdf1d8365af224bc70e3c1490d8461d859c37cc70e739a11e987af0215f3e94",
  source: "/Users/sterling/.cache/opencode/bin/rg",
})
const M7_RIPGREP_NOTICE_SHA256 = Object.freeze({
  "licenses/ripgrep-COPYING.txt": "01c266bced4a434da0051174d6bee16a4c82cf634e2679b6155d40d75012390f",
  "licenses/ripgrep-MIT.txt": "0f96a83840e146e43c0ec96a22ec1f392e0680e6c1226e6f3ba87e0740af850f",
  "licenses/ripgrep-UNLICENSE.txt": "7e12e5df4bae12cb21581ba157ced20e1986a0508dd10d0e8a4ab9a4cf94e85c",
})
const M7_RIPGREP_FILES = Object.freeze(["bin/rg"])
export const M7_PROFILE = Object.freeze({
  platform: "darwin", architecture: "arm64", macOS: "27.0", bun: "1.3.14",
  rustc: "1.97.1", cargo: "1.97.1", opencode: "0.0.0-beta-17595",
  effect: "4.0.0-beta.107", stateSchema: "curiosity-query-state/v1",
  controlledPluginId: "iamsterling.opencode2-config",
  ripgrep: { version: M7_RIPGREP.version, architecture: M7_RIPGREP.architecture, sha256: M7_RIPGREP.sha256 },
})
export const M7_NATIVE_INSTALL_ID = "@rpath/libcuriosity_runtime_native.dylib"
export const M7_PLUGIN_ENTRYPOINT = "plugin/index.js"
export const M7_PLUGIN_BUILD_ARGUMENTS = Object.freeze(["--target=bun", "--minify-whitespace"])
export const m7PluginAdapterSource = ({ delegate, effect }) => `import { closeSync, constants, fstatSync, openSync, writeSync } from "node:fs"
import delegated from ${JSON.stringify(delegate)}
import { Effect } from ${JSON.stringify(effect)}
const identity=${JSON.stringify(M7_PROFILE.controlledPluginId)}
if(delegated?.id!==identity||typeof delegated.effect!=="function")throw new Error("M7_PLUGIN_IDENTITY_INVALID")
const nonce=process.env.CURIOSITY_M7_SMOKE_NONCE, marker=process.env.CURIOSITY_M7_SMOKE_MARKER
const probing=typeof nonce==="string"&&/^[0-9a-f]{64}$/.test(nonce)&&typeof marker==="string"&&marker.length>0
const record=(value)=>{if(!probing)return;const fd=openSync(marker,constants.O_WRONLY|constants.O_APPEND|constants.O_NOFOLLOW);try{const status=fstatSync(fd);if(!status.isFile()||status.uid!==process.getuid()||(status.mode&0o777)!==0o600)throw new Error("M7_SMOKE_MARKER_INVALID");writeSync(fd,JSON.stringify({nonce,...value})+"\\n")}finally{closeSync(fd)}}
const wrapHook=(domain,kind)=>({...domain,hook:(...args)=>domain.hook(...args).pipe(Effect.tap(()=>Effect.sync(()=>record({kind:"registration",registration:kind,id:String(args[0])}))))})
const tool=(context)=>({...wrapHook(context.tool,"tool.hook"),transform:(callback)=>{const tools=[];return context.tool.transform((draft)=>callback({...draft,add:(definition)=>{tools.push(definition.name);return draft.add(definition)}})).pipe(Effect.tap(()=>Effect.sync(()=>record({kind:"registration",registration:"tool.transform",id:"transform",tools}))))}})
export default {id:identity,effect:(context)=>Effect.gen(function*(){record({kind:"setup",id:identity});yield* Effect.addFinalizer(()=>Effect.sync(()=>record({kind:"cleanup",id:identity})));yield* delegated.effect({...context,session:probing?wrapHook(context.session,"session.hook"):context.session,tool:probing?tool(context):context.tool})})}
`
const M7_BUILD_DEPENDENCIES = Object.freeze([
  ["@opencode-ai/plugin", M7_PROFILE.opencode], ["@opencode-ai/cli", M7_PROFILE.opencode],
  ["effect", M7_PROFILE.effect], ["typescript", "5.8.2"], ["@types/node", "26.2.0"],
])
const M7_RELEASE_DEPENDENCIES = Object.freeze([
  ["@opencode-ai/cli-darwin-arm64", M7_PROFILE.opencode], ["fast-check", "4.9.0"], ["pure-rand", "8.4.2"],
])
const M7_NATIVE_RUSTFLAGS = [
  "-C", `link-arg=-Wl,-install_name,${M7_NATIVE_INSTALL_ID}`,
].join("\x1f")

const METADATA = new Set(["manifest.json", "SHA256SUMS"])
const fail = (code) => { throw new Error(code) }
const safeRelative = (value) => typeof value === "string" && value.length > 0 && !isAbsolute(value) &&
  value.split(/[\\/]/u).every((part) => part && part !== "." && part !== "..")
const digestBytes = (value) => createHash("sha256").update(value).digest("hex")
const digest = (path) => digestBytes(readFileSync(path))
const CONFINEMENT = "M7_BUILD_DEPENDENCY_CONFINEMENT_INVALID"

const beneath = (root, candidate) => {
  const path = relative(root, candidate)
  return path === "" || (!path.startsWith(`..${sep}`) && path !== ".." && !isAbsolute(path))
}

const canonicalDirectory = (path, unavailableCode) => {
  let canonical; let status
  try { canonical = realpathSync(path); status = lstatSync(canonical) }
  catch (error) { fail(error?.code === "ELOOP" ? CONFINEMENT : unavailableCode) }
  if (!status.isDirectory()) fail(CONFINEMENT)
  return canonical
}

export const m7DependencyInput = (dependencyRoot, candidate, type = "file") => {
  const root = canonicalDirectory(dependencyRoot, "M7_BUILD_DEPENDENCIES_UNAVAILABLE")
  const lexical = resolve(candidate)
  if (!beneath(root, lexical)) fail(CONFINEMENT)
  let canonical; let status
  try { canonical = realpathSync(lexical); status = lstatSync(canonical) }
  catch (error) { fail(error?.code === "ELOOP" ? CONFINEMENT : "M7_BUILD_DEPENDENCIES_UNAVAILABLE") }
  if (!beneath(root, canonical) || (type === "file" ? !status.isFile() : !status.isDirectory())) fail(CONFINEMENT)
  return canonical
}

const readPackage = (path, code) => {
  try { return JSON.parse(readFileSync(path, "utf8")) } catch { fail(code) }
}

const dependencyPackage = (dependencyRoot, name, version) => {
  const store = m7DependencyInput(dependencyRoot, join(dependencyRoot, ".bun"), "directory"); let foundName = false
  let entries
  try { entries = readdirSync(store).sort() } catch { fail("M7_BUILD_DEPENDENCIES_UNAVAILABLE") }
  for (const entry of entries) {
    const candidate = join(store, entry, "node_modules", ...name.split("/"), "package.json")
    let metadata
    try { metadata = lstatSync(candidate) } catch (error) {
      if (error?.code === "ENOENT") continue
      fail(error?.code === "ELOOP" ? CONFINEMENT : "M7_BUILD_DEPENDENCIES_UNAVAILABLE")
    }
    if (!metadata.isFile() && !metadata.isSymbolicLink()) fail(CONFINEMENT)
    const manifestPath = m7DependencyInput(dependencyRoot, candidate)
    const manifest = readPackage(manifestPath, "M7_BUILD_DEPENDENCIES_UNAVAILABLE")
    if (manifest.name !== name) continue
    foundName = true
    if (manifest.version === version) return m7DependencyInput(dependencyRoot, dirname(candidate), "directory")
  }
  fail(foundName ? "M7_BUILD_DEPENDENCY_PIN_MISMATCH" : "M7_BUILD_DEPENDENCIES_UNAVAILABLE")
}

const sourceDirectory = (root, path, required = true) => {
  let status
  try { status = lstatSync(path) } catch (error) {
    if (!required && error?.code === "ENOENT") return false
    fail("M7_BUILD_DEPENDENCIES_UNAVAILABLE")
  }
  if (status.isSymbolicLink() || !status.isDirectory() || !beneath(root, path)) fail(CONFINEMENT)
  return true
}

const removeStagedPath = (path, permittedTargets) => {
  let status
  try { status = lstatSync(path) } catch (error) {
    if (error?.code === "ENOENT") return
    fail(CONFINEMENT)
  }
  if (status.isSymbolicLink()) {
    let canonical
    try { canonical = realpathSync(path) } catch { fail(CONFINEMENT) }
    if (!permittedTargets.includes(canonical)) fail(CONFINEMENT)
    unlinkSync(path); return
  }
  if (!status.isDirectory()) fail(CONFINEMENT)
  rmSync(path, { recursive: true, force: true })
}

export const stageM7BuildDependencies = ({ sourceRoot, dependencyRoot }) => {
  let source; let dependencies
  try { source = realpathSync(sourceRoot) }
  catch { fail("M7_BUILD_DEPENDENCIES_UNAVAILABLE") }
  if (!lstatSync(source).isDirectory()) fail(CONFINEMENT)
  const pluginRoot = join(source, "apps/plugin/opencode2")
  sourceDirectory(source, join(source, "apps")); sourceDirectory(source, pluginRoot)
  const modules = join(pluginRoot, "node_modules")
  sourceDirectory(source, modules, false)
  const manifest = readPackage(join(pluginRoot, "package.json"), "M7_BUILD_DEPENDENCIES_UNAVAILABLE")
  if (manifest.dependencies?.["@opencode-ai/plugin"] !== M7_PROFILE.opencode ||
    manifest.devDependencies?.["@opencode-ai/cli"] !== M7_PROFILE.opencode ||
    manifest.dependencies?.effect !== M7_PROFILE.effect || manifest.devDependencies?.typescript !== "5.8.2" ||
    manifest.devDependencies?.["@types/node"] !== "26.2.0") {
    fail("M7_BUILD_DEPENDENCY_PIN_MISMATCH")
  }
  dependencies = canonicalDirectory(dependencyRoot, "M7_BUILD_DEPENDENCIES_UNAVAILABLE")
  const buildPackages = M7_BUILD_DEPENDENCIES.map(([name, version]) => [name, dependencyPackage(dependencies, name, version)])
  for (const [name, version] of M7_RELEASE_DEPENDENCIES) dependencyPackage(dependencies, name, version)
  const runtimeTarget = canonicalDirectory(join(source, "apps/runtime"), "M7_BUILD_DEPENDENCIES_UNAVAILABLE")
  if (!beneath(source, runtimeTarget)) fail(CONFINEMENT)
  const typescript = buildPackages.find(([name]) => name === "typescript")?.[1]
  const tsc = m7DependencyInput(dependencies, join(typescript, "bin/tsc"))

  if (!existsSync(modules)) mkdirSync(modules, { mode: 0o700 })
  for (const [name, packageTarget] of buildPackages) {
    const target = join(modules, ...name.split("/")); const parent = dirname(target)
    if (!existsSync(parent)) mkdirSync(parent, { recursive: true, mode: 0o700 })
    else sourceDirectory(source, parent)
    removeStagedPath(target, [packageTarget]); symlinkSync(packageTarget, target, "dir")
  }
  const runtime = join(modules, "@curiosity/runtime"); const runtimeParent = dirname(runtime)
  if (!existsSync(runtimeParent)) mkdirSync(runtimeParent, { recursive: true, mode: 0o700 })
  else sourceDirectory(source, runtimeParent)
  removeStagedPath(runtime, [runtimeTarget]); symlinkSync(runtimeTarget, runtime, "dir")
  const bin = join(modules, ".bin"); if (!existsSync(bin)) mkdirSync(bin, { mode: 0o700 }); else sourceDirectory(source, bin)
  removeStagedPath(join(bin, "tsc"), [tsc]); symlinkSync("../typescript/bin/tsc", join(bin, "tsc"))
  return { network: "disabled", source: dependencies }
}

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

export const assertM7RipgrepLinks = (linked) => {
  const expected = ["/usr/lib/libiconv.2.dylib", "/usr/lib/libSystem.B.dylib"]
  if (!Array.isArray(linked) || linked.length !== expected.length || expected.some((path) => !linked.includes(path))) fail("M7_RIPGREP_LINK_INVALID")
  return true
}

export const copyVerifiedExecutable = ({ source, destination, sha256, code, unavailableCode = code }) => {
  if (!isAbsolute(source) || resolve(source) !== source || !isAbsolute(destination) || resolve(destination) !== destination || existsSync(destination)) fail(code)
  let canonical; let destinationParent
  try { canonical = realpathSync(source) } catch { fail(unavailableCode) }
  try { destinationParent = lstatSync(dirname(destination)) } catch { fail(code) }
  if (canonical !== source || realpathSync(dirname(destination)) !== dirname(destination) || !destinationParent.isDirectory() || destinationParent.uid !== process.getuid() || (destinationParent.mode & 0o022) !== 0) fail(code)
  const temporary = `${destination}.copy-${process.pid}-${randomBytes(8).toString("hex")}`
  let input; let output; let identity; let published = false; const hash = createHash("sha256")
  try {
    input = openSync(source, constants.O_RDONLY | constants.O_NOFOLLOW)
    identity = fstatSync(input, { bigint: true })
    if (!identity.isFile() || identity.uid !== BigInt(process.getuid()) || (identity.mode & 0o022n) !== 0n || (identity.mode & 0o111n) === 0n) fail(code)
    output = openSync(temporary, constants.O_CREAT | constants.O_EXCL | constants.O_WRONLY | constants.O_NOFOLLOW, 0o700)
    const bytes = Buffer.alloc(1024 * 1024)
    while (true) {
      const length = readSync(input, bytes, 0, bytes.length, null)
      if (length === 0) break
      hash.update(bytes.subarray(0, length))
      let offset = 0
      while (offset < length) offset += writeSync(output, bytes, offset, length - offset)
    }
    fchmodSync(output, 0o755); fsyncSync(output); closeSync(output); output = undefined
    if (hash.digest("hex") !== sha256) fail(code)
    linkSync(temporary, destination); published = true; unlinkSync(temporary)
    let sourceStable = false
    try { const current = lstatSync(source, { bigint: true }); sourceStable = !current.isSymbolicLink() && current.dev === identity.dev && current.ino === identity.ino }
    catch { /* Diagnostic only: trust remains with the opened descriptor and copied digest. */ }
    return { path: destination, sourceIdentity: { dev: identity.dev, ino: identity.ino }, sourceStable }
  } catch (error) {
    rmSync(temporary, { force: true }); if (published) rmSync(destination, { force: true }); throw error
  } finally {
    if (output !== undefined) closeSync(output)
    if (input !== undefined) closeSync(input)
  }
}

export const verifyM7RipgrepInput = (input, destination) => {
  if (input !== M7_RIPGREP.source) {
    try { lstatSync(input) } catch { fail("M7_RIPGREP_INPUT_UNAVAILABLE") }
    fail("M7_RIPGREP_INPUT_MISMATCH")
  }
  if (typeof destination !== "string") fail("M7_RIPGREP_INPUT_MISMATCH")
  const artifact = copyVerifiedExecutable({ source: input, destination, sha256: M7_RIPGREP.sha256, code: "M7_RIPGREP_INPUT_MISMATCH", unavailableCode: "M7_RIPGREP_INPUT_UNAVAILABLE" }).path
  let version; let architecture; let linked
  try {
    version = execFileSync(artifact, ["--version"], { encoding: "utf8" }).split("\n", 1)[0]
    architecture = execFileSync("file", [artifact], { encoding: "utf8" })
    linked = execFileSync("otool", ["-L", artifact], { encoding: "utf8" }).split("\n").slice(1).map((line) => line.trim().split(" ")[0]).filter(Boolean)
    if (version !== `ripgrep ${M7_RIPGREP.version} (rev af60c2de9d)` || !architecture.includes(`Mach-O 64-bit executable ${M7_RIPGREP.architecture}`)) fail("M7_RIPGREP_INPUT_MISMATCH")
    assertM7RipgrepLinks(linked)
    return artifact
  } catch { rmSync(artifact, { force: true }); fail("M7_RIPGREP_INPUT_MISMATCH") }
}

export const darwinUuid = (path) => {
  let output
  try { output = execFileSync("otool", ["-l", path], { encoding: "utf8" }) }
  catch { fail("M7_NATIVE_UUID_INVALID") }
  const uuids = [...output.matchAll(/^\s*uuid ([0-9A-F]{8}(?:-[0-9A-F]{4}){3}-[0-9A-F]{12})$/gmu)].map((match) => match[1])
  if (uuids.length !== 1 || !output.includes("cmd LC_UUID") || uuids[0] === "00000000-0000-0000-0000-000000000000") fail("M7_NATIVE_UUID_INVALID")
  return uuids[0]
}

export const assertM7NativeHasValidUuid = (path) => {
  darwinUuid(path)
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
  let integrity
  try { integrity = parseManifest(JSON.parse(readFileSync(join(root, "manifest.json"), "utf8"))) } catch { fail("M7_LICENSE_INVENTORY_INVALID") }
  const names = new Set(); const covered = new Set()
  for (const component of sbom.components) {
    if (typeof component?.name !== "string" || names.has(component.name) || typeof component.version !== "string" || !component.version || typeof component.license !== "string" || !component.license || !Array.isArray(component.files) || component.files.length === 0 || !safeRelative(component.licenseFile) || (component.notices !== undefined && (!Array.isArray(component.notices) || component.notices.some((path) => !safeRelative(path))))) fail("M7_SBOM_INVALID")
    const references = [component.licenseFile, ...(component.notices ?? [])]
    if (component.name === "ripgrep" && (component.version !== M7_RIPGREP.version || component.platform !== M7_PROFILE.platform || component.architecture !== M7_RIPGREP.architecture || component.sha256 !== M7_RIPGREP.sha256 || JSON.stringify([...component.files].sort()) !== JSON.stringify([...M7_RIPGREP_FILES].sort()))) fail("M7_SBOM_INVALID")
    if (component.name === "ripgrep" && (component.license !== "MIT OR Unlicense" || component.licenseFile !== "licenses/ripgrep-MIT.txt" || JSON.stringify([...(component.notices ?? [])].sort()) !== JSON.stringify(Object.keys(M7_RIPGREP_NOTICE_SHA256).sort()))) fail("M7_LICENSE_INVENTORY_INVALID")
    names.add(component.name)
    for (const path of references) {
      secureFile(join(root, path), "M7_LICENSE_INVENTORY_INVALID")
      const entry = integrity.get(path)
      if (!entry || digest(join(root, path)) !== entry.sha256) fail("M7_LICENSE_INVENTORY_INVALID")
      if (component.name === "ripgrep" && digest(join(root, path)) !== M7_RIPGREP_NOTICE_SHA256[path]) fail("M7_LICENSE_INVENTORY_INVALID")
      covered.add(path)
    }
    for (const path of component.files) {
      if (!safeRelative(path)) fail("M7_SBOM_INVALID")
      secureFile(join(root, path), "M7_SBOM_INVALID")
      if (component.name === "ripgrep" && (digest(join(root, path)) !== M7_RIPGREP.sha256 || integrity.get(path)?.sha256 !== M7_RIPGREP.sha256)) fail("M7_SBOM_INVALID")
      covered.add(path)
    }
  }
  for (const required of ["curiosity-m7-release", "curiosity-runtime-native", "@curiosity/runtime", "@iamsterling/opencode2-config", "opencode2", "ripgrep", "@opencode-ai/plugin", "@opencode-ai/protocol", "@opencode-ai/schema", "effect", "fast-check", "pure-rand"]) if (!names.has(required)) fail("M7_SBOM_COVERAGE_INVALID")
  for (const { path } of payloadEntries(root)) {
    if (["SBOM.json", "DEPENDENCIES-LICENSES.md", "RELEASE.json", "provenance.json"].includes(path)) continue
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

const scriptRoot = 'CURIOSITY_RUNTIME_RELEASE_ROOT="$(CDPATH= cd -- "$(/usr/bin/dirname -- "$0")/.." && pwd -P)"\nexport CURIOSITY_RUNTIME_RELEASE_ROOT'
const hostSmokeRunner = `import { spawn } from "node:child_process"
import { randomBytes } from "node:crypto"
import { createServer } from "node:http"
import { closeSync, constants, fstatSync, lstatSync, mkdirSync, openSync, readSync, realpathSync, readdirSync, unlinkSync, writeFileSync, writeSync } from "node:fs"
import { dirname, isAbsolute, join, relative, resolve, sep } from "node:path"

const pluginId = ${JSON.stringify(M7_PROFILE.controlledPluginId)}
const expectedTools = ${JSON.stringify(["formerhuman_search", "ledger_approval_request", "ledger_approval_status", "ledger_claim_release", "ledger_claim_request", "ledger_evidence_submit", "ledger_fact_record", "ledger_intent_activate", "ledger_intent_frame", "ledger_intent_propose", "ledger_progress_propose", "ledger_resolution_propose", "ledger_review_propose", "ledger_work_propose", "native_loop_pause", "native_loop_resume", "native_loop_start", "native_loop_status", "native_loop_stop", "web_search"])}
const delay = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds))
const groupAlive = (pid) => { try { process.kill(-pid, 0); return true } catch { return false } }
const terminateGroup = async (pid) => {
  if (!groupAlive(pid)) return
  try { process.kill(-pid, "SIGTERM") } catch {}
  for (let attempt = 0; attempt < 20 && groupAlive(pid); attempt += 1) await delay(25)
  if (groupAlive(pid)) { try { process.kill(-pid, "SIGKILL") } catch {} }
  for (let attempt = 0; attempt < 20 && groupAlive(pid); attempt += 1) await delay(25)
  if (groupAlive(pid)) throw new Error("survivor")
}
const ownedFile = (directory, prefix, suffix, contents = "") => {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const path = join(directory, prefix + randomBytes(16).toString("hex") + suffix)
    let fd
    try {
      fd = openSync(path, constants.O_CREAT | constants.O_EXCL | constants.O_RDWR | constants.O_NOFOLLOW, 0o600)
      if (contents) writeFileSync(fd, contents)
      const status = fstatSync(fd, { bigint: true })
      if (!status.isFile() || status.uid !== BigInt(process.getuid()) || (status.mode & 0o177n) !== 0n) throw new Error("owned")
      return { path, fd, dev: status.dev, ino: status.ino, contents }
    } catch (error) {
      if (fd !== undefined) closeSync(fd)
      if (error?.code !== "EEXIST") throw error
    }
  }
  throw new Error("owned")
}
const removeOwned = (owned) => {
  if (!owned) return
  try {
    const current = lstatSync(owned.path, { bigint: true })
    if (!current.isSymbolicLink() && current.isFile() && current.dev === owned.dev && current.ino === owned.ino) unlinkSync(owned.path)
  } catch (error) { if (error?.code !== "ENOENT") throw error }
}
const readOwned = (owned, maximum = 65_536) => {
  const status = fstatSync(owned.fd, { bigint: true })
  if (!status.isFile() || status.dev !== owned.dev || status.ino !== owned.ino || status.size > BigInt(maximum)) throw new Error("probe")
  const bytes = Buffer.alloc(Number(status.size)); let offset = 0
  while (offset < bytes.length) { const length = readSync(owned.fd, bytes, offset, bytes.length - offset, offset); if (!length) break; offset += length }
  if (offset !== bytes.length) throw new Error("probe")
  return bytes.toString("utf8")
}
const secureDirectory = (path) => {
  const status = lstatSync(path)
  if (status.isSymbolicLink() || !status.isDirectory() || status.uid !== process.getuid() || (status.mode & 0o022) !== 0) throw new Error("profile")
  return realpathSync(path)
}
const externalDirectory = (input) => {
  if (!input || !isAbsolute(input) || resolve(input) !== input || secureDirectory(input) !== input) throw new Error("external")
  return input
}
const externalFile = (input) => {
  if (!input || !isAbsolute(input) || resolve(input) !== input) throw new Error("external")
  const status = lstatSync(input)
  if (status.isSymbolicLink() || !status.isFile() || status.uid !== process.getuid() || (status.mode & 0o022) !== 0 || realpathSync(input) !== input) throw new Error("external")
  return input
}
const profile = (input) => {
  if (!input || !isAbsolute(input) || resolve(input) !== input) throw new Error("profile")
  let ancestor = input
  while (true) { try { lstatSync(ancestor); break } catch (error) { if (error?.code !== "ENOENT") throw error; const parent = dirname(ancestor); if (parent === ancestor) throw error; ancestor = parent } }
  if (realpathSync(ancestor) !== ancestor) throw new Error("profile")
  if (ancestor !== input) {
    const missing = []; for (let path = input; path !== ancestor; path = dirname(path)) missing.push(path)
    for (const path of missing.reverse()) { mkdirSync(path, { mode: 0o700 }); if (secureDirectory(path) !== path) throw new Error("profile") }
  }
  const root = secureDirectory(input); if (root !== input) throw new Error("profile")
  const paths = { root, home: join(root, "home"), config: join(root, "config"), data: join(root, "data"), cache: join(root, "cache") }
  for (const path of [paths.home, paths.config, paths.data, paths.cache]) {
    try { lstatSync(path) } catch (error) { if (error?.code !== "ENOENT") throw error; mkdirSync(path, { mode: 0o700 }) }
    if (secureDirectory(path) !== path || relative(root, path).startsWith(\`..\${sep}\`)) throw new Error("profile")
  }
  paths.opencode = join(paths.config, "opencode")
  for (const path of [paths.opencode]) {
    try { lstatSync(path) } catch (error) { if (error?.code !== "ENOENT") throw error; mkdirSync(path, { mode: 0o700 }) }
    if (secureDirectory(path) !== path) throw new Error("profile")
  }
  return paths
}
const materialize = (paths) => {
  const releaseRoot = process.env.CURIOSITY_RUNTIME_RELEASE_ROOT
  if (!releaseRoot || !isAbsolute(releaseRoot) || resolve(releaseRoot) !== releaseRoot || realpathSync(releaseRoot) !== releaseRoot) throw new Error("template")
  const pluginPath = join(releaseRoot, ${JSON.stringify(M7_PLUGIN_ENTRYPOINT)})
  const pluginStatus = lstatSync(pluginPath)
  if (pluginStatus.isSymbolicLink() || !pluginStatus.isFile() || realpathSync(pluginPath) !== pluginPath) throw new Error("plugin")
  const search = { backend: "runtime", runtime: { stateRoot: externalDirectory(process.env.CURIOSITY_M7_STATE_ROOT), workspaceScope: externalDirectory(process.env.CURIOSITY_M7_WORKSPACE), queryCapabilityFile: externalFile(process.env.CURIOSITY_M7_QUERY_CAPABILITY_FILE) }, controlledPluginIds: [pluginId] }
  if (readdirSync(paths.opencode).length) throw new Error("duplicate")
  const config = JSON.stringify({ plugins: ["-opencode.*", { package: pluginPath, options: { search } }] })
  return { workspace: search.runtime.workspaceScope, state: search.runtime.stateRoot, config }
}
const probeRecords = (owned, nonce) => {
  const text = readOwned(owned); if (!text.endsWith("\\n")) throw new Error("probe")
  const records = text.slice(0, -1).split("\\n").map((line) => JSON.parse(line))
  if (records.some((record) => record.nonce !== nonce || !["setup", "cleanup", "registration"].includes(record.kind))) throw new Error("probe")
  return records
}
const validateSetup = (owned, nonce) => {
  const records = probeRecords(owned, nonce)
  if (records.filter((record) => record.kind === "setup" && record.id === pluginId).length !== 1 || records.some((record) => record.kind === "cleanup")) throw new Error("probe")
}
const validateProbe = (owned, nonce) => {
  const records = probeRecords(owned, nonce)
  if (records.filter((record) => record.kind === "setup" && record.id === pluginId).length !== 1 || records.filter((record) => record.kind === "cleanup" && record.id === pluginId).length !== 1) throw new Error("probe")
  const registrations = records.filter((record) => record.kind === "registration")
  const hooks = registrations.filter((record) => record.registration !== "tool.transform").map((record) => record.registration + ":" + record.id).sort()
  if (JSON.stringify(hooks) !== JSON.stringify(["session.hook:context", "tool.hook:execute.after", "tool.hook:execute.before"])) throw new Error("probe")
  const tools = registrations.flatMap((record) => record.registration === "tool.transform" && Array.isArray(record.tools) ? record.tools : []).sort()
  if (JSON.stringify(tools) !== JSON.stringify(expectedTools)) throw new Error("probe")
}
const proxyRecorder = async () => {
  const records = []; let truncated = false
  const record = (method, authority) => { if (records.length === 64) truncated = true; else records.push({ method, authority: authority.trim().toLowerCase().replace(/\\.$/u, "") }) }
  const server = createServer((request, response) => { record(request.method ?? "UNKNOWN", request.headers.host ?? ""); response.writeHead(502).end() })
  server.on("connect", (request, socket) => { record("CONNECT", request.url ?? ""); socket.destroy() })
  await new Promise((accept, reject) => { server.once("error", reject); server.listen(0, "127.0.0.1", accept) })
  const address = server.address(); if (!address || typeof address === "string") throw new Error("proxy")
  return { records, get truncated() { return truncated }, url: \`http://127.0.0.1:\${address.port}\`, close: () => new Promise((accept, reject) => { server.close((error) => error ? reject(error) : accept()); server.closeAllConnections() }) }
}
const environment = (paths, materialized, probe, proxyURL, password) => ({
  PATH: process.env.PATH, HOME: paths.home, XDG_CONFIG_HOME: paths.config, XDG_DATA_HOME: paths.data, XDG_CACHE_HOME: paths.cache,
  OPENCODE_CONFIG_DIR: paths.opencode, OPENCODE_CONFIG_CONTENT: materialized.config, OPENCODE_CONFIG_PROJECT_DISABLE: "1", OPENCODE_PASSWORD: password,
  OPENCODE_DISABLE_MODELS_FETCH: "1", OPENCODE_DISABLE_FFF: "1", CURIOSITY_RUNTIME_RELEASE_ROOT: process.env.CURIOSITY_RUNTIME_RELEASE_ROOT,
  ...(probe ? { CURIOSITY_M7_SMOKE_NONCE: probe.nonce, CURIOSITY_M7_SMOKE_MARKER: probe.path } : {}),
  ...(proxyURL ? { HTTP_PROXY: proxyURL, HTTPS_PROXY: proxyURL, ALL_PROXY: proxyURL, http_proxy: proxyURL, https_proxy: proxyURL, all_proxy: proxyURL, NO_PROXY: "127.0.0.1,localhost", no_proxy: "127.0.0.1,localhost" } : {}),
})
const mode = process.argv[2]; const host = process.argv[3]
const diagnostic = mode === "launch" ? "M7_LAUNCH_FAILED" : "M7_HOST_SMOKE_FAILED"; const diagnosticFd = Number(process.env.CURIOSITY_M7_DIAGNOSTIC_FD)
let child; let policy; let probe; let proxy; let failed = false; let pendingSignal; let signalExitCode; let shutdown; let childSettled = false; let ownedGroupAfterExit = false
const signalHandlers = new Map(); const signalCodes = { SIGHUP: 129, SIGINT: 130, SIGTERM: 143 }
const beginShutdown = (signal) => {
  pendingSignal ??= signal; signalExitCode ??= signalCodes[signal]; failed = true
  if (!child?.pid) return
  if (shutdown) { if (!childSettled || ownedGroupAfterExit) { try { process.kill(-child.pid, "SIGKILL") } catch {} }; return }
  shutdown = (async () => { try { process.kill(-child.pid, signal) } catch {}; await delay(250); if ((!childSettled || ownedGroupAfterExit) && groupAlive(child.pid)) { try { process.kill(-child.pid, "SIGKILL") } catch {} } })()
}
for (const signal of ["SIGINT", "SIGTERM", "SIGHUP"]) { const handler = () => beginShutdown(signal); signalHandlers.set(signal, handler); process.on(signal, handler) }
try {
  const paths = profile(process.env.CURIOSITY_M7_PROFILE_ROOT); const materialized = materialize(paths)
  if (mode === "launch") {
    probe = ownedFile(paths.cache, "m7-host-probe-", ".jsonl"); probe.nonce = randomBytes(32).toString("hex")
    const password = randomBytes(32).toString("base64url")
    child = spawn(host, ["--standalone", ...process.argv.slice(4)], { cwd: materialized.workspace, detached: true, env: environment(paths, materialized, probe, undefined, password), stdio: "inherit" })
    if (pendingSignal) beginShutdown(pendingSignal)
    await delay(500)
    const activationDeadline = Date.now() + 9_500
    while (true) { try { validateSetup(probe, probe.nonce); break } catch { if (Date.now() >= activationDeadline || child.exitCode !== null) throw new Error("activation"); await delay(50) } }
    const status = child.exitCode !== null || child.signalCode !== null
      ? { code: child.exitCode, signal: child.signalCode }
      : await new Promise((accept, reject) => { child.once("error", reject); child.once("exit", (code, signal) => { childSettled = true; ownedGroupAfterExit = groupAlive(child.pid); accept({ code, signal }) }) })
    childSettled = true; ownedGroupAfterExit = groupAlive(child.pid)
    if (shutdown) await shutdown
    if (status.code !== 0 || status.signal) throw new Error("host")
    validateProbe(probe, probe.nonce)
  } else if (mode === "smoke") {
    const sandbox = "/usr/bin/sandbox-exec"; if (!lstatSync(sandbox).isFile()) throw new Error("sandbox")
    policy = ownedFile(paths.cache, "m7-host-smoke-", ".sb", \`(version 1)\n(allow default)\n(deny network-outbound)\n(allow network-outbound (remote ip "localhost:*"))\n(deny file-write*)\n(allow file-write* (subpath \${JSON.stringify(paths.root)}))\n(allow file-write* (subpath \${JSON.stringify(materialized.workspace)}))\n(allow file-write* (subpath \${JSON.stringify(materialized.state)}))\n\`)
    probe = ownedFile(paths.cache, "m7-host-probe-", ".jsonl"); probe.nonce = randomBytes(32).toString("hex")
    proxy = await proxyRecorder()
    try {
      const password = randomBytes(32).toString("base64url")
      child = spawn(sandbox, ["-p", policy.contents, host, "serve", "--hostname", "127.0.0.1", "--port", "0", "--log-level", "all"], { cwd: materialized.workspace, detached: true, env: environment(paths, materialized, probe, proxy.url, password), stdio: ["ignore", "pipe", "pipe"] })
      if (pendingSignal) beginShutdown(pendingSignal)
      const output = []; let size = 0; let overflow = false
      const capture = (chunk) => { size += chunk.length; if (size > 65_536) overflow = true; else output.push(Buffer.from(chunk)) }
      child.stdout.on("data", capture); child.stderr.on("data", capture)
      const deadline = Date.now() + 30_000
      let confirmed = false
      while (Date.now() < deadline) {
        if (overflow || child.exitCode !== null) throw new Error("host")
        const baseURL = Buffer.concat(output).toString().match(/server listening on (http:\\/\\/127\\.0\\.0\\.1:\\d+)/u)?.[1]
        if (!baseURL) { await delay(25); continue }
        const url = new URL("/api/plugin", baseURL); url.searchParams.set("location[directory]", materialized.workspace)
        try {
          const authorization = "Basic " + Buffer.from("opencode:" + password).toString("base64")
          const response = await fetch(url, { headers: { Authorization: authorization }, signal: AbortSignal.timeout(1_000) })
          const bytes = Buffer.from(await response.arrayBuffer()); if (bytes.length > 65_536) throw new Error("response")
          const payload = JSON.parse(bytes.toString("utf8")); const ids = Array.isArray(payload?.data) ? payload.data.map((entry) => entry?.id) : []
          if (response.ok && ids.length === 1 && ids[0] === pluginId) { validateSetup(probe, probe.nonce); confirmed = true; break }
        } catch {}
        await delay(50)
      }
      if (!confirmed) throw new Error("timeout")
      const reaped = child.exitCode === null ? new Promise((resolve) => child.once("exit", resolve)) : Promise.resolve()
      await terminateGroup(child.pid); await Promise.race([reaped, delay(1_000).then(() => { throw new Error("reap") })]); childSettled = true; ownedGroupAfterExit = false
      validateProbe(probe, probe.nonce)
      const settledProxy = proxy; await settledProxy.close(); proxy = undefined
      if (settledProxy.truncated || settledProxy.records.length !== 0) throw new Error("external")
    } finally { if (child?.pid) await terminateGroup(child.pid) }
  } else throw new Error("mode")
} catch { failed = true } finally {
  if (child?.pid && (!childSettled || ownedGroupAfterExit)) { try { await terminateGroup(child.pid) } catch { failed = true } }
  for (const [signal, handler] of signalHandlers) process.off(signal, handler)
  if (proxy) { try { await proxy.close() } catch { failed = true } }
  for (const owned of [probe, policy]) { if (owned?.fd !== undefined) { try { closeSync(owned.fd) } catch { failed = true } }; try { removeOwned(owned) } catch { failed = true } }
}
if (failed) { try { writeSync(Number.isInteger(diagnosticFd) ? diagnosticFd : 2, diagnostic + "\\n") } catch {}; process.exitCode = signalExitCode ?? 1 }
`
export const writeReleaseScripts = (stage) => {
  mkdirSync(join(stage, "scripts"), { recursive: true, mode: 0o755 })
  mkdirSync(join(stage, "tools"), { recursive: true, mode: 0o755 })
  writeFileSync(join(stage, "tools/m7-host-smoke.mjs"), hostSmokeRunner, { mode: 0o644 })
  const script = (name, body) => writeFileSync(join(stage, "scripts", name), `#!/bin/sh\nset -eu\n${scriptRoot}\n${body}\n`, { mode: 0o755 })
  script("verify", 'exec bun "$CURIOSITY_RUNTIME_RELEASE_ROOT/tools/m7-release.mjs" verify "$CURIOSITY_RUNTIME_RELEASE_ROOT"')
  script("preflight", 'exec bun "$CURIOSITY_RUNTIME_RELEASE_ROOT/tools/m7-release.mjs" verify "$CURIOSITY_RUNTIME_RELEASE_ROOT"')
  script("install", 'exec bun "$CURIOSITY_RUNTIME_RELEASE_ROOT/tools/m7-release.mjs" install "$CURIOSITY_RUNTIME_RELEASE_ROOT" "${1:?prefix}"')
  script("upgrade", 'exec bun "$CURIOSITY_RUNTIME_RELEASE_ROOT/tools/m7-release.mjs" install "$CURIOSITY_RUNTIME_RELEASE_ROOT" "${1:?prefix}"')
  script("rollback", 'exec bun "$CURIOSITY_RUNTIME_RELEASE_ROOT/tools/m7-release.mjs" rollback "${1:?prefix}" "${2:?release-id}"')
  script("uninstall", 'exec bun "$CURIOSITY_RUNTIME_RELEASE_ROOT/tools/m7-release.mjs" uninstall "${1:?prefix}"')
  const runtimeExecutable = `'${process.execPath.replaceAll("'", `'\\''`)}'`
  const fixedPath = `$CURIOSITY_RUNTIME_RELEASE_ROOT/bin:/usr/bin:/bin`
  const isolatedRunner = (mode) => `/usr/bin/env -i PATH="${fixedPath}" CURIOSITY_M7_PROFILE_ROOT="$CURIOSITY_M7_PROFILE_ROOT" CURIOSITY_M7_STATE_ROOT="$CURIOSITY_M7_STATE_ROOT" CURIOSITY_M7_WORKSPACE="$CURIOSITY_M7_WORKSPACE" CURIOSITY_M7_QUERY_CAPABILITY_FILE="$CURIOSITY_M7_QUERY_CAPABILITY_FILE" CURIOSITY_RUNTIME_RELEASE_ROOT="$CURIOSITY_RUNTIME_RELEASE_ROOT" CURIOSITY_M7_DIAGNOSTIC_FD=3 ${runtimeExecutable} "$CURIOSITY_RUNTIME_RELEASE_ROOT/tools/m7-host-smoke.mjs" ${mode} "$CURIOSITY_RUNTIME_RELEASE_ROOT/bin/opencode2" "$@"`
  const redacted = (mode, code) => `CURIOSITY_RUNTIME_RELEASE_ROOT="$(CDPATH= cd -- "$(/usr/bin/dirname -- "$0")/.." 2>/dev/null && pwd -P)" || { printf '%s\\n' '${code}' >&2; exit 1; }\nif [ -z "\${CURIOSITY_M7_PROFILE_ROOT:-}" ] || [ -z "\${CURIOSITY_M7_STATE_ROOT:-}" ] || [ -z "\${CURIOSITY_M7_WORKSPACE:-}" ] || [ -z "\${CURIOSITY_M7_QUERY_CAPABILITY_FILE:-}" ] || [ ! -f "$CURIOSITY_RUNTIME_RELEASE_ROOT/tools/m7-host-smoke.mjs" ]; then\n  printf '%s\\n' '${code}' >&2\n  exit 1\nfi\nexport CURIOSITY_RUNTIME_RELEASE_ROOT CURIOSITY_M7_PROFILE_ROOT CURIOSITY_M7_STATE_ROOT CURIOSITY_M7_WORKSPACE CURIOSITY_M7_QUERY_CAPABILITY_FILE\nexec 3>&2\nexec ${isolatedRunner(mode)} 2>/dev/null`
  writeFileSync(join(stage, "scripts/launch"), `#!/bin/sh\n${redacted("launch", "M7_LAUNCH_FAILED")}\n`, { mode: 0o755 })
  writeFileSync(join(stage, "scripts/smoke"), `#!/bin/sh\n${redacted("smoke", "M7_HOST_SMOKE_FAILED")}\n`, { mode: 0o755 })
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
