#!/usr/bin/env node
import { createHash, randomBytes } from "node:crypto"
import { execFile, spawn } from "node:child_process"
import { createServer as createNetServer } from "node:net"
import { once } from "node:events"
import { cp, lstat, mkdir, mkdtemp, readFile, readdir, rm, stat, symlink, writeFile } from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"
import { promisify } from "node:util"
import { capabilityReport } from "../dist/platform/real-host/index.js"
import { PINNED_REAL_HOST_VERSION } from "../dist/platform/real-host/index.js"
import { canonicalRoot, classifyProxyAttempts, createProxyRecorder, isolatedEnvironment, resolveInstalledRuntimePaths, sandboxProfile, scanRetainedFiles, verifyCopiedRuntimeIdentity } from "./lib/darwin-real-host-guard.mjs"
import { findWorkspaceRoot } from "./workspace-root.mjs"

export { capabilityReport } from "../dist/platform/real-host/index.js"
const execute = promisify(execFile)
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
const digest = async (file) => createHash("sha256").update(await readFile(file)).digest("hex")
const waitFor = async (predicate, timeout) => {
  const end = Date.now() + timeout
  while (Date.now() < end) { const result = await predicate(); if (result) return result; await delay(25) }
  throw new Error("REAL_HOST_TIMEOUT")
}
const versionOf = async (host, env) => (await execute(host, ["--version"], { env })).stdout.match(/\d+\.\d+\.\d+(?:-[A-Za-z0-9.-]+)?/u)?.[0] ?? "unknown"
const markers = async (file) => { try { return (await readFile(file, "utf8")).trim().split("\n").filter(Boolean).map(JSON.parse) } catch { return [] } }
const groupMembers = async (pid) => {
  const { stdout } = await execute("ps", ["-axo", "pid=,pgid="])
  return stdout.split("\n").map((line) => line.trim().split(/\s+/u)).filter((fields) => fields[1] === String(pid)).map(([member]) => Number(member)).filter(Number.isFinite).sort((a, b) => a - b)
}
const TOOL_IDS = ["formerhuman_search", "ledger_approval_request", "ledger_approval_status", "ledger_claim_release", "ledger_claim_request", "ledger_evidence_submit", "ledger_fact_record", "ledger_intent_activate", "ledger_intent_frame", "ledger_intent_propose", "ledger_progress_propose", "ledger_resolution_propose", "ledger_review_propose", "ledger_work_propose", "native_loop_pause", "native_loop_resume", "native_loop_start", "native_loop_status", "native_loop_stop", "web_search"]
const fixture = path.resolve("tests/fixtures/real-host-adversary.mjs")
const runFixture = async ({ root, mode, target, secret, profile, env = {} }) => {
  const profilePath = path.join(root, `fixture-${mode}-${randomBytes(4).toString("hex")}.sb`)
  await writeFile(profilePath, profile)
  try {
    return await execute("/usr/bin/sandbox-exec", ["-f", profilePath, process.execPath, fixture, mode, target, secret ?? ""], { env: { PATH: process.env.PATH ?? "/usr/bin:/bin", ...env }, timeout: 2_000 })
  } catch (error) { return { code: error.code, stdout: error.stdout ?? "", stderr: error.stderr ?? "" } } finally { await rm(profilePath, { force: true }) }
}
const exits = (result, code) => (result.code ?? 0) === code
const qualifyFixtures = async ({ canonical, proxy, secrets }) => {
  const sibling = `${canonical}-canary`
  const inside = path.join(canonical, "fixture-inside")
  const linked = path.join(canonical, "fixture-link")
  const strict = sandboxProfile(canonical)
  const results = {}
  const address = Object.values(os.networkInterfaces()).flat().find((entry) => entry && entry.family === "IPv4" && !entry.internal)?.address
  if (!address) throw new Error("REAL_HOST_NETWORK_FIXTURE_UNAVAILABLE")
  const canary = createNetServer((socket) => socket.end())
  try {
    await new Promise((resolve, reject) => { canary.once("error", reject); canary.listen(0, "0.0.0.0", resolve) })
    const canaryAddress = canary.address(); if (!canaryAddress || typeof canaryAddress === "string") throw new Error("REAL_HOST_NETWORK_FIXTURE_UNAVAILABLE")
    // The controller's non-loopback address lets the disabled control prove reachability.
    const networkTarget = `http://${address}:${canaryAddress.port}`
    const networkControl = await runFixture({ root: canonical, mode: "network", target: networkTarget, profile: sandboxProfile(canonical, { network: false }) })
    const networkBlocked = await runFixture({ root: canonical, mode: "network", target: networkTarget, profile: sandboxProfile(canonical, { localNetwork: false }) })
    if (!exits(networkControl, 0) || !exits(networkBlocked, 1)) throw new Error(`REAL_HOST_NETWORK_FIXTURE_INCONCLUSIVE:${networkControl.code}:${networkBlocked.code}`)
    // A real proxy request proves the recorder/classifier path; its non-CONNECT method must be rejected.
    const proxyAttempt = await runFixture({ root: canonical, mode: "proxy", target: `${proxy.url}/model-canary`, profile: strict })
    if (!exits(proxyAttempt, 1) || proxy.records.length !== 1) throw new Error("REAL_HOST_PROXY_ATTEMPT_OBSERVED")
    try { classifyProxyAttempts(proxy.records, { truncated: proxy.truncated }); throw new Error("REAL_HOST_PROXY_FIXTURE_NOT_REJECTED") } catch (error) { if (!String(error.message).includes("REAL_HOST_EXTERNAL_ATTEMPT_OBSERVED")) throw error }
    proxy.records.splice(0)
    const writeControl = await runFixture({ root: canonical, mode: "inside-write", target: inside, profile: strict })
    const outsideControl = await runFixture({ root: canonical, mode: "outside-write", target: sibling, profile: sandboxProfile(canonical, { writes: false }) })
    await rm(sibling, { force: true })
    const outsideBlocked = await runFixture({ root: canonical, mode: "outside-write", target: sibling, profile: strict })
    await symlink(sibling, linked)
    const symlinkControl = await runFixture({ root: canonical, mode: "outside-write", target: linked, profile: sandboxProfile(canonical, { writes: false }) })
    await rm(sibling, { force: true })
    const symlinkBlocked = await runFixture({ root: canonical, mode: "outside-write", target: linked, profile: strict })
    if (!exits(writeControl, 0) || !exits(outsideControl, 0) || !exits(outsideBlocked, 1) || !exits(symlinkControl, 0) || !exits(symlinkBlocked, 1) || await lstat(sibling).then(() => true).catch(() => false)) throw new Error("REAL_HOST_OUTSIDE_WRITE_DENIED")
    await rm(linked, { force: true })
    const secretFile = path.join(canonical, "fixture-secret")
    const secretWrite = await runFixture({ root: canonical, mode: "secret-file", target: secretFile, secret: secrets[0], profile: strict })
    if (!exits(secretWrite, 0)) throw new Error("REAL_HOST_SECRET_PERSISTED")
    await scanRetainedFiles(canonical, { output: Buffer.alloc(0), secrets: [] })
    try { await scanRetainedFiles(canonical, { output: Buffer.alloc(0), secrets }); throw new Error("REAL_HOST_SECRET_FIXTURE_NOT_REJECTED") } catch (error) { if (!String(error.message).includes("REAL_HOST_SECRET_PERSISTED")) throw error }
    await rm(secretFile, { force: true })
    const secretOutput = await runFixture({ root: canonical, mode: "secret-output", target: "", secret: secrets[0], profile: strict })
    await scanRetainedFiles(canonical, { output: Buffer.from(secretOutput.stdout), secrets: [] })
    try { await scanRetainedFiles(canonical, { output: Buffer.from(secretOutput.stdout), secrets }); throw new Error("REAL_HOST_OUTPUT_FIXTURE_NOT_REJECTED") } catch (error) { if (!String(error.message).includes("REAL_HOST_SECRET_LEAK")) throw error }
    const late = path.join(canonical, "fixture-late")
    const forkAllowed = await runFixture({ root: canonical, mode: "detached-child", target: late, profile: sandboxProfile(canonical, { fork: false, writes: false }) })
    await delay(200)
    const allowedLateWrite = await lstat(late).then(() => true).catch(() => false)
    await rm(late, { force: true })
    const forkBlocked = await runFixture({ root: canonical, mode: "detached-child", target: late, profile: strict })
    await delay(200)
    const blockedLateWrite = await lstat(late).then(() => true).catch(() => false)
    if (!exits(forkAllowed, 0) || !allowedLateWrite || !exits(forkBlocked, 1) || blockedLateWrite) throw new Error(`REAL_HOST_PROCESS_FORK_DENIED:${forkAllowed.code ?? 0}:${allowedLateWrite}:${forkBlocked.code}:${blockedLateWrite}`)
    results.network = "caught"; results.proxy = "caught"; results.outsideWrite = "caught"; results.secretPersistence = "caught"; results.detachedChild = "caught"
    return results
  } finally { await new Promise((resolve) => canary.close(resolve)); await rm(sibling, { force: true }); await rm(path.join(canonical, "fixture-late"), { force: true }); await rm(linked, { force: true }); await rm(inside, { force: true }); await rm(path.join(canonical, "fixture-secret"), { force: true }) }
}

export const runRealHostSuite = async () => {
  if (process.platform !== "darwin" || !await stat("/usr/bin/sandbox-exec").then(() => true).catch(() => false)) throw new Error("REAL_HOST_DARWIN_SANDBOX_REQUIRED")
  const root = await mkdtemp(path.join(os.tmpdir(), "opencode2-real-host-"))
  const output = []; let child; let proxy
  const password = randomBytes(32).toString("base64url")
  const authorization = `Basic ${Buffer.from(`opencode:${password}`).toString("base64")}`
  const secrets = [password, `opencode:${password}`, authorization]
  const terminate = async () => {
    if (!child) return { before: [], after: [] }
    const running = () => child.exitCode === null && child.signalCode === null
    const before = await groupMembers(child.pid)
    if (!running()) return { before, after: await groupMembers(child.pid) }
    try { process.kill(-child.pid, "SIGTERM") } catch {}
    await Promise.race([once(child, "exit"), delay(10_000)])
    if (running()) {
      try { process.kill(-child.pid, "SIGKILL") } catch {}
      try { process.kill(child.pid, "SIGKILL") } catch {}
    }
    if (running()) await Promise.race([once(child, "exit"), delay(10_000)])
    if (running()) throw new Error("REAL_HOST_TERMINATION_TIMEOUT")
    const after = await groupMembers(child.pid)
    if (after.length) throw new Error(`REAL_HOST_PROCESS_SURVIVORS:${after.join(",")}`)
    return { before, after }
  }
  try {
    const workspaceRoot = await findWorkspaceRoot(process.cwd())
    const canonical = await canonicalRoot(root)
    const paths = Object.fromEntries(["home", "config", "data", "cache", "project"].map((name) => [name, path.join(canonical, name)]))
    await Promise.all(Object.values(paths).map((dir) => mkdir(dir, { recursive: true })))
    await mkdir(path.join(paths.project, ".opencode", "plugins"), { recursive: true }); await mkdir(path.join(paths.config, "opencode"), { recursive: true })
    const artifact = path.join(canonical, "artifact"); await mkdir(artifact)
    await cp(path.resolve("dist"), path.join(artifact, "dist"), { recursive: true }); await cp(path.resolve("package.json"), path.join(artifact, "package.json")); await cp(path.join(workspaceRoot, "node_modules/.bun/node_modules"), path.join(artifact, "node_modules"), { recursive: true, dereference: true }); await cp(path.resolve("node_modules"), path.join(artifact, "node_modules"), { recursive: true, dereference: true, force: true })
    const installedRuntime = resolveInstalledRuntimePaths()
    await mkdir(path.join(artifact, "node_modules/@opencode-ai/cli-darwin-arm64/bin"), { recursive: true }); await cp(installedRuntime.cli, path.join(artifact, "node_modules/@opencode-ai/cli-darwin-arm64/bin/opencode2"))
    const entrypoint = pathToFileURL(path.join(artifact, "dist/index.js")).href; const effectEntrypoint = pathToFileURL(path.join(artifact, "node_modules/effect/dist/index.js")).href; const artifactHash = await digest(path.join(artifact, "dist/index.js")); const marker = path.join(paths.project, ".opencode", "host-marker.jsonl")
    await writeFile(path.join(paths.project, ".opencode/plugins/opencode2-config.js"), `import { appendFile } from "node:fs/promises"; import { Effect } from ${JSON.stringify(effectEntrypoint)}; const marker=${JSON.stringify(marker)}, entry=${JSON.stringify(entrypoint)}, hash=${JSON.stringify(artifactHash)}; const record=(x)=>appendFile(marker,JSON.stringify(x)+"\\n"); export default {id:"iamsterling.opencode2-config",effect:(context)=>Effect.gen(function*(){const {default:plugin}=yield* Effect.promise(()=>import(entry));yield* Effect.promise(()=>record({kind:"setup",lifecycle:"effect",id:plugin.id,artifactEntrypoint:entry,artifactHash:hash}));yield* Effect.addFinalizer(()=>Effect.promise(()=>record({kind:"cleanup",lifecycle:"effect",id:plugin.id})));const wrapHook=(domain,kind)=>({...domain,hook:(...args)=>domain.hook(...args).pipe(Effect.tap(()=>Effect.promise(()=>record({kind:"registration",registration:kind,id:String(args[0])}))))});const tool={...wrapHook(context.tool,"tool.hook"),transform:(callback)=>{const tools=[];return context.tool.transform((draft)=>callback({...draft,add:(definition)=>{tools.push(definition.name);return draft.add(definition)}})).pipe(Effect.tap(()=>Effect.promise(()=>record({kind:"registration",registration:"tool.transform",id:"transform",tools}))))}};yield* plugin.effect({...context,session:wrapHook(context.session,"session.hook"),tool})})}`)
    const pluginConfig = JSON.stringify({ plugins: [path.join(paths.project, ".opencode/plugins/opencode2-config.js")] })
    await writeFile(path.join(paths.project, "opencode.json"), pluginConfig)
    proxy = await createProxyRecorder()
    const fixtures = await qualifyFixtures({ canonical, proxy, secrets })
    const env = isolatedEnvironment({ root: canonical, ...paths, password, proxyURL: proxy.url, pluginConfig })
    const host = path.join(artifact, "node_modules/@opencode-ai/cli-darwin-arm64/bin/opencode2")
    const runtime = await verifyCopiedRuntimeIdentity({
      cli: installedRuntime.cli,
      sdk: installedRuntime.sdk,
      copiedCli: host,
      copiedSdk: path.join(artifact, "node_modules/@opencode-ai/plugin/dist/promise/index.js"),
    })
    const version = await versionOf(host, env); if (version !== PINNED_REAL_HOST_VERSION) throw new Error(`REAL_HOST_VERSION_PIN_MISMATCH:${version}`)
    const profile = path.join(canonical, "sandbox.sb"); await writeFile(profile, sandboxProfile(canonical))
    child = spawn("/usr/bin/sandbox-exec", ["-f", profile, host, "serve", "--hostname", "127.0.0.1", "--port", "0", "--log-level", "all"], { cwd: paths.project, env, detached: true, stdio: ["ignore", "pipe", "pipe"] })
    child.stdout.on("data", (chunk) => output.push(Buffer.from(chunk))); child.stderr.on("data", (chunk) => output.push(Buffer.from(chunk))); await once(child, "spawn")
    const baseURL = await waitFor(() => Buffer.concat(output).toString().match(/server listening on (http:\/\/127\.0\.0\.1:\d+)/u)?.[1], Number(process.env.REAL_HOST_TIMEOUT_MS || 10_000)).catch(() => { throw new Error("REAL_HOST_START_FAILED") })
    const plugin = new URL("/api/plugin", baseURL); plugin.searchParams.set("location[directory]", paths.project)
    const response = await fetch(plugin, { headers: { Authorization: authorization }, signal: AbortSignal.timeout(10_000) }); if (!response.ok) throw new Error(`REAL_HOST_HTTP_${response.status}`); await response.arrayBuffer()
    const records = await waitFor(async () => { const values = await markers(marker); return values.filter((x) => x.kind === "registration").length === 4 ? values : undefined }, 10_000)
    await delay(100)
    const cleanup = await terminate()
    const all = await markers(marker); const registrations = all.filter((x) => x.kind === "registration"); const tools = registrations.find((x) => x.registration === "tool.transform")?.tools ?? []
    if (all.filter((x) => x.kind === "setup").length !== 1 || all.filter((x) => x.kind === "cleanup").length !== 1 || registrations.length !== 4 || JSON.stringify([...tools].sort()) !== JSON.stringify(TOOL_IDS)) throw new Error("REAL_HOST_REGISTRATION_MISMATCH")
    const rawOutput = Buffer.concat(output); const retainedFilesScanned = await scanRetainedFiles(canonical, { output: rawOutput, proxyRecords: proxy.records, secrets })
    const network = classifyProxyAttempts(proxy.records, { truncated: proxy.truncated })
    const capabilities = capabilityReport({ hostVersion: version, pluginApiVersion: PINNED_REAL_HOST_VERSION })
    return { supported: true, serve: { status: "confirmed", code: "REAL_HOST_SERVE_CONFIRMED" }, discovery: { status: "invoked", code: "REAL_HOST_PLUGIN_EFFECT_INVOKED", invoked: true, lifecycle: "effect" }, activation: { method: "GET", path: "/api/plugin", query: { "location[directory]": "<disposable-project>" }, authenticated: true }, http: { status: response.status, path: "/api/plugin", authenticated: true }, setupCount: 1, cleanupCount: 1, registrations: registrations.map((x) => `${x.registration}:${x.id}`), tools, artifact: { entrypoint: "artifact/dist/index.js", sha256: artifactHash, copied: true, runtime }, network, filesystem: { outsideWritesPrevented: true, retainedFilesScanned }, credentials: { providerCredentialsInherited: false, retainedRawMatches: 0, outputRawMatches: 0 }, processes: { forkPrevented: true, observedGroupMembersBeforeCleanup: cleanup.before, survivingGroupMembersAfterCleanup: cleanup.after }, fixtures, hostVersion: version, capabilities, output: "[captured output withheld]", topLevelWrites: (await readdir(canonical)).sort(), projectWrites: (await readdir(path.join(paths.project, ".opencode"))).sort() }
  } finally { await terminate(); await proxy?.close(); await rm(root, { recursive: true, force: true }); try { await stat(root); throw new Error("REAL_HOST_ROOT_NOT_REMOVED") } catch (error) { if (error.code !== "ENOENT") throw error } }
}
if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) process.stdout.write(`${JSON.stringify(await runRealHostSuite())}\n`)
