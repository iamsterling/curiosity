#!/usr/bin/env node
import { copyFile, lstat, mkdir, readdir, readFile, realpath, rm, writeFile } from "node:fs/promises"
import { homedir } from "node:os"
import { dirname, isAbsolute, join, relative, resolve, sep } from "node:path"
import { fileURLToPath } from "node:url"

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const configInput = resolve(process.env.OPENCODE_CONFIG_DIR || join(homedir(), ".config", "opencode"))
const packageName = "@iamsterling/opencode2-config"
const packageVersion = JSON.parse(await readFile(join(root, "package.json"), "utf8")).version
const packageSpec = `${packageName}@${packageVersion}`
const installerArgs = process.argv.slice(2)
const busyDiagnostic = "OPENCODE2_CONFIG_INSTALL_BUSY: retry the installation"
const unsafeDestinationDiagnostic = "OPENCODE2_CONFIG_DESTINATION_UNSAFE"
let admittedConfigRoot
const files = async (directory, base = directory) => (await Promise.all((await readdir(directory, { withFileTypes: true })).map(async (entry) => entry.isDirectory() ? files(join(directory, entry.name), base) : [join(directory, entry.name).slice(base.length + 1).replaceAll("\\", "/")]))).flat()

const unsafeDestination = () => {
  const error = new Error(unsafeDestinationDiagnostic)
  error.code = unsafeDestinationDiagnostic
  throw error
}
const identity = (details) => `${details.dev}:${details.ino}:${details.mode}`
const within = (base, target) => {
  const difference = relative(base, target)
  return difference === "" || (!difference.startsWith(`..${sep}`) && difference !== ".." && !isAbsolute(difference))
}
const initializeConfigRoot = async () => {
  await mkdir(configInput, { recursive: true }).catch((error) => {
    if (error?.code !== "EEXIST") throw error
  })
  const details = await lstat(configInput).catch(() => unsafeDestination())
  if (!details.isDirectory() || details.isSymbolicLink()) unsafeDestination()
  const canonical = await realpath(configInput).catch(() => unsafeDestination())
  admittedConfigRoot = { canonical, identity: identity(details) }
  return configInput
}
const assertSafeDestination = async (target, options = {}) => {
  if (!admittedConfigRoot) unsafeDestination()
  const currentRoot = await realpath(configInput).catch(() => unsafeDestination())
  const rootDetails = await lstat(configInput).catch(() => unsafeDestination())
  if (currentRoot !== admittedConfigRoot.canonical || identity(rootDetails) !== admittedConfigRoot.identity) unsafeDestination()
  const lexicalTarget = resolve(target)
  const lexicalRoot = resolve(configInput)
  if (!within(lexicalRoot, lexicalTarget)) unsafeDestination()
  const difference = relative(lexicalRoot, lexicalTarget)
  let current = admittedConfigRoot.canonical
  const parts = difference ? difference.split(sep) : []
  for (let index = 0; index < parts.length; index++) {
    current = join(current, parts[index])
    let details
    try { details = await lstat(current) } catch (error) {
      if (error?.code === "ENOENT") return
      unsafeDestination()
    }
    if (details.isSymbolicLink()) unsafeDestination()
    const final = index === parts.length - 1
    if (!final && !details.isDirectory()) unsafeDestination()
    if (final && options.directory && !details.isDirectory()) unsafeDestination()
    if (final && options.file && !details.isFile()) unsafeDestination()
    const canonical = await realpath(current).catch(() => unsafeDestination())
    if (!within(admittedConfigRoot.canonical, canonical)) unsafeDestination()
  }
}
const confinedJoin = (base, ...parts) => {
  const destination = resolve(base, ...parts)
  if (!within(resolve(base), destination)) unsafeDestination()
  return destination
}

if (installerArgs.includes("--help") || installerArgs.includes("-h")) {
  console.log(`OpenCode2 Config installer

Usage:
  opencode2-config
  npx -y @iamsterling/opencode2-config@latest

Installs the plugin commands and local command agent into OPENCODE_CONFIG_DIR
or the default ~/.config/opencode directory for OpenCode 2 (opencode2).`)
  process.exit(0)
}

if (installerArgs.includes("--version") || installerArgs.includes("-v")) {
  console.log(packageVersion)
  process.exit(0)
}

function stripJsonComments(input) {
  let output = ""
  let quote = ""
  let escaped = false
  let lineComment = false
  let blockComment = false
  for (let index = 0; index < input.length; index++) {
    const char = input[index]
    const next = input[index + 1]
    if (lineComment) {
      if (char === "\n" || char === "\r") { lineComment = false; output += char }
      continue
    }
    if (blockComment) {
      if (char === "*" && next === "/") { blockComment = false; index++ }
      else if (char === "\n" || char === "\r") output += char
      continue
    }
    if (quote) {
      output += char
      if (escaped) escaped = false
      else if (char === "\\") escaped = true
      else if (char === quote) quote = ""
      continue
    }
    if (char === '"') { quote = char; output += char; continue }
    if (char === "/" && next === "/") { lineComment = true; index++; continue }
    if (char === "/" && next === "*") { blockComment = true; index++; continue }
    output += char
  }
  return output
}

function stripTrailingCommas(input) {
  let output = ""
  let quote = ""
  let escaped = false
  for (let index = 0; index < input.length; index++) {
    const char = input[index]
    if (quote) {
      output += char
      if (escaped) escaped = false
      else if (char === "\\") escaped = true
      else if (char === quote) quote = ""
      continue
    }
    if (char === '"') { quote = char; output += char; continue }
    if (char === ",") {
      let lookahead = index + 1
      while (/\s/.test(input[lookahead] || "")) lookahead++
      if (input[lookahead] === "]" || input[lookahead] === "}") continue
    }
    output += char
  }
  return output
}

function parseJsonc(input) {
  return JSON.parse(stripTrailingCommas(stripJsonComments(input)))
}

function isPackageSpec(value) {
  const spec = String(value || "").trim()
  return spec === packageName || spec.startsWith(`${packageName}@`)
}

async function configurePackagePlugin(config) {
  let configured = false
  const updatedFiles = []
  for (const name of ["opencode.json", "opencode.jsonc", "config.json", "config.jsonc"]) {
    try {
      const target = join(config, name)
      await assertSafeDestination(target, { file: true })
      const source = await readFile(target, "utf8")
      const parsed = parseJsonc(source)
      // OpenCode 2 renames plugin to plugins; V1 config still loads in V2, so
      // pin the package spec in whichever array (or both) actually exists.
      const specs = [...new Set([
        ...(Array.isArray(parsed?.plugin) ? parsed.plugin.filter(isPackageSpec) : []),
        ...(Array.isArray(parsed?.plugins) ? parsed.plugins.filter(isPackageSpec) : []),
      ])]
      if (!specs.length) continue
      configured = true

      // OpenCode caches package plugins by the literal config spec. A bare
      // package name or @latest can therefore keep loading an older cached
      // release after npm installs a newer one. Pin the config entry to the
      // installer package's exact version while preserving JSONC comments.
      let updated = source
      for (const spec of new Set(specs)) {
        if (spec === packageSpec) continue
        updated = updated.replaceAll(JSON.stringify(spec), JSON.stringify(packageSpec))
      }
      if (updated !== source) {
        await assertSafeDestination(target, { file: true })
        await writeFile(target, updated, "utf8")
        updatedFiles.push(target)
      }
    } catch (error) {
      if (error?.code === unsafeDestinationDiagnostic || error?.message === unsafeDestinationDiagnostic) throw error
      if (error?.code !== "ENOENT") console.warn(`Could not inspect ${join(config, name)} for duplicate plugin entries: ${error.message}`)
    }
  }
  return { configured, updatedFiles }
}

async function ensureDependency(config) {
  const packagePath = join(config, "package.json")
  let pkg = {}
  try {
    await assertSafeDestination(packagePath, { file: true })
    pkg = JSON.parse(await readFile(packagePath, "utf8"))
  } catch (error) {
    if (error?.code === unsafeDestinationDiagnostic || error?.message === unsafeDestinationDiagnostic) throw error
    if (error?.code !== "ENOENT") {
      console.warn(`Could not update ${packagePath}: ${error.message}`)
      console.warn('Add "@opencode-ai/plugin": "next" to that package.json if OpenCode 2 cannot load the local plugin.')
      return
    }
  }
  if (!pkg || typeof pkg !== "object" || Array.isArray(pkg)) pkg = {}
  pkg.dependencies = pkg.dependencies && typeof pkg.dependencies === "object" && !Array.isArray(pkg.dependencies) ? pkg.dependencies : {}
  if (!pkg.dependencies["@opencode-ai/plugin"]) {
    // The V2 plugin API is beta; match the @next channel used by opencode2.
    pkg.dependencies["@opencode-ai/plugin"] = "0.0.0-beta-17595"
    await assertSafeDestination(packagePath, { file: true })
    await writeFile(packagePath, JSON.stringify(pkg, null, 2) + "\n", "utf8")
  }
}

async function acquireInstallLock() {
  const config = await initializeConfigRoot()
  const installLock = join(config, ".opencode2-config.install.lock")
  await assertSafeDestination(installLock)
  try {
    await mkdir(installLock)
  } catch (error) {
    if (error?.code === "EEXIST") {
      await assertSafeDestination(installLock, { directory: true })
      return undefined
    }
    throw error
  }
  try {
    await assertSafeDestination(installLock, { directory: true })
    await writeFile(join(installLock, "owner.json"), `${JSON.stringify({ pid: process.pid })}\n`, "utf8")
  } catch (error) {
    await rm(installLock, { recursive: true, force: true })
    throw error
  }
  return { config, release: async () => rm(installLock, { recursive: true, force: true }) }
}

const assetDestination = ({ agentDir, bundleDir, commandDir, skillDir }, asset) => {
  if (asset.installDestination === "commands") return confinedJoin(commandDir, `${asset.id}.md`)
  if (asset.installDestination === "agents") return confinedJoin(agentDir, `${asset.id}.md`)
  if (asset.installDestination === "skills") {
    const [, , skill, ...resource] = String(asset.sourcePath).split("/")
    if (!skill || resource.length === 0) unsafeDestination()
    return confinedJoin(skillDir, skill, ...resource)
  }
  if (asset.installDestination === "config") {
    if (!String(asset.sourcePath).startsWith("assets/config/")) unsafeDestination()
    return confinedJoin(bundleDir, "config", String(asset.sourcePath).slice("assets/config/".length))
  }
  unsafeDestination()
}

async function install(config) {
  const pluginDir = join(config, "plugins")
  const commandDir = join(config, "commands")
  const agentDir = join(config, "agents")
  const skillDir = join(config, "skills")
  const bundleDir = join(config, "opencode2-config-bundle")
  const paths = { agentDir, bundleDir, commandDir, pluginDir, skillDir }
  const managedDirectories = Object.values(paths)
  const pluginTargets = [
    join(pluginDir, "opencode2-config"),
    join(pluginDir, ".opencode2-config.previous"),
    join(pluginDir, `.${"opencode2-config"}.stage-${process.pid}`),
    join(pluginDir, `opencode2-config.rollback-${process.pid}`),
  ]
  const pluginFiles = [
    join(pluginDir, "opencode2-config.ts"),
    join(pluginDir, "opencode2-config.js"),
    join(pluginDir, "opencode2-config.receipt.json"),
  ]
  await Promise.all(managedDirectories.map((target) => assertSafeDestination(target, { directory: true })))
  await Promise.all(pluginTargets.map((target) => assertSafeDestination(target, { directory: true })))
  await Promise.all(pluginFiles.map((target) => assertSafeDestination(target, { file: true })))

  if (installerArgs.includes("--rollback")) {
    const { rollbackStagedRelease } = await import(join(root, "dist", "platform", "install", "index.js"))
    await rollbackStagedRelease(config)
    console.log(`Rolled back OpenCode2 Config in ${config}; Ledger state was not modified.`)
    return
  }

  const assetManifest = JSON.parse(await readFile(join(root, "assets", "manifest.json"), "utf8"))
  const assets = assetManifest.assets.map((asset) => ({ asset, destination: assetDestination(paths, asset), source: resolve(root, asset.sourcePath) }))
  await Promise.all(assets.map(({ destination }) => assertSafeDestination(destination, { file: true })))
  for (const directory of managedDirectories.filter((target) => target !== bundleDir)) {
    await assertSafeDestination(directory, { directory: true })
    await mkdir(directory, { recursive: true })
    await assertSafeDestination(directory, { directory: true })
  }
  await assertSafeDestination(bundleDir, { directory: true })
  await rm(bundleDir, { recursive: true, force: true })
  await mkdir(bundleDir, { recursive: true })
  await assertSafeDestination(bundleDir, { directory: true })
  const packageConfig = await configurePackagePlugin(config)
  const useConfiguredPackage = packageConfig.configured
  if (useConfiguredPackage) {
    await Promise.all(pluginFiles.map((target) => assertSafeDestination(target, { file: true })))
    await rm(join(pluginDir, "opencode2-config.ts"), { force: true })
    await rm(join(pluginDir, "opencode2-config.js"), { force: true })
  } else {
    await ensureDependency(config)
    await assertSafeDestination(join(pluginDir, "opencode2-config.ts"), { file: true })
    await rm(join(pluginDir, "opencode2-config.ts"), { force: true })
    const { createReleaseManifest } = await import(join(root, "dist", "platform", "release", "index.js"))
    const { installStagedRelease } = await import(join(root, "dist", "platform", "install", "index.js"))
    const compiled = join(root, "dist")
    const manifest = await createReleaseManifest({ source: compiled, files: (await files(compiled)).filter((file) => file.endsWith(".js")), entry: "index.js" })
    await Promise.all([pluginDir, ...pluginTargets, ...pluginFiles].map((target) => assertSafeDestination(target)))
    await installStagedRelease({ configRoot: config, source: compiled, manifest })
  }
  for (const { destination, source } of assets) {
    await assertSafeDestination(dirname(destination), { directory: true })
    await mkdir(dirname(destination), { recursive: true })
    await assertSafeDestination(dirname(destination), { directory: true })
    await assertSafeDestination(destination, { file: true })
    await copyFile(source, destination)
  }
  if (useConfiguredPackage) {
    const pinResult = packageConfig.updatedFiles.length ? `pinned the config entry to ${packageSpec}` : `the config entry is already pinned to ${packageSpec}`
    console.log(`OpenCode2 Config is already configured as a package in ${config}; ${pinResult} and removed the duplicate local plugin copy.`)
  } else console.log(`Installed OpenCode2 Config plugin to ${config}`)
  console.log(`Installed ${packageName} assets from assets/manifest.json`)
}

let lock
try {
  lock = await acquireInstallLock()
  if (!lock) {
    console.error(busyDiagnostic)
    process.exitCode = 75
  } else {
    try {
      await install(lock.config)
    } finally {
      await lock.release()
    }
  }
} catch (error) {
  if (error?.code === unsafeDestinationDiagnostic || error?.message === unsafeDestinationDiagnostic) {
    console.error(unsafeDestinationDiagnostic)
    process.exitCode = 1
  } else throw error
}
