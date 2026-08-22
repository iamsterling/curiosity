import assert from "node:assert/strict"
import { spawn } from "node:child_process"
import { promises as fs } from "node:fs"
import os from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const installer = path.join(root, "tools", "install-node.mjs")
const packageJson = JSON.parse(await fs.readFile(path.join(root, "package.json"), "utf8"))
const shellInstaller = path.join(root, "tools", "install.sh")
const powerShellSource = await fs.readFile(path.join(root, "tools", "install.ps1"), "utf8")
const packageVersion = packageJson.version
const expectedPackageSpec = `@iamsterling/opencode2-config@${packageVersion}`
const temporaryRoot = await fs.mkdtemp(path.join(os.tmpdir(), "opencode2-config-installer-"))

async function runInstaller(config, cliArgs = []) {
  return await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [installer, ...cliArgs], {
      cwd: root,
      env: { ...process.env, OPENCODE_CONFIG_DIR: config },
      windowsHide: true,
    })
    const stdout = []
    const stderr = []
    child.stdout.on("data", (data) => stdout.push(Buffer.from(data)))
    child.stderr.on("data", (data) => stderr.push(Buffer.from(data)))
    child.on("error", reject)
    child.on("close", (code) => resolve({
      code,
      stdout: Buffer.concat(stdout).toString("utf8"),
      stderr: Buffer.concat(stderr).toString("utf8"),
    }))
  })
}

async function commandCount(config) {
  return (await fs.readdir(path.join(config, "commands"))).filter((name) => name.endsWith(".md")).length
}

async function exists(target) {
  try { await fs.access(target); return true } catch { return false }
}

try {
  const helpConfig = path.join(temporaryRoot, "help-must-not-install")
  const helpResult = await runInstaller(helpConfig, ["--help"])
  assert.equal(helpResult.code, 0, helpResult.stderr)
  assert.match(helpResult.stdout, /OpenCode2 Config installer/)
  assert.equal(await exists(helpConfig), false, "--help must not mutate the OpenCode config directory")

  const versionResult = await runInstaller(helpConfig, ["--version"])
  assert.equal(versionResult.code, 0, versionResult.stderr)
  assert.equal(versionResult.stdout.trim(), packageVersion)
  assert.equal(await exists(helpConfig), false, "--version must not mutate the OpenCode config directory")

  const shellHelpResult = await new Promise((resolve, reject) => {
    const child = spawn("sh", [shellInstaller, "--help"], {
      cwd: root,
      env: { ...process.env, OPENCODE_CONFIG_DIR: helpConfig },
    })
    const stdout = []
    const stderr = []
    child.stdout.on("data", (data) => stdout.push(Buffer.from(data)))
    child.stderr.on("data", (data) => stderr.push(Buffer.from(data)))
    child.on("error", reject)
    child.on("close", (code) => resolve({ code, stdout: Buffer.concat(stdout).toString("utf8"), stderr: Buffer.concat(stderr).toString("utf8") }))
  })
  assert.equal(shellHelpResult.code, 0, shellHelpResult.stderr)
  assert.match(shellHelpResult.stdout, /OpenCode2 Config installer/)
  assert.equal(await exists(helpConfig), false, "the shell wrapper must forward --help without installing")
  assert.match(powerShellSource, /tools[\\/]install-node\.mjs/)
  assert.match(powerShellSource, /@args/)

  const local = path.join(temporaryRoot, "local")
  const localResult = await runInstaller(local)
  assert.equal(localResult.code, 0, localResult.stderr)
  assert.equal(await exists(path.join(local, "plugins", "opencode2-config.js")), true)
  assert.equal(await commandCount(local), 41)
  assert.equal(await exists(path.join(local, "agents", "opencode-loop-local.md")), false)
  assert.equal(await exists(path.join(local, "skills", "handoff-compiler", "SKILL.md")), true)
  assert.equal(await exists(path.join(local, "skills", "handoff-compiler", "documentation.md")), true)
  assert.equal(await exists(path.join(local, "skills", "handoff-compiler", "documentation", "documentation.md")), false)
  assert.equal(await exists(path.join(local, "skills", "verify", "SKILL.md")), true)
  assert.equal(await exists(path.join(local, "opencode2-config-bundle", "config", "agents", "orchestrator.json")), true)
  assert.equal(await exists(path.join(local, "opencode2-config-bundle", "config", "overlay.schema.json")), true)
  await fs.symlink(path.join(root, "node_modules"), path.join(local, "node_modules"), "dir")
  await import(path.join(local, "plugins", "opencode2-config.js"))
  const localPackage = JSON.parse(await fs.readFile(path.join(local, "package.json"), "utf8"))
  assert.equal(localPackage.dependencies["@opencode-ai/plugin"], packageJson.dependencies["@opencode-ai/plugin"])

  const configured = path.join(temporaryRoot, "configured")
  await fs.mkdir(path.join(configured, "plugins"), { recursive: true })
  await fs.writeFile(path.join(configured, "opencode.json"), JSON.stringify({ plugin: ["@iamsterling/opencode2-config@latest"] }), "utf8")
  await fs.writeFile(path.join(configured, "plugins", "opencode2-config.js"), "duplicate", "utf8")
  await fs.writeFile(path.join(configured, "plugins", "opencode2-config.js"), "duplicate", "utf8")
  const configuredResult = await runInstaller(configured)
  assert.equal(configuredResult.code, 0, configuredResult.stderr)
  assert.match(configuredResult.stdout, /removed the duplicate local plugin copy/i)
  assert.equal(await exists(path.join(configured, "plugins", "opencode2-config.js")), false)
  assert.equal(await exists(path.join(configured, "plugins", "opencode2-config.js")), false)
  assert.equal(await commandCount(configured), 41)
  assert.equal(await exists(path.join(configured, "agents", "opencode-loop-local.md")), false)
  const configuredJson = JSON.parse(await fs.readFile(path.join(configured, "opencode.json"), "utf8"))
  assert.deepEqual(configuredJson.plugin, [expectedPackageSpec], "the installer must bust OpenCode's stale package cache with an exact version spec")

  const jsonc = path.join(temporaryRoot, "jsonc")
  await fs.mkdir(jsonc, { recursive: true })
  await fs.writeFile(path.join(jsonc, "opencode.jsonc"), `{
    // A configured package is authoritative; a local copy would load twice.
    "plugin": [
      "other-plugin",
      "@iamsterling/opencode2-config",
    ],
  }`, "utf8")
  const jsoncResult = await runInstaller(jsonc)
  assert.equal(jsoncResult.code, 0, jsoncResult.stderr)
  assert.equal(await exists(path.join(jsonc, "plugins", "opencode2-config.js")), false)
  const updatedJsonc = await fs.readFile(path.join(jsonc, "opencode.jsonc"), "utf8")
  assert.match(updatedJsonc, /A configured package is authoritative/, "pinning must preserve JSONC comments")
  assert.match(updatedJsonc, new RegExp(expectedPackageSpec.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")))

  const lookalike = path.join(temporaryRoot, "lookalike")
  await fs.mkdir(lookalike, { recursive: true })
  await fs.writeFile(path.join(lookalike, "opencode.json"), JSON.stringify({ plugin: ["@iamsterling/opencode2-config-extra"] }), "utf8")
  const lookalikeResult = await runInstaller(lookalike)
  assert.equal(lookalikeResult.code, 0, lookalikeResult.stderr)
  assert.equal(await exists(path.join(lookalike, "plugins", "opencode2-config.js")), true)

  console.log("OpenCode2 Config installer test passed")
} finally {
  await fs.rm(temporaryRoot, { recursive: true, force: true })
}
