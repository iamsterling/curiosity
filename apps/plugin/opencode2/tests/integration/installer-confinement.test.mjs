import assert from "node:assert/strict"
import { mkdtemp, mkdir, readFile, readdir, rm, symlink, writeFile } from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import { spawn } from "node:child_process"
import test from "node:test"

const pluginRoot = path.resolve(import.meta.dirname, "../..")
const installer = path.join(pluginRoot, "tools", "install-node.mjs")
const unsafeDiagnostic = "OPENCODE2_CONFIG_DESTINATION_UNSAFE\n"

const runInstaller = (config) => new Promise((resolve, reject) => {
  const child = spawn(process.execPath, [installer], {
    cwd: pluginRoot,
    env: { ...process.env, OPENCODE_CONFIG_DIR: config },
    stdio: ["ignore", "pipe", "pipe"],
  })
  const stdout = []
  const stderr = []
  child.stdout.on("data", (chunk) => stdout.push(Buffer.from(chunk)))
  child.stderr.on("data", (chunk) => stderr.push(Buffer.from(chunk)))
  child.once("error", reject)
  child.once("close", (code) => resolve({
    code,
    stderr: Buffer.concat(stderr).toString("utf8"),
    stdout: Buffer.concat(stdout).toString("utf8"),
  }))
})

test("installer rejects outside-root symlinks for every managed directory without writing through them", async (context) => {
  for (const managedDirectory of ["commands", "agents", "skills", "plugins", "opencode2-config-bundle"]) {
    await context.test(managedDirectory, async () => {
      const root = await mkdtemp(path.join(os.tmpdir(), "opencode2-installer-confinement-"))
      const config = path.join(root, "config")
      const outside = path.join(root, "operator-owned-outside")
      const canary = path.join(outside, "canary.txt")
      try {
        await mkdir(config)
        await mkdir(outside)
        await writeFile(canary, "outside-canary\n", { flag: "wx" })
        await symlink(outside, path.join(config, managedDirectory), "dir")
        const before = await readdir(outside)

        const result = await runInstaller(config)
        assert.notEqual(result.code, 0)
        assert.equal(result.stdout, "")
        assert.equal(result.stderr, unsafeDiagnostic)
        assert.deepEqual(await readdir(outside), before)
        assert.equal(await readFile(canary, "utf8"), "outside-canary\n")
      } finally {
        await rm(root, { recursive: true, force: true })
      }
    })
  }
})

test("installer rejects an outside-root final asset symlink without changing its target", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "opencode2-installer-file-confinement-"))
  const config = path.join(root, "config")
  const outside = path.join(root, "operator-owned-outside.txt")
  try {
    const manifest = JSON.parse(await readFile(path.join(pluginRoot, "assets", "manifest.json"), "utf8"))
    const command = manifest.assets.find((asset) => asset.installDestination === "commands")
    assert.ok(command)
    await mkdir(path.join(config, "commands"), { recursive: true })
    await writeFile(outside, "outside-file-canary\n", { flag: "wx" })
    await symlink(outside, path.join(config, "commands", `${command.id}.md`))

    const result = await runInstaller(config)
    assert.notEqual(result.code, 0)
    assert.equal(result.stdout, "")
    assert.equal(result.stderr, unsafeDiagnostic)
    assert.equal(await readFile(outside, "utf8"), "outside-file-canary\n")
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})
