import assert from "node:assert/strict"
import { createHash } from "node:crypto"
import { spawn } from "node:child_process"
import { access, chmod, lstat, mkdir, readFile, readdir, realpath, writeFile } from "node:fs/promises"
import path from "node:path"

import { validateColdResolverDenial, validateFunctionalHost, validateInstalledPluginSetup } from "./functional-validation.mjs"
import { inspectPackageArchive } from "./package-archive.mjs"
import { extractReadmeSetup } from "./readme-setup.mjs"
import { startLoopbackRegistry } from "./registry-server.mjs"
import { EXPECTED_COMMAND_IDS, EXPECTED_HOST_VERSION, EXPECTED_SKILL_IDS } from "./validation-contract.mjs"

const digest = (contents) => createHash("sha256").update(contents).digest("hex")
const exists = (target) => access(target).then(() => true, () => false)
const capture = (command, args, options) => new Promise((resolve, reject) => {
  const child = spawn(command, args, { cwd: options.cwd, env: options.env, stdio: ["ignore", "pipe", "pipe"] })
  const stdout = []
  const stderr = []
  child.stdout.on("data", (chunk) => stdout.push(Buffer.from(chunk)))
  child.stderr.on("data", (chunk) => stderr.push(Buffer.from(chunk)))
  child.once("error", reject)
  child.once("close", (code, signal) => resolve({
    code,
    signal,
    stderr: Buffer.concat(stderr).toString("utf8"),
    stdout: Buffer.concat(stdout).toString("utf8"),
  }))
})

const contained = (root, target) => {
  const relative = path.relative(root, target)
  return relative === "" || (!relative.startsWith(`..${path.sep}`) && relative !== ".." && !path.isAbsolute(relative))
}

const cleanRoots = async (base, names) => {
  const roots = Object.fromEntries(names.map((name) => [name, path.join(base, name)]))
  await Promise.all(Object.values(roots).map((directory) => mkdir(directory, { recursive: true })))
  return roots
}

const assertEmptyDirectories = async (roots, names) => {
  for (const name of names) assert.deepEqual(await readdir(roots[name]), [], `${name} must begin empty`)
}

const gitShim = async (base) => {
  const directory = path.join(base, "vcs-shim")
  const log = path.join(base, "vcs-invocations.jsonl")
  await mkdir(directory, { recursive: true })
  for (const name of ["git", "gh"]) {
    const target = path.join(directory, name)
    await writeFile(target, `#!/bin/sh\nprintf '%s\\n' '${name}' >> '${log}'\nexit 97\n`, { flag: "wx", mode: 0o700 })
    await chmod(target, 0o700)
  }
  return { directory, log }
}

const environment = ({ cache, configHome, data, git, home, install, origin, temporary }) => ({
  BUN_CONFIG_REGISTRY: origin,
  BUN_INSTALL: install,
  BUN_INSTALL_CACHE_DIR: cache,
  BUN_TMPDIR: temporary,
  GIT_CONFIG_NOSYSTEM: "1",
  GIT_TERMINAL_PROMPT: "0",
  HOME: home,
  LANG: "C.UTF-8",
  NPM_CONFIG_REGISTRY: origin,
  OPENCODE_CONFIG_PROJECT_DISABLE: "1",
  OPENCODE_DISABLE_FFF: "1",
  OPENCODE_DISABLE_MODELS_FETCH: "1",
  PATH: `${git}:/usr/local/bin:/usr/bin:/bin`,
  TMPDIR: temporary,
  XDG_CACHE_HOME: cache,
  XDG_CONFIG_HOME: configHome,
  XDG_DATA_HOME: data,
})

const assertAbsentSetup = async (configRoot) => {
  for (const relative of [
    "node_modules",
    "plugins/opencode2-config",
    "plugins/opencode2-config.js",
    "plugins/opencode2-config.ts",
    "plugins/opencode2-config.receipt.json",
    "commands",
    "skills",
    "opencode2-config-bundle",
  ]) assert.equal(await exists(path.join(configRoot, relative)), false, relative)
}

const archiveFiles = (inspected) => new Map(inspected.entries
  .filter(({ path: entryPath, type }) => entryPath.startsWith("package/") && type === "0")
  .map((entry) => [entry.path.slice("package/".length), entry]))

const assetDestination = (configRoot, asset) => {
  if (asset.installDestination === "commands") return path.join(configRoot, "commands", `${asset.id}.md`)
  if (asset.installDestination === "agents") return path.join(configRoot, "agents", `${asset.id}.md`)
  if (asset.installDestination === "skills") {
    const [, , skill, ...resource] = asset.sourcePath.split("/")
    return path.join(configRoot, "skills", skill, ...resource)
  }
  if (asset.installDestination === "config") return path.join(configRoot, "opencode2-config-bundle", "config", asset.sourcePath.slice("assets/config/".length))
  assert.fail(`unknown install destination: ${asset.installDestination}`)
}

const verifyPackageBranch = async ({ configRoot, configText, product }) => {
  assert.equal(await readFile(path.join(configRoot, "opencode.json"), "utf8"), configText)
  assert.equal(await exists(path.join(configRoot, "node_modules")), false)
  const plugins = path.join(configRoot, "plugins")
  if (await exists(plugins)) assert.deepEqual(await readdir(plugins), [])
  for (const relative of ["plugins/opencode2-config", "plugins/opencode2-config.js", "plugins/opencode2-config.ts", "plugins/opencode2-config.receipt.json"]) {
    assert.equal(await exists(path.join(configRoot, relative)), false, relative)
  }
  const files = archiveFiles(product)
  const assetManifest = JSON.parse(files.get("assets/manifest.json").contents.toString("utf8"))
  const commands = (await readdir(path.join(configRoot, "commands"))).filter((name) => name.endsWith(".md")).map((name) => name.slice(0, -3)).sort()
  assert.deepEqual(commands, [...EXPECTED_COMMAND_IDS].sort())
  assert.deepEqual((await readdir(path.join(configRoot, "skills"))).sort(), [...EXPECTED_SKILL_IDS].sort())
  for (const asset of assetManifest.assets) {
    const source = files.get(asset.sourcePath)
    assert.ok(source, asset.sourcePath)
    assert.equal(digest(await readFile(assetDestination(configRoot, asset))), digest(source.contents), asset.sourcePath)
  }
  return {
    assets: assetManifest.assets.length,
    bundleAssets: assetManifest.assets.filter(({ installDestination }) => installDestination === "config").length,
    commands: commands.length,
    localPluginWrapper: false,
    localReceipt: false,
    skills: EXPECTED_SKILL_IDS.length,
  }
}

const walkPackageRoots = async (roots, name, version) => {
  const found = new Map()
  const seen = new Set()
  const walk = async (target) => {
    const canonical = await realpath(target).catch(() => undefined)
    if (!canonical || seen.has(canonical)) return
    seen.add(canonical)
    const details = await lstat(canonical)
    if (!details.isDirectory()) return
    const manifestPath = path.join(canonical, "package.json")
    if (await exists(manifestPath)) {
      let manifest
      try { manifest = JSON.parse(await readFile(manifestPath, "utf8")) } catch { manifest = undefined }
      if (manifest?.name === name && manifest?.version === version) found.set(canonical, manifest)
    }
    for (const entry of await readdir(canonical, { withFileTypes: true })) {
      if (entry.name === ".git") continue
      const child = path.join(canonical, entry.name)
      if (entry.isDirectory() || entry.isSymbolicLink()) await walk(child)
    }
  }
  for (const root of roots) await walk(root)
  return [...found.keys()].sort()
}

const verifyCachedProduct = async ({ allowedRoots, product, packageName, packageVersion }) => {
  const canonicalRoots = await Promise.all(allowedRoots.map((root) => realpath(root)))
  const packageRoots = await walkPackageRoots(canonicalRoots, packageName, packageVersion)
  assert.ok(packageRoots.length > 0, "OpenCode cold cache must contain the exact product")
  for (const packageRoot of packageRoots) assert.ok(canonicalRoots.some((root) => contained(root, packageRoot)), packageRoot)
  const packageRoot = packageRoots.find((candidate) => candidate.includes("node_modules")) ?? packageRoots[0]
  let matchedFiles = 0
  for (const entry of product.inventory.filter(({ type, path: entryPath }) => type === "file" && entryPath.startsWith("package/"))) {
    const target = path.join(packageRoot, entry.path.slice("package/".length))
    assert.ok(contained(packageRoot, target), entry.path)
    assert.equal(digest(await readFile(target)), entry.sha256, entry.path)
    matchedFiles += 1
  }
  return {
    archiveSha256: product.archive.sha256,
    matchedFiles,
    packageRoot,
    packageRoots: packageRoots.length,
  }
}

const phaseProductEvidence = (records, phase, packageName, version) => {
  const matching = records.filter((record) => record.phase === phase && record.name === packageName && (record.version === version || record.versions?.includes(version)))
  return {
    packuments: matching.filter(({ kind }) => kind === "packument").length,
    tarballs: matching.filter(({ kind }) => kind === "tarball").length,
    withheldTarballs: matching.filter(({ kind }) => kind === "withheld-product-tarball").length,
  }
}

export const validateRegistryPackageSmoke = async ({ inputRoot, prepared, validationRoot }) => {
  const registryLog = path.join(validationRoot, "registry-requests.jsonl")
  const vcs = await gitShim(validationRoot)
  const registry = await startLoopbackRegistry({ catalogPath: prepared.catalogPath, inputRoot, logPath: registryLog })
  try {
    const productRecord = prepared.product
    const productTarball = path.join(inputRoot, "registry", "tarballs", productRecord.filename)
    const product = await inspectPackageArchive(productTarball, { rejectLinks: true })
    const productMetadata = prepared.metadata.registry.product
    const readme = product.entries.find(({ path: entryPath }) => entryPath === "package/README.md").contents.toString("utf8")
    const extractedSetup = extractReadmeSetup(readme, productMetadata.packageSpec)
    const configText = extractedSetup.configText

    const roots = await cleanRoots(path.join(validationRoot, "positive"), [
      "bunx-cache", "bunx-data", "bunx-home", "bunx-install", "bunx-tmp",
      "config-home", "host-cache", "host-data", "host-home", "host-install", "host-tmp", "project", "disabled-project",
    ])
    const configRoot = path.join(roots["config-home"], "opencode")
    await mkdir(configRoot, { recursive: true })
    await writeFile(path.join(configRoot, "opencode.json"), configText, { flag: "wx" })
    await assertAbsentSetup(configRoot)
    await assertEmptyDirectories(roots, ["bunx-cache", "bunx-data", "bunx-home", "bunx-install", "bunx-tmp", "host-cache", "host-data", "host-home", "host-install", "host-tmp", "project", "disabled-project"])
    const bunxEnv = {
      ...environment({
        cache: roots["bunx-cache"], configHome: roots["config-home"], data: roots["bunx-data"], git: vcs.directory,
        home: roots["bunx-home"], install: roots["bunx-install"], origin: registry.origin, temporary: roots["bunx-tmp"],
      }),
      OPENCODE_CONFIG_DIR: configRoot,
    }
    registry.setPhase("bunx")
    const installer = await capture(prepared.catalog.readmeSetup.installerArgv[0], prepared.catalog.readmeSetup.installerArgv.slice(1), {
      cwd: roots.project,
      env: bunxEnv,
    })
    assert.equal(installer.code, 0, installer.stderr)
    assert.match(installer.stdout, /already configured as a package/u)
    assert.match(installer.stdout, /already pinned to @iamsterling\/opencode2-config@0\.1\.0/u)
    const installed = await verifyPackageBranch({ configRoot, configText, product })
    const bunxRequests = phaseProductEvidence(registry.records, "bunx", productRecord.name, productRecord.version)
    assert.ok(bunxRequests.packuments >= 1, JSON.stringify(bunxRequests))
    assert.ok(bunxRequests.tarballs >= 1, JSON.stringify(bunxRequests))

    const hostEnv = environment({
      cache: roots["host-cache"], configHome: roots["config-home"], data: roots["host-data"], git: vcs.directory,
      home: roots["host-home"], install: roots["host-install"], origin: registry.origin, temporary: roots["host-tmp"],
    })
    assert.notEqual(await realpath(roots["bunx-cache"]), await realpath(roots["host-cache"]))
    registry.setPhase("host-positive")
    const runtime = await validateFunctionalHost({
      configRoot,
      disabled: { env: hostEnv, project: roots["disabled-project"] },
      enabled: { env: hostEnv, project: roots.project },
      host: prepared.host,
      hostVersion: EXPECTED_HOST_VERSION,
      packageSpec: productMetadata.packageSpec,
    })
    const hostRequests = phaseProductEvidence(registry.records, "host-positive", productRecord.name, productRecord.version)
    assert.ok(hostRequests.packuments >= 1, JSON.stringify(hostRequests))
    assert.ok(hostRequests.tarballs >= 1, JSON.stringify(hostRequests))
    registry.setPhase("readme-verification")
    const verification = await capture(prepared.catalog.readmeSetup.verificationArgv[0], prepared.catalog.readmeSetup.verificationArgv.slice(1), {
      cwd: roots.project,
      env: { ...hostEnv, PATH: `${vcs.directory}:${path.dirname(prepared.host)}:/usr/local/bin:/usr/bin:/bin` },
    })
    assert.equal(verification.code, 0, verification.stderr)
    assert.match(verification.stdout, /iamsterling\.opencode2-config/u)
    const cached = await verifyCachedProduct({
      allowedRoots: [roots["host-cache"], roots["host-data"], roots["host-home"], roots["host-install"], roots["host-tmp"]],
      packageName: productRecord.name,
      packageVersion: productRecord.version,
      product,
    })
    const setupInstrumentation = await validateInstalledPluginSetup({
      directory: path.join(validationRoot, "setup-instrumentation"),
      hostVersion: EXPECTED_HOST_VERSION,
      pluginEntry: path.join(cached.packageRoot, "dist", "index.js"),
    })

    const denied = await cleanRoots(path.join(validationRoot, "cold-denial"), ["cache", "config-home", "data", "home", "install", "project", "tmp"])
    const deniedConfig = path.join(denied["config-home"], "opencode")
    await mkdir(deniedConfig, { recursive: true })
    await writeFile(path.join(deniedConfig, "opencode.json"), configText, { flag: "wx" })
    await assertAbsentSetup(deniedConfig)
    await assertEmptyDirectories(denied, ["cache", "data", "home", "install", "project", "tmp"])
    const deniedEnv = environment({
      cache: denied.cache, configHome: denied["config-home"], data: denied.data, git: vcs.directory,
      home: denied.home, install: denied.install, origin: registry.origin, temporary: denied.tmp,
    })
    registry.setPhase("cold-denial", { withholdProduct: true })
    const resolutionAttempted = () => {
      const evidence = phaseProductEvidence(registry.records, "cold-denial", productRecord.name, productRecord.version)
      return evidence.packuments >= 1 && evidence.withheldTarballs >= 1
    }
    const coldResolverDenial = await validateColdResolverDenial({ env: deniedEnv, host: prepared.host, project: denied.project, resolutionAttempted })
    const denialRequests = phaseProductEvidence(registry.records, "cold-denial", productRecord.name, productRecord.version)
    assert.ok(denialRequests.packuments >= 1, JSON.stringify(denialRequests))
    assert.ok(denialRequests.withheldTarballs >= 1, JSON.stringify(denialRequests))
    assert.deepEqual(await walkPackageRoots([denied.cache, denied.data, denied.home, denied.install, denied.tmp], productRecord.name, productRecord.version), [])
    assert.equal(await exists(vcs.log), false, "Git/GitHub shim was invoked")
    const deniedFallbacks = registry.records.filter((record) => record.kind === "denied")
    for (const record of deniedFallbacks) {
      if (record.status === 405) {
        assert.equal(record.method, "POST")
        assert.match(record.path, /^\/-\/npm\/v1\/security\/(?:advisories\/bulk|audits\/quick)$/u)
        continue
      }
      assert.equal(record.status, 404, JSON.stringify(record))
      assert.match(
        decodeURIComponent(record.path),
        /^\/(?:@msgpackr-extract\/msgpackr-extract-(?:darwin-(?:arm64|x64)|linux-(?:arm|arm64|x64)|win32-x64)|@opencode-ai\/theme|@opentui\/(?:core|keymap|solid)|node-gyp|solid-js|supports-color)$/u,
      )
    }
    return {
      mode: "smoke",
      input: "packed-product-loopback-registry",
      readme: {
        config: prepared.catalog.readmeSetup.config,
        installerArgv: prepared.catalog.readmeSetup.installerArgv,
        verificationExecuted: true,
        verificationArgv: prepared.catalog.readmeSetup.verificationArgv,
      },
      product: { archive: product.archive, packageSpec: productMetadata.packageSpec, packedFiles: product.inventory.length },
      registry: {
        allowlistOnly: true,
        bunx: bunxRequests,
        coldDenial: denialRequests,
        dependencyTarballs: prepared.metadata.registry.dependencyTarballs,
        host: hostRequests,
        noProxy: true,
        rejectedUninventoriedRequests: deniedFallbacks.length,
        requests: registry.records.length,
      },
      caches: { bunxAndHostSeparate: true, openCode: cached },
      installed,
      runtime,
      setupInstrumentation,
      negativeControls: { coldResolverDenial, installedDisable: runtime.negativeControl },
      gitInvocations: 0,
    }
  } finally {
    await registry.close()
  }
}
