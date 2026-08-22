import { createHash } from "node:crypto"
import { spawn } from "node:child_process"
import { access, mkdir, readFile, realpath, writeFile } from "node:fs/promises"
import path from "node:path"

import { inspectPackageArchive, validatePackedProduct } from "./package-archive.mjs"
import { extractReadmeSetup } from "./readme-setup.mjs"

const fail = (code, detail) => {
  const suffix = detail === undefined ? "" : `:${JSON.stringify(detail)}`
  throw new Error(`${code}${suffix}`)
}
const digest = (value) => createHash("sha256").update(value).digest("hex")
const exists = (target) => access(target).then(() => true, () => false)
const run = (command, args, options = {}) => new Promise((resolve, reject) => {
  const child = spawn(command, args, { cwd: options.cwd, env: process.env, stdio: ["ignore", "pipe", "pipe"] })
  const stdout = []
  const stderr = []
  child.stdout.on("data", (chunk) => stdout.push(Buffer.from(chunk)))
  child.stderr.on("data", (chunk) => stderr.push(Buffer.from(chunk)))
  child.once("error", reject)
  child.once("close", (code) => {
    const result = { code, stderr: Buffer.concat(stderr).toString("utf8"), stdout: Buffer.concat(stdout).toString("utf8") }
    if (code === 0) resolve(result)
    else reject(new Error(`${options.code ?? "OPENCODE2_PACKAGE_COMMAND_FAILED"}:${code}`))
  })
})

const packagePath = (modules, name) => path.join(modules, ...name.split("/"))

const resolveInstalledPackage = async ({ environment, from, name }) => {
  let cursor = from
  while (true) {
    const modules = path.basename(cursor) === "node_modules" ? cursor : path.join(cursor, "node_modules")
    const candidate = packagePath(modules, name)
    if (await exists(path.join(candidate, "package.json"))) return realpath(candidate)
    const parent = path.dirname(cursor)
    if (parent === cursor || !path.resolve(parent).startsWith(path.resolve(environment))) break
    cursor = parent
  }
  return undefined
}

const installedProductClosure = async ({ environment, roots }) => {
  const canonicalEnvironment = await realpath(environment)
  const pending = roots.map((name) => ({ from: canonicalEnvironment, name, optional: false }))
  const packages = new Map()
  while (pending.length > 0) {
    const request = pending.shift()
    const location = await resolveInstalledPackage({ environment: canonicalEnvironment, from: request.from, name: request.name })
    if (!location) {
      if (request.optional) continue
      fail("OPENCODE2_LOCKED_DEPENDENCY_NOT_INSTALLED", request.name)
    }
    const manifest = JSON.parse(await readFile(path.join(location, "package.json"), "utf8"))
    const identity = `${manifest.name}@${manifest.version}`
    if (packages.has(identity)) continue
    packages.set(identity, { identity, location, manifest, name: manifest.name, version: manifest.version })
    for (const name of Object.keys(manifest.dependencies ?? {})) pending.push({ from: location, name, optional: false })
    for (const name of Object.keys(manifest.optionalDependencies ?? {})) pending.push({ from: location, name, optional: true })
  }
  return [...packages.values()].sort((left, right) => left.identity.localeCompare(right.identity))
}

const parseBunLock = async (lockPath) => {
  const source = await readFile(lockPath, "utf8")
  let lock
  try {
    lock = JSON.parse(source.replace(/,\s*([}\]])/gu, "$1"))
  } catch {
    fail("OPENCODE2_TEST_ENVIRONMENT_LOCK_INVALID")
  }
  const records = new Map()
  for (const value of Object.values(lock.packages ?? {})) {
    const [identity, sourceType, , integrity] = value
    if (sourceType !== "" || typeof identity !== "string" || typeof integrity !== "string") continue
    const current = records.get(identity)
    if (current && current !== integrity) fail("OPENCODE2_LOCK_INTEGRITY_AMBIGUOUS", identity)
    records.set(identity, integrity)
  }
  return records
}

const registryName = (name) => name.replace("/", "%2f")
const fetchExactTarball = async ({ destination, identity, integrity, name, sourceRegistry, version }) => {
  const metadataURL = new URL(`${registryName(name)}/${encodeURIComponent(version)}`, sourceRegistry)
  const response = await fetch(metadataURL, {
    headers: { Accept: "application/json" },
    redirect: "error",
    signal: AbortSignal.timeout(30_000),
  })
  if (!response.ok) fail("OPENCODE2_DEPENDENCY_METADATA_FETCH_FAILED", { identity, status: response.status })
  const metadata = await response.json()
  if (metadata?.name !== name || metadata?.version !== version || typeof metadata?.dist?.tarball !== "string") {
    fail("OPENCODE2_DEPENDENCY_METADATA_INVALID", identity)
  }
  const tarballURL = new URL(metadata.dist.tarball)
  if (tarballURL.protocol !== "https:" || tarballURL.username || tarballURL.password || tarballURL.origin !== sourceRegistry.origin) {
    fail("OPENCODE2_DEPENDENCY_TARBALL_ORIGIN_INVALID", identity)
  }
  const tarballResponse = await fetch(tarballURL, { redirect: "error", signal: AbortSignal.timeout(60_000) })
  if (!tarballResponse.ok) fail("OPENCODE2_DEPENDENCY_TARBALL_FETCH_FAILED", { identity, status: tarballResponse.status })
  const contents = Buffer.from(await tarballResponse.arrayBuffer())
  const actualIntegrity = `sha512-${createHash("sha512").update(contents).digest("base64")}`
  if (actualIntegrity !== integrity || metadata.dist.integrity !== integrity) fail("OPENCODE2_DEPENDENCY_TARBALL_INTEGRITY_INVALID", identity)
  await writeFile(destination, contents, { flag: "wx", mode: 0o444 })
  const inspected = await inspectPackageArchive(destination, { rejectLinks: true })
  if (inspected.manifest.name !== name || inspected.manifest.version !== version || inspected.archive.integrity !== integrity) {
    fail("OPENCODE2_DEPENDENCY_TARBALL_IDENTITY_INVALID", identity)
  }
  return inspected
}

const concurrentMap = async (values, concurrency, operation) => {
  const output = new Array(values.length)
  let cursor = 0
  await Promise.all(Array.from({ length: Math.min(concurrency, values.length) }, async () => {
    while (cursor < values.length) {
      const index = cursor
      cursor += 1
      output[index] = await operation(values[index], index)
    }
  }))
  return output
}

const registryRecord = ({ filename, inspected, kind }) => ({
  archive: inspected.archive,
  filename,
  kind,
  manifest: inspected.manifest,
  name: inspected.manifest.name,
  version: inspected.manifest.version,
})

export const prepareRegistry = async ({ environment, inputRoot, lockPath, pluginRoot, sourceManifest }) => {
  const registry = path.join(inputRoot, "registry")
  const tarballDirectory = path.join(registry, "tarballs")
  await mkdir(tarballDirectory, { recursive: true })
  const packed = await run("bun", ["pm", "pack", "--ignore-scripts", "--quiet", "--destination", tarballDirectory], {
    code: "OPENCODE2_PRODUCT_PACK_FAILED",
    cwd: pluginRoot,
  })
  const productOutput = packed.stdout.trim().split("\n").at(-1)
  const productName = productOutput ? path.basename(productOutput) : undefined
  if (!productName || path.resolve(productOutput) !== path.resolve(tarballDirectory, productName)) fail("OPENCODE2_PRODUCT_PACK_OUTPUT_INVALID")
  const productTarball = path.join(tarballDirectory, productName)
  const product = validatePackedProduct({ inspected: await inspectPackageArchive(productTarball, { rejectLinks: true }), sourceManifest })
  const packageSpec = `${product.manifest.name}@${product.manifest.version}`
  const readmeEntry = product.entries.find(({ path: entryPath, type }) => entryPath === "package/README.md" && type === "0")
  if (!readmeEntry) fail("OPENCODE2_PACKED_README_MISSING")
  const setup = extractReadmeSetup(readmeEntry.contents.toString("utf8"), packageSpec)

  const closure = await installedProductClosure({ environment, roots: Object.keys(sourceManifest.dependencies ?? {}) })
  const lock = await parseBunLock(lockPath)
  const sourceRegistry = new URL(process.env.OPENCODE2_PACKAGE_SOURCE_REGISTRY ?? "https://registry.npmjs.org/")
  if (sourceRegistry.protocol !== "https:" || sourceRegistry.username || sourceRegistry.password || sourceRegistry.pathname !== "/") {
    fail("OPENCODE2_PACKAGE_SOURCE_REGISTRY_INVALID")
  }
  const dependencies = await concurrentMap(closure, 8, async (dependency) => {
    const integrity = lock.get(dependency.identity)
    if (!integrity?.startsWith("sha512-")) fail("OPENCODE2_LOCKED_DEPENDENCY_INTEGRITY_MISSING", dependency.identity)
    const filename = `${digest(dependency.identity)}.tgz`
    const inspected = await fetchExactTarball({
      destination: path.join(tarballDirectory, filename),
      identity: dependency.identity,
      integrity,
      name: dependency.name,
      sourceRegistry,
      version: dependency.version,
    })
    return registryRecord({ filename, inspected, kind: "lock-resolved-dependency" })
  })
  const productRecord = registryRecord({ filename: productName, inspected: product, kind: "product" })
  const catalog = {
    schemaVersion: 1,
    allowlistOnly: true,
    noProxy: true,
    packages: [productRecord, ...dependencies].sort((left, right) => `${left.name}@${left.version}`.localeCompare(`${right.name}@${right.version}`)),
    product: {
      archive: product.archive,
      inventory: product.inventory,
      name: product.manifest.name,
      packageSpec,
      version: product.manifest.version,
    },
    readmeSetup: {
      config: setup.config,
      installerArgv: setup.installerArgv,
      verificationArgv: setup.verificationArgv,
    },
  }
  await writeFile(path.join(registry, "catalog.json"), `${JSON.stringify(catalog, null, 2)}\n`, { flag: "wx" })
  return {
    allowlistOnly: true,
    catalog: "registry/catalog.json",
    dependencyTarballs: dependencies.length,
    noProxy: true,
    product: catalog.product,
    schemaVersion: 1,
  }
}
