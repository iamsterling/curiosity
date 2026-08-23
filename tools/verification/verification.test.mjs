import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const execute = promisify(execFile);

test("query types resolve to the authoritative implementation rather than a handwritten declaration", async () => {
  const manifest = JSON.parse(await readFile(path.join(ROOT, "apps/runtime/package.json"), "utf8"));
  assert.equal(manifest.exports["./query"].types, "./src/query.ts");
  assert.equal(await readFile(path.join(ROOT, "apps/runtime/src/query.d.ts"), "utf8"), 'export * from "./query.js";\n');
  const declarationConfig = JSON.parse(await readFile(path.join(ROOT, "apps/runtime/tsconfig.types.json"), "utf8"));
  assert.equal(declarationConfig.exclude.includes("src/query.d.ts"), true);
});

test("current runtime documentation maps the historical query declaration range to authoritative symbols", async () => {
  const index = await readFile(path.join(ROOT, "apps/runtime/docs/README.md"), "utf8");
  assert.match(index, /Current source redirect and historical errata/u);
  assert.match(index, /`apps\/runtime\/src\/query\.d\.ts:1-29`/u);
  for (const authority of [
    "`apps/runtime/src/query.ts#createQueryRuntime`",
    "`apps/runtime/src/query.ts#queryRuntimeCapabilities`",
    "`apps/runtime/src/index.ts#RuntimeOptions`",
    "`apps/runtime/src/index.ts#QueryRuntimeOptions`",
  ]) assert.match(index, new RegExp(authority.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&"), "u"));
  const research = await readFile(path.join(ROOT, "apps/runtime/docs/research/reverse-engineering-retrieval-memory-systems-2026-08-18.md"), "utf8");
  assert.match(research, /apps\/runtime\/src\/query\.ts#createQueryRuntime/u);
  assert.match(research, /apps\/runtime\/src\/index\.ts#RuntimeOptions/u);
  assert.doesNotMatch(research, /apps\/runtime\/src\/query\.ts:1-10/u);
});

test("repository exposes an executable staged plugin and runtime contract", async () => {
  const root = JSON.parse(await readFile(path.join(ROOT, "package.json"), "utf8"));
  assert.equal(root.scripts["contract:runtime-plugin"], "node tools/verification/runtime-plugin-contract.mjs");
  const implementation = await import("./runtime-plugin-contract.mjs");
  assert.equal(typeof implementation.verifyRuntimePluginContract, "function");
});

test("registry smoke builds the plugin before executing installed setup evidence", async () => {
  const manifest = JSON.parse(await readFile(path.join(ROOT, "apps/plugin/opencode2/package.json"), "utf8"));
  assert.match(
    manifest.scripts["test:container:smoke"],
    /^bun run build && node --test tests\/integration\/functional-container-startup\.test\.mjs && node tools\/ephemeral-container\.mjs smoke$/u,
  );
});

test("versioned runtime compatibility evidence and ABI profiles are exact", async () => {
  const { verifyRuntimeContractEvidence } = await import("./runtime-contract-evidence.mjs");
  const evidence = await verifyRuntimeContractEvidence();
  assert.deepEqual(evidence.abi["query-only"], [
    "curiosity_runtime_v0_web_search",
    "curiosity_runtime_v1_corpus_query",
  ]);
  const { resolveNativeLibrary, verifyAbiSymbols } = await import("./native-abi.mjs");
  assert.throws(
    () => resolveNativeLibrary({ platform: "linux", directory: "/fixture", entries: ["libcuriosity_runtime_native.dylib"] }),
    /ABI_LIBRARY_MISSING:libcuriosity_runtime_native\.so/u,
  );
  assert.throws(
    () => verifyAbiSymbols({ profile: "query-only", output: "T curiosity_runtime_v0_web_search\n" }),
    /ABI_SYMBOL_MISMATCH:query-only/u,
  );
});

test("verification inventory is separate from capability lifecycle status", async () => {
  const inventory = JSON.parse(await readFile(path.join(ROOT, "docs/verification/inventory.json"), "utf8"));
  assert.equal(inventory.schemaVersion, 1);
  assert.equal("capabilities" in inventory, false);
  const historical = inventory.releaseArtifacts.find(({ id }) => id === "m7-historical-artifact");
  assert.equal(historical.sourceCommit, "0dfc71de02393da9aad37bc753724886c00e323c");
  assert.equal(historical.artifactSha256, "3aa8e5ba6660cafefb3d3121ba1e652346f4019a78922a0ec689b04b32e06642");
  const implementation = await import("./inventory-model.mjs");
  assert.equal(typeof implementation.verifyInventory, "function");
});

test("M7 status is split between immutable history and the unqualified source candidate", async () => {
  const status = JSON.parse(await readFile(path.join(ROOT, "docs/status/capabilities.json"), "utf8"));
  assert.equal(status.capabilities.length, 27);
  const historical = status.capabilities.find(({ id }) => id === "runtime-m7-historical");
  const candidate = status.capabilities.find(({ id }) => id === "runtime-m7-current");
  assert.equal(historical.status, "Current");
  assert.equal(historical.scope.constraints.includes("source commit 0dfc71de02393da9aad37bc753724886c00e323c"), true);
  assert.equal(candidate.status, "Deferred");
  assert.equal(candidate.qualification.state, "unqualified");
  assert.equal(candidate.availability.state, "disabled");
});

test("Linux network denial is fail-closed and enforces the exact Rust pin", async () => {
  const source = await readFile(path.join(ROOT, "apps/runtime/tools/network-denied-linux.sh"), "utf8");
  assert.match(source, /EXPECTED_RUST=1\.97\.1/u);
  assert.match(source, /RUNTIME_RUST_PIN_MISMATCH/u);
  assert.match(source, /sudo -n unshare -n -- \/bin\/sh/u);
  assert.match(source, /PATH="\$5:\/usr\/bin:\/bin"/u);
  assert.doesNotMatch(source, /\bexit 0\b/u);
});

test("Turbo test and verify hashes include repository verification and runtime contract inputs exactly once", async () => {
  const futureInput = path.join(ROOT, "apps/runtime/src/turbo-future-source-fixture.ts");
  await writeFile(futureInput, "export {};\n", "utf8");
  let graph;
  try {
    const { stdout } = await execute(
      path.join(ROOT, "node_modules/.bin/turbo"),
      ["run", "test", "verify", "--dry=json"],
      { cwd: ROOT, maxBuffer: 64 * 1024 * 1024 },
    );
    graph = JSON.parse(stdout);
  } finally {
    await rm(futureInput, { force: true });
  }
  const requiredInputs = [
    "docs/verification/inventory.json",
    "apps/runtime/tools/run-test-profile.mjs",
    "apps/runtime/tools/verify-profile.mjs",
    "apps/runtime/src/query.ts",
    "apps/runtime/src/repository-search.ts",
    "apps/runtime/src/turbo-future-source-fixture.ts",
    "apps/runtime/package.json",
    "apps/runtime/tsconfig.json",
    "apps/runtime/tsconfig.types.json",
    "apps/plugin/opencode2/src/features/search/runtime-adapter.ts",
    "apps/plugin/opencode2/package.json",
    "apps/plugin/opencode2/tsconfig.json",
    "apps/plugin/opencode2/tsconfig.build.json",
    "apps/plugin/opencode2/tsconfig.contract.json",
  ];
  for (const packageName of ["@curiosity/runtime", "@iamsterling/opencode2-config"]) {
    for (const taskName of ["test", "verify"]) {
      const matches = graph.tasks.filter((task) => task.package === packageName && task.task === taskName);
      assert.equal(matches.length, 1, `${packageName}#${taskName}`);
      assert.doesNotMatch(matches[0].command, /turbo\s+run\s+(?:test|verify)/u);
      const inputs = Object.keys(matches[0].inputs).map((input) => path.posix.normalize(path.posix.join(matches[0].directory, input)));
      for (const required of requiredInputs)
        assert.equal(inputs.filter((input) => input === required).length, 1, `${packageName}#${taskName}:${required}`);
    }
  }
});

test("the required workspace command reaches honest starter syntax and package contract checks", async () => {
  const typescript = await import("typescript");
  for (const starter of ["apps/docs", "apps/web"]) {
    const manifest = JSON.parse(await readFile(path.join(ROOT, starter, "package.json"), "utf8"));
    for (const command of ["lint", "check-types", "build", "test"])
      assert.equal(manifest.scripts.verify.match(new RegExp(`bun run ${command}(?:\\s|$)`, "gu"))?.length, 1, `${starter}:${command}`);
    const source = await readFile(path.join(ROOT, starter, "app/page.tsx"), "utf8");
    const broken = source.replace("export default function Home()", "export default function Home(");
    const diagnostics = typescript.transpileModule(broken, {
      reportDiagnostics: true,
      compilerOptions: { jsx: typescript.JsxEmit.Preserve, module: typescript.ModuleKind.ESNext, target: typescript.ScriptTarget.ESNext },
    }).diagnostics ?? [];
    assert.equal(diagnostics.some(({ category }) => category === typescript.DiagnosticCategory.Error), true, starter);
  }
  for (const configuration of ["packages/eslint-config", "packages/typescript-config"])
    assert.equal(JSON.parse(await readFile(path.join(ROOT, configuration, "package.json"), "utf8")).scripts.verify, "bun run test");
  const { stdout } = await execute(
    path.join(ROOT, "node_modules/.bin/turbo"),
    [
      "run", "verify", "--filter=docs", "--filter=web", "--filter=@repo/ui",
      "--filter=@repo/eslint-config", "--filter=@repo/typescript-config", "--dry=json",
    ],
    { cwd: ROOT, maxBuffer: 64 * 1024 * 1024 },
  );
  const taskIds = JSON.parse(stdout).tasks.map(({ taskId }) => taskId).sort();
  assert.deepEqual(taskIds, [
    "@repo/eslint-config#verify",
    "@repo/typescript-config#verify",
    "@repo/ui#verify",
    "docs#verify",
    "web#verify",
  ]);
});
