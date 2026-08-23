#!/usr/bin/env node
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { cp, mkdir, mkdtemp, readFile, realpath, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  inspectPackageArchive,
  validatePackedProduct,
} from "../../apps/plugin/opencode2/tools/ephemeral-container/package-archive.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const PLUGIN_ROOT = path.join(ROOT, "apps/plugin/opencode2");
const RUNTIME_ROOT = path.join(ROOT, "apps/runtime");
const PLUGIN_NAME = "@iamsterling/opencode2-config";
const RUNTIME_NAME = "@curiosity/runtime";
const QUERY_CAPABILITY = new Uint8Array([1, 2, 3, 4]);

const run = (command, arguments_, options = {}) => {
  const result = spawnSync(command, arguments_, {
    cwd: options.cwd ?? ROOT,
    encoding: "utf8",
    env: options.env ?? process.env,
    maxBuffer: 8 * 1024 * 1024,
    stdio: options.capture === false ? "inherit" : "pipe",
    timeout: 180_000,
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`${options.code ?? "RUNTIME_PLUGIN_CONTRACT_COMMAND_FAILED"}:${command}:${result.status}\n${result.stderr ?? ""}`);
  }
  return String(result.stdout ?? "").trim();
};

const nativeFilename = () => `libcuriosity_runtime_native.${process.platform === "darwin" ? "dylib" : process.platform === "linux" ? "so" : "unsupported"}`;

const buildInputs = () => {
  run("cargo", ["build", "--manifest-path", "native/Cargo.toml", "--release", "--locked", "--no-default-features"], {
    cwd: RUNTIME_ROOT,
    capture: false,
    code: "RUNTIME_PLUGIN_CONTRACT_NATIVE_BUILD_FAILED",
  });
  run("bun", ["run", "build"], {
    cwd: PLUGIN_ROOT,
    capture: false,
    code: "RUNTIME_PLUGIN_CONTRACT_PLUGIN_BUILD_FAILED",
  });
};

const verifyPublicPackageBoundary = async (temporary) => {
  const manifest = JSON.parse(await readFile(path.join(PLUGIN_ROOT, "package.json"), "utf8"));
  const packedOutput = run("bun", ["pm", "pack", "--ignore-scripts", "--quiet", "--destination", temporary], {
    cwd: PLUGIN_ROOT,
    code: "RUNTIME_PLUGIN_CONTRACT_PACK_FAILED",
  });
  const archiveName = packedOutput.split(/\r?\n/u).findLast((line) => line.endsWith(".tgz"));
  if (!archiveName) throw new Error("RUNTIME_PLUGIN_CONTRACT_PACK_OUTPUT_INVALID");
  const inspected = await inspectPackageArchive(path.join(temporary, path.basename(archiveName)), { rejectLinks: true });
  validatePackedProduct({ inspected, sourceManifest: manifest });
  assert.equal(inspected.manifest.name, PLUGIN_NAME);
  assert.equal(inspected.manifest.dependencies?.[RUNTIME_NAME], undefined);
};

const stageRuntime = async (fixture) => {
  const runtimePackage = path.join(fixture, "node_modules/@curiosity/runtime");
  await mkdir(path.join(runtimePackage, "runtime"), { recursive: true });
  await mkdir(path.join(runtimePackage, "native"), { recursive: true });
  await mkdir(path.join(runtimePackage, "types"), { recursive: true });
  run("bun", ["build", "src/query.ts", "--target=bun", "--outfile", path.join(runtimePackage, "runtime/query.js")], {
    cwd: RUNTIME_ROOT,
    code: "RUNTIME_PLUGIN_CONTRACT_RUNTIME_BUILD_FAILED",
  });
  run(path.join(RUNTIME_ROOT, "node_modules/.bin/tsc"), ["-p", "tsconfig.types.json", "--outDir", path.join(runtimePackage, "types")], {
    cwd: RUNTIME_ROOT,
    code: "RUNTIME_PLUGIN_CONTRACT_TYPES_BUILD_FAILED",
  });
  await cp(path.join(RUNTIME_ROOT, "native/target/release", nativeFilename()), path.join(runtimePackage, "native", nativeFilename()));
  await writeFile(path.join(runtimePackage, "package.json"), `${JSON.stringify({
    name: RUNTIME_NAME,
    private: true,
    version: "0.0.0-contract",
    type: "module",
    exports: {
      "./query": {
        types: "./types/query.d.ts",
        import: "./runtime/query.js",
      },
    },
  }, null, 2)}\n`);
};

const stagePlugin = async (fixture) => {
  const pluginPackage = path.join(fixture, "node_modules/@iamsterling/opencode2-config");
  await mkdir(pluginPackage, { recursive: true });
  await cp(path.join(PLUGIN_ROOT, "dist"), path.join(pluginPackage, "dist"), { recursive: true });
  await writeFile(path.join(pluginPackage, "package.json"), `${JSON.stringify({ name: PLUGIN_NAME, private: true, type: "module" }, null, 2)}\n`);
  const effectSource = await realpath(path.join(PLUGIN_ROOT, "node_modules/effect"));
  await cp(effectSource, path.join(fixture, "node_modules/effect"), { recursive: true });
};

const stageAbsentCorpus = async (fixture) => {
  const stateRoot = path.join(fixture, "state");
  await mkdir(path.join(stateRoot, "authority"), { recursive: true });
  await writeFile(path.join(stateRoot, "format.json"), '{"format":"curiosity.corpus/v1"}\n');
  const digest = createHash("sha256").update(QUERY_CAPABILITY).digest("hex");
  await writeFile(path.join(stateRoot, "authority/query.sha256"), `${digest}\n`);
};

const executeContract = (fixture) => {
  const program = `
    import assert from "node:assert/strict";
    import { Effect } from "effect";
    import * as query from "@curiosity/runtime/query";
    import { createRuntimeSearchExecutor } from "./node_modules/@iamsterling/opencode2-config/dist/features/search/runtime-adapter.js";
    assert.deepEqual(Object.keys(query).sort(), ["createQueryRuntime", "queryRuntimeCapabilities"]);
    const capability = new Uint8Array(${JSON.stringify([...QUERY_CAPABILITY])});
    const executor = createRuntimeSearchExecutor({
      backend: "runtime",
      controlledPluginIds: ["iamsterling.opencode2-config"],
      runtime: {
        stateRoot: ${JSON.stringify(path.join(fixture, "state"))},
        workspaceScope: ${JSON.stringify(path.join(fixture, "workspace"))},
        queryCapability: capability,
        deadlineMs: 1_000,
      },
    });
    try {
      await Effect.runPromise(executor.open);
      await Effect.runPromise(executor.execute({ query: "bounded corpus absence", maxResults: 1 }, { agent: "researcher", id: "contract-1" }));
      console.log("UNEXPECTED_RUNTIME_SUCCESS");
      process.exitCode = 2;
    } catch (error) {
      console.log(error?.code ?? "MISSING_DIAGNOSTIC");
    } finally {
      executor.cleanup();
      executor.cleanup();
    }
  `;
  const environment = {
    HOME: fixture,
    LANG: "C",
    PATH: process.env.PATH ?? "/usr/bin:/bin",
    TMPDIR: fixture,
  };
  const result = run("bun", ["--eval", program], {
    cwd: fixture,
    env: environment,
    code: "RUNTIME_PLUGIN_CONTRACT_EXECUTION_FAILED",
  });
  assert.equal(result, "WEB_SEARCH_CORPUS_ABSENT");
};

export const verifyRuntimePluginContract = async ({ build = true } = {}) => {
  if (!new Set(["darwin", "linux"]).has(process.platform)) throw new Error("RUNTIME_PLUGIN_CONTRACT_PLATFORM_UNSUPPORTED");
  if (build) buildInputs();
  const temporary = await realpath(await mkdtemp(path.join(os.tmpdir(), "curiosity-runtime-plugin-contract-")));
  try {
    const fixture = path.join(temporary, "fixture");
    await mkdir(path.join(fixture, "node_modules"), { recursive: true });
    await mkdir(path.join(fixture, "workspace"));
    await stageAbsentCorpus(fixture);
    await verifyPublicPackageBoundary(temporary);
    await stageRuntime(fixture);
    await stagePlugin(fixture);
    executeContract(fixture);
    return true;
  } finally {
    await rm(temporary, { recursive: true, force: true });
    await rm(temporary, { recursive: true, force: true });
  }
};

if (path.resolve(process.argv[1] ?? "") === fileURLToPath(import.meta.url)) {
  const arguments_ = process.argv.slice(2);
  if (arguments_.some((argument) => argument !== "--no-build") || arguments_.length > 1) {
    console.error("usage: node tools/verification/runtime-plugin-contract.mjs [--no-build]");
    process.exitCode = 2;
  } else {
    try {
      await verifyRuntimePluginContract({ build: arguments_[0] !== "--no-build" });
      console.log("runtime-plugin executable contract passed");
    } catch (error) {
      console.error(error instanceof Error ? error.message : String(error));
      process.exitCode = 1;
    }
  }
}
