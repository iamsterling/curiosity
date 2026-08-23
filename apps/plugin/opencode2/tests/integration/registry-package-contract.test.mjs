import assert from "node:assert/strict"
import { spawn } from "node:child_process"
import { mkdtemp, readFile, rm } from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import test from "node:test"

import { inspectPackageArchive, validatePackedProduct } from "../../tools/ephemeral-container/package-archive.mjs"
import { extractReadmeSetup } from "../../tools/ephemeral-container/readme-setup.mjs"
import { advanceRegistrySmokePhase } from "../../tools/ephemeral-container/registry-validation.mjs"

const pluginRoot = path.resolve(import.meta.dirname, "../..")
const packageManifest = JSON.parse(await readFile(path.join(pluginRoot, "package.json"), "utf8"))
const packageSpec = `${packageManifest.name}@${packageManifest.version}`
const packedFilename = "iamsterling-opencode2-config-0.1.0.tgz"

const capture = (command, args, options = {}) => new Promise((resolve, reject) => {
  const child = spawn(command, args, { cwd: options.cwd, env: process.env, stdio: ["ignore", "pipe", "pipe"] })
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

const withPackedProduct = async (operation) => {
  const temporary = await mkdtemp(path.join(os.tmpdir(), "opencode2-registry-pack-"))
  try {
    const packed = await capture("bun", ["pm", "pack", "--ignore-scripts", "--quiet", "--destination", temporary], { cwd: pluginRoot })
    assert.equal(packed.code, 0, packed.stderr)
    return await operation(await inspectPackageArchive(path.join(temporary, packedFilename), { rejectLinks: true }))
  } finally {
    await rm(temporary, { recursive: true, force: true })
  }
}

const assertGateDiagnostic = (operation, code, detail) => {
  assert.throws(operation, (error) => {
    assert.equal(error.message.startsWith(code), true, error.message)
    if (detail !== undefined) assert.match(error.message, new RegExp(JSON.stringify(detail).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "u"))
    return true
  })
}

test("README has one exact config-first packaged installer contract without latest", async () => {
  const readme = await readFile(path.join(pluginRoot, "README.md"), "utf8")
  const setup = extractReadmeSetup(readme, packageSpec)
  assert.deepEqual(setup.config, { $schema: "https://opencode.ai/config.json", plugins: [packageSpec] })
  assert.deepEqual(setup.installerArgv, ["bunx", "--bun", packageSpec])
  assert.deepEqual(setup.verificationArgv, ["opencode2", "plugin", "list"])
  assert.match(readme, /After a cold first start, repeat this exact command for up to 15 seconds only/u)
  assert.match(readme, /exactly `No plugins loaded`/u)
  assert.match(readme, /subset of the\s+pinned built-in inventory with no custom plugin ID/u)
  assert.match(readme, /continued absence after the bound,\s+is failure/u)
})

test("registry smoke phase guard rejects functional host work before cold README verification", () => {
  const completed = []
  assert.throws(() => advanceRegistrySmokePhase(completed, "functional-host"), {
    message: /OPENCODE2_README_COLD_ORDER_INVALID/u,
  })
  assert.deepEqual(completed, [])
  for (const phase of ["installer-setup", "readme-verification", "functional-host", "setup-instrumentation"]) {
    advanceRegistrySmokePhase(completed, phase)
  }
  assert.deepEqual(completed, ["installer-setup", "readme-verification", "functional-host", "setup-instrumentation"])
})

test("normal pack preserves the source manifest and excludes development/workspace surfaces", async () => {
  await withPackedProduct(async (product) => {
    const inspected = validatePackedProduct({ inspected: product, sourceManifest: packageManifest })
    const packedManifest = inspected.manifest
    assert.deepEqual(packedManifest, packageManifest, "pack tests must inspect, not rewrite, the source manifest")
    assert.notEqual(packedManifest.private, true)
    assert.deepEqual(packedManifest.publishConfig, { access: "public" })
    assert.equal(packedManifest.dependencies?.["@curiosity/runtime"], undefined)
  })
})

test("packed gate rejects every malformed registry surface and missing runtime target", async (context) => {
  await withPackedProduct(async (product) => {
    const manifestCase = async (name, code, mutate) => context.test(name, () => {
      const packedManifest = structuredClone(product.manifest)
      mutate(packedManifest)
      assertGateDiagnostic(
        () => validatePackedProduct({ inspected: { ...product, manifest: packedManifest }, sourceManifest: packageManifest }),
        code,
      )
    })
    await manifestCase("missing bin", "OPENCODE2_PACKED_BIN_INVALID", (manifest) => { delete manifest.bin })
    await manifestCase("wrong bin name", "OPENCODE2_PACKED_BIN_INVALID", (manifest) => { manifest.bin = { wrong: "tools/install-node.mjs" } })
    await manifestCase("wrong bin target", "OPENCODE2_PACKED_BIN_INVALID", (manifest) => { manifest.bin["opencode2-config"] = "dist/index.js" })
    await manifestCase("missing exports", "OPENCODE2_PACKED_EXPORTS_INVALID", (manifest) => { delete manifest.exports })
    await manifestCase("missing root export", "OPENCODE2_PACKED_EXPORTS_INVALID", (manifest) => { delete manifest.exports["."] })
    await manifestCase("extra export", "OPENCODE2_PACKED_EXPORTS_INVALID", (manifest) => { manifest.exports["./extra"] = "./dist/index.js" })
    for (const key of [".", "./server"]) {
      await manifestCase(`${key} import target`, "OPENCODE2_PACKED_EXPORTS_INVALID", (manifest) => { manifest.exports[key].import = "./dist/missing.js" })
      await manifestCase(`${key} types target`, "OPENCODE2_PACKED_EXPORTS_INVALID", (manifest) => { manifest.exports[key].types = "./dist/missing.d.ts" })
    }
    await manifestCase("missing top-level types", "OPENCODE2_PACKED_TYPES_INVALID", (manifest) => { delete manifest.types })
    await manifestCase("wrong top-level types", "OPENCODE2_PACKED_TYPES_INVALID", (manifest) => { manifest.types = "./dist/missing.d.ts" })
    for (const required of ["dist", "assets", "tools/install-node.mjs", "README.md", "LICENSE"]) {
      await manifestCase(`files missing ${required}`, "OPENCODE2_PACKED_FILES_INVALID", (manifest) => {
        manifest.files = manifest.files.filter((entry) => entry !== required)
      })
    }
    await manifestCase("files contains an extra surface", "OPENCODE2_PACKED_FILES_INVALID", (manifest) => { manifest.files.push("docs") })

    for (const target of ["package/tools/install-node.mjs", "package/dist/index.js", "package/dist/index.d.ts"]) {
      await context.test(`missing referenced target ${target}`, () => {
        const inventory = product.inventory.filter(({ path: entryPath }) => entryPath !== target)
        assertGateDiagnostic(
          () => validatePackedProduct({ inspected: { ...product, inventory }, sourceManifest: packageManifest }),
          "OPENCODE2_PACKED_TARGET_MISSING",
        )
      })
      await context.test(`non-regular referenced target ${target}`, () => {
        const inventory = product.inventory.map((entry) => entry.path === target ? { path: target, type: "symlink", mode: entry.mode, size: 1, target: "elsewhere" } : entry)
        assertGateDiagnostic(
          () => validatePackedProduct({ inspected: { ...product, inventory }, sourceManifest: packageManifest }),
          "OPENCODE2_PACKED_TARGET_NOT_REGULAR",
        )
      })
    }
    await context.test("packaged bin target must be executable", () => {
      const inventory = product.inventory.map((entry) => entry.path === "package/tools/install-node.mjs" ? { ...entry, mode: 0o644 } : entry)
      assertGateDiagnostic(
        () => validatePackedProduct({ inspected: { ...product, inventory }, sourceManifest: packageManifest }),
        "OPENCODE2_PACKED_BIN_NOT_EXECUTABLE",
      )
    })
    await context.test("source manifest is independently gated", () => {
      const sourceManifest = structuredClone(packageManifest)
      delete sourceManifest.bin
      assertGateDiagnostic(
        () => validatePackedProduct({ inspected: product, sourceManifest }),
        "OPENCODE2_PACKED_BIN_INVALID",
        "source",
      )
    })
  })
})

test("packed gate rejects optional, peer, development, and consumer metadata references to @curiosity/runtime", async (context) => {
  await withPackedProduct(async (product) => {
    const cases = {
      dependencies: (manifest) => { manifest.dependencies["@curiosity/runtime"] = "0.0.0" },
      optionalDependencies: (manifest) => { manifest.optionalDependencies = { "@curiosity/runtime": "0.0.0" } },
      peerDependencies: (manifest) => { manifest.peerDependencies = { "@curiosity/runtime": "0.0.0" } },
      devDependencies: (manifest) => { manifest.devDependencies["@curiosity/runtime"] = "0.0.0" },
      runtimeDependencies: (manifest) => { manifest.runtimeDependencies = { "@curiosity/runtime": "0.0.0" } },
      bundledDependencies: (manifest) => { manifest.bundledDependencies = ["@curiosity/runtime"] },
      peerDependenciesMeta: (manifest) => { manifest.peerDependenciesMeta = { "@curiosity/runtime": { optional: true } } },
      overrides: (manifest) => { manifest.overrides = { "@curiosity/runtime": "0.0.0" } },
      resolutions: (manifest) => { manifest.resolutions = { "@curiosity/runtime": "0.0.0" } },
    }
    for (const [section, mutate] of Object.entries(cases)) {
      await context.test(`${section} in source manifest`, () => {
        const sourceManifest = structuredClone(packageManifest)
        mutate(sourceManifest)
        assertGateDiagnostic(
          () => validatePackedProduct({ inspected: { ...product, manifest: structuredClone(sourceManifest) }, sourceManifest }),
          "OPENCODE2_PACKED_RUNTIME_DEPENDENCY_FORBIDDEN",
          section,
        )
      })
      await context.test(`${section} in packed manifest`, () => {
        const packedManifest = structuredClone(product.manifest)
        mutate(packedManifest)
        assertGateDiagnostic(
          () => validatePackedProduct({ inspected: { ...product, manifest: packedManifest }, sourceManifest: packageManifest }),
          "OPENCODE2_PACKED_RUNTIME_DEPENDENCY_FORBIDDEN",
          section,
        )
      })
    }
  })
})

test("runtime dependency gate recognizes selector and alias semantics without scanning unrelated text", async (context) => {
  await withPackedProduct(async (product) => {
    const rejected = {
      "reviewer resolution selector reproduction": {
        mutate: (manifest) => { manifest.resolutions = { "**/@curiosity/runtime": "0.0.0" } },
        path: ["resolutions", "**/@curiosity/runtime"],
      },
      "scoped parent resolution selector": {
        mutate: (manifest) => { manifest.resolutions = { "@scope/parent/@curiosity/runtime@^1": "0.0.0" } },
        path: ["resolutions", "@scope/parent/@curiosity/runtime@^1"],
      },
      "scoped pnpm override selector": {
        mutate: (manifest) => { manifest.overrides = { "@scope/parent@1 > @curiosity/runtime@2": "2.0.0" } },
        path: ["overrides", "@scope/parent@1 > @curiosity/runtime@2"],
      },
      "nested override selector": {
        mutate: (manifest) => { manifest.overrides = { "@scope/parent@1": { "**/@curiosity/runtime@2": "2.0.0" } } },
        path: ["overrides", "@scope/parent@1", "**/@curiosity/runtime@2"],
      },
      "dependency alias value": {
        mutate: (manifest) => { manifest.optionalDependencies = { alias: "npm:@curiosity/runtime@0.0.0" } },
        path: ["optionalDependencies", "alias"],
      },
      "override alias value": {
        mutate: (manifest) => { manifest.overrides = { alias: "npm:@curiosity/runtime@0.0.0" } },
        path: ["overrides", "alias"],
      },
      "override direct dependency reference": {
        mutate: (manifest) => { manifest.overrides = { alias: "$@curiosity/runtime" } },
        path: ["overrides", "alias"],
      },
    }
    for (const [name, { mutate, path: expectedPath }] of Object.entries(rejected)) {
      await context.test(name, () => {
        const packedManifest = structuredClone(product.manifest)
        mutate(packedManifest)
        assertGateDiagnostic(
          () => validatePackedProduct({ inspected: { ...product, manifest: packedManifest }, sourceManifest: packageManifest }),
          "OPENCODE2_PACKED_RUNTIME_DEPENDENCY_FORBIDDEN",
          expectedPath,
        )
      })
    }

    const accepted = {
      "root prose and scripts": (manifest) => {
        manifest.description = "Documentation may mention @curiosity/runtime without declaring it."
        manifest.scripts.note = "printf '@curiosity/runtime'"
      },
      "similarly prefixed package": (manifest) => { manifest.resolutions = { "**/@curiosity/runtime-tools": "1.0.0" } },
      "similarly prefixed scoped override": (manifest) => { manifest.overrides = { "@scope/parent>@curiosity/runtime-tools": "1.0.0" } },
      "unrelated metadata note": (manifest) => { manifest.peerDependenciesMeta = { "other-package": { note: "@curiosity/runtime" } } },
      "unrelated patch path": (manifest) => { manifest.patchedDependencies = { "other-package@1.0.0": "patches/@curiosity/runtime.patch" } },
      "alias to similarly prefixed package": (manifest) => { manifest.optionalDependencies = { alias: "npm:@curiosity/runtime-tools@1.0.0" } },
    }
    for (const [name, mutate] of Object.entries(accepted)) {
      await context.test(name, () => {
        const sourceManifest = structuredClone(packageManifest)
        mutate(sourceManifest)
        assert.doesNotThrow(() => validatePackedProduct({ inspected: { ...product, manifest: structuredClone(sourceManifest) }, sourceManifest }))
      })
    }
  })
})

test("manifest comparison ignores object and files allowlist ordering without weakening exact values", async () => {
  await withPackedProduct(async (product) => {
    const reordered = Object.fromEntries(Object.entries(product.manifest).reverse())
    reordered.files = [...reordered.files].reverse()
    assert.doesNotThrow(() => validatePackedProduct({ inspected: { ...product, manifest: reordered }, sourceManifest: packageManifest }))
  })
})
