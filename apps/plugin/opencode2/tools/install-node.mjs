#!/usr/bin/env node
import { copyFile, mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises"
import { homedir } from "node:os"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const config = process.env.OPENCODE_CONFIG_DIR || join(homedir(), ".config", "opencode")
const pluginDir = join(config, "plugins")
const commandDir = join(config, "commands")
const agentDir = join(config, "agents")
const skillDir = join(config, "skills")
const bundleDir = join(config, "opencode2-config-bundle")
const packagePath = join(config, "package.json")
const packageName = "@iamsterling/opencode2-config"
const packageVersion = JSON.parse(await readFile(join(root, "package.json"), "utf8")).version
const packageSpec = `${packageName}@${packageVersion}`
const installerArgs = process.argv.slice(2)
const files = async (directory, base = directory) => (await Promise.all((await readdir(directory, { withFileTypes: true })).map(async (entry) => entry.isDirectory() ? files(join(directory, entry.name), base) : [join(directory, entry.name).slice(base.length + 1).replaceAll("\\", "/")]))).flat()

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

if (installerArgs.includes("--rollback")) {
  const { rollbackStagedRelease } = await import(join(root, "dist", "platform", "install", "index.js"))
  await rollbackStagedRelease(config)
  console.log(`Rolled back OpenCode2 Config in ${config}; Ledger state was not modified.`)
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

async function configurePackagePlugin() {
  let configured = false
  const updatedFiles = []
  for (const name of ["opencode.json", "opencode.jsonc", "config.json", "config.jsonc"]) {
    try {
      const target = join(config, name)
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
        await writeFile(target, updated, "utf8")
        updatedFiles.push(target)
      }
    } catch (error) {
      if (error?.code !== "ENOENT") console.warn(`Could not inspect ${join(config, name)} for duplicate plugin entries: ${error.message}`)
    }
  }
  return { configured, updatedFiles }
}

async function ensureDependency() {
  let pkg = {}
  try {
    pkg = JSON.parse(await readFile(packagePath, "utf8"))
  } catch (error) {
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
    await writeFile(packagePath, JSON.stringify(pkg, null, 2) + "\n", "utf8")
  }
}

const assetManifest = JSON.parse(await readFile(join(root, "assets", "manifest.json"), "utf8"))
await mkdir(pluginDir, { recursive: true })
await mkdir(commandDir, { recursive: true })
await mkdir(agentDir, { recursive: true })
await mkdir(skillDir, { recursive: true })
await rm(bundleDir, { recursive: true, force: true })
await mkdir(bundleDir, { recursive: true })
const packageConfig = await configurePackagePlugin()
const useConfiguredPackage = packageConfig.configured
if (useConfiguredPackage) {
  await rm(join(pluginDir, "opencode2-config.ts"), { force: true })
  await rm(join(pluginDir, "opencode2-config.js"), { force: true })
} else {
  await ensureDependency()
  await rm(join(pluginDir, "opencode2-config.ts"), { force: true })
  const { createReleaseManifest } = await import(join(root, "dist", "platform", "release", "index.js"))
  const { installStagedRelease } = await import(join(root, "dist", "platform", "install", "index.js"))
  const compiled = join(root, "dist")
  const manifest = await createReleaseManifest({ source: compiled, files: (await files(compiled)).filter((file) => file.endsWith(".js")), entry: "index.js" })
  await installStagedRelease({ configRoot: config, source: compiled, manifest })
}
for (const asset of assetManifest.assets) {
  const source = join(root, asset.sourcePath)
  if (asset.installDestination === "commands") await copyFile(source, join(commandDir, `${asset.id}.md`))
  if (asset.installDestination === "agents") await copyFile(source, join(agentDir, `${asset.id}.md`))
  if (asset.installDestination === "skills") {
    const [, , skill, ...resource] = asset.sourcePath.split("/")
    const destination = join(skillDir, skill, ...resource)
    await mkdir(dirname(destination), { recursive: true }); await copyFile(source, destination)
  }
  if (asset.installDestination === "config") {
    const relative = asset.sourcePath.slice("assets/config/".length)
    const destination = join(bundleDir, "config", relative)
    await mkdir(dirname(destination), { recursive: true }); await copyFile(source, destination)
  }
}
if (useConfiguredPackage) {
  const pinResult = packageConfig.updatedFiles.length ? `pinned the config entry to ${packageSpec}` : `the config entry is already pinned to ${packageSpec}`
  console.log(`OpenCode2 Config is already configured as a package in ${config}; ${pinResult} and removed the duplicate local plugin copy.`)
} else console.log(`Installed OpenCode2 Config plugin to ${config}`)
console.log(`Installed ${packageName} assets from assets/manifest.json`)
