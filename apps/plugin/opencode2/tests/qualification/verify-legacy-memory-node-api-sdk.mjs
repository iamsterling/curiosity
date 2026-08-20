#!/usr/bin/env bun
import { createHash } from "node:crypto";
import {
  chmodSync,
  copyFileSync,
  existsSync,
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
const approval = join(
  repository,
  "apps/runtime/docs/approvals/legacy-memory-node-api-sdk-v1.json",
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
if (argumentsMap.get("--phase") !== "candidate-generate") {
  console.error(
    "SDK_APPROVAL_REQUIRED: acceptance is blocked in candidate/not-qualified status",
  );
  process.exit(2);
}
if (existsSync(approval)) throw new Error("SDK_PREMATURE_APPROVAL_RECORD");
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

const commands = [];
const run = (command, args, options = {}) => {
  commands.push([command, ...args]);
  const result = spawnSync(command, args, {
    cwd: repository,
    encoding: "utf8",
    env: {
      ...process.env,
      LC_ALL: "C",
      CARGO_NET_OFFLINE: options.offline
        ? "true"
        : process.env.CARGO_NET_OFFLINE,
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
  if (bridgeSource.includes(forbidden))
    throw new Error(`SDK_FORBIDDEN_SOURCE_CAPABILITY:${forbidden}`);
if (
  (bridgeSource.match(/static mut|OnceLock|LazyLock|Mutex|RwLock/g) ?? [])
    .length !== 0
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
const allocationSettle = allocationProbeSource.indexOf(
  "reject_value(env, deferred, rejection)",
);
if (
  allocationCreate < 0 ||
  allocationInject < 0 ||
  allocationSettle < 0 ||
  !(allocationCreate < allocationInject && allocationInject < allocationSettle)
)
  throw new Error("SDK_ALLOCATION_REJECTION_ORDER_INVALID");

run("cargo", ["fetch", "--manifest-path", manifest, "--locked"]);
const canonicalNapiLicense = run("/usr/bin/curl", [
  "-fsSL",
  napiSysSource.licenseUrl,
]).stdout;
if (sha(canonicalNapiLicense) !== napiSysSource.licenseSha256)
  throw new Error("SDK_NAPI_SYS_UPSTREAM_LICENSE_MISMATCH");
const metadata = JSON.parse(
  run("cargo", [
    "metadata",
    "--manifest-path",
    manifest,
    "--locked",
    "--format-version",
    "1",
  ]).stdout,
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

const bunLoader = realpathSync(process.execPath);
const artifacts = {};
const profileRows = [
  ["normal", null],
  ["panic", 'sdk_probe="panic"'],
  ["allocation-failure", 'sdk_probe="allocation_failure"'],
  ["queue-failure", 'sdk_probe="queue_failure"'],
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
  4
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
const licenseTemplate = `# Legacy memory Node-API SDK v1 raw candidate licenses\n\nStatus: candidate/not-qualified. Design: raw-napi-sys-v1.\n\nDependency JSON SHA-256: \`${zeroDigest}\`. This field is normalized to 64 zeroes for the JSON-to-human binding.\n\n${packageRows.map((row) => `- ${row.name} ${row.version}: ${row.license}; selected ${row.selectedLicense}; ${row.role}`).join("\n")}\n\nObligations: retain MIT and ISC copyright/license notices; retain Apache-2.0 license and applicable NOTICE content; record modification to the private raw bridge.\n\n### napi-sys 3.3.0 — canonical upstream napi-rs MIT evidence\n\n- Repository: ${napiSysSource.repository}\n- Tag: ${napiSysSource.tag}\n- Annotated tag object: ${napiSysSource.tagObject}\n- Source commit: ${napiSysSource.commit}\n- Crate path: ${napiSysSource.pathInVcs}\n- Canonical license URL: ${napiSysSource.licenseUrl}\n- Canonical license content SHA-256: ${napiSysSource.licenseSha256}\n- Notice obligations: retain both upstream copyright notices, the permission notices, and warranty disclaimers.\n\n\`\`\`text\n${canonicalNapiLicense}\`\`\`\n\n${retainedTexts}\n`;
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
  schemaVersion: 2,
  design: "raw-napi-sys-v1",
  status: "candidate/not-qualified",
  manifestSha256: sha(readFileSync(manifest)),
  lockfileSha256: sha(readFileSync(lockfile)),
  normalizedGraphSha256: sha(graphBytes),
  humanReceiptSha256: sha(licenseTemplate),
  rootDependencies: directDependencies,
  forbiddenPackagesAbsent: ["napi", "napi-derive", "napi-build"],
  packages: packageRows,
};
const dependencyPath = repoPath(
  "apps/runtime/docs/licenses/legacy-memory-node-api-sdk-v1.json",
);
const humanPath = repoPath(
  "apps/runtime/docs/licenses/legacy-memory-node-api-sdk-v1.md",
);
write(dependencyPath, `${JSON.stringify(dependencyReceipt, null, 2)}\n`);
write(
  humanPath,
  licenseTemplate.replace(zeroDigest, sha(readFileSync(dependencyPath))),
);
write(
  repoPath("apps/runtime/docs/licenses/legacy-memory-node-api-sdk-v1.sha256"),
  sidecar(dependencyPath),
);

const undefinedText = `${normal.undefinedImports.join("\n")}\n`;
const undefinedPath = repoPath(
  "apps/runtime/docs/specifications/legacy-memory-node-api-sdk-v1-undefined-imports.txt",
);
write(undefinedPath, undefinedText);
write(
  repoPath(
    "apps/runtime/docs/specifications/legacy-memory-node-api-sdk-v1-undefined-imports.sha256",
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
  schemaVersion: 2,
  bridge: "raw-napi-sys",
  status: "candidate/not-qualified",
  target: "aarch64-apple-darwin",
  napiMinimum: 4,
  javascriptExports: ["qualificationInfo", "execute"],
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
  identicalFourProfileClosure: true,
  artifactInspection: {
    file: normal.file,
    archs: normal.archs,
    header: normal.header,
    loadCommands: normal.loadCommands,
    embeddedPaths: normal.embeddedPaths,
  },
};
const abiPath = repoPath(
  "apps/runtime/docs/specifications/legacy-memory-node-api-sdk-v1-abi.json",
);
write(abiPath, `${JSON.stringify(abiReceipt, null, 2)}\n`);
write(
  repoPath(
    "apps/runtime/docs/specifications/legacy-memory-node-api-sdk-v1-abi.sha256",
  ),
  sidecar(abiPath),
);

const sourcePaths = [
  ...filesBelow(crateRoot, (path) => path.includes("/target/")),
  ...filesBelow(
    join(repository, "apps/runtime/native/src/legacy_memory"),
  ).filter((path) => path.endsWith(".rs")),
  join(
    repository,
    "apps/plugin/opencode2/tests/qualification/legacy-memory-node-api-sdk.ts",
  ),
  join(
    repository,
    "apps/plugin/opencode2/tests/qualification/legacy-memory-node-api-sdk.test.ts",
  ),
  import.meta.filename,
].sort();
const sourceTreeSha256 = sha(
  Buffer.concat(
    sourcePaths.flatMap((path) => [
      Buffer.from(`${relative(repository, path)}\0`),
      readFileSync(path),
    ]),
  ),
);
const sourceCommit = run("git", ["rev-parse", "HEAD"]).stdout.trim();
const noLoadStatus = {
  addonLoaderCalls: 0,
  nativeExportCalls: 0,
  opencodeLaunches: 0,
  javascriptAddonImports: 0,
};
const noLoadReceiptPath = join(candidate, "no-addon-load-process-receipt.json");
write(
  noLoadReceiptPath,
  `${JSON.stringify(
    {
      schemaVersion: 2,
      status: "candidate/not-qualified",
      ...noLoadStatus,
      commands,
      proof:
        "candidate mode performs acquisition, canonical-license retrieval, network-denied compilation, and static file/lipo/otool/nm/strings/git inspection only",
    },
    null,
    2,
  )}\n`,
);
const artifactReceipts = {};
for (const [name, cfg] of profileRows) {
  const artifact = artifacts[name];
  const expectation = artifactExpectations[name];
  const receipt = {
    schemaVersion: 2,
    status: "candidate/not-qualified",
    artifact: name,
    artifactSha256: artifact.sha256,
    sourceCommit,
    sourceTreeSha256,
    manifestSha256: dependencyReceipt.manifestSha256,
    lockfileSha256: dependencyReceipt.lockfileSha256,
    normalizedGraphSha256: dependencyReceipt.normalizedGraphSha256,
    profile: "release",
    cfg: cfg ?? "normal",
    triggerSha256: sha(expectation.trigger),
    triggerByteLength: expectation.trigger.byteLength,
    expectedResult: expectation.expectedResult,
    abiReceiptSha256: sha(readFileSync(abiPath)),
    undefinedImportsReceiptSha256: sha(readFileSync(undefinedPath)),
    machoClosure: {
      target: "aarch64-apple-darwin",
      architecture: artifact.archs,
      fileType: "Mach-O 64-bit bundle",
      deploymentTarget: "15.0",
      dylibs: artifact.dylibs,
      rpaths: [],
      definedGlobals: artifact.definedGlobals,
      undefinedImports: artifact.undefinedImports,
      embeddedPaths: artifact.embeddedPaths,
      dynamicLookup: false,
    },
    noLoadStatus,
    settlementPolicy: {
      completionAttempts: 1,
      retryOnSettlementFailure: false,
      harnessFailureCode: "SDK_TRANSPORT_COMPLETION_FAILED",
    },
  };
  const path = join(candidate, `${name}-artifact.json`);
  write(path, `${JSON.stringify(receipt, null, 2)}\n`);
  artifactReceipts[name] = {
    path,
    sha256: sha(readFileSync(path)),
  };
}
const receiptPaths = [
  dependencyPath,
  humanPath,
  repoPath("apps/runtime/docs/licenses/legacy-memory-node-api-sdk-v1.sha256"),
  abiPath,
  repoPath(
    "apps/runtime/docs/specifications/legacy-memory-node-api-sdk-v1-abi.sha256",
  ),
  undefinedPath,
  repoPath(
    "apps/runtime/docs/specifications/legacy-memory-node-api-sdk-v1-undefined-imports.sha256",
  ),
];
const review = {
  schemaVersion: 2,
  qualification: "legacy-memory-node-api-sdk-v1",
  design: "raw-napi-sys-v1",
  status: "candidate/not-qualified",
  candidate: {
    sourceCommit,
    sourceTreeSha256,
    manifestSha256: dependencyReceipt.manifestSha256,
    lockfileSha256: dependencyReceipt.lockfileSha256,
    dependencyReceiptSha256: sha(readFileSync(dependencyPath)),
    humanLicenseReceiptSha256: sha(readFileSync(humanPath)),
    abiReceiptSha256: sha(readFileSync(abiPath)),
    undefinedImportsSha256: sha(readFileSync(undefinedPath)),
    normalArtifactSha256: artifacts.normal.sha256,
    panicArtifactSha256: artifacts.panic.sha256,
    allocationFailureArtifactSha256: artifacts["allocation-failure"].sha256,
    queueFailureArtifactSha256: artifacts["queue-failure"].sha256,
    normalArtifactReceiptSha256: artifactReceipts.normal.sha256,
    panicArtifactReceiptSha256: artifactReceipts.panic.sha256,
    allocationFailureArtifactReceiptSha256:
      artifactReceipts["allocation-failure"].sha256,
    queueFailureArtifactReceiptSha256: artifactReceipts["queue-failure"].sha256,
  },
  dependencyPolicy: {
    normalizedGraphSha256: dependencyReceipt.normalizedGraphSha256,
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
  proposedReceipts: receiptPaths.map((path) => ({
    path: relative(proposed, path),
    sha256: sha(readFileSync(path)),
  })),
};
write(reviewPath, `${JSON.stringify(review, null, 2)}\n`);
console.log(JSON.stringify(review, null, 2));
console.log("candidate/not-qualified");
