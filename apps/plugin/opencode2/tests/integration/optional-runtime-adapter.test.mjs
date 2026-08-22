import assert from "node:assert/strict"
import { spawn } from "node:child_process"
import { cp, mkdir, mkdtemp, realpath, rm, symlink, writeFile } from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import test from "node:test"

const pluginRoot = path.resolve(import.meta.dirname, "../..")

test("registry package remains loadable and fails gracefully when the private runtime adapter is absent", async () => {
  const temporary = await mkdtemp(path.join(os.tmpdir(), "opencode2-optional-runtime-"))
  const isolated = path.join(temporary, "package")
  try {
    await cp(path.join(pluginRoot, "dist"), path.join(isolated, "dist"), { recursive: true })
    await mkdir(path.join(isolated, "node_modules"), { recursive: true })
    await symlink(await realpath(path.join(pluginRoot, "node_modules", "effect")), path.join(isolated, "node_modules", "effect"), "dir")
    await writeFile(path.join(isolated, "package.json"), '{"type":"module"}\n')
    const program = `
      import { Effect } from "effect"
      import { createRuntimeSearchExecutor } from "./dist/features/search/runtime-adapter.js"
      const executor = createRuntimeSearchExecutor({
        backend: "runtime",
        controlledPluginIds: ["iamsterling.opencode2-config"],
        runtime: { stateRoot: ${JSON.stringify(temporary)}, workspaceScope: ${JSON.stringify(temporary)}, queryCapability: new Uint8Array([1]) },
      })
      try {
        await Effect.runPromise(executor.open)
        console.log("UNEXPECTED_RUNTIME_PRESENT")
        process.exitCode = 2
      } catch (error) {
        console.log(error?.code ?? "MISSING_DIAGNOSTIC")
      } finally {
        executor.cleanup()
      }
    `
    const result = await new Promise((resolve, reject) => {
      const child = spawn(process.execPath, ["--input-type=module", "-e", program], {
        cwd: isolated,
        env: { HOME: temporary, LANG: "C", PATH: "/usr/bin:/bin" },
        stdio: ["ignore", "pipe", "pipe"],
      })
      const stdout = []
      const stderr = []
      child.stdout.on("data", (chunk) => stdout.push(Buffer.from(chunk)))
      child.stderr.on("data", (chunk) => stderr.push(Buffer.from(chunk)))
      child.once("error", reject)
      child.once("close", (code) => resolve({ code, stderr: Buffer.concat(stderr).toString("utf8"), stdout: Buffer.concat(stdout).toString("utf8") }))
    })
    assert.equal(result.code, 0, result.stderr)
    assert.equal(result.stdout.trim(), "WEB_SEARCH_RUNTIME_CONFIG_INVALID")
    assert.equal(result.stderr, "")
  } finally {
    await rm(temporary, { recursive: true, force: true })
  }
})
