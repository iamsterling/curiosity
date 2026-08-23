import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { execFile } from "node:child_process";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";

import { createFileRepository } from "../status/status-repository.mjs";
import { verifyInventory } from "./inventory-model.mjs";
import { verifyAbiSymbols } from "./native-abi.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const INVENTORY = path.join(ROOT, "docs/verification/inventory.json");
const load = async () => JSON.parse(await readFile(INVENTORY, "utf8"));
const execute = promisify(execFile);

const overlay = (base, changes) => ({
  assertPath: (relative) => base.assertPath(relative),
  exists: async (relative) => relative in changes ? changes[relative] !== null : base.exists(relative),
  read: async (relative) => relative in changes ? changes[relative] : base.read(relative),
  listFiles: async (relative) => {
    const files = new Set(await base.listFiles(relative));
    for (const [file, value] of Object.entries(changes)) {
      if (file === relative || file.startsWith(`${relative}/`)) value === null ? files.delete(file) : files.add(file);
    }
    return [...files].sort();
  },
  historicalIdentity: (relative) => base.historicalIdentity(relative),
});

const rejects = async (operation, code) => assert.rejects(operation, (error) => {
  assert.ok(error instanceof Error);
  assert.match(error.message, new RegExp(`^${code}:`, "u"));
  return true;
});

test("verification inventory fails closed for a new package and an unclassified script or export", async (context) => {
  const inventory = await load();
  const repository = createFileRepository(ROOT);
  await context.test("new package", () => rejects(
    () => verifyInventory(inventory, overlay(repository, { "packages/unreviewed/package.json": '{"name":"unreviewed","private":true}\n' })),
    "VERIFICATION_PACKAGE_INVENTORY",
  ));
  await context.test("new nested package", () => rejects(
    () => verifyInventory(inventory, overlay(repository, { "apps/plugin/opencode2/tools/unreviewed/package.json": '{"name":"unreviewed-nested","private":true}\n' })),
    "VERIFICATION_PACKAGE_INVENTORY",
  ));
  await context.test("script", async () => {
    const manifest = JSON.parse(await repository.read("packages/ui/package.json"));
    manifest.scripts.unreviewed = "true";
    await rejects(() => verifyInventory(inventory, overlay(repository, { "packages/ui/package.json": `${JSON.stringify(manifest)}\n` })), "VERIFICATION_PACKAGE_SCRIPTS");
  });
  await context.test("export", async () => {
    const manifest = JSON.parse(await repository.read("packages/ui/package.json"));
    manifest.exports["./unreviewed"] = "./src/button.tsx";
    await rejects(() => verifyInventory(inventory, overlay(repository, { "packages/ui/package.json": `${JSON.stringify(manifest)}\n` })), "VERIFICATION_PACKAGE_EXPORTS");
  });
});

test("verification inventory fails closed for a new test, a skipped expected profile, and Cargo drift", async (context) => {
  const inventory = await load();
  const repository = createFileRepository(ROOT);
  await context.test("test", () => rejects(
    () => verifyInventory(inventory, overlay(repository, { "apps/runtime/tests/unreviewed.test.ts": 'import { test } from "bun:test"; test("x",()=>{});\n' })),
    "VERIFICATION_TEST_INVENTORY",
  ));
  await context.test("profile mapping", async () => {
    const changed = structuredClone(inventory);
    const expected = changed.tests.find(({ profiles }) => profiles.includes("network-denied"));
    expected.profiles = expected.profiles.filter((profile) => profile !== "network-denied");
    await rejects(() => verifyInventory(changed, repository), "VERIFICATION_TEST_PROFILE");
  });
  await context.test("crate", async () => {
    const cargo = await repository.read("apps/runtime/native/Cargo.toml");
    await rejects(() => verifyInventory(inventory, overlay(repository, { "apps/runtime/native/Cargo.toml": cargo.replace('admin = []', 'unreviewed = []') })), "VERIFICATION_CARGO_SURFACE");
  });
  await context.test("implicit Cargo build script", () => rejects(
    () => verifyInventory(inventory, overlay(repository, { "apps/runtime/native/build.rs": "fn main() {}\n" })),
    "VERIFICATION_CARGO_SURFACE",
  ));
  await context.test("explicit Cargo package build script", async () => {
    const cargo = await repository.read("apps/runtime/native/Cargo.toml");
    await rejects(
      () => verifyInventory(inventory, overlay(repository, {
        "apps/runtime/native/Cargo.toml": cargo.replace("publish = false", 'publish = false\nbuild = "tools/build.rs"'),
        "apps/runtime/native/tools/build.rs": "fn main() {}\n",
      })),
      "VERIFICATION_CARGO_SURFACE",
    );
  });
});

test("ABI and workflow action, condition, and aggregate drift fail closed", async (context) => {
  assert.throws(() => verifyAbiSymbols({ profile: "default", output: "T curiosity_runtime_v0_web_search\n" }), /ABI_SYMBOL_MISMATCH/u);
  const inventory = await load();
  const repository = createFileRepository(ROOT);
  const workflow = await repository.read(".github/workflows/opencode2.yml");
  for (const [name, changed] of [
    ["action", workflow.replace("actions/checkout@d23441a48e516b6c34aea4fa41551a30e30af803", "actions/checkout@main")],
    ["condition", workflow.replace("if: always() &&", "if: success() &&")],
    ["aggregate", workflow.replace('test "$RUNTIME_PORTABLE" = success', 'test "$RUNTIME_PORTABLE" != failure')],
  ]) await context.test(name, () => rejects(
    () => verifyInventory(inventory, overlay(repository, { ".github/workflows/opencode2.yml": changed })),
    "VERIFICATION_WORKFLOW_DRIFT",
  ));

  await context.test("write-all remains forbidden after an inventory hash refresh", async () => {
    const changedSource = workflow.replace("permissions:\n  contents: read", "permissions: write-all");
    const changedInventory = structuredClone(inventory);
    changedInventory.workflows[0].sha256 = createHash("sha256").update(changedSource).digest("hex");
    await rejects(
      () => verifyInventory(changedInventory, overlay(repository, { ".github/workflows/opencode2.yml": changedSource })),
      "VERIFICATION_WORKFLOW_PERMISSIONS",
    );
  });
  await context.test("job write permission remains forbidden after an inventory hash refresh", async () => {
    const changedSource = workflow.replace("  darwin-compatibility:\n    name:", "  darwin-compatibility:\n    permissions:\n      contents: write\n    name:");
    const changedInventory = structuredClone(inventory);
    changedInventory.workflows[0].sha256 = createHash("sha256").update(changedSource).digest("hex");
    await rejects(
      () => verifyInventory(changedInventory, overlay(repository, { ".github/workflows/opencode2.yml": changedSource })),
      "VERIFICATION_WORKFLOW_PERMISSIONS",
    );
  });
  await context.test("required aggregate omission remains forbidden after an inventory hash refresh", async () => {
    const changedSource = workflow
      .replace("needs: [inventory-status, workspace-verification, plugin-linux, registry-smoke, runtime-portable]", "needs: [inventory-status, workspace-verification, registry-smoke, runtime-portable]")
      .replace("          PLUGIN_LINUX: ${{ needs.plugin-linux.result }}\n", "")
      .replace('          test "$PLUGIN_LINUX" = success\n', "");
    const changedInventory = structuredClone(inventory);
    changedInventory.workflows[0].sha256 = createHash("sha256").update(changedSource).digest("hex");
    const gate = changedInventory.workflows[0].jobs.find(({ id }) => id === "required-gate");
    gate.needs = gate.needs.filter((id) => !["plugin-linux", "runtime-network-denied"].includes(id));
    gate.commands = gate.commands.filter((command) => !['test "$PLUGIN_LINUX" = success', 'test "$RUNTIME_NETWORK_DENIED" = success'].includes(command));
    await rejects(
      () => verifyInventory(changedInventory, overlay(repository, { ".github/workflows/opencode2.yml": changedSource })),
      "VERIFICATION_WORKFLOW_REQUIRED_AGGREGATE",
    );
  });
  await context.test("an explicitly inventoried approved job read scope remains allowed", async () => {
    const changedSource = workflow.replace("  inventory-status:\n    name:", "  inventory-status:\n    permissions: { checks: read }\n    name:");
    const changedInventory = structuredClone(inventory);
    changedInventory.workflows[0].sha256 = createHash("sha256").update(changedSource).digest("hex");
    changedInventory.workflows[0].jobs.find(({ id }) => id === "inventory-status").permissions = { checks: "read" };
    assert.equal(
      await verifyInventory(changedInventory, overlay(repository, { ".github/workflows/opencode2.yml": changedSource })),
      true,
    );
  });
});

test("dependency, Cargo target, and required record additions and omissions fail closed", async (context) => {
  const inventory = await load();
  const repository = createFileRepository(ROOT);
  await context.test("external package dependency", async () => {
    const manifest = JSON.parse(await repository.read("packages/ui/package.json"));
    manifest.devDependencies["unreviewed-external"] = "1.0.0";
    await rejects(
      () => verifyInventory(inventory, overlay(repository, { "packages/ui/package.json": `${JSON.stringify(manifest)}\n` })),
      "VERIFICATION_PACKAGE_DEPENDENCIES",
    );
  });
  await context.test("workspace package dependency", async () => {
    const manifest = JSON.parse(await repository.read("packages/ui/package.json"));
    manifest.devDependencies["@curiosity/runtime"] = "workspace:*";
    await rejects(
      () => verifyInventory(inventory, overlay(repository, { "packages/ui/package.json": `${JSON.stringify(manifest)}\n` })),
      "VERIFICATION_PACKAGE_DEPENDENCIES",
    );
  });
  await context.test("inventoried mutable dependency protocol", async () => {
    const manifest = JSON.parse(await repository.read("packages/ui/package.json"));
    manifest.devDependencies["unreviewed-external"] = "latest";
    const changed = structuredClone(inventory);
    changed.packages.find(({ path: packagePath }) => packagePath === "packages/ui").dependencies.push({
      name: "unreviewed-external",
      section: "devDependencies",
      version: "latest",
      classification: "external",
      protocol: "tag",
    });
    await rejects(
      () => verifyInventory(changed, overlay(repository, { "packages/ui/package.json": `${JSON.stringify(manifest)}\n` })),
      "VERIFICATION_PACKAGE_DEPENDENCY_POLICY",
    );
  });
  await context.test("override metadata", async () => {
    const manifest = JSON.parse(await repository.read("packages/ui/package.json"));
    manifest.overrides = { typescript: "5.9.2" };
    await rejects(
      () => verifyInventory(inventory, overlay(repository, { "packages/ui/package.json": `${JSON.stringify(manifest)}\n` })),
      "VERIFICATION_PACKAGE_DEPENDENCIES",
    );
  });
  await context.test("bundled dependency metadata", async () => {
    const manifest = JSON.parse(await repository.read("packages/ui/package.json"));
    manifest.bundledDependencies = ["react"];
    await rejects(
      () => verifyInventory(inventory, overlay(repository, { "packages/ui/package.json": `${JSON.stringify(manifest)}\n` })),
      "VERIFICATION_PACKAGE_DEPENDENCIES",
    );
  });
  await context.test("peer dependency metadata", async () => {
    const manifest = JSON.parse(await repository.read("packages/ui/package.json"));
    manifest.peerDependencies = { react: "^19.2.0" };
    manifest.peerDependenciesMeta = { react: { optional: true } };
    const changed = structuredClone(inventory);
    changed.packages.find(({ path: packagePath }) => packagePath === "packages/ui").dependencies.push({
      name: "react",
      section: "peerDependencies",
      version: "^19.2.0",
      classification: "external",
      protocol: "caret",
    });
    await rejects(
      () => verifyInventory(changed, overlay(repository, { "packages/ui/package.json": `${JSON.stringify(manifest)}\n` })),
      "VERIFICATION_PACKAGE_DEPENDENCIES",
    );
  });
  await context.test("package-manager override metadata", async () => {
    const manifest = JSON.parse(await repository.read("packages/ui/package.json"));
    manifest.pnpm = { overrides: { typescript: "5.9.2" } };
    await rejects(
      () => verifyInventory(inventory, overlay(repository, { "packages/ui/package.json": `${JSON.stringify(manifest)}\n` })),
      "VERIFICATION_PACKAGE_DEPENDENCIES",
    );
  });
  await context.test("new trusted dependency requires explicit review", async () => {
    const manifest = JSON.parse(await repository.read("packages/ui/package.json"));
    manifest.trustedDependencies = ["react"];
    await rejects(
      () => verifyInventory(inventory, overlay(repository, { "packages/ui/package.json": `${JSON.stringify(manifest)}\n` })),
      "VERIFICATION_PACKAGE_EXECUTION_METADATA",
    );
  });
  await context.test("a lifecycle hook cannot be laundered through a scripts inventory refresh", async () => {
    const manifest = JSON.parse(await repository.read("packages/ui/package.json"));
    manifest.scripts.postinstall = "node install-hook.mjs";
    const changed = structuredClone(inventory);
    changed.packages.find(({ path: packagePath }) => packagePath === "packages/ui").scripts = manifest.scripts;
    await rejects(
      () => verifyInventory(changed, overlay(repository, { "packages/ui/package.json": `${JSON.stringify(manifest)}\n` })),
      "VERIFICATION_PACKAGE_EXECUTION_METADATA",
    );
  });
  await context.test("an inventoried but unreviewed trusted dependency remains forbidden", async () => {
    const manifest = JSON.parse(await repository.read("packages/ui/package.json"));
    manifest.trustedDependencies = ["react"];
    const changed = structuredClone(inventory);
    changed.packages.find(({ path: packagePath }) => packagePath === "packages/ui").executionMetadata.push(
      {
        kind: "trust-policy",
        path: "trustedDependencies",
        value: ["react"],
        classification: "reviewed",
        reason: "mutation fixture",
      },
      {
        kind: "trusted-dependency",
        path: "trustedDependencies",
        key: "react",
        value: true,
        classification: "unreviewed",
        reason: "mutation fixture",
      },
    );
    await rejects(
      () => verifyInventory(changed, overlay(repository, { "packages/ui/package.json": `${JSON.stringify(manifest)}\n` })),
      "VERIFICATION_PACKAGE_EXECUTION_POLICY",
    );
  });
  await context.test("unsafe patch protocols remain forbidden after review", async () => {
    const manifest = JSON.parse(await repository.read("packages/ui/package.json"));
    manifest.patchedDependencies = { "react@19.2.0": "https://example.invalid/react.patch" };
    const changed = structuredClone(inventory);
    changed.packages.find(({ path: packagePath }) => packagePath === "packages/ui").executionMetadata.push({
      kind: "patch",
      path: "patchedDependencies",
      key: "react@19.2.0",
      value: "https://example.invalid/react.patch",
      classification: "reviewed",
      reason: "mutation fixture",
    });
    await rejects(
      () => verifyInventory(changed, overlay(repository, { "packages/ui/package.json": `${JSON.stringify(manifest)}\n` })),
      "VERIFICATION_PACKAGE_EXECUTION_POLICY",
    );
  });
  await context.test("implicit Cargo bin", () => rejects(
    () => verifyInventory(inventory, overlay(repository, { "apps/runtime/native/src/bin/unreviewed.rs": "fn main() {}\n" })),
    "VERIFICATION_CARGO_SURFACE",
  ));
  for (const collection of ["releaseArtifacts", "crossPackageContracts"]) {
    await context.test(`${collection} omission`, async () => {
      const changed = structuredClone(inventory);
      changed[collection].pop();
      await rejects(() => verifyInventory(changed, repository), "VERIFICATION_REQUIRED_RECORDS");
    });
  }
});

test("Bun execution policy disables implicit trust and every CI install ignores scripts", async (context) => {
  const inventory = await load();
  const repository = createFileRepository(ROOT);
  const manifest = JSON.parse(await repository.read("package.json"));
  assert.deepEqual(manifest.trustedDependencies, []);

  const workflow = await repository.read(".github/workflows/opencode2.yml");
  const installs = workflow.match(/^\s*- run: bun install .*$/gmu) ?? [];
  assert.equal(installs.length > 0, true);
  for (const command of installs) {
    assert.match(command, /(?:^|\s)--frozen-lockfile(?:\s|$)/u);
    assert.match(command, /(?:^|\s)--ignore-scripts(?:\s|$)/u);
  }

  await context.test("default-trusted msgpackr-extract cannot be laundered through reviewed inventory metadata", async () => {
    const changedManifest = structuredClone(manifest);
    changedManifest.trustedDependencies = ["msgpackr-extract"];
    const changed = structuredClone(inventory);
    const rootPackage = changed.packages.find(({ path: packagePath }) => packagePath === ".");
    rootPackage.executionMetadata = [
      ...rootPackage.executionMetadata.filter(({ kind }) => kind !== "trust-policy" && kind !== "trusted-dependency"),
      {
        kind: "trust-policy",
        path: "trustedDependencies",
        value: ["msgpackr-extract"],
        classification: "reviewed",
        reason: "mutation fixture",
      },
      {
        kind: "trusted-dependency",
        path: "trustedDependencies",
        key: "msgpackr-extract",
        value: true,
        classification: "reviewed",
        reason: "mutation fixture",
      },
    ];
    await rejects(
      () => verifyInventory(changed, overlay(repository, { "package.json": `${JSON.stringify(changedManifest)}\n` })),
      "VERIFICATION_PACKAGE_TRUST_POLICY",
    );
  });

  await context.test("workflow flag removal remains forbidden after an inventory hash refresh", async () => {
    const changedSource = workflow.replace("bun install --frozen-lockfile --ignore-scripts", "bun install --frozen-lockfile");
    const changed = structuredClone(inventory);
    changed.workflows[0].sha256 = createHash("sha256").update(changedSource).digest("hex");
    await rejects(
      () => verifyInventory(changed, overlay(repository, { ".github/workflows/opencode2.yml": changedSource })),
      "VERIFICATION_WORKFLOW_INSTALL_POLICY",
    );
  });

  await context.test("Bun install aliases and wrappers remain forbidden after a workflow hash refresh", async () => {
    const { classifyWorkflowBunInstallCommand } = await import("./inventory-model.mjs");
    const canonical = "bun install --frozen-lockfile --ignore-scripts";
    assert.equal(classifyWorkflowBunInstallCommand(canonical), "canonical");
    assert.equal(classifyWorkflowBunInstallCommand("echo install dependencies"), "none");
    for (const command of [
      "bun i --frozen-lockfile --ignore-scripts",
      "command bun install --frozen-lockfile --ignore-scripts",
      "env BUN_CONFIG_VERBOSE_FETCH=1 bun install --frozen-lockfile --ignore-scripts",
      "/opt/bun/bin/bun install --frozen-lockfile --ignore-scripts",
      "bun install --frozen-lockfile --ignore-scripts --production",
    ]) {
      assert.equal(classifyWorkflowBunInstallCommand(command), "noncanonical", command);
      const changedSource = workflow.replace(canonical, command);
      const changed = structuredClone(inventory);
      changed.workflows[0].sha256 = createHash("sha256").update(changedSource).digest("hex");
      await rejects(
        () => verifyInventory(changed, overlay(repository, { ".github/workflows/opencode2.yml": changedSource })),
        "VERIFICATION_WORKFLOW_INSTALL_POLICY",
      );
    }
  });
});

test("Bun and npm automatic lifecycle authority is inventoried separately from generic scripts", async () => {
  const { packageExecutionMetadata } = await import("./inventory-model.mjs");
  const lifecycle = [
    "predependencies", "dependencies", "postdependencies",
    "preinstall", "install", "postinstall",
    "preuninstall", "uninstall", "postuninstall",
    "prepack", "pack", "postpack",
    "preprepare", "prepare", "postprepare",
    "prepublish", "prepublishOnly", "publish", "postpublish",
    "prestart", "start", "poststart",
    "prestop", "stop", "poststop",
    "prerestart", "restart", "postrestart",
    "pretest", "test", "posttest",
    "preversion", "version", "postversion",
  ];
  for (const name of lifecycle) {
    assert.deepEqual(packageExecutionMetadata({ scripts: { [name]: `node ${name}.mjs` } }), [{
      kind: "lifecycle-script",
      path: `scripts.${name}`,
      value: `node ${name}.mjs`,
    }], name);
  }
  assert.deepEqual(packageExecutionMetadata({ scripts: { prestart: "node prestart.mjs" } }, ["server.js"]), [
    { kind: "implicit-lifecycle-script", path: "server.js", key: "start", value: "node server.js" },
    { kind: "lifecycle-script", path: "scripts.prestart", value: "node prestart.mjs" },
  ]);
  assert.deepEqual(packageExecutionMetadata({}, ["binding.gyp"]), [
    { kind: "implicit-lifecycle-script", path: "binding.gyp", key: "install", value: "node-gyp rebuild" },
  ]);
  assert.deepEqual(packageExecutionMetadata({ scripts: { "ordinary-check": "node check.mjs" } }), []);
});

test("npm executes standalone prestart before its implicit server.js start", async () => {
  const temporary = await mkdtemp(path.join(os.tmpdir(), "curiosity-implicit-start-"));
  try {
    await writeFile(path.join(temporary, "package.json"), `${JSON.stringify({
      name: "curiosity-implicit-start-fixture",
      private: true,
      scripts: { prestart: 'node -e "require(\'fs\').writeFileSync(\'prestart.marker\',\'ran\')"' },
    })}\n`);
    await writeFile(path.join(temporary, "server.js"), 'require("fs").writeFileSync("start.marker", "ran");\n');
    await execute("npm", ["start", "--silent"], { cwd: temporary });
    assert.equal(await readFile(path.join(temporary, "prestart.marker"), "utf8"), "ran");
    assert.equal(await readFile(path.join(temporary, "start.marker"), "utf8"), "ran");
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
});

test("implicit npm execution surfaces cannot be laundered through inventory refreshes", async (context) => {
  const inventory = await load();
  const repository = createFileRepository(ROOT);
  const manifestPath = "packages/ui/package.json";
  await context.test("prestart plus implicit server.js start", async () => {
    const manifest = JSON.parse(await repository.read(manifestPath));
    manifest.scripts.prestart = "node prestart.mjs";
    const changed = structuredClone(inventory);
    changed.packages.find(({ path: packagePath }) => packagePath === "packages/ui").scripts = manifest.scripts;
    await rejects(
      () => verifyInventory(changed, overlay(repository, {
        [manifestPath]: `${JSON.stringify(manifest)}\n`,
        "packages/ui/server.js": 'console.log("implicit start");\n',
      })),
      "VERIFICATION_PACKAGE_EXECUTION_METADATA",
    );
  });
  await context.test("implicit binding.gyp install", () => rejects(
    () => verifyInventory(inventory, overlay(repository, { "packages/ui/binding.gyp": '{}\n' })),
    "VERIFICATION_PACKAGE_EXECUTION_METADATA",
  ));
});

test("clean frozen Bun installs ignore lifecycle scripts even for a default-trusted package name", async () => {
  const temporary = await mkdtemp(path.join(os.tmpdir(), "curiosity-bun-install-policy-"));
  const dependency = path.join(temporary, "msgpackr-extract");
  try {
    await mkdir(dependency);
    await writeFile(path.join(temporary, "package.json"), `${JSON.stringify({
      name: "curiosity-install-policy-fixture",
      private: true,
      trustedDependencies: [],
      dependencies: { "msgpackr-extract": "file:./msgpackr-extract" },
    })}\n`);
    await writeFile(path.join(dependency, "package.json"), `${JSON.stringify({
      name: "msgpackr-extract",
      version: "3.0.4",
      scripts: { install: 'node -e "require(\'fs\').writeFileSync(\'../../lifecycle-marker\',\'ran\')"' },
    })}\n`);
    const trusted = await execute("bun", ["pm", "default-trusted"], { cwd: temporary });
    assert.match(trusted.stdout, /^ - msgpackr-extract$/mu);
    await execute("bun", ["install", "--ignore-scripts"], { cwd: temporary });
    const lock = await readFile(path.join(temporary, "bun.lock"), "utf8");
    await rm(path.join(temporary, "node_modules"), { recursive: true, force: true });
    await rm(path.join(temporary, "lifecycle-marker"), { force: true });
    await execute("bun", ["install", "--frozen-lockfile", "--ignore-scripts"], { cwd: temporary });
    await assert.rejects(() => readFile(path.join(temporary, "lifecycle-marker")), { code: "ENOENT" });
    assert.equal(await readFile(path.join(temporary, "bun.lock"), "utf8"), lock);
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
});

test("required workspace verification lane covers only starter and configuration workspaces once", async () => {
  const inventory = await load();
  const workflow = inventory.workflows[0];
  const lane = workflow.jobs.find(({ id }) => id === "workspace-verification");
  assert.deepEqual(lane.runsOn, ["ubuntu-latest"]);
  assert.deepEqual(lane.commands, [
    "bunx turbo run verify --filter=docs --filter=web --filter=@repo/ui --filter=@repo/eslint-config --filter=@repo/typescript-config",
  ]);
  const command = lane.commands[0];
  for (const workspace of ["docs", "web", "@repo/ui", "@repo/eslint-config", "@repo/typescript-config"])
    assert.equal(command.match(new RegExp(`--filter=${workspace.replaceAll("/", "\\/")}(?:\\s|$)`, "gu"))?.length, 1, workspace);
  assert.doesNotMatch(command, /opencode2|@curiosity\/runtime/u);
  const gate = workflow.jobs.find(({ id }) => id === "required-gate");
  assert.equal(gate.needs.filter((id) => id === lane.id).length, 1);
  assert.equal(gate.commands.filter((value) => value === 'test "$WORKSPACE_VERIFICATION" = success').length, 1);
});

test("required profiles close over their command graph and legacy orphan surfaces make no green claim", async (context) => {
  const inventory = await load();
  const repository = createFileRepository(ROOT);
  for (const [profile, reason] of [
    ["legacy-orphan-bootstrap", "obsolete imported bootstrap harness is retained but not wired into required verification"],
    ["legacy-orphan-comprehensive", "obsolete imported comprehensive harness is retained but not wired into required verification"],
    ["legacy-orphan-consolidation", "historical consolidation harness is retained but not wired into required verification"],
    ["legacy-orphan-smoke", "obsolete imported smoke harness is retained but not wired into required verification"],
    ["legacy-orphan-identity", "legacy identity scanner is retained but not wired into required verification"],
  ]) {
    assert.equal(inventory.testProfiles[profile].disposition, "legacy-orphan", profile);
    assert.equal(inventory.testProfiles[profile].reason, reason, profile);
    assert.deepEqual(inventory.testProfiles[profile].entrypoints, [], profile);
  }

  await context.test("removing a required script edge cannot be laundered through an inventory refresh", async () => {
    const manifestPath = "apps/plugin/opencode2/package.json";
    const manifest = JSON.parse(await repository.read(manifestPath));
    manifest.scripts.verify = manifest.scripts.verify.replace(" && bun run test:security", "");
    const changed = structuredClone(inventory);
    changed.packages.find(({ path: packagePath }) => packagePath === "apps/plugin/opencode2").scripts = manifest.scripts;
    await rejects(
      () => verifyInventory(changed, overlay(repository, { [manifestPath]: `${JSON.stringify(manifest)}\n` })),
      "VERIFICATION_REQUIRED_PROFILE_UNEXECUTED",
    );
  });

  await context.test("manual Darwin real-host work cannot leak into portable or required command graphs", async () => {
    const manifestPath = "apps/plugin/opencode2/package.json";
    const manifest = JSON.parse(await repository.read(manifestPath));
    manifest.scripts.verify = `${manifest.scripts.verify} && bun run test:real-host`;
    const changed = structuredClone(inventory);
    changed.packages.find(({ path: packagePath }) => packagePath === "apps/plugin/opencode2").scripts = manifest.scripts;
    await rejects(
      () => verifyInventory(changed, overlay(repository, { [manifestPath]: `${JSON.stringify(manifest)}\n` })),
      "VERIFICATION_MANUAL_PROFILE_LEAK",
    );
  });
});

test("verification tool additions and byte drift fail closed", async (context) => {
  const inventory = await load();
  const repository = createFileRepository(ROOT);
  await context.test("new tool", () => rejects(
    () => verifyInventory(inventory, overlay(repository, { "tools/verification/unreviewed.mjs": "export {};\n" })),
    "VERIFICATION_TOOL_INVENTORY",
  ));
  await context.test("network gate drift", async () => {
    const source = await repository.read("apps/runtime/tools/network-denied-linux.sh");
    await rejects(
      () => verifyInventory(inventory, overlay(repository, { "apps/runtime/tools/network-denied-linux.sh": `${source}\n# drift\n` })),
      "VERIFICATION_TOOL_DRIFT",
    );
  });

  await context.test("plugin verification wrapper plans and entrypoint are code-owned beyond self-hash", async (mutationContext) => {
    const wrapperPath = "apps/plugin/opencode2/tools/verification-profile.mjs";
    const source = await repository.read(wrapperPath);
    const tool = inventory.verificationTools.find(({ path: toolPath }) => toolPath === wrapperPath);
    assert.ok(tool);
    assert.deepEqual(tool.profiles, ["plugin-linux", "plugin-darwin"]);
    const mutations = [
      ["remove portable verification", 'linux: Object.freeze({ platform: "linux", commands: Object.freeze(["verify"]) })', 'linux: Object.freeze({ platform: "linux", commands: Object.freeze([]) })'],
      ["reverse Darwin plan", 'commands: Object.freeze(["verify", "test:real-host"])', 'commands: Object.freeze(["test:real-host", "verify"])'],
      ["append Darwin command", 'commands: Object.freeze(["verify", "test:real-host"])', 'commands: Object.freeze(["verify", "test:real-host", "extra"])'],
      ["bypass injected executor", "execute(command)", "void command"],
      ["bypass CLI entrypoint", "verifyPluginProfile(profile)", "pluginVerificationProfilePlan(profile)"],
    ];
    for (const [name, from, to] of mutations) await mutationContext.test(name, async () => {
      const changedSource = source.replace(from, to);
      assert.notEqual(changedSource, source, name);
      const changed = structuredClone(inventory);
      changed.verificationTools.find(({ path: toolPath }) => toolPath === wrapperPath).sha256 = createHash("sha256").update(changedSource).digest("hex");
      await rejects(
        () => verifyInventory(changed, overlay(repository, { [wrapperPath]: changedSource })),
        "VERIFICATION_PLUGIN_PROFILE_CONTRACT",
      );
    });
  });
});

test("bounded Turbo source globs cannot be weakened by refreshing the task inventory", async () => {
  const inventory = await load();
  const repository = createFileRepository(ROOT);
  const turbo = JSON.parse(await repository.read("turbo.json"));
  for (const task of ["test", "verify"])
    turbo.tasks[task].inputs = turbo.tasks[task].inputs.filter((input) => input !== "$TURBO_ROOT$/apps/runtime/src/**");
  const changed = structuredClone(inventory);
  changed.taskGraph.testVerifyInputs = turbo.tasks.test.inputs;
  await rejects(
    () => verifyInventory(changed, overlay(repository, { "turbo.json": `${JSON.stringify(turbo)}\n` })),
    "VERIFICATION_TURBO_INPUTS",
  );
});

test("runtime profiles cannot be conflated with M7 or SDK v2", async () => {
  const inventory = await load();
  const portable = inventory.testProfiles["portable-linux"].tests;
  const networkDenied = inventory.testProfiles["network-denied"].tests;
  assert.equal(portable.some((file) => file.includes("m7-")), false);
  assert.equal(networkDenied.some((file) => file.includes("m7-")), false);
  assert.equal(Object.keys(inventory.testProfiles).includes("sdk-v2-manual"), true);
  const workflow = await readFile(path.join(ROOT, ".github/workflows/opencode2.yml"), "utf8");
  assert.doesNotMatch(workflow, /m7:(?:test|build)|legacy-memory-node-api-sdk/u);
  assert.match(workflow, /Darwin compatibility \(not M7 qualification\)/u);
});
