import { createHash } from "node:crypto"
import { cp, mkdir, readFile, readdir, rename, rm, stat, writeFile } from "node:fs/promises"
import { dirname, join, relative, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const manifestName = ".generic-bundle-manifest.json"
const ignored = new Set([".DS_Store"])
const digest = (text) => createHash("sha256").update(text).digest("hex")

async function files(path) {
  const details = await stat(path)
  if (details.isFile()) return [path]
  const entries = await readdir(path, { withFileTypes: true })
  return (await Promise.all(entries.filter((entry) => !ignored.has(entry.name)).map((entry) => files(join(path, entry.name))))).flat()
}
async function inventory(base = root) {
  const paths = (await files(base)).filter((item) => relative(base, item) !== manifestName)
  return Promise.all(paths.sort().map(async (path) => ({ path: relative(base, path), sha256: digest(await readFile(path)) })))
}
async function copyFileFromManifest(source, destination) { await mkdir(dirname(destination), { recursive: true }); await cp(source, destination) }
const diagnostic = (code, path, detail) => ({ code, path, detail })
const roles = ["orchestrator", "generalist", "analyst", "implementer", "strategist", "reviewer", "researcher", "worker"]
const providerRoute = (value) => /^[^/\s]+\/[^/\s]+$/.test(String(value || "")) && !String(value).includes("REQUIRED_")

async function validateOverlay(target, diagnostics) {
  const overlayPath = join(target, "assets", "config", "overlay.json")
  try {
    const overlay = JSON.parse(await readFile(overlayPath, "utf8"))
    if (overlay.host?.apiVersion !== "1") diagnostics.push(diagnostic("BUNDLE_HOST_API_UNSUPPORTED", "assets/config/overlay.json", "host.apiVersion must be 1"))
    const depth = overlay.experimental?.subagent_depth
    if (!Number.isInteger(depth) || depth < 0 || depth > 3) diagnostics.push(diagnostic("BUNDLE_NESTED_DEPTH_INVALID", "assets/config/overlay.json", "experimental.subagent_depth must be an integer from 0 to 3"))
    if (depth < 3) diagnostics.push(diagnostic("BUNDLE_NESTED_DEPTH_UNAVAILABLE", "assets/config/overlay.json", "the four-level primary to lead to specialist/implementer to reviewer chain requires explicit operator opt-in to depth 3"))
    const plugins = Array.isArray(overlay.plugins) ? overlay.plugins : []
    if (!Array.isArray(overlay.plugins)) diagnostics.push(diagnostic("BUNDLE_OVERLAY_INVALID", "assets/config/overlay.json#plugins", "plugins must be an array"))
    if (new Set(plugins).size !== plugins.length) diagnostics.push(diagnostic("BUNDLE_PLUGIN_DUPLICATE", "assets/config/overlay.json", "plugin appears more than once"))
    if (!roles.includes(overlay.defaultAgent) || !overlay.enabledAgents?.includes(overlay.defaultAgent)) diagnostics.push(diagnostic("BUNDLE_DEFAULT_AGENT_INVALID", "assets/config/overlay.json", "defaultAgent must be enabled"))
    for (const role of overlay.enabledAgents ?? []) {
      if (!roles.includes(role)) diagnostics.push(diagnostic("BUNDLE_AGENT_UNKNOWN", "assets/config/overlay.json", role))
      if (!providerRoute(overlay.models?.[role])) diagnostics.push(diagnostic("BUNDLE_MODEL_ROUTE_REQUIRED", `assets/config/overlay.json#models.${role}`, "supply a provider-qualified operator-selected route"))
    }
    if (!Array.isArray(overlay.permissions) || !overlay.permissions.length) diagnostics.push(diagnostic("BUNDLE_PERMISSIONS_REQUIRED", "assets/config/overlay.json", "declare at least one permission rule"))
  } catch { diagnostics.push(diagnostic("BUNDLE_OVERLAY_MISSING", "assets/config/overlay.json", "create an installation overlay from the example")) }
}

export async function validateBundle(destination) {
  const diagnostics = []
  const target = resolve(destination)
  let manifest
  try { manifest = JSON.parse(await readFile(join(target, manifestName), "utf8")) }
  catch { return [diagnostic("BUNDLE_MANIFEST_MISSING", manifestName, "export manifest is absent or invalid JSON")] }
  for (const entry of manifest.assets ?? []) {
    try {
      const actual = digest(await readFile(join(target, entry.path)))
      if (actual !== entry.sha256) diagnostics.push(diagnostic("BUNDLE_ASSET_STALE", entry.path, "content hash differs from manifest"))
    } catch { diagnostics.push(diagnostic("BUNDLE_ASSET_MISSING", entry.path, "manifested asset is absent")) }
  }
  let commandFiles = []
  try { commandFiles = (await files(join(target, "assets", "commands"))).filter((path) => path.endsWith(".md")) }
  catch { diagnostics.push(diagnostic("BUNDLE_ASSET_MISSING", "commands", "command directory is absent")) }
  for (const path of commandFiles) {
    const text = await readFile(path, "utf8")
    for (const skill of text.matchAll(/^skill:\s*([\w-]+)\s*$/gm)) {
      try { await stat(join(target, "assets", "skills", skill[1], "SKILL.md")) }
      catch { diagnostics.push(diagnostic("BUNDLE_COMMAND_SKILL_MISSING", relative(target, path), skill[1])) }
    }
  }
  for (const path of await files(target)) {
    if (!/\.(?:md|json)$/u.test(path)) continue
    const text = await readFile(path, "utf8")
    if (/\b(?:Crafty|AI-DLC)\b/u.test(text)) diagnostics.push(diagnostic("BUNDLE_PRODUCT_LEAKAGE", relative(target, path), "product-specific term found"))
  }
  await validateOverlay(target, diagnostics)
  return diagnostics
}

export async function exportBundle(destination, { overlay } = {}) {
  const target = resolve(destination)
  if (target === root) throw new Error("BUNDLE_DESTINATION_INVALID: destination must not be the source repository")
  const stage = `${target}.stage-${process.pid}`
  await rm(stage, { recursive: true, force: true }); await mkdir(stage, { recursive: true })
  const authoritative = JSON.parse(await readFile(join(root, "assets", "manifest.json"), "utf8"))
  await mkdir(join(stage, "assets"), { recursive: true })
  await copyFileFromManifest(join(root, "assets", "manifest.json"), join(stage, "assets", "manifest.json"))
  for (const asset of authoritative.assets) await copyFileFromManifest(join(root, asset.sourcePath), join(stage, asset.sourcePath))
  if (!overlay) { await rm(stage, { recursive: true, force: true }); throw new Error("BUNDLE_OPERATOR_OVERLAY_REQUIRED") }
  const selectedOverlay = overlay
  await writeFile(join(stage, "assets", "config", "overlay.json"), JSON.stringify(selectedOverlay, null, 2) + "\n")
  const assetsInventory = await inventory(stage)
  await writeFile(join(stage, manifestName), `${JSON.stringify({ schemaVersion: 1, assets: assetsInventory }, null, 2)}\n`)
  const backup = `${target}.backup-${process.pid}`
  await rm(backup, { recursive: true, force: true }); await mkdir(dirname(target), { recursive: true })
  try { await rename(target, backup) } catch (error) { if (error?.code !== "ENOENT") throw error }
  try { await rename(stage, target) }
  catch (error) { try { await rename(backup, target) } catch {}; throw error }
  await rm(backup, { recursive: true, force: true })
  return []
}

const [operation, destination] = process.argv.slice(2)
if (import.meta.url === `file://${process.argv[1]}`) {
  if (!destination || !["validate", "export", "doctor"].includes(operation)) {
    console.error("BUNDLE_USAGE: node tools/bundle-assets.mjs <validate|export|doctor> <isolated-destination>")
    process.exitCode = 2
  } else {
    const overlayPath = process.argv[4]
    const overlay = overlayPath ? JSON.parse(await readFile(overlayPath, "utf8")) : undefined
    const diagnostics = operation === "export" ? await exportBundle(destination, { overlay }) : await validateBundle(destination)
    for (const item of diagnostics) console.error(`${item.code}:${item.path}:${item.detail}`)
    process.exitCode = diagnostics.length ? 1 : 0
  }
}
