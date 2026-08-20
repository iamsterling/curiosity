#!/usr/bin/env bun
import { createHash } from "node:crypto";
import {
  chmodSync,
  cpSync,
  copyFileSync,
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  realpathSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { basename, dirname, join, relative, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const repository = resolve(import.meta.dirname, "../../../../..");
const approvedRoot =
  "/private/var/folders/wr/8bsbkjgd46v11_cpt9rfqm2r0000gn/T/opencode";
const crateRoot = join(
  repository,
  "apps/runtime/native-node-api-qualification",
);
const manifest = join(crateRoot, "Cargo.toml");
const lockfile = join(crateRoot, "Cargo.lock");
const toolRoot = join(
  repository,
  "apps/runtime/native-node-api-qualification-tools",
);
const toolManifest = join(toolRoot, "Cargo.toml");
const toolLockfile = join(toolRoot, "Cargo.lock");
const guardSourcePath = join(crateRoot, "tests/fixtures/guard-page-node-api.c");
const guardRecipePath = join(
  crateRoot,
  "tests/fixtures/guard-page-build-recipe.json",
);
const phaseFixtureSourcePath = join(
  crateRoot,
  "tests/fixtures/controlled-phase-core.rs",
);
const phaseFixtureRecipePath = join(
  crateRoot,
  "tests/fixtures/controlled-phase-core-build-recipe.json",
);
const phaseFixtureTranscriptSchemaPath = join(
  crateRoot,
  "tests/fixtures/controlled-phase-transcript-schema.json",
);
const approval = join(
  repository,
  "apps/runtime/docs/approvals/legacy-memory-node-api-sdk-v2.json",
);
const exactRustflags = "-C link-arg=-Wl,-dead_strip_dylibs";
const sha = (bytes) => createHash("sha256").update(bytes).digest("hex");
const napiSysSource = {
  repository: "https://github.com/napi-rs/napi-rs",
  tag: "napi-sys-v3.3.0",
  tagObject: "bbad39cc6f1ce60af941933acaf6577b10b52a9a",
  commit: "679eb79f5cf3c7c6b2850f4ab46092126f23dc5c",
  pathInVcs: "crates/sys",
  licenseUrl:
    "https://raw.githubusercontent.com/napi-rs/napi-rs/679eb79f5cf3c7c6b2850f4ab46092126f23dc5c/LICENSE",
  licenseSha256:
    "3f1ce66533302df3a32edbfdfc0b78f0dd34659e4c1f5817162e5ea3c2297215",
};

const argumentsMap = new Map();
for (let index = 2; index < process.argv.length; index += 2)
  argumentsMap.set(process.argv[index], process.argv[index + 1]);
const phase = argumentsMap.get("--phase");
if (phase === "acceptance") {
  const { runAcceptance } =
    await import("./legacy-memory-node-api-sdk-v2-acceptance-verifier.mjs");
  await runAcceptance({ repository, argumentsMap });
  process.exit(0);
}
if (phase === "self-test") {
  const { selfTestAcceptanceVerifier } =
    await import("./legacy-memory-node-api-sdk-v2-acceptance-verifier.mjs");
  console.log(JSON.stringify(selfTestAcceptanceVerifier()));
  process.exit(0);
}
if (phase !== "candidate-generate" && phase !== "reproduce") {
  console.error(
    "SDK_APPROVAL_REQUIRED: acceptance is blocked in candidate/not-qualified status",
  );
  process.exit(2);
}
const reproductionMode = phase === "reproduce";
if (!reproductionMode && existsSync(approval))
  throw new Error("SDK_PREMATURE_APPROVAL_RECORD");
if (process.env.RUSTFLAGS !== exactRustflags)
  throw new Error("SDK_LINKER_POLICY_INVALID");
if (process.env.MACOSX_DEPLOYMENT_TARGET !== "15.0")
  throw new Error("SDK_DEPLOYMENT_TARGET_INVALID");
if (process.versions.bun !== "1.3.14")
  throw new Error("SDK_BUN_VERSION_INVALID");

const runRoot = realpathSync(argumentsMap.get("--run-root"));
if (!runRoot.startsWith(`${realpathSync(approvedRoot)}/`))
  throw new Error("SDK_RUN_ROOT_FORBIDDEN");
const candidate = join(runRoot, "candidate");
const proposed = resolve(argumentsMap.get("--proposed-checkin-root"));
const reviewPath = resolve(argumentsMap.get("--root-user-review-report"));
if (reviewPath !== join(candidate, "root-user-review.json"))
  throw new Error("SDK_REVIEW_PATH_INVALID");
mkdirSync(candidate, { recursive: true, mode: 0o700 });
mkdirSync(proposed, { recursive: true, mode: 0o700 });
mkdirSync(join(runRoot, "home"), { recursive: true, mode: 0o700 });

const approvedEnvironment = {
  PATH: process.env.PATH,
  HOME: join(runRoot, "home"),
  CARGO_HOME: process.env.CARGO_HOME,
  CARGO_TARGET_DIR: process.env.CARGO_TARGET_DIR,
  CARGO_NET_OFFLINE: "true",
  RUSTUP_HOME: process.env.RUSTUP_HOME ?? join(process.env.HOME, ".rustup"),
  RUSTUP_TOOLCHAIN: "stable-aarch64-apple-darwin",
  MACOSX_DEPLOYMENT_TARGET: "15.0",
  RUSTFLAGS: exactRustflags,
  LC_ALL: "C",
  TMPDIR: runRoot,
};

const commands = [];
const run = (command, args, options = {}) => {
  commands.push([command, ...args]);
  const result = spawnSync(command, args, {
    cwd: repository,
    encoding: "utf8",
    env: {
      ...approvedEnvironment,
      CARGO_NET_OFFLINE: options.acquisition
        ? undefined
        : options.offline
          ? "true"
          : approvedEnvironment.CARGO_NET_OFFLINE,
      ...options.env,
    },
  });
  if (result.status !== 0)
    throw new Error(
      `${command} ${args.join(" ")}\n${result.stdout}${result.stderr}`,
    );
  return { stdout: result.stdout, stderr: result.stderr };
};
const write = (path, bytes) => {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, bytes);
};
const sidecar = (path) => `${sha(readFileSync(path))}  ${basename(path)}\n`;
const repoPath = (path) => join(proposed, path);
const filesBelow = (root, skip = () => false) =>
  readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
    const path = join(root, entry.name);
    if (skip(path)) return [];
    return entry.isDirectory() ? filesBelow(path, skip) : [path];
  });

const repositoryNativeArtifacts = filesBelow(repository, (path) =>
  ["/.git/", "/node_modules/", "/.turbo/"].some((part) =>
    `${path}/`.includes(part),
  ),
).filter(
  (path) =>
    path === join(repository, "libstd.a") || /\.(?:node|dylib)$/.test(path),
);
if (repositoryNativeArtifacts.length !== 0)
  throw new Error(
    `SDK_REPOSITORY_ARTIFACT_RESIDUE:${repositoryNativeArtifacts.map((path) => relative(repository, path)).join(",")}`,
  );
const beforeInventory = {
  schemaVersion: 2,
  status: "clean-before-generation",
  repositoryRootLibstdAbsent: !existsSync(join(repository, "libstd.a")),
  repositoryGeneratedNativeArtifacts: [],
  qualificationTargetAbsent: !existsSync(join(crateRoot, "target")),
};
if (
  !beforeInventory.repositoryRootLibstdAbsent ||
  !beforeInventory.qualificationTargetAbsent
)
  throw new Error("SDK_BEFORE_INVENTORY_DIRTY");
write(
  join(candidate, "before-inventory.json"),
  `${JSON.stringify(beforeInventory, null, 2)}\n`,
);

const manifestText = readFileSync(manifest, "utf8");
const bridgeSource = readFileSync(join(crateRoot, "src/lib.rs"), "utf8");
const counterSource = readFileSync(
  join(crateRoot, "src/control_flow.rs"),
  "utf8",
);
const phaseCounterCoreSource = readFileSync(
  join(crateRoot, "src/phase_counter_core.rs"),
  "utf8",
);
const settlementSource = readFileSync(
  join(crateRoot, "src/settlement.rs"),
  "utf8",
);
const settlementCoreSource = readFileSync(
  join(crateRoot, "src/settlement_core.rs"),
  "utf8",
);
const fakeAdapterSource = readFileSync(
  join(crateRoot, "tests/fixtures/fake-settlement-adapter.rs"),
  "utf8",
);
const fakeAdapterVectors = readFileSync(
  join(crateRoot, "tests/fixtures/fake-settlement-vectors.json"),
);
const completeNativeSource = `${bridgeSource}\n${counterSource}\n${phaseCounterCoreSource}\n${settlementSource}\n${settlementCoreSource}`;
const exactDependencies =
  '[dependencies]\nnapi-sys = { version = "=3.3.0", default-features = false, features = ["napi4"] }\nryu-js = "=1.0.3"';
if (!manifestText.includes(exactDependencies))
  throw new Error("SDK_DIRECT_DEPENDENCIES_INVALID");
if (
  existsSync(join(crateRoot, "build.rs")) ||
  manifestText.includes("[build-dependencies]") ||
  !manifestText.includes('[profile.release]\npanic = "unwind"')
)
  throw new Error("SDK_BUILD_PROFILE_INVALID");
for (const forbidden of [
  "napi_get_global",
  "napi_get_named_property",
  "napi_call_function",
  "napi_make_callback",
  "napi_create_reference",
  "napi_get_reference_value",
  "napi_delete_reference",
  "threadsafe_function",
  "cleanup_hook",
  "instance_data",
  "external_arraybuffer",
  "dlopen",
  "dlsym",
])
  if (completeNativeSource.includes(forbidden))
    throw new Error(`SDK_FORBIDDEN_SOURCE_CAPABILITY:${forbidden}`);
if (
  (
    completeNativeSource.match(/static mut|OnceLock|LazyLock|Mutex|RwLock/g) ??
    []
  ).length !== 0
)
  throw new Error("SDK_MUTABLE_GLOBAL_STATE_FORBIDDEN");
for (const forbidden of ["std::panic::set_hook", "std::panic::take_hook"])
  if (bridgeSource.includes(forbidden))
    throw new Error(`SDK_PANIC_HOOK_MUTATION_FORBIDDEN:${forbidden}`);
if (
  !bridgeSource.includes("std::panic::resume_unwind(Box::new(PanicProbe))") ||
  bridgeSource.includes('panic!("qualification panic probe")')
)
  throw new Error("SDK_PANIC_PROBE_NOT_HOOK_BYPASSING");
if (
  !bridgeSource.includes("SDK_INPUT_TYPE_INVALID") ||
  !bridgeSource.includes("SDK_TRANSPORT_FAILED")
)
  throw new Error("SDK_REJECTION_CODES_NOT_CLOSED");
const completionSource = bridgeSource.slice(
  bridgeSource.indexOf('unsafe extern "C" fn complete_work'),
  bridgeSource.indexOf("fn settle_once"),
);
if ((completionSource.match(/settle_once\(/g) ?? []).length !== 1)
  throw new Error("SDK_COMPLETION_SETTLEMENT_NOT_EXACTLY_ONCE");
if (
  bridgeSource.includes("napi_resolve_deferred") ||
  bridgeSource.includes("napi_reject_deferred")
)
  throw new Error("SDK_RAW_SETTLEMENT_OUTSIDE_ADAPTER");
const productionBridgeSource = bridgeSource.slice(
  0,
  bridgeSource.indexOf("#[cfg(test)]"),
);
const allocationProbeSource = productionBridgeSource.slice(
  productionBridgeSource.indexOf("fn settle_allocation_failure_probe"),
  productionBridgeSource.indexOf("fn create_promise"),
);
const allocationCreate = allocationProbeSource.indexOf(
  "create_error(env, RejectionCode::TransportFailed)",
);
const allocationInject = allocationProbeSource.indexOf(
  "inject_owned_input_allocation_failure()",
);
const allocationSettle = allocationProbeSource.indexOf("settle_deferred(");
if (
  allocationCreate < 0 ||
  allocationInject < 0 ||
  allocationSettle < 0 ||
  !(allocationCreate < allocationInject && allocationInject < allocationSettle)
)
  throw new Error("SDK_ALLOCATION_REJECTION_ORDER_INVALID");

run("cargo", ["fetch", "--manifest-path", manifest, "--locked"], {
  offline: reproductionMode,
  acquisition: !reproductionMode,
});
run("cargo", ["fetch", "--manifest-path", toolManifest, "--locked"], {
  offline: reproductionMode,
  acquisition: !reproductionMode,
});
const canonicalNapiLicense = reproductionMode
  ? readFileSync(
      join(
        realpathSync(argumentsMap.get("--approved-archive-root")),
        "napi-rs-LICENSE",
      ),
      "utf8",
    )
  : run("/usr/bin/curl", ["-fsSL", napiSysSource.licenseUrl]).stdout;
if (sha(canonicalNapiLicense) !== napiSysSource.licenseSha256)
  throw new Error("SDK_NAPI_SYS_UPSTREAM_LICENSE_MISMATCH");
const metadata = JSON.parse(
  run(
    "cargo",
    [
      "metadata",
      "--manifest-path",
      manifest,
      "--locked",
      "--format-version",
      "1",
    ],
    { offline: true },
  ).stdout,
);
const expectedThirdParty = [
  "cfg-if@1.0.4",
  "libloading@0.9.0",
  "napi-sys@3.3.0",
  "ryu-js@1.0.3",
  "windows-link@0.2.1",
];
const rootPackage = metadata.packages.find(
  (pkg) => pkg.name === "curiosity-native-node-api-qualification",
);
const napiSysPackage = metadata.packages.find(
  (pkg) => pkg.name === "napi-sys" && pkg.version === "3.3.0",
);
const napiSysVcs = JSON.parse(
  readFileSync(
    join(dirname(napiSysPackage.manifest_path), ".cargo_vcs_info.json"),
  ),
);
if (
  napiSysPackage.repository !== napiSysSource.repository ||
  napiSysVcs.git.sha1 !== napiSysSource.commit ||
  napiSysVcs.path_in_vcs !== napiSysSource.pathInVcs
)
  throw new Error("SDK_NAPI_SYS_UPSTREAM_SOURCE_MISMATCH");
const thirdParty = metadata.packages
  .filter((pkg) => pkg.source?.startsWith("registry+"))
  .map((pkg) => `${pkg.name}@${pkg.version}`)
  .sort();
if (JSON.stringify(thirdParty) !== JSON.stringify(expectedThirdParty))
  throw new Error(`SDK_DEPENDENCY_CLOSURE_INVALID:${thirdParty.join(",")}`);
if (
  metadata.packages.some((pkg) =>
    ["napi", "napi-derive", "napi-build"].includes(pkg.name),
  )
)
  throw new Error("SDK_FORBIDDEN_DEPENDENCY_PRESENT");
const napiNode = metadata.resolve.nodes.find((node) =>
  node.id.includes("napi-sys@3.3.0"),
);
if (
  !napiNode ||
  napiNode.features.includes("dyn-symbols") ||
  !napiNode.features.includes("napi4") ||
  napiNode.features.some((feature) => /^napi(?:5|6|7|8|9|10)$/.test(feature))
)
  throw new Error("SDK_NAPI_FEATURE_CLOSURE_INVALID");

const approvedArchiveRoot = join(runRoot, "approved-archives");
mkdirSync(approvedArchiveRoot, { recursive: true, mode: 0o700 });
const approvedArchiveNames = new Set([
  "cfg-if-1.0.4.crate",
  "libloading-0.9.0.crate",
  "napi-sys-3.3.0.crate",
  "ryu-js-1.0.3.crate",
  "windows-link-0.2.1.crate",
  "proc-macro2-1.0.107.crate",
  "quote-1.0.47.crate",
  "syn-2.0.119.crate",
  "unicode-ident-1.0.24.crate",
]);
const cargoHomeFiles = filesBelow(process.env.CARGO_HOME);
for (const source of cargoHomeFiles) {
  const relativeSource = relative(process.env.CARGO_HOME, source);
  const isArchive = approvedArchiveNames.has(basename(source));
  const isIndexMaterial =
    relativeSource.includes("/index.crates.io-") &&
    (basename(source) === "config.json" ||
      [
        "cfg-if",
        "libloading",
        "napi-sys",
        "ryu-js",
        "windows-link",
        "proc-macro2",
        "quote",
        "syn",
        "unicode-ident",
      ].includes(basename(source)));
  if (!isArchive && !isIndexMaterial) continue;
  const destination = join(approvedArchiveRoot, "cargo-home", relativeSource);
  mkdirSync(dirname(destination), { recursive: true, mode: 0o700 });
  copyFileSync(source, destination);
  chmodSync(destination, 0o600);
}
write(join(approvedArchiveRoot, "napi-rs-LICENSE"), canonicalNapiLicense);
chmodSync(join(approvedArchiveRoot, "napi-rs-LICENSE"), 0o600);
const archiveInventory = filesBelow(approvedArchiveRoot)
  .map((path) => ({
    path: relative(approvedArchiveRoot, path),
    mode: (statSync(path).mode & 0o777).toString(8).padStart(4, "0"),
    size: statSync(path).size,
    sha256: sha(readFileSync(path)),
  }))
  .sort((left, right) => left.path.localeCompare(right.path));
if (
  archiveInventory.filter((row) => row.path.endsWith(".crate")).length !== 9 ||
  archiveInventory.length > 30 ||
  archiveInventory.reduce((sum, row) => sum + row.size, 0) > 20_000_000
)
  throw new Error("SDK_APPROVED_ARCHIVE_ROOT_INVALID");
const archiveInventoryBytes = `${archiveInventory.map((row) => `${row.path}\t${row.mode}\t${row.size}\t${row.sha256}`).join("\n")}\n`;
write(join(candidate, "approved-archive-inventory.txt"), archiveInventoryBytes);
write(
  join(approvedArchiveRoot, "approved-archive-inventory.txt"),
  archiveInventoryBytes,
);
const approvedArchiveInventorySha256 = sha(archiveInventoryBytes);

const scannerMetadata = JSON.parse(
  run(
    "cargo",
    [
      "metadata",
      "--manifest-path",
      toolManifest,
      "--locked",
      "--offline",
      "--format-version",
      "1",
    ],
    { offline: true },
  ).stdout,
);
const scannerPackageNames = scannerMetadata.packages
  .filter((pkg) => pkg.source?.startsWith("registry+"))
  .map((pkg) => `${pkg.name}@${pkg.version}`)
  .sort();
if (
  JSON.stringify(scannerPackageNames) !==
  JSON.stringify([
    "proc-macro2@1.0.107",
    "quote@1.0.47",
    "syn@2.0.119",
    "unicode-ident@1.0.24",
  ])
)
  throw new Error(
    `SDK_SCANNER_DEPENDENCY_CLOSURE_INVALID:${scannerPackageNames}`,
  );
const scannerLockChecksums = new Map(
  [
    ...readFileSync(toolLockfile, "utf8").matchAll(
      /\[\[package\]\]\nname = "([^"]+)"\nversion = "([^"]+)"(?:\nsource = "[^"]+")?(?:\nchecksum = "([0-9a-f]{64})")?/g,
    ),
  ].map((match) => [`${match[1]}@${match[2]}`, match[3] ?? null]),
);
const scannerPackages = scannerMetadata.packages
  .filter((pkg) => pkg.source?.startsWith("registry+"))
  .map((pkg) => ({
    name: pkg.name,
    version: pkg.version,
    checksum: scannerLockChecksums.get(`${pkg.name}@${pkg.version}`),
    license: pkg.license,
    source: pkg.source,
  }))
  .sort((left, right) => left.name.localeCompare(right.name));
if (
  scannerPackages.some(
    (pkg) =>
      !pkg.checksum ||
      !["MIT OR Apache-2.0", "(MIT OR Apache-2.0) AND Unicode-3.0"].includes(
        pkg.license,
      ),
  )
)
  throw new Error("SDK_SCANNER_DEPENDENCY_POLICY_INVALID");
const scannerDependencyReceipt = {
  schemaVersion: 1,
  tool: "node_api_source_scanner",
  manifestSha256: sha(readFileSync(toolManifest)),
  lockfileSha256: sha(readFileSync(toolLockfile)),
  packages: scannerPackages,
};
const scannerDependencyReceiptBytes = `${JSON.stringify(scannerDependencyReceipt, null, 2)}\n`;
write(
  join(candidate, "source-material/scanner-dependencies.json"),
  scannerDependencyReceiptBytes,
);
const scannerTarget = join(process.env.CARGO_TARGET_DIR, "source-scanner");
run(
  "cargo",
  [
    "test",
    "--manifest-path",
    toolManifest,
    "--locked",
    "--offline",
    "--all-targets",
  ],
  { offline: true, env: { CARGO_TARGET_DIR: scannerTarget } },
);
run(
  "cargo",
  [
    "build",
    "--manifest-path",
    toolManifest,
    "--release",
    "--locked",
    "--offline",
    "--bin",
    "node_api_source_scanner",
  ],
  { offline: true, env: { CARGO_TARGET_DIR: scannerTarget } },
);
const scannerBinary = join(scannerTarget, "release/node_api_source_scanner");
const scannerOutput = run(scannerBinary, [repository]).stdout;
const scannerLines = scannerOutput.trimEnd().split("\n");
if (
  scannerLines.length !== 25 ||
  !scannerLines[0].startsWith("version\t") ||
  !scannerLines[1].startsWith("normalization\t") ||
  scannerLines.filter((line) => line.startsWith("mutation\t")).length !== 10 ||
  scannerLines.filter((line) => line.startsWith("recorder\t")).length !== 9 ||
  scannerLines.filter((line) => line.startsWith("phase\t")).length !== 3 ||
  scannerLines.filter((line) => line.startsWith("raw\t")).length !== 1
)
  throw new Error("SDK_AST_SCANNER_OUTPUT_INVALID");
write(join(candidate, "source-material/ast-sites.tsv"), scannerOutput);
const verifierSelfTestOutput = run(process.execPath, [
  import.meta.filename,
  "--phase",
  "self-test",
]).stdout;
const verifierSelfTest = JSON.parse(verifierSelfTestOutput);
if (
  verifierSelfTest.phaseStaticAdversaries !== 13 ||
  verifierSelfTest.transcriptAdversaries !== 7 ||
  verifierSelfTest.wrongProfileMembershipRejected !== true ||
  JSON.stringify(verifierSelfTest.packagingAbsence?.surfaces) !==
    JSON.stringify([
      "package",
      "bundle",
      "dist",
      "assets",
      "provenance",
      "generatedPlugin",
      "install",
      "release",
      "M7",
    ]) ||
  verifierSelfTest.packagingAbsence?.forbiddenMarkers !== 12 ||
  verifierSelfTest.packagingAbsence?.rejectionCases !== 108 ||
  verifierSelfTest.packagingAbsence?.cleanControlPathsInspected !== 9 ||
  verifierSelfTest.packagingAbsence?.cleanup !== true ||
  verifierSelfTest.timeoutRejected !== true ||
  verifierSelfTest.independentVerdictDerivation !== true ||
  verifierSelfTest.addonLoaderCalls !== 0 ||
  verifierSelfTest.opencodeLaunches !== 0
)
  throw new Error("SDK_STATIC_VERIFIER_SELF_TEST_INVALID");
write(
  join(candidate, "source-material/static-verifier-self-test.json"),
  `${JSON.stringify(verifierSelfTest, null, 2)}\n`,
);

const guardArtifact = join(candidate, "fixtures/guard-page-node-api.node");
mkdirSync(dirname(guardArtifact), { recursive: true, mode: 0o700 });
const guardBuildArguments = [
  "-std=c17",
  "-O2",
  "-fvisibility=hidden",
  "-mmacosx-version-min=15.0",
  "-bundle",
  "-Wl,-dead_strip_dylibs",
  `-Wl,-bundle_loader,${realpathSync(process.execPath)}`,
  guardSourcePath,
  "-o",
  guardArtifact,
];
run(
  "/usr/bin/sandbox-exec",
  [
    "-p",
    "(version 1)(allow default)(deny network*)",
    "/usr/bin/clang",
    ...guardBuildArguments,
  ],
  { offline: true },
);
chmodSync(guardArtifact, 0o500);
const guardDefinedGlobals = run("/usr/bin/nm", ["-gUj", guardArtifact])
  .stdout.split("\n")
  .filter(Boolean)
  .map((symbol) => symbol.replace(/^_/, ""));
const guardUndefinedImports = run("/usr/bin/nm", ["-uj", guardArtifact])
  .stdout.split("\n")
  .filter(Boolean)
  .map((symbol) => symbol.replace(/^_/, ""))
  .sort();
const expectedGuardImports = JSON.parse(
  readFileSync(guardRecipePath),
).expectedImports;
const guardDylibs = run("/usr/bin/otool", ["-L", guardArtifact])
  .stdout.split("\n")
  .map((line) => line.trim())
  .filter((line) => line.startsWith("/") && !line.endsWith(":"))
  .map((line) => line.split(" ")[0]);
if (
  !run("/usr/bin/file", [guardArtifact])
    .stdout.trim()
    .endsWith("Mach-O 64-bit bundle arm64") ||
  JSON.stringify(guardDefinedGlobals) !==
    JSON.stringify(["napi_register_module_v1"]) ||
  JSON.stringify(guardUndefinedImports) !==
    JSON.stringify(expectedGuardImports) ||
  JSON.stringify(guardDylibs) !== JSON.stringify(["/usr/lib/libSystem.B.dylib"])
)
  throw new Error("SDK_GUARD_FIXTURE_STATIC_CLOSURE_INVALID");
const fakeAdapterArtifact = join(candidate, "fixtures/fake-settlement-adapter");
const fakeAdapterBuildArguments = [
  join(crateRoot, "tests/fixtures/fake-settlement-adapter.rs"),
  "-C",
  "strip=symbols",
  `--remap-path-prefix=${repository}=<repository>`,
  "-o",
  fakeAdapterArtifact,
];
run("rustc", fakeAdapterBuildArguments);
chmodSync(fakeAdapterArtifact, 0o500);
const phaseFixtureSource = readFileSync(phaseFixtureSourcePath, "utf8");
const phaseControllerSource = phaseFixtureSource.slice(
  phaseFixtureSource.indexOf("struct ControllerState"),
  phaseFixtureSource.indexOf("struct RequestRecord"),
);
if (
  !phaseFixtureSource.includes('#[path = "../../src/phase_counter_core.rs"]') ||
  !phaseFixtureSource.includes("impl PhaseController for ExplicitController") ||
  phaseFixtureSource.includes("controlled_") ||
  phaseCounterCoreSource.includes("controlled_") ||
  ["record_entry_phase", "record_worker_phase", "record_completion_phase"].some(
    (phaseFunction) =>
      (phaseFixtureSource.match(new RegExp(`${phaseFunction}\\(`, "g")) ?? [])
        .length !== 1,
  ) ||
  /(?:^|\n)\s*static\s/m.test(phaseFixtureSource) ||
  /(?:napi_|createRequire|JavaScript|\.node|thread_local!|TcpStream|UdpSocket|std::fs|std::env::var|instance_data)/.test(
    phaseFixtureSource,
  ) ||
  /(?:ControlFlowCounters|CounterSnapshot|\bcounters?\b|RequestRecord|\bresults?\b|parity|settlement)/.test(
    phaseControllerSource,
  )
)
  throw new Error("SDK_PHASE_FIXTURE_SOURCE_BOUNDARY_INVALID");
const phaseFixtureArtifact = join(candidate, "fixtures/controlled-phase-core");
const phaseFixtureBuildArguments = [
  "--edition=2024",
  "--cfg",
  "phase_fixture",
  "-C",
  "opt-level=2",
  "-C",
  "strip=symbols",
  `--remap-path-prefix=${repository}=<repository>`,
  phaseFixtureSourcePath,
  "-o",
  phaseFixtureArtifact,
];
run(
  "/usr/bin/sandbox-exec",
  [
    "-p",
    "(version 1)(allow default)(deny network*)",
    "rustc",
    ...phaseFixtureBuildArguments,
  ],
  { offline: true },
);
chmodSync(phaseFixtureArtifact, 0o500);
const phaseFixtureFile = run("/usr/bin/file", [
  phaseFixtureArtifact,
]).stdout.trim();
const phaseFixtureImports = run("/usr/bin/nm", ["-uj", phaseFixtureArtifact])
  .stdout.split("\n")
  .filter(Boolean)
  .map((symbol) => symbol.replace(/^_/, ""))
  .sort();
const phaseFixtureStrings = run("/usr/bin/strings", [
  phaseFixtureArtifact,
]).stdout;
if (
  !phaseFixtureFile.endsWith("Mach-O 64-bit executable arm64") ||
  phaseFixtureImports.some((symbol) => symbol.startsWith("napi_")) ||
  /(?:napi_register_module_v1|control_flow_observation|createGuardedOverLimitView)/.test(
    phaseFixtureStrings,
  )
)
  throw new Error("SDK_PHASE_FIXTURE_STATIC_CLOSURE_INVALID");

const bunLoader = realpathSync(process.execPath);
const artifacts = {};
const profileRows = [
  ["normal", null],
  ["panic", 'sdk_probe="panic"'],
  ["allocation-failure", 'sdk_probe="allocation_failure"'],
  ["queue-failure", 'sdk_probe="queue_failure"'],
  ["control-flow-observation", 'sdk_probe="control_flow_observation"'],
];
const artifactExpectations = {
  normal: {
    trigger: Buffer.alloc(0),
    expectedResult: "dispatches exact ADR 0056 parity response bytes",
  },
  panic: {
    trigger: Buffer.from(
      '{"protocolVersion":1,"requestId":"sdk-panic","operation":"canonicalize","input":{"value":{"kind":"json","value":null}}}\n',
    ),
    expectedResult:
      '{"protocolVersion":1,"requestId":"sdk-panic","status":"error","diagnostic":{"code":"PARITY_INTERNAL_FAILURE","path":null}}\n',
  },
  "allocation-failure": {
    trigger: Buffer.from(
      '{"protocolVersion":1,"requestId":"sdk-allocation-failure","operation":"canonicalize","input":{"value":{"kind":"json","value":null}}}\n',
    ),
    expectedResult:
      "Promise rejects with SDK_TRANSPORT_FAILED before owned input allocation",
  },
  "queue-failure": {
    trigger: Buffer.from(
      '{"protocolVersion":1,"requestId":"sdk-queue-failure","operation":"canonicalize","input":{"value":{"kind":"json","value":null}}}\n',
    ),
    expectedResult:
      "input copied once; queue refused; Promise rejects with SDK_TRANSPORT_FAILED; worker not executed",
  },
  "control-flow-observation": {
    trigger: Buffer.alloc(0),
    expectedResult: "header-json LF exact parity response bytes",
  },
};
const permittedNapi = new Map([
  ["napi_create_arraybuffer", 1],
  ["napi_create_async_work", 1],
  ["napi_create_error", 1],
  ["napi_create_promise", 1],
  ["napi_create_string_utf8", 1],
  ["napi_create_typedarray", 1],
  ["napi_define_properties", 1],
  ["napi_delete_async_work", 1],
  ["napi_get_cb_info", 1],
  ["napi_get_typedarray_info", 1],
  ["napi_get_version", 1],
  ["napi_is_typedarray", 1],
  ["napi_queue_async_work", 1],
  ["napi_reject_deferred", 1],
  ["napi_resolve_deferred", 1],
]);
const filesystemImports = new Set([
  "close",
  "closedir",
  "dirfd",
  "fstat",
  "getcwd",
  "lstat",
  "open",
  "opendir",
  "read",
  "readdir_r",
]);
const forbiddenImport =
  /(?:dlopen|dlsym|socket|connect|send|recv|fork|exec|spawn|system|threadsafe|cleanup_hook|napi_(?:get_global|get_named_property|call_function|make_callback|create_reference|get_reference_value|delete_reference|set_instance_data|get_instance_data))/;

for (const [name, cfg] of profileRows) {
  const target = join(process.env.CARGO_TARGET_DIR, name);
  const cargoArgs = [
    "rustc",
    "--manifest-path",
    manifest,
    "--release",
    "--locked",
    "--offline",
    "--lib",
    "-vv",
    "--",
    "-C",
    "link-arg=-Wl,-bundle",
    "-C",
    `link-arg=-Wl,-bundle_loader,${bunLoader}`,
    `--remap-path-prefix=${runRoot}=<candidate-root>`,
    `--remap-path-prefix=${repository}=<repository>`,
  ];
  if (cfg) cargoArgs.push("--cfg", cfg);
  const build = run(
    "/usr/bin/sandbox-exec",
    ["-p", "(version 1)(allow default)(deny network*)", "cargo", ...cargoArgs],
    { offline: true, env: { CARGO_TARGET_DIR: target } },
  );
  const linkerReceipt = `${build.stdout}${build.stderr}`;
  if (
    !linkerReceipt.includes("-dead_strip_dylibs") ||
    linkerReceipt.includes("-undefined dynamic_lookup") ||
    linkerReceipt.includes("-undefined,dynamic_lookup") ||
    ["-no_dead_strip_inits_and_terms", "-all_load", "-force_load"].some(
      (flag) => linkerReceipt.includes(flag),
    )
  )
    throw new Error(`SDK_LINKER_INVOCATION_INVALID:${name}`);
  const built = join(
    target,
    "release/libcuriosity_native_node_api_qualification.dylib",
  );
  const artifact = join(candidate, "artifacts", `${name}.node`);
  mkdirSync(dirname(artifact), { recursive: true });
  copyFileSync(built, artifact);
  chmodSync(artifact, 0o500);
  const normalize = (text) => text.replaceAll(artifact, "<candidate-artifact>");
  const file = normalize(run("/usr/bin/file", [artifact]).stdout).trim();
  const archs = run("/usr/bin/lipo", ["-archs", artifact]).stdout.trim();
  const header = normalize(run("/usr/bin/otool", ["-hv", artifact]).stdout);
  const loads = normalize(run("/usr/bin/otool", ["-l", artifact]).stdout);
  const dylibReceipt = normalize(
    run("/usr/bin/otool", ["-L", artifact]).stdout,
  );
  const dylibs = dylibReceipt
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("/"))
    .map((line) => line.split(" ")[0]);
  const defined = run("/usr/bin/nm", ["-gUj", artifact])
    .stdout.split("\n")
    .filter(Boolean)
    .map((symbol) => symbol.replace(/^_/, ""));
  const undefinedImports = run("/usr/bin/nm", ["-u", "-j", artifact])
    .stdout.split("\n")
    .filter(Boolean)
    .map((symbol) => symbol.replace(/^_/, ""))
    .sort();
  const embeddedPaths = run("/usr/bin/strings", [artifact])
    .stdout.split("\n")
    .filter((line) => line.startsWith(repository) || line.startsWith(runRoot));
  const bytes = readFileSync(artifact);
  const triggerPresence = {
    panic: bytes.includes(Buffer.from("sdk-panic")),
    allocationFailure: bytes.includes(Buffer.from("sdk-allocation-failure")),
    queueFailure: bytes.includes(Buffer.from("sdk-queue-failure")),
  };
  if (
    !file.endsWith("Mach-O 64-bit bundle arm64") ||
    archs !== "arm64" ||
    !header.includes("BUNDLE") ||
    !/platform 1\n\s+minos 15\.0/.test(loads) ||
    JSON.stringify(dylibs) !== JSON.stringify(["/usr/lib/libSystem.B.dylib"]) ||
    /LC_(?:LOAD_WEAK_DYLIB|REEXPORT_DYLIB|LOAD_UPWARD_DYLIB|LAZY_LOAD_DYLIB|ID_DYLIB|RPATH)/.test(
      loads,
    ) ||
    JSON.stringify(defined) !== JSON.stringify(["napi_register_module_v1"]) ||
    embeddedPaths.length !== 0
  )
    throw new Error(`SDK_STATIC_CLOSURE_INVALID:${name}`);
  for (const symbol of undefinedImports) {
    if (forbiddenImport.test(symbol))
      throw new Error(`SDK_FORBIDDEN_IMPORT:${name}:${symbol}`);
    if (symbol.startsWith("napi_") && !permittedNapi.has(symbol))
      throw new Error(`SDK_NODE_API_IMPORT_INVALID:${name}:${symbol}`);
  }
  if (name === "normal" && Object.values(triggerPresence).some(Boolean))
    throw new Error("SDK_NORMAL_CONTAINS_PROBE_TRIGGER");
  const expectedTrigger = {
    panic: name === "panic",
    allocationFailure: name === "allocation-failure",
    queueFailure: name === "queue-failure",
  };
  if (JSON.stringify(triggerPresence) !== JSON.stringify(expectedTrigger))
    throw new Error(`SDK_PROBE_TRIGGER_INVALID:${name}`);
  artifacts[name] = {
    sha256: sha(bytes),
    cfg: cfg ?? "normal",
    file,
    archs,
    header,
    loadCommands: loads,
    dylibs,
    definedGlobals: defined,
    undefinedImports,
    triggerPresence,
    embeddedPaths,
    linker: {
      rustflags: exactRustflags,
      bundleLoaderSha256: sha(readFileSync(bunLoader)),
      dynamicLookup: false,
      panicStrategy: "unwind",
    },
  };
}

const normal = artifacts.normal;
for (const [name] of profileRows)
  if (
    JSON.stringify(artifacts[name].dylibs) !== JSON.stringify(normal.dylibs) ||
    JSON.stringify(artifacts[name].definedGlobals) !==
      JSON.stringify(normal.definedGlobals) ||
    JSON.stringify(artifacts[name].undefinedImports) !==
      JSON.stringify(normal.undefinedImports)
  )
    throw new Error(`SDK_PROFILE_CLOSURE_MISMATCH:${name}`);
if (
  new Set(Object.values(artifacts).map((artifact) => artifact.sha256)).size !==
  5
)
  throw new Error("SDK_ARTIFACT_HASH_COLLISION");

const lockChecksums = new Map(
  [
    ...readFileSync(lockfile, "utf8").matchAll(
      /\[\[package\]\]\nname = "([^"]+)"\nversion = "([^"]+)"(?:\nsource = "[^"]+")?(?:\nchecksum = "([0-9a-f]{64})")?/g,
    ),
  ].map((match) => [`${match[1]}@${match[2]}`, match[3] ?? null]),
);
const selectedLicense = new Map([
  ["napi-sys", "MIT"],
  ["ryu-js", "Apache-2.0"],
  ["libloading", "ISC"],
  ["cfg-if", "MIT"],
  ["windows-link", "MIT"],
]);
const resolveNodes = new Map(
  metadata.resolve.nodes.map((node) => [node.id, node]),
);
const rootNode = resolveNodes.get(metadata.resolve.root);
const parents = new Map();
for (const node of metadata.resolve.nodes)
  for (const dependency of node.deps)
    parents.set(dependency.pkg, [
      ...(parents.get(dependency.pkg) ?? []),
      node.id,
    ]);
const packageRows = metadata.packages
  .filter(
    (pkg) => pkg.id === rootPackage.id || pkg.source?.startsWith("registry+"),
  )
  .map((pkg) => {
    const node = resolveNodes.get(pkg.id);
    const sourceRoot = dirname(pkg.manifest_path);
    const licenseFiles = [
      "LICENSE",
      "LICENSE-MIT",
      "LICENSE-APACHE",
      "LICENSE-ISC",
      "NOTICE",
    ]
      .filter((name) => existsSync(join(sourceRoot, name)))
      .map((name) => ({
        name,
        sha256: sha(readFileSync(join(sourceRoot, name))),
        text: readFileSync(join(sourceRoot, name), "utf8"),
      }));
    return {
      name: pkg.name,
      version: pkg.version,
      source: pkg.source,
      checksum: lockChecksums.get(`${pkg.name}@${pkg.version}`) ?? null,
      license: pkg.license,
      selectedLicense:
        pkg.id === rootPackage.id ? "MIT" : selectedLicense.get(pkg.name),
      role:
        pkg.id === rootPackage.id
          ? "first-party-root"
          : rootNode.deps.some((dependency) => dependency.pkg === pkg.id)
            ? "direct-runtime"
            : "transitive-lock",
      parents: [...(parents.get(pkg.id) ?? [])].sort(),
      enabledFeatures: [...(node?.features ?? [])].sort(),
      targetDisposition:
        pkg.name === "windows-link" ? "windows-only-not-compiled" : "darwin",
      buildOrProcMacro: pkg.targets.some((target) =>
        target.kind.some((kind) =>
          ["custom-build", "proc-macro"].includes(kind),
        ),
      ),
      licenseEvidence:
        pkg.name === "napi-sys"
          ? {
              kind: "registry-manifest-and-canonical-upstream-license",
              registryManifestSha256: sha(readFileSync(pkg.manifest_path)),
              registryDeclaration: 'license = "MIT"',
              source: napiSysSource,
              canonicalLicenseContentSha256: sha(canonicalNapiLicense),
              obligations: [
                "retain-copyright-notice",
                "retain-permission-notice",
                "retain-warranty-disclaimer",
                "attribute-napi-rs-and-github-copyright-holders",
              ],
            }
          : { kind: "archive-files", files: licenseFiles },
      retainedLicenseFiles: licenseFiles,
    };
  })
  .sort((left, right) =>
    `${left.name}@${left.version}`.localeCompare(
      `${right.name}@${right.version}`,
    ),
  );
if (
  packageRows.length !== 6 ||
  packageRows
    .filter((row) => row.source)
    .some(
      (row) =>
        !row.checksum ||
        !["MIT", "ISC", "Apache-2.0"].includes(row.selectedLicense),
    )
)
  throw new Error("SDK_DEPENDENCY_RECEIPT_POLICY_INVALID");
const graphBytes = `${JSON.stringify(
  packageRows.map(
    ({ name, version, role, parents, enabledFeatures, targetDisposition }) => ({
      name,
      version,
      role,
      parents,
      enabledFeatures,
      targetDisposition,
    }),
  ),
)}\n`;
const zeroDigest = "0".repeat(64);
const retainedTexts = packageRows
  .flatMap((row) =>
    row.retainedLicenseFiles.map(
      (file) =>
        `### ${row.name} ${row.version} — ${file.name}\n\n\`\`\`text\n${file.text}\n\`\`\``,
    ),
  )
  .join("\n\n");
const licenseTemplate = `# Legacy memory Node-API SDK v2 raw candidate licenses\n\nStatus: candidate/not-qualified. Design: raw-napi-sys-v2-control-flow-observation.\n\nDependency JSON SHA-256: \`${zeroDigest}\`. This field is normalized to 64 zeroes for the JSON-to-human binding.\n\n${packageRows.map((row) => `- ${row.name} ${row.version}: ${row.license}; selected ${row.selectedLicense}; ${row.role}`).join("\n")}\n\nObligations: retain MIT and ISC copyright/license notices; retain Apache-2.0 license and applicable NOTICE content; record modification to the private raw bridge.\n\n### napi-sys 3.3.0 — canonical upstream napi-rs MIT evidence\n\n- Repository: ${napiSysSource.repository}\n- Tag: ${napiSysSource.tag}\n- Annotated tag object: ${napiSysSource.tagObject}\n- Source commit: ${napiSysSource.commit}\n- Crate path: ${napiSysSource.pathInVcs}\n- Canonical license URL: ${napiSysSource.licenseUrl}\n- Canonical license content SHA-256: ${napiSysSource.licenseSha256}\n- Notice obligations: retain both upstream copyright notices, the permission notices, and warranty disclaimers.\n\n\`\`\`text\n${canonicalNapiLicense}\`\`\`\n\n${retainedTexts}\n`;
const directDependencies = [
  {
    name: "napi-sys",
    version: "3.3.0",
    checksum:
      "85fbf1fa9f1babfe396d74bbbf52b3643770243e8f5b0b46715d4caf7f0dfc9a",
    selectedLicense: "MIT",
    defaultFeatures: false,
    features: ["napi4"],
    authorizedUse: "raw-node-api-declarations",
  },
  {
    name: "ryu-js",
    version: "1.0.3",
    checksum:
      "04d056b875a9d2e6cb9a61d127afee9ac5999b9f87bcb32079d1318e505be714",
    selectedLicense: "Apache-2.0",
    defaultFeatures: true,
    features: [],
    authorizedUse: "shared-adr-0056-dispatcher-only",
  },
];
const dependencyReceipt = {
  schemaVersion: 3,
  design: "raw-napi-sys-v2-control-flow-observation",
  status: "candidate/not-qualified",
  manifestSha256: sha(readFileSync(manifest)),
  lockfileSha256: sha(readFileSync(lockfile)),
  normalizedGraphSha256: sha(graphBytes),
  approvedArchiveInventorySha256,
  humanReceiptSha256: sha(licenseTemplate),
  rootDependencies: directDependencies,
  forbiddenPackagesAbsent: ["napi", "napi-derive", "napi-build"],
  packages: packageRows,
};
const dependencyPath = repoPath(
  "apps/runtime/docs/licenses/legacy-memory-node-api-sdk-v2.json",
);
const humanPath = repoPath(
  "apps/runtime/docs/licenses/legacy-memory-node-api-sdk-v2.md",
);
write(dependencyPath, `${JSON.stringify(dependencyReceipt, null, 2)}\n`);
write(
  humanPath,
  licenseTemplate.replace(zeroDigest, sha(readFileSync(dependencyPath))),
);
write(
  repoPath("apps/runtime/docs/licenses/legacy-memory-node-api-sdk-v2.sha256"),
  sidecar(dependencyPath),
);

const undefinedText = `${normal.undefinedImports.join("\n")}\n`;
const undefinedPath = repoPath(
  "apps/runtime/docs/specifications/legacy-memory-node-api-sdk-v2-undefined-imports.txt",
);
write(undefinedPath, undefinedText);
write(
  repoPath(
    "apps/runtime/docs/specifications/legacy-memory-node-api-sdk-v2-undefined-imports.sha256",
  ),
  sidecar(undefinedPath),
);
const importRows = normal.undefinedImports.map((symbol) => ({
  symbol,
  category: symbol.startsWith("napi_")
    ? "node-api-v4"
    : filesystemImports.has(symbol)
      ? "shared-dispatcher-read-only-filesystem"
      : "rust-runtime-allocator-unwind",
  napiIntroduced: permittedNapi.get(symbol) ?? null,
}));
const abiReceipt = {
  schemaVersion: 3,
  qualification: "legacy-memory-node-api-sdk-v2",
  bridge: "raw-napi-sys-control-flow-observation",
  status: "candidate/not-qualified",
  target: "aarch64-apple-darwin",
  napiMinimum: 4,
  javascriptExports: ["qualificationInfo", "execute"],
  artifactProfiles: [
    "normal",
    "panic",
    "allocationFailure",
    "queueFailure",
    "controlFlowObservation",
  ],
  permittedNativeCallbackRoles: [
    "module-registration",
    "export-callbacks-two",
    "async-execute",
    "async-complete",
  ],
  linker: {
    rustflags: ["-C", "link-arg=-Wl,-dead_strip_dylibs"],
    panicStrategy: "unwind",
    dynamicLookup: false,
    bundleLoaderSha256: normal.linker.bundleLoaderSha256,
  },
  dylibs: normal.dylibs,
  rpaths: [],
  definedGlobals: normal.definedGlobals,
  undefinedImports: importRows,
  forbiddenCapabilitiesAbsent: true,
  identicalFiveProfileClosure: true,
  artifactInspection: {
    file: normal.file,
    archs: normal.archs,
    header: normal.header,
    loadCommands: normal.loadCommands,
    embeddedPaths: normal.embeddedPaths,
  },
};
const abiPath = repoPath(
  "apps/runtime/docs/specifications/legacy-memory-node-api-sdk-v2-abi.json",
);
write(abiPath, `${JSON.stringify(abiReceipt, null, 2)}\n`);
write(
  repoPath(
    "apps/runtime/docs/specifications/legacy-memory-node-api-sdk-v2-abi.sha256",
  ),
  sidecar(abiPath),
);

const sourcePaths = [
  ...filesBelow(crateRoot, (path) => path.includes("/target/")),
  ...filesBelow(toolRoot, (path) => path.includes("/target/")),
  ...filesBelow(
    join(repository, "apps/runtime/native/src/legacy_memory"),
  ).filter((path) => path.endsWith(".rs")),
  join(
    repository,
    "apps/plugin/opencode2/tests/qualification/legacy-memory-node-api-sdk.ts",
  ),
  join(
    repository,
    "apps/plugin/opencode2/tests/qualification/legacy-memory-node-api-sdk-v2.acceptance.ts",
  ),
  join(
    repository,
    "apps/plugin/opencode2/tests/qualification/legacy-memory-node-api-sdk-v2-acceptance-verifier.mjs",
  ),
  join(
    repository,
    "apps/plugin/opencode2/tools/verify-legacy-memory-native-parity.mjs",
  ),
  join(
    repository,
    "apps/runtime/docs/specifications/legacy-memory-node-api-sdk-v2.md",
  ),
  join(
    repository,
    "apps/runtime/docs/decisions/0058-fifth-node-api-control-flow-observation-artifact.md",
  ),
  join(
    repository,
    "apps/plugin/opencode2/docs/decisions/0028-fifth-node-api-control-flow-observation-companion.md",
  ),
  join(
    repository,
    "apps/runtime/docs/decisions/0059-controlled-phase-core-concurrency-evidence.md",
  ),
  join(
    repository,
    "apps/plugin/opencode2/docs/decisions/0029-controlled-phase-core-concurrency-companion.md",
  ),
  import.meta.filename,
].sort();
for (const requiredDecision of [
  "apps/runtime/docs/decisions/0059-controlled-phase-core-concurrency-evidence.md",
  "apps/plugin/opencode2/docs/decisions/0029-controlled-phase-core-concurrency-companion.md",
])
  if (!sourcePaths.includes(join(repository, requiredDecision)))
    throw new Error(`SDK_SOURCE_TREE_DECISION_MISSING:${requiredDecision}`);
const sourceTreeSha256 = sha(
  Buffer.concat(
    sourcePaths.flatMap((path) => [
      Buffer.from(`${relative(repository, path)}\0`),
      readFileSync(path),
    ]),
  ),
);
write(
  join(candidate, "source-material/source-tree-inventory.txt"),
  `${sourcePaths
    .map((path) => `${relative(repository, path)}\t${sha(readFileSync(path))}`)
    .join("\n")}\n`,
);
const sourceCommit =
  argumentsMap.get("--source-commit") ??
  run("git", ["rev-parse", "HEAD"]).stdout.trim();
const noLoadStatus = {
  addonLoaderCalls: 0,
  nativeExportCalls: 0,
  opencodeLaunches: 0,
  javascriptAddonImports: 0,
  guardFixtureLoads: 0,
  fakeAdapterExecutions: 0,
  phaseFixtureExecutions: 0,
  astScannerExecutions: 1,
  astScannerTestExecutions: 8,
  staticVerifierSelfTestExecutions: 1,
};
const noLoadReceiptPath = join(candidate, "no-addon-load-process-receipt.json");
write(
  noLoadReceiptPath,
  `${JSON.stringify(
    {
      schemaVersion: 3,
      status: "candidate/not-qualified",
      ...noLoadStatus,
      commands,
      proof:
        "candidate mode performs acquisition, canonical-license retrieval, network-denied SDK/AST-scanner/guard/fake/phase-fixture compilation, AST scanning, and static file/lipo/otool/nm/strings/git inspection only; no addon, guard fixture, fake executable, phase fixture, native export, or OpenCode process is loaded or invoked",
    },
    null,
    2,
  )}\n`,
);
const sourceMaterialRoot = join(candidate, "source-material");
const schemaMaterial = {
  qualificationInfoSchemaSha256: sha(
    '{"profiles":{"normal":"v1-exact","panic":"v1-exact","allocationFailure":"v1-exact","queueFailure":"v1-exact","controlFlowObservation":"v2-control-flow-exact"}}\n',
  ),
  executeSchemaSha256: sha(
    '{"profiles":{"normal":"exact-parity","panic":"exact-v1-probe","allocationFailure":"reject","queueFailure":"reject","controlFlowObservation":"header-json LF exact-parity-bytes"}}\n',
  ),
  paritySchemaSha256: sha(
    readFileSync(
      join(
        repository,
        "apps/runtime/docs/specifications/legacy-memory-parity-v1.md",
      ),
    ),
  ),
  observationHeaderSchemaSha256: sha(
    '{"schemaVersion":1,"kind":"control_flow_observation","orderedCounters":["inputCopyOperations","inputBytesCopied","asyncWorkCreateAttempts","asyncWorkCreateSuccesses","asyncWorkQueueAttempts","asyncWorkQueueSuccesses","workerCallbackEntries","dispatcherInvocations","completionCallbackEntries","settlementAttempts"]}\n',
  ),
  envelopeGrammarSha256: sha("header-json LF exact-parity-response-bytes\n"),
};
for (const [name, digest] of Object.entries(schemaMaterial))
  write(join(sourceMaterialRoot, `${name}.sha256`), `${digest}\n`);
const orderedCounterNames = [
  "inputCopyOperations",
  "inputBytesCopied",
  "asyncWorkCreateAttempts",
  "asyncWorkCreateSuccesses",
  "asyncWorkQueueAttempts",
  "asyncWorkQueueSuccesses",
  "workerCallbackEntries",
  "dispatcherInvocations",
  "completionCallbackEntries",
  "settlementAttempts",
];
const scannerVersion = scannerLines[0].split("\t")[1];
const scannerNormalization = scannerLines[1].split("\t")[1];
const scannedMutations = scannerLines
  .filter((line) => line.startsWith("mutation\t"))
  .map((line) => line.split("\t"));
if (
  JSON.stringify(scannedMutations.map((row) => row[1])) !==
    JSON.stringify(orderedCounterNames) ||
  scannedMutations.some((row) => row.length !== 6) ||
  scannedMutations[0][4] === scannedMutations[1][4]
)
  throw new Error("SDK_AST_COUNTER_MUTATION_SET_INVALID");
const canonicalScannedMaterial = (rows) =>
  `${rows
    .map(
      ([, name, path, symbol, node, parent]) =>
        `${name}\t${path}\t${symbol}\t${sha(`${scannerVersion}\n${scannerNormalization}\n${node}\n${parent}\n`)}`,
    )
    .join("\n")}\n`;
const counterMutationMaterial = canonicalScannedMaterial(scannedMutations);
const expectedRecorders = [
  "record_input_copy",
  "record_async_work_create_attempt",
  "record_async_work_create_success",
  "record_async_work_queue_attempt",
  "record_async_work_queue_success",
  "record_worker_callback_entry",
  "record_dispatcher_invocation",
  "record_completion_callback_entry",
  "record_settlement_attempt",
];
const scannedRecorders = scannerLines
  .filter((line) => line.startsWith("recorder\t"))
  .map((line) => line.split("\t"));
if (
  JSON.stringify(scannedRecorders.map((row) => row[1])) !==
    JSON.stringify(expectedRecorders) ||
  scannedRecorders.some((row) => row.length !== 6)
)
  throw new Error("SDK_AST_RECORDER_CALL_SET_INVALID");
const recorderCallMaterial = canonicalScannedMaterial(scannedRecorders);
const scannedPhaseCalls = scannerLines
  .filter((line) => line.startsWith("phase\t"))
  .map((line) => line.split("\t"));
if (
  JSON.stringify(scannedPhaseCalls.map((row) => row[1])) !==
    JSON.stringify(["entry", "worker", "completion"]) ||
  scannedPhaseCalls.some((row) => row.length !== 6)
)
  throw new Error("SDK_AST_PHASE_CORE_CALL_SET_INVALID");
const phaseCoreCallMaterial = canonicalScannedMaterial(scannedPhaseCalls);
for (const material of [
  counterMutationMaterial,
  recorderCallMaterial,
  phaseCoreCallMaterial,
])
  if (/^(?:mutation|recorder|phase|counter|raw)\t/m.test(material))
    throw new Error("SDK_AST_CANONICAL_PREFIX_PRESENT");
write(
  join(sourceMaterialRoot, "counter-mutation-sites.txt"),
  counterMutationMaterial,
);
write(
  join(sourceMaterialRoot, "recorder-call-sites.txt"),
  recorderCallMaterial,
);
write(
  join(sourceMaterialRoot, "phase-core-call-sites.txt"),
  phaseCoreCallMaterial,
);
const rawRows = scannerLines
  .filter((line) => line.startsWith("raw\t"))
  .map((line) => line.split("\t"));
const rawSettlementMaterial = canonicalScannedMaterial(rawRows);
if (/^raw\t/m.test(rawSettlementMaterial))
  throw new Error("SDK_AST_CANONICAL_PREFIX_PRESENT");
write(
  join(sourceMaterialRoot, "raw-settlement-call-site.txt"),
  rawSettlementMaterial,
);
const controlFlow = {
  counterSchema: "legacy-memory-node-api-control-flow-counters-v1",
  orderedCounterNames,
  counterMutationSitesSha256: sha(counterMutationMaterial),
  recorderCallSitesSha256: sha(recorderCallMaterial),
  phaseCoreCallSitesSha256: sha(phaseCoreCallMaterial),
  rawSettlementCallSiteSha256: sha(rawSettlementMaterial),
  fakeAdapterVectorsSha256: sha(fakeAdapterVectors),
};
const clangVersion = run("/usr/bin/clang", ["--version"]).stdout.trim();
const verificationTools = {
  astScannerVersion: scannerVersion,
  astScannerSourceSha256: sha(readFileSync(join(toolRoot, "src/main.rs"))),
  astScannerManifestSha256: sha(readFileSync(toolManifest)),
  astScannerLockfileSha256: sha(readFileSync(toolLockfile)),
  astScannerDependencyReceiptSha256: sha(scannerDependencyReceiptBytes),
  astNormalizationSha256: sha(`${scannerNormalization}\n`),
  astOutputSha256: sha(scannerOutput),
  guardSourceSha256: sha(readFileSync(guardSourcePath)),
  guardBuildRecipeSha256: sha(readFileSync(guardRecipePath)),
  guardCompilerSha256: sha(`${clangVersion}\n`),
  guardArtifactSha256: sha(readFileSync(guardArtifact)),
  guardImportsSha256: sha(`${guardUndefinedImports.join("\n")}\n`),
  guardExportsSha256: sha(`${guardDefinedGlobals.join("\n")}\n`),
  fakeAdapterBuildRecipeSha256: sha(
    `${fakeAdapterBuildArguments
      .map((argument) =>
        argument
          .replaceAll(repository, "<repository>")
          .replaceAll(runRoot, "<RUN_ROOT>"),
      )
      .join("\n")}\n`,
  ),
  fakeAdapterArtifactSha256: sha(readFileSync(fakeAdapterArtifact)),
  phaseFixtureSourceSha256: sha(readFileSync(phaseFixtureSourcePath)),
  phaseFixtureBuildRecipeSha256: sha(readFileSync(phaseFixtureRecipePath)),
  phaseFixtureArtifactSha256: sha(readFileSync(phaseFixtureArtifact)),
  phaseFixtureTranscriptSchemaSha256: sha(
    readFileSync(phaseFixtureTranscriptSchemaPath),
  ),
};
const packageSurfacePaths = new Set();
const addPackageSurface = (path) => {
  if (!existsSync(path)) return;
  const metadata = lstatSync(path);
  if (metadata.isSymbolicLink())
    throw new Error("SDK_PACKAGE_SURFACE_SYMLINK_FORBIDDEN");
  if (metadata.isDirectory()) {
    for (const nested of filesBelow(path)) packageSurfacePaths.add(nested);
  } else {
    packageSurfacePaths.add(path);
  }
};
const pluginPackageRoot = join(repository, "apps/plugin/opencode2");
const pluginPackage = JSON.parse(
  readFileSync(join(pluginPackageRoot, "package.json")),
);
for (const packagePath of pluginPackage.files)
  addPackageSurface(join(pluginPackageRoot, packagePath));
for (const exported of Object.values(pluginPackage.exports).flatMap((value) =>
  typeof value === "string" ? [value] : Object.values(value),
))
  addPackageSurface(join(pluginPackageRoot, exported));
const runtimePackageRoot = join(repository, "apps/runtime");
const runtimePackage = JSON.parse(
  readFileSync(join(runtimePackageRoot, "package.json")),
);
for (const exported of Object.values(runtimePackage.exports).flatMap((value) =>
  typeof value === "string" ? [value] : Object.values(value),
))
  addPackageSurface(join(runtimePackageRoot, exported));
const repositoryInventory = run("git", [
  "ls-files",
  "--cached",
  "--others",
  "--exclude-standard",
])
  .stdout.split("\n")
  .filter(Boolean);
for (const repositoryPath of repositoryInventory) {
  if (
    /(?:^|\/)(?:assets|dist|provenance|bundles?|install[^/]*|release[^/]*|m7[^/]*)(?:\/|$)/i.test(
      repositoryPath,
    ) &&
    !repositoryPath.startsWith("apps/runtime/native-node-api-qualification/") &&
    !repositoryPath.startsWith("apps/plugin/opencode2/tests/qualification/") &&
    !repositoryPath.startsWith("apps/runtime/docs/") &&
    !repositoryPath.startsWith("apps/plugin/opencode2/docs/")
  )
    addPackageSurface(join(repository, repositoryPath));
}
const packageAbsenceMarkers = [
  "control_flow_observation",
  "legacy-memory-node-api-control-flow-counters-v1",
  "controlled-phase-core",
  "controlled_phase_core",
  "phase_fixture",
  "ExplicitController",
  "PhaseController",
  "controlledPhaseCoreInterleaving",
  verificationTools.phaseFixtureSourceSha256,
  verificationTools.phaseFixtureBuildRecipeSha256,
  verificationTools.phaseFixtureArtifactSha256,
  verificationTools.phaseFixtureTranscriptSchemaSha256,
];
const packageAbsenceInventory = [];
for (const path of [...packageSurfacePaths].sort()) {
  const bytes = readFileSync(path);
  const text = bytes.toString("utf8");
  if (packageAbsenceMarkers.some((marker) => text.includes(marker)))
    throw new Error(`SDK_PACKAGE_ABSENCE_FAILED:${relative(repository, path)}`);
  const fileKind = run("/usr/bin/file", [path]).stdout.trim();
  let stringsSha256 = null;
  if (/(?:Mach-O|archive|executable|shared library)/i.test(fileKind)) {
    const strings = run("/usr/bin/strings", [path]).stdout;
    if (packageAbsenceMarkers.some((marker) => strings.includes(marker)))
      throw new Error(
        `SDK_PACKAGE_BINARY_STRING_ABSENCE_FAILED:${relative(repository, path)}`,
      );
    stringsSha256 = sha(strings);
  }
  packageAbsenceInventory.push({
    path: relative(repository, path),
    sha256: sha(bytes),
    fileKind,
    stringsSha256,
  });
}
write(
  join(candidate, "source-material/packaging-absence-inventory.json"),
  `${JSON.stringify(packageAbsenceInventory, null, 2)}\n`,
);
const normalizedEnvironment = Object.entries(approvedEnvironment)
  .filter(([, value]) => value !== undefined)
  .map(([name, value]) => [
    name,
    String(value)
      .replaceAll(runRoot, "<RUN_ROOT>")
      .replaceAll(process.env.CARGO_HOME, "<CARGO_HOME>")
      .replaceAll(process.env.CARGO_TARGET_DIR, "<CARGO_TARGET_DIR>"),
  ])
  .sort(([left], [right]) => left.localeCompare(right));
const normalizedNames = `${normalizedEnvironment.map(([name]) => name).join("\n")}\n`;
const normalizedNameValues = `${normalizedEnvironment.map(([name, value]) => `${name}=${value}`).join("\n")}\n`;
const environment = {
  normalizedNamesSha256: sha(normalizedNames),
  normalizedNameValueSha256: sha(normalizedNameValues),
};
const rustcVersion = run("rustc", ["--version", "--verbose"]).stdout.trim();
const cargoVersion = run("cargo", ["--version", "--verbose"]).stdout.trim();
const observationMarkers = [
  "control_flow_observation",
  "header-json LF exact-parity-bytes",
  "legacy-memory-node-api-control-flow-counters-v1",
  ...orderedCounterNames,
];
const normalStrings = run("/usr/bin/strings", [
  join(candidate, "artifacts/normal.node"),
]).stdout;
if (observationMarkers.some((marker) => normalStrings.includes(marker)))
  throw new Error("SDK_NORMAL_OBSERVATION_STRING_PRESENT");
const profileDefinitions = [
  ["normal", "normal", null, "normal-and-opencode"],
  ["panic", "panic", 'sdk_probe="panic"', "isolated-bun-fault-child"],
  [
    "allocation-failure",
    "allocationFailure",
    'sdk_probe="allocation_failure"',
    "isolated-bun-fault-child",
  ],
  [
    "queue-failure",
    "queueFailure",
    'sdk_probe="queue_failure"',
    "isolated-bun-fault-child",
  ],
  [
    "control-flow-observation",
    "controlFlowObservation",
    'sdk_probe="control_flow_observation"',
    "isolated-bun-observation-child",
  ],
];
const profileReceipts = [];
for (const [
  artifactName,
  profile,
  exclusiveCfg,
  loaderClass,
] of profileDefinitions) {
  const artifact = artifacts[artifactName];
  const receipt = {
    schemaVersion: 3,
    qualification: "legacy-memory-node-api-sdk-v2",
    receiptKind: "candidate-profile",
    profile,
    exclusiveCfg,
    triggerSha256:
      artifactExpectations[artifactName].trigger.byteLength === 0
        ? null
        : sha(artifactExpectations[artifactName].trigger),
    artifactSha256: artifact.sha256,
    source: {
      sourceCommit,
      sourceTreeSha256,
      manifestSha256: dependencyReceipt.manifestSha256,
      lockfileSha256: dependencyReceipt.lockfileSha256,
      sharedDispatcherSha256: sha(
        readFileSync(
          join(repository, "apps/runtime/native/src/legacy_memory/protocol.rs"),
        ),
      ),
      counterSourceSha256: sha(counterSource),
      phaseCounterCoreSha256: sha(phaseCounterCoreSource),
      settlementGateSourceSha256: sha(settlementSource),
      settlementAdapterSourceSha256: sha(settlementSource),
      settlementCoreSourceSha256: sha(settlementCoreSource),
      fakeAdapterSourceSha256: sha(fakeAdapterSource),
    },
    schemas: schemaMaterial,
    controlFlow,
    verificationTools,
    compiler: {
      rustcVersion,
      cargoVersion,
      target: "aarch64-apple-darwin",
      profile: "release",
      panicStrategy: "unwind",
      rustflags: exactRustflags,
      linkerArguments: ["-Wl,-dead_strip_dylibs", "-Wl,-bundle"],
      macosDeploymentTarget: "15.0",
    },
    environment,
    imports: {
      abiReceiptSha256: sha(readFileSync(abiPath)),
      undefinedImportsSha256: sha(readFileSync(undefinedPath)),
      symbolClassificationsSha256: sha(`${JSON.stringify(importRows)}\n`),
      loadCommandsSha256: sha(artifact.loadCommands),
      loadDylibs: artifact.dylibs,
      rpaths: [],
      definedGlobals: artifact.definedGlobals,
      napiMinimum: 4,
      napiHostMaximum: null,
    },
    loaderClass,
    staticVerdicts: {
      machOClosure: true,
      twoExportsOnly: true,
      importsClosed: true,
      soleRawSettlementCallSiteInAdapter: true,
      counterMutationSitesClosed: true,
      recorderCallSitesClosed: true,
      phaseCoreCallSitesClosed: true,
      phaseFixtureStandalone: true,
      phaseFixtureCoordinationClosed: true,
      normalObservationStringsAbsent: true,
    },
  };
  const receiptPath = `apps/runtime/docs/specifications/legacy-memory-node-api-sdk-v2-${artifactName}-receipt.json`;
  const sidecarPath = receiptPath.replace(/\.json$/, ".sha256");
  const proposedReceipt = repoPath(receiptPath);
  write(proposedReceipt, `${JSON.stringify(receipt, null, 2)}\n`);
  write(repoPath(sidecarPath), sidecar(proposedReceipt));
  profileReceipts.push({
    profile,
    receiptPath,
    receiptSha256: sha(readFileSync(proposedReceipt)),
    sidecarPath,
    artifactSha256: artifact.sha256,
  });
}
const candidateAggregate = {
  schemaVersion: 3,
  qualification: "legacy-memory-node-api-sdk-v2",
  receiptKind: "candidate",
  dependencyReceiptSha256: sha(readFileSync(dependencyPath)),
  humanLicenseReceiptSha256: sha(readFileSync(humanPath)),
  abiReceiptSha256: sha(readFileSync(abiPath)),
  undefinedImportsSha256: sha(readFileSync(undefinedPath)),
  schemas: schemaMaterial,
  controlFlow,
  verificationTools,
  profiles: profileReceipts,
  candidateStaticVerdicts: {
    allProfileReceiptsClosed: true,
    allTenArtifactHashPairsUnequal: true,
    normalObservationStringsAbsent: true,
    soleRawSettlementCallSiteInAdapter: true,
    counterMutationSitesClosed: true,
    recorderCallSitesClosed: true,
    phaseCoreCallSitesClosed: true,
    phaseFixtureStandalone: true,
    phaseFixtureCoordinationClosed: true,
    dependencyClosureApproved: true,
    abiAndImportsClosed: true,
  },
};
const aggregatePath = repoPath(
  "apps/runtime/docs/specifications/legacy-memory-node-api-sdk-v2-candidate-receipt.json",
);
write(aggregatePath, `${JSON.stringify(candidateAggregate, null, 2)}\n`);
write(
  repoPath(
    "apps/runtime/docs/specifications/legacy-memory-node-api-sdk-v2-candidate-receipt.sha256",
  ),
  sidecar(aggregatePath),
);
const receiptPaths = [
  dependencyPath,
  humanPath,
  repoPath("apps/runtime/docs/licenses/legacy-memory-node-api-sdk-v2.sha256"),
  abiPath,
  repoPath(
    "apps/runtime/docs/specifications/legacy-memory-node-api-sdk-v2-abi.sha256",
  ),
  undefinedPath,
  repoPath(
    "apps/runtime/docs/specifications/legacy-memory-node-api-sdk-v2-undefined-imports.sha256",
  ),
  ...profileReceipts.flatMap((profile) => [
    repoPath(profile.receiptPath),
    repoPath(profile.sidecarPath),
  ]),
  aggregatePath,
  repoPath(
    "apps/runtime/docs/specifications/legacy-memory-node-api-sdk-v2-candidate-receipt.sha256",
  ),
];
const normalProfileReceipt = JSON.parse(
  readFileSync(repoPath(profileReceipts[0].receiptPath)),
);
const approvalProposal = {
  schemaVersion: 3,
  qualification: "legacy-memory-node-api-sdk-v2",
  decision: "proposal-only/not-approved",
  candidate: {
    path: relative(proposed, aggregatePath),
    sha256: sha(readFileSync(aggregatePath)),
  },
  profiles: profileReceipts.map(
    ({ profile, receiptPath, receiptSha256, artifactSha256 }) => ({
      profile,
      receiptPath,
      receiptSha256,
      artifactSha256,
    }),
  ),
  dependencyPolicy: {
    dependencyReceiptSha256: candidateAggregate.dependencyReceiptSha256,
    humanLicenseReceiptSha256: candidateAggregate.humanLicenseReceiptSha256,
    normalizedGraphSha256: dependencyReceipt.normalizedGraphSha256,
    approvedArchiveInventorySha256,
  },
  schemas: schemaMaterial,
  controlFlow,
  verificationTools,
  compilerPolicy: normalProfileReceipt.compiler,
  environmentPolicy: environment,
  importPolicy: normalProfileReceipt.imports,
  approval: null,
};
const approvalProposalPath = join(candidate, "approval-proposal.json");
write(approvalProposalPath, `${JSON.stringify(approvalProposal, null, 2)}\n`);
const review = {
  schemaVersion: 3,
  qualification: "legacy-memory-node-api-sdk-v2",
  design: "raw-napi-sys-v2-control-flow-observation",
  status: "candidate/not-qualified",
  candidate: {
    path: relative(proposed, aggregatePath),
    sha256: sha(readFileSync(aggregatePath)),
  },
  profiles: profileReceipts,
  dependencyPolicy: {
    normalizedGraphSha256: dependencyReceipt.normalizedGraphSha256,
    approvedArchiveInventorySha256,
    directDependencies,
    forbiddenPackages: ["napi", "napi-derive", "napi-build"],
    approvedSpdx: ["MIT", "ISC", "Apache-2.0"],
  },
  linkerPolicy: {
    rustflags: ["-C", "link-arg=-Wl,-dead_strip_dylibs"],
    panicStrategy: "unwind",
    loadDylibs: ["/usr/lib/libSystem.B.dylib"],
    rpaths: [],
    definedGlobals: ["napi_register_module_v1"],
  },
  schemas: schemaMaterial,
  controlFlow,
  verificationTools,
  approvalProposal: {
    path: relative(runRoot, approvalProposalPath),
    sha256: sha(readFileSync(approvalProposalPath)),
    status: "proposal-only/not-approved",
  },
  noLoadStatus,
  approvedArchiveRoot,
  proposedReceipts: receiptPaths.map((path) => ({
    path: relative(proposed, path),
    sha256: sha(readFileSync(path)),
  })),
};
write(reviewPath, `${JSON.stringify(review, null, 2)}\n`);
console.log(JSON.stringify(review, null, 2));
console.log("candidate/not-qualified");
