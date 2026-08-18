import { createServer } from "node:http"
import { lstat, readdir, readFile, realpath } from "node:fs/promises"
import { createRequire } from "node:module"
import path from "node:path"
import { createHash } from "node:crypto"
import { randomBytes } from "node:crypto"
import { closeSync, constants, existsSync, fchmodSync, fstatSync, fsyncSync, linkSync, lstatSync as lstatFileSync, openSync, readSync, realpathSync as realpathFileSync, rmSync, unlinkSync, writeSync } from "node:fs"
import { fileURLToPath } from "node:url"

const fail = (code) => { throw new Error(code) }
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex")

export const copyVerifiedExecutable = ({ source, destination, expectedSha256, code }) => {
  if (!path.isAbsolute(source) || path.resolve(source) !== source || !path.isAbsolute(destination) || path.resolve(destination) !== destination || existsSync(destination)) fail(code)
  let canonical; let destinationParent
  try { canonical = realpathFileSync(source) } catch { fail(code) }
  try { destinationParent = lstatFileSync(path.dirname(destination)) } catch { fail(code) }
  if (canonical !== source || realpathFileSync(path.dirname(destination)) !== path.dirname(destination) || !destinationParent.isDirectory() || destinationParent.uid !== process.getuid() || (destinationParent.mode & 0o022) !== 0) fail(code)
  const temporary = `${destination}.copy-${process.pid}-${randomBytes(8).toString("hex")}`
  let input; let output; let identity; let published = false; const hash = createHash("sha256")
  try {
    input = openSync(source, constants.O_RDONLY | constants.O_NOFOLLOW); identity = fstatSync(input, { bigint: true })
    if (!identity.isFile() || identity.uid !== BigInt(process.getuid()) || (identity.mode & 0o022n) !== 0n || (identity.mode & 0o111n) === 0n) fail(code)
    output = openSync(temporary, constants.O_CREAT | constants.O_EXCL | constants.O_WRONLY | constants.O_NOFOLLOW, 0o700)
    const bytes = Buffer.alloc(1024 * 1024)
    while (true) { const length = readSync(input, bytes, 0, bytes.length, null); if (!length) break; hash.update(bytes.subarray(0, length)); let offset = 0; while (offset < length) offset += writeSync(output, bytes, offset, length - offset) }
    fchmodSync(output, 0o755); fsyncSync(output); closeSync(output); output = undefined
    if (hash.digest("hex") !== expectedSha256) fail(code)
    linkSync(temporary, destination); published = true; unlinkSync(temporary)
    let sourceStable = false
    try { const current = lstatFileSync(source, { bigint: true }); sourceStable = !current.isSymbolicLink() && current.dev === identity.dev && current.ino === identity.ino } catch {}
    return { path: destination, sourceStable }
  } catch (error) { rmSync(temporary, { force: true }); if (published) rmSync(destination, { force: true }); throw error }
  finally { if (output !== undefined) closeSync(output); if (input !== undefined) closeSync(input) }
}

export const runtimeIdentity = {
  cliExecutable: "5e25c1eb8c1afd5b0665340f9ba9c07eeb60d5e5e33434885a190cf034eb43ec",
  pluginSdk: "851132def23c2231aec95ed4b3b108e1e5ca7d9d316d398e9422a0f6346cf462",
}

export const resolveInstalledRuntimePaths = () => {
  const require = createRequire(import.meta.url)
  const cliPackage = require.resolve("@opencode-ai/cli/package.json")
  return {
    cli: require.resolve("@opencode-ai/cli-darwin-arm64/bin/opencode2", { paths: [path.dirname(cliPackage)] }),
    sdk: fileURLToPath(import.meta.resolve("@opencode-ai/plugin")),
  }
}

export const verifyCopiedRuntimeIdentity = async ({ cli, sdk, copiedCli, copiedSdk }) => {
  const observed = await Promise.all([cli, sdk, copiedCli, copiedSdk].map(async (file) => sha256(await readFile(file))))
  if (observed[0] !== runtimeIdentity.cliExecutable || observed[2] !== runtimeIdentity.cliExecutable) fail("REAL_HOST_CLI_IDENTITY_MISMATCH")
  if (observed[1] !== runtimeIdentity.pluginSdk || observed[3] !== runtimeIdentity.pluginSdk) fail("REAL_HOST_PLUGIN_SDK_IDENTITY_MISMATCH")
  return { cliExecutable: observed[2], pluginSdk: observed[3] }
}

export const canonicalRoot = async (root) => {
  const metadata = await lstat(root)
  if (metadata.isSymbolicLink()) fail("REAL_HOST_ROOT_SYMLINK")
  return realpath(root)
}

const schemeString = (value) => JSON.stringify(value)

export const sandboxProfile = (root, { network = true, localNetwork = true, writes = true, fork = true } = {}) => {
  const clauses = ["(version 1)", "(allow default)"]
  if (network) clauses.push("(deny network-outbound)", ...(localNetwork ? ['(allow network-outbound (remote ip "localhost:*"))'] : []))
  if (writes) clauses.push("(deny file-write*)", `(allow file-write* (subpath ${schemeString(root)}))`)
  if (fork) clauses.push("(deny process-fork)")
  return `${clauses.join("\n")}\n`
}

export const isolatedEnvironment = ({ root, home, config, data, cache, password, proxyURL, pluginConfig }) => ({
  PATH: process.env.PATH ?? "/usr/bin:/bin",
  HOME: home,
  XDG_CONFIG_HOME: config,
  XDG_DATA_HOME: data,
  XDG_CACHE_HOME: cache,
  OPENCODE_CONFIG_DIR: path.join(config, "opencode"),
  OPENCODE_CONFIG_CONTENT: pluginConfig,
  OPENCODE_CONFIG_PROJECT_DISABLE: "1",
  OPENCODE_PASSWORD: password,
  OPENCODE_DISABLE_MODELS_FETCH: "1",
  OPENCODE_DISABLE_FFF: "1",
  HTTP_PROXY: proxyURL,
  HTTPS_PROXY: proxyURL,
  ALL_PROXY: proxyURL,
  NO_PROXY: "127.0.0.1,localhost",
})

const normalizedAuthority = (authority) => authority.trim().toLowerCase().replace(/\.$/u, "")

/** Classifies only proxy-observed attempts; sandbox enforcement covers bypasses. */
export const classifyProxyAttempts = (records, { truncated = false } = {}) => {
  if (truncated) fail("REAL_HOST_PROXY_CAPACITY_EXHAUSTED")
  if (records.length) fail("REAL_HOST_EXTERNAL_ATTEMPT_OBSERVED")
  const catalog = records.filter((record) => record.method === "CONNECT" && normalizedAuthority(record.authority) === "models.opencode.ai:443" && record.disposition === "rejected")
  const unknown = records.filter((record) => !(record.method === "CONNECT" && normalizedAuthority(record.authority) === "models.opencode.ai:443" && record.disposition === "rejected"))
  if (unknown.length) {
    const hasAuthority = unknown.some((record) => normalizedAuthority(record.authority))
    fail(hasAuthority ? "REAL_HOST_EXTERNAL_ATTEMPT_OBSERVED" : "REAL_HOST_UNKNOWN_AUTHORITY_ATTEMPT")
  }
  if (catalog.length !== records.length) fail(`REAL_HOST_CATALOG_ATTEMPT_COUNT_MISMATCH:${catalog.length}:${records.length}`)
  return {
    successfulExternalEgressPrevented: true,
    successfulExternalEgressCount: 0,
    observedProxyAttempts: records.length,
    catalogMetadata: { method: "CONNECT", authority: "models.opencode.ai:443", disposition: "rejected", attempts: catalog.length },
    modelCatalogAttempts: catalog.length,
    githubAttempts: 0,
    providerInferenceAttempts: 0,
    successfulInferenceCount: 0,
    unknownAuthorityAttempts: 0,
  }
}

export const createProxyRecorder = async ({ capacity = 64 } = {}) => {
  const records = []
  let truncated = false
  const record = (entry) => {
    if (records.length >= capacity) { truncated = true; return }
    records.push({ ...entry, disposition: "rejected" })
  }
  const server = createServer((request, response) => {
    const authority = request.headers.host ?? ""
    const parsed = new URL(request.url ?? "/", `http://${authority || "localhost"}`)
    record({ method: request.method ?? "UNKNOWN", authority, path: parsed.pathname, modelCanary: parsed.pathname === "/model-canary" })
    response.writeHead(502).end()
  })
  server.on("connect", (request, socket) => {
    record({ method: "CONNECT", authority: request.url ?? "", path: "", modelCanary: false })
    socket.destroy()
  })
  await new Promise((resolve, reject) => { server.once("error", reject); server.listen(0, "127.0.0.1", resolve) })
  const address = server.address()
  if (!address || typeof address === "string") fail("REAL_HOST_PROXY_START_FAILED")
  return { records, get truncated() { return truncated }, url: `http://127.0.0.1:${address.port}`, close: () => new Promise((resolve, reject) => { server.close((error) => error ? reject(error) : resolve()); server.closeAllConnections() }) }
}

const byteMatches = (value, secret) => value.includes(Buffer.from(secret))

export const scanRetainedFiles = async (root, { output, proxyRecords = [], secrets, scanner = { readdir, lstat, readFile } }) => {
  const proxyMetadata = Buffer.from(JSON.stringify(proxyRecords))
  if (secrets.some((secret) => byteMatches(output, secret))) fail("REAL_HOST_SECRET_LEAK")
  if (secrets.some((secret) => byteMatches(proxyMetadata, secret))) fail("REAL_HOST_SECRET_LEAK")
  let files = 0
  const visit = async (directory) => {
    for (const entry of await scanner.readdir(directory, { withFileTypes: true })) {
      const file = path.join(directory, entry.name)
      const before = await scanner.lstat(file)
      if (before.isSymbolicLink()) fail("REAL_HOST_SCAN_SYMLINK")
      if (before.isDirectory()) { await visit(file); continue }
      if (!before.isFile()) fail("REAL_HOST_SCAN_NON_REGULAR")
      let content
      try { content = await scanner.readFile(file) } catch { fail("REAL_HOST_SCAN_UNREADABLE") }
      const after = await scanner.lstat(file)
      let stableContent
      try { stableContent = await scanner.readFile(file) } catch { fail("REAL_HOST_SCAN_UNREADABLE") }
      const stable = await scanner.lstat(file)
      if (after.isSymbolicLink() || stable.isSymbolicLink()
        || after.size !== before.size || stable.size !== before.size
        || after.mtimeMs !== before.mtimeMs || stable.mtimeMs !== before.mtimeMs
        || after.ctimeMs !== before.ctimeMs || stable.ctimeMs !== before.ctimeMs
        || after.ino !== before.ino || stable.ino !== before.ino
        || !Buffer.from(content).equals(Buffer.from(stableContent))) fail("REAL_HOST_SCAN_RACE")
      files += 1
      if (secrets.some((secret) => byteMatches(content, secret))) fail("REAL_HOST_SECRET_PERSISTED")
    }
  }
  await visit(root)
  return files
}
