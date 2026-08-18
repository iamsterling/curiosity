#!/usr/bin/env node
import { execFileSync, spawnSync } from "node:child_process"
import { copyFileSync, cpSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, realpathSync, rmSync, writeFileSync } from "node:fs"
import { dirname, isAbsolute, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import {
  M7_PLUGIN_BUILD_ARGUMENTS, M7_PLUGIN_ENTRYPOINT, M7_PROFILE, M7_RIPGREP, assertCleanReleaseInput, assertM7NativeHasValidUuid, assertM7NativeLinks, assertM7RipgrepLinks, createReleaseArchive, darwinLinkedLibraries, extractReleaseArchive, installRelease, listReleaseArchive,
  m7NativeCargoEnvironment,
  rollbackRelease, uninstallRelease, validateArtifactTree, validateReleaseInventory,
  m7DependencyInput, m7PluginAdapterSource, stageM7BuildDependencies, verifyM7RipgrepInput, writeArtifactMetadata, writeReleaseScripts,
} from "./m7-release-lib.mjs"

const runtime = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const root = resolve(runtime, "../..")
const run = (program, args, options = {}) => {
  const result = spawnSync(program, args, { cwd: options.cwd ?? root, encoding: "utf8", stdio: options.capture ? "pipe" : "inherit", env: { ...process.env, ...options.env } })
  if (result.status !== 0) throw new Error(options.code ?? `M7_COMMAND_FAILED:${program}`)
  return `${result.stdout ?? ""}`.trim()
}
const git = (...args) => execFileSync("git", args, { cwd: root, encoding: "utf8" }).trim()
const releaseIdentity = () => assertCleanReleaseInput({ head: git("rev-parse", "HEAD"), dirty: git("status", "--porcelain=v1", "--untracked-files=all"), tracked: git("cat-file", "-e", "HEAD^{commit}") === "" })
const dependencyRoot = () => {
  const configured = process.env.CURIOSITY_M7_DEPENDENCY_ROOT
  if (configured && !isAbsolute(configured)) throw new Error("M7_BUILD_DEPENDENCIES_UNAVAILABLE")
  return configured ?? join(root, "node_modules")
}
const requiredDependencyFile = (dependencies, path) => m7DependencyInput(dependencies, path)
const findHost = (dependencies) => requiredDependencyFile(dependencies, join(dependencies, ".bun/@opencode-ai+cli-darwin-arm64@0.0.0-beta-17595/node_modules/@opencode-ai/cli-darwin-arm64/bin/opencode2"))

const assertToolPins = () => {
  const actual = {
    macOS: run("sw_vers", ["-productVersion"], { capture: true }), bun: run("bun", ["--version"], { capture: true }),
    rustc: run("rustc", ["--version"], { capture: true }).split(/\s+/u)[1], cargo: run("cargo", ["--version"], { capture: true }).split(/\s+/u)[1],
  }
  for (const key of Object.keys(actual)) if (actual[key] !== M7_PROFILE[key]) throw new Error("M7_TOOL_PIN_MISMATCH")
  return actual
}

const packageFiles = (stage, prefix) => {
  const files = []; const walk = (directory) => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name); if (entry.isDirectory()) walk(path); else files.push(path.slice(stage.length + 1).replaceAll("\\", "/"))
    }
  }
  walk(join(stage, prefix)); return files.sort()
}
const component = (name, version, files, licenseFile, properties = {}) => ({ type: "library", name, version, license: "MIT", licenseFile, files, ...properties })
const writeInventory = (stage, releaseId, bundledPackages, dependencies) => {
  const licenses = join(stage, "licenses"); mkdirSync(licenses)
  copyFileSync(join(runtime, "LICENSE"), join(licenses, "MIT-Curiosity.txt"))
  copyFileSync(requiredDependencyFile(dependencies, join(dependencies, ".bun/effect@4.0.0-beta.107/node_modules/effect/LICENSE")), join(licenses, "MIT-Effect.txt"))
  copyFileSync(requiredDependencyFile(dependencies, join(dependencies, ".bun/fast-check@4.9.0/node_modules/fast-check/LICENSE")), join(licenses, "MIT-fast-check.txt"))
  copyFileSync(requiredDependencyFile(dependencies, join(dependencies, ".bun/pure-rand@8.4.2/node_modules/pure-rand/LICENSE")), join(licenses, "MIT-pure-rand.txt"))
  copyFileSync(join(root, "apps/plugin/opencode2/LICENSE"), join(licenses, "MIT-Plugin.txt"))
  copyFileSync(join(runtime, "licenses/opencode-MIT.txt"), join(licenses, "MIT-OpenCode.txt"))
  copyFileSync(join(runtime, "licenses/ripgrep-COPYING.txt"), join(licenses, "ripgrep-COPYING.txt"))
  copyFileSync(join(runtime, "licenses/ripgrep-MIT.txt"), join(licenses, "ripgrep-MIT.txt"))
  copyFileSync(join(runtime, "licenses/ripgrep-UNLICENSE.txt"), join(licenses, "ripgrep-UNLICENSE.txt"))
  const pluginFile = [M7_PLUGIN_ENTRYPOINT]
  const components = [
    component("curiosity-m7-release", releaseId, [...packageFiles(stage, "scripts"), ...packageFiles(stage, "tools"), "RELEASE.json", "provenance.json", "SBOM.json", "DEPENDENCIES-LICENSES.md", "manifest.json", "SHA256SUMS"], "licenses/MIT-Curiosity.txt", { type: "application" }),
    component("curiosity-runtime-native", "0.0.0", ["native/libcuriosity_runtime_native.dylib"], "licenses/MIT-Curiosity.txt"),
    component("@curiosity/runtime", "0.0.0", packageFiles(stage, "runtime"), "licenses/MIT-Curiosity.txt"),
    component("@iamsterling/opencode2-config", "0.1.0", pluginFile.concat(packageFiles(stage, "plugin/assets")), "licenses/MIT-Plugin.txt"),
    component("opencode2", M7_PROFILE.opencode, ["bin/opencode2"], "licenses/MIT-OpenCode.txt", { type: "application" }),
    component("ripgrep", M7_RIPGREP.version, ["bin/rg"], "licenses/ripgrep-MIT.txt", { type: "application", license: "MIT OR Unlicense", platform: M7_PROFILE.platform, architecture: M7_RIPGREP.architecture, sha256: M7_RIPGREP.sha256, notices: ["licenses/ripgrep-COPYING.txt", "licenses/ripgrep-MIT.txt", "licenses/ripgrep-UNLICENSE.txt"] }),
    component("@opencode-ai/plugin", M7_PROFILE.opencode, pluginFile, "licenses/MIT-OpenCode.txt", { bundled: true }),
    component("@opencode-ai/protocol", M7_PROFILE.opencode, pluginFile, "licenses/MIT-OpenCode.txt", { bundled: true }),
    component("@opencode-ai/schema", M7_PROFILE.opencode, pluginFile, "licenses/MIT-OpenCode.txt", { bundled: true }),
    component("effect", M7_PROFILE.effect, pluginFile, "licenses/MIT-Effect.txt", { bundled: true }),
    component("fast-check", "4.9.0", pluginFile, "licenses/MIT-fast-check.txt", { bundled: true }),
    component("pure-rand", "8.4.2", pluginFile, "licenses/MIT-pure-rand.txt", { bundled: true }),
  ]
  const inventoried = components.filter((entry) => entry.bundled).map((entry) => entry.name).sort()
  if (JSON.stringify(inventoried) !== JSON.stringify([...bundledPackages].sort())) throw new Error("M7_SBOM_COVERAGE_INVALID")
  writeFileSync(join(stage, "SBOM.json"), JSON.stringify({ bomFormat: "CycloneDX", specVersion: "1.6", version: 1, components }, null, 2) + "\n")
  writeFileSync(join(stage, "DEPENDENCIES-LICENSES.md"), "# M7 dependency and license inventory\n\nEvery shipped and bundled package is listed with exact version, payload files, and license file in `SBOM.json`. Project, OpenCode, and package components are MIT licensed. Ripgrep 15.1.0 is dual-licensed under MIT and the Unlicense; its COPYING, MIT, and Unlicense texts are included. The precompiled OpenCode package, exact ripgrep binary, and bundled plugin graph are private same-operator inputs; no public supply-chain claim is made.\n")
}

const bundledPackageNames = (metafile) => new Set(Object.keys(JSON.parse(readFileSync(metafile, "utf8")).inputs).flatMap((path) => {
  const match = path.match(/node_modules\/(?:\.bun\/[^/]+\/node_modules\/)?((?:@[^/]+\/)?[^/]+)/u); return match ? [match[1]] : []
}))

const build = (output) => {
  if (process.platform !== M7_PROFILE.platform || process.arch !== M7_PROFILE.architecture) throw new Error("M7_PLATFORM_PIN_MISMATCH")
  const tools = assertToolPins(); const releaseId = releaseIdentity(); const parent = resolve(output); mkdirSync(parent, { recursive: true })
  const dependencies = stageM7BuildDependencies({ sourceRoot: root, dependencyRoot: dependencyRoot() })
  console.log(`M7 build dependencies verified locally at ${dependencies.source}; network disabled`)
  const stage = mkdtempSync(join(parent, ".m7-stage-"))
  try {
    run("cargo", ["build", "--manifest-path", "apps/runtime/native/Cargo.toml", "--release", "--locked", "--no-default-features"], { env: m7NativeCargoEnvironment(process.env) })
    run("bun", ["run", "build"], { code: "M7_PLUGIN_BUILD_FAILED", cwd: join(root, "apps/plugin/opencode2") })
    mkdirSync(join(stage, "native")); const stagedDylib = join(stage, "native/libcuriosity_runtime_native.dylib")
    copyFileSync(join(runtime, "native/target/release/libcuriosity_runtime_native.dylib"), stagedDylib); assertM7NativeLinks(darwinLinkedLibraries(stagedDylib)); assertM7NativeHasValidUuid(stagedDylib)
    mkdirSync(join(stage, "runtime")); run("bun", ["build", "apps/runtime/src/query.ts", "--target=bun", "--outfile", join(stage, "runtime/query.js")]); copyFileSync(join(runtime, "src/query.d.ts"), join(stage, "runtime/query.d.ts"))
    mkdirSync(join(stage, "plugin")); const metafile = join(stage, ".plugin-metafile.json"); const releaseEntry = join(stage, ".plugin-entry.mjs")
    writeFileSync(releaseEntry, m7PluginAdapterSource({ delegate: join(root, "apps/plugin/opencode2/dist/index.js"), effect: join(root, "apps/plugin/opencode2/node_modules/effect/dist/index.js") }))
    run("bun", ["build", releaseEntry, ...M7_PLUGIN_BUILD_ARGUMENTS, "--outfile", join(stage, M7_PLUGIN_ENTRYPOINT), `--metafile=${metafile}`]); rmSync(releaseEntry); cpSync(join(root, "apps/plugin/opencode2/assets"), join(stage, "plugin/assets"), { recursive: true })
    const bundled = bundledPackageNames(metafile); rmSync(metafile)
    mkdirSync(join(stage, "bin")); copyFileSync(findHost(dependencies.source), join(stage, "bin/opencode2")); import.meta.require("node:fs").chmodSync(join(stage, "bin/opencode2"), 0o755)
    verifyM7RipgrepInput(M7_RIPGREP.source, join(stage, "bin/rg"))
    mkdirSync(join(stage, "tools")); copyFileSync(fileURLToPath(import.meta.url), join(stage, "tools/m7-release.mjs")); copyFileSync(join(runtime, "tools/m7-release-lib.mjs"), join(stage, "tools/m7-release-lib.mjs"))
    writeReleaseScripts(stage)
    writeFileSync(join(stage, "RELEASE.json"), JSON.stringify({ releaseId, commit: releaseId.slice(3), profile: { ...M7_PROFILE, ...tools }, private: true, published: false, signed: false, notarized: false, m5Live: false, m6Crawl: false }, null, 2) + "\n")
    writeFileSync(join(stage, "provenance.json"), JSON.stringify({ subject: releaseId, digestAlgorithm: "SHA-256", operatorModel: "private same-operator", publisherIdentity: null, signature: null, notarization: null, inputs: [{ name: "ripgrep", version: M7_RIPGREP.version, source: M7_RIPGREP.source, sha256: M7_RIPGREP.sha256, platform: M7_PROFILE.platform, architecture: M7_RIPGREP.architecture }] }, null, 2) + "\n")
    writeInventory(stage, releaseId, bundled, dependencies.source); writeArtifactMetadata(stage); validateArtifactTree(stage); validateReleaseInventory(stage)
    const destination = join(parent, `${releaseId}.tar.gz`); createReleaseArchive(stage, destination, releaseId); console.log(destination)
  } catch (error) { throw error } finally { rmSync(stage, { recursive: true, force: true }) }
}

const verify = (artifact) => {
  if (process.platform !== M7_PROFILE.platform || process.arch !== M7_PROFILE.architecture) throw new Error("M7_PLATFORM_PIN_MISMATCH")
  assertToolPins(); const rootPath = realpathSync(resolve(artifact)); validateArtifactTree(rootPath); validateReleaseInventory(rootPath)
  const release = JSON.parse(readFileSync(join(rootPath, "RELEASE.json"), "utf8")); if (JSON.stringify(release.profile) !== JSON.stringify(M7_PROFILE) || release.m5Live || release.m6Crawl) throw new Error("M7_PROFILE_INVALID")
  if (!run("file", [join(rootPath, "bin/opencode2")], { capture: true }).includes("Mach-O 64-bit executable arm64")) throw new Error("M7_HOST_ARCH_INVALID")
  if (run(join(rootPath, "bin/opencode2"), ["--version"], { capture: true }) !== `opencode2 v${M7_PROFILE.opencode}`) throw new Error("M7_HOST_PIN_INVALID")
  const rg = join(rootPath, "bin/rg"); if (!run("file", [rg], { capture: true }).includes(`Mach-O 64-bit executable ${M7_RIPGREP.architecture}`)) throw new Error("M7_RIPGREP_INPUT_MISMATCH")
  if (run(rg, ["--version"], { capture: true }).split("\n", 1)[0] !== `ripgrep ${M7_RIPGREP.version} (rev af60c2de9d)`) throw new Error("M7_RIPGREP_INPUT_MISMATCH")
  if (import.meta.require("node:crypto").createHash("sha256").update(readFileSync(rg)).digest("hex") !== M7_RIPGREP.sha256) throw new Error("M7_RIPGREP_INPUT_MISMATCH")
  assertM7RipgrepLinks(darwinLinkedLibraries(rg))
  const dylib = join(rootPath, "native/libcuriosity_runtime_native.dylib"); if (!run("file", [dylib], { capture: true }).includes("Mach-O 64-bit dynamically linked shared library arm64")) throw new Error("M7_NATIVE_ARCH_INVALID")
  const symbols = run("nm", ["-gU", dylib], { capture: true }); for (const symbol of ["curiosity_runtime_v0_web_search", "curiosity_runtime_v1_corpus_query"]) if (!symbols.includes(symbol)) throw new Error("M7_NATIVE_SYMBOL_INVALID")
  for (const forbidden of ["corpus_admin", "owned_crawl", "crawl_job"]) if (symbols.includes(forbidden)) throw new Error("M7_QUERY_ONLY_SYMBOL_INVALID")
  assertM7NativeLinks(darwinLinkedLibraries(dylib)); assertM7NativeHasValidUuid(dylib)
  console.log("M7 private artifact verified; no publication, signature, notarization, M5-live, or M6-crawl claim")
}

const [command, ...args] = process.argv.slice(2)
if (command === "build") build(args[0] ?? join(root, "apps/runtime/.m7-artifacts"))
else if (command === "verify" || command === "preflight") verify(args[0] ?? process.cwd())
else if (command === "install" || command === "upgrade") { const artifact = realpathSync(resolve(args[0])); verify(artifact); installRelease(artifact, resolve(args[1])) }
else if (command === "rollback") rollbackRelease(resolve(args[0]), args[1])
else if (command === "uninstall") uninstallRelease(resolve(args[0]))
else if (command === "extract") extractReleaseArchive(resolve(args[0]), resolve(args[1]))
else if (command === "list") console.log(listReleaseArchive(resolve(args[0])).join("\n"))
else throw new Error("usage: m7-release.mjs build [output] | verify ARTIFACT | install ARTIFACT PREFIX | rollback PREFIX RELEASE | uninstall PREFIX | list ARCHIVE | extract ARCHIVE DESTINATION")
