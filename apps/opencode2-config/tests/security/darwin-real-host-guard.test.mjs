import assert from "node:assert/strict"
import { lstat, mkdtemp, mkdir, readFile, readdir, rm, symlink, utimes, writeFile } from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import test from "node:test"
import { canonicalRoot, classifyProxyAttempts, createProxyRecorder, isolatedEnvironment, resolveInstalledRuntimePaths, scanRetainedFiles, verifyCopiedRuntimeIdentity } from "../../tools/lib/darwin-real-host-guard.mjs"

test("retained-file scan catches output and file credential canaries without serializing them", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "opencode2-guard-test-"))
  const secret = ["credential", "canary", "not", "to", "be", "reported"].join("-")
  try {
    await writeFile(path.join(root, "secret"), secret)
    await assert.rejects(scanRetainedFiles(root, { output: Buffer.from(secret), secrets: [secret] }), /REAL_HOST_SECRET_LEAK/)
    await assert.rejects(scanRetainedFiles(root, { output: Buffer.alloc(0), secrets: [secret] }), /REAL_HOST_SECRET_PERSISTED/)
  } finally { await rm(root, { recursive: true, force: true }) }
})

test("retained-file scan catches a secret in raw proxy metadata before records are redacted", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "opencode2-guard-test-"))
  const secret = ["proxy", "metadata", "canary"].join("-")
  try {
    await assert.rejects(
      scanRetainedFiles(root, { output: Buffer.alloc(0), proxyRecords: [{ method: "CONNECT", authority: secret }], secrets: [secret] }),
      /REAL_HOST_SECRET_LEAK/,
    )
  } finally { await rm(root, { recursive: true, force: true }) }
})

test("retained-file scan fails closed for symlinks and scan races", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "opencode2-guard-test-"))
  try {
    await mkdir(path.join(root, "nested"))
    await symlink("/tmp", path.join(root, "nested", "escape"))
    await assert.rejects(scanRetainedFiles(root, { output: Buffer.alloc(0), secrets: [] }), /REAL_HOST_SCAN_SYMLINK/)
  } finally { await rm(root, { recursive: true, force: true }) }
})

test("retained-file scanner executes unreadable and race failure paths through its controlled adapter", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "opencode2-guard-test-"))
  const target = path.join(root, "candidate")
  try {
    await writeFile(target, "safe")
    const scanner = { readdir, lstat, readFile }
    await assert.doesNotReject(scanRetainedFiles(root, { output: Buffer.alloc(0), secrets: [], scanner }))
    await assert.rejects(
      scanRetainedFiles(root, { output: Buffer.alloc(0), secrets: [], scanner: { ...scanner, readFile: async () => { throw new Error("controlled unreadable") } } }),
      /REAL_HOST_SCAN_UNREADABLE/,
    )
    let lstatCalls = 0
    await assert.rejects(
      scanRetainedFiles(root, { output: Buffer.alloc(0), secrets: [], scanner: { ...scanner, lstat: async (file) => {
        const info = await lstat(file)
        if (file === target && ++lstatCalls === 2) return { ...info, size: info.size + 1, isSymbolicLink: info.isSymbolicLink.bind(info) }
        return info
      } } }),
      /REAL_HOST_SCAN_RACE/,
    )
  } finally { await rm(root, { recursive: true, force: true }) }
})

test("retained-file scanner detects a same-size rewrite with its mtime restored", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "opencode2-guard-test-"))
  const target = path.join(root, "candidate")
  try {
    await writeFile(target, "safe")
    const original = await lstat(target)
    let rewrote = false
    await assert.rejects(
      scanRetainedFiles(root, {
        output: Buffer.alloc(0),
        secrets: [],
        scanner: {
          readdir,
          lstat,
          readFile: async (file) => {
            const content = await readFile(file)
            if (file === target && !rewrote) {
              rewrote = true
              await writeFile(file, "risk")
              await utimes(file, original.atime, original.mtime)
            }
            return content
          },
        },
      }),
      /REAL_HOST_SCAN_RACE/,
    )
    assert.equal(rewrote, true)
  } finally { await rm(root, { recursive: true, force: true }) }
})

test("copied runtime identity rejects substituted CLI and plugin SDK bytes", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "opencode2-guard-test-"))
  try {
    const { cli, sdk } = resolveInstalledRuntimePaths()
    const copiedCli = path.join(root, "opencode2")
    const copiedSdk = path.join(root, "index.js")
    await writeFile(copiedCli, await readFile(cli)); await writeFile(copiedSdk, await readFile(sdk))
    await assert.doesNotReject(verifyCopiedRuntimeIdentity({ cli, sdk, copiedCli, copiedSdk }))
    await writeFile(copiedCli, "substituted")
    await assert.rejects(verifyCopiedRuntimeIdentity({ cli, sdk, copiedCli, copiedSdk }), /REAL_HOST_CLI_IDENTITY_MISMATCH/)
    await writeFile(copiedCli, await readFile(cli))
    await writeFile(copiedSdk, "substituted")
    await assert.rejects(verifyCopiedRuntimeIdentity({ cli, sdk, copiedCli, copiedSdk }), /REAL_HOST_PLUGIN_SDK_IDENTITY_MISMATCH/)
  } finally { await rm(root, { recursive: true, force: true }) }
})

test("proxy records but does not retain request headers or bodies", async () => {
  const proxy = await createProxyRecorder()
  try {
    const response = await fetch(`${proxy.url}/model-canary`, { headers: { authorization: "do-not-record" }, body: "do-not-record", method: "POST" })
    assert.equal(response.status, 502)
    assert.equal(proxy.records.length, 1)
    assert.deepEqual(proxy.records[0], { method: "POST", authority: `127.0.0.1:${new URL(proxy.url).port}`, path: "/model-canary", modelCanary: true, disposition: "rejected" })
  } finally { await proxy.close() }
})

test("canonical root rejects a symlink root", async () => {
  const parent = await mkdtemp(path.join(os.tmpdir(), "opencode2-guard-test-"))
  try {
    await mkdir(path.join(parent, "root"))
    await symlink(path.join(parent, "root"), path.join(parent, "link"))
    await assert.rejects(canonicalRoot(path.join(parent, "link")), /REAL_HOST_ROOT_SYMLINK/)
  } finally { await rm(parent, { recursive: true, force: true }) }
})

test("zero or more rejected exact catalog CONNECT attempts are accepted and all other proxy records fail", () => {
  const records = [
    { method: "CONNECT", authority: "models.opencode.ai:443", disposition: "rejected" },
    { method: "CONNECT", authority: "models.opencode.ai:443", disposition: "rejected" },
  ]
  assert.deepEqual(classifyProxyAttempts(records), {
    successfulExternalEgressPrevented: true,
    successfulExternalEgressCount: 0,
    observedProxyAttempts: 2,
    catalogMetadata: { method: "CONNECT", authority: "models.opencode.ai:443", disposition: "rejected", attempts: 2 },
    providerInferenceAttempts: 0,
    successfulInferenceCount: 0,
    unknownAuthorityAttempts: 0,
  })
  assert.deepEqual(classifyProxyAttempts([]).catalogMetadata.attempts, 0)
  assert.deepEqual(classifyProxyAttempts(records.slice(0, 1)).catalogMetadata.attempts, 1)
  assert.throws(() => classifyProxyAttempts([...records, { method: "CONNECT", authority: "api.openai.com:443" }]), /REAL_HOST_EXTERNAL_ATTEMPT_OBSERVED/)
  assert.throws(() => classifyProxyAttempts([{ method: "GET", authority: "models.opencode.ai:443" }]), /REAL_HOST_EXTERNAL_ATTEMPT_OBSERVED/)
  assert.throws(() => classifyProxyAttempts([{ method: "CONNECT", authority: "models.opencode.ai:443", disposition: "accepted" }]), /REAL_HOST_EXTERNAL_ATTEMPT_OBSERVED/)
  assert.throws(() => classifyProxyAttempts(records, { truncated: true }), /REAL_HOST_PROXY_CAPACITY_EXHAUSTED/)
})

test("isolated environment retains the fetch-disable setting without inherited provider credentials", () => {
  const env = isolatedEnvironment({ root: "/root", home: "/root/home", config: "/root/config", data: "/root/data", cache: "/root/cache", password: "secret", proxyURL: "http://127.0.0.1:1", pluginConfig: "{}" })
  assert.equal(env.OPENCODE_DISABLE_MODELS_FETCH, "1")
  assert.equal(env.OPENAI_API_KEY, undefined)
  assert.equal(env.ANTHROPIC_API_KEY, undefined)
})
