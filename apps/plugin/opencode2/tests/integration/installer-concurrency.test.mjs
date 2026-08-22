import assert from "node:assert/strict"
import { createHash } from "node:crypto"
import { spawn } from "node:child_process"
import { access, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import test from "node:test"

const pluginRoot = path.resolve(import.meta.dirname, "../..")
const installer = path.join(pluginRoot, "tools", "install-node.mjs")
const busyDiagnostic = "OPENCODE2_CONFIG_INSTALL_BUSY: retry the installation\n"
const digest = (contents) => createHash("sha256").update(contents).digest("hex")

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

test("one concurrent installer wins and losers receive the stable retryable busy result", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "opencode2-installer-concurrency-"))
  const config = path.join(root, "config")
  const unrelated = path.join(config, "operator-owned.txt")
  const outsideCanary = path.join(root, "outside-canary.txt")
  try {
    await writeFile(unrelated, "preserve-inside\n", { flag: "wx" }).catch(async (error) => {
      if (error.code !== "ENOENT") throw error
      await import("node:fs/promises").then(({ mkdir }) => mkdir(config, { recursive: true }))
      await writeFile(unrelated, "preserve-inside\n", { flag: "wx" })
    })
    await writeFile(outsideCanary, "preserve-outside\n", { flag: "wx" })

    const results = await Promise.all(Array.from({ length: 12 }, () => runInstaller(config)))
    const winners = results.filter(({ code }) => code === 0)
    const losers = results.filter(({ code }) => code !== 0)
    assert.equal(winners.length, 1, JSON.stringify(results))
    assert.equal(losers.length, 11, JSON.stringify(results))
    for (const loser of losers) {
      assert.equal(loser.code, 75)
      assert.equal(loser.stdout, "")
      assert.equal(loser.stderr, busyDiagnostic)
    }

    const plugins = path.join(config, "plugins")
    const receiptText = await readFile(path.join(plugins, "opencode2-config.receipt.json"), "utf8")
    const receipt = JSON.parse(receiptText)
    assert.equal(await readFile(path.join(plugins, "opencode2-config", "receipt.json"), "utf8"), receiptText)
    for (const file of receipt.files) {
      const contents = await readFile(path.join(plugins, "opencode2-config", "dist", file.path))
      assert.equal(digest(contents), file.sha256, file.path)
    }
    assert.deepEqual(
      (await readdir(plugins)).filter((name) => name.startsWith(".opencode2-config.stage-")),
      [],
    )
    await assert.rejects(() => access(path.join(config, ".opencode2-config.install.lock")), { code: "ENOENT" })
    assert.equal(await readFile(unrelated, "utf8"), "preserve-inside\n")
    assert.equal(await readFile(outsideCanary, "utf8"), "preserve-outside\n")
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})
