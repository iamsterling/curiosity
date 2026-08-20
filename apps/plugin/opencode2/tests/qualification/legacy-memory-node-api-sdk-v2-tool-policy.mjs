import { createHash } from "node:crypto";
import {
  existsSync,
  lstatSync,
  readFileSync,
  realpathSync,
  statSync,
} from "node:fs";
import { dirname, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

export const MINIMAL_SYSTEM_PATH = "/usr/bin:/bin:/usr/sbin:/sbin";

const sha = (bytes) => createHash("sha256").update(bytes).digest("hex");
const canonicalJsonSha = (value) => sha(`${JSON.stringify(value)}\n`);

const fixedToolPaths = (repository, bunPath) => {
  const bun = realpathSync(bunPath);
  const nodePrefix = bun.includes("/lib/node_modules/bun/")
    ? bun.slice(0, bun.indexOf("/lib/node_modules/bun/"))
    : null;
  if (nodePrefix === null) throw new Error("SDK_NODE_CANONICAL_PATH_UNKNOWN");
  return {
    rustc:
      "/Users/sterling/.rustup/toolchains/stable-aarch64-apple-darwin/bin/rustc",
    rustdoc:
      "/Users/sterling/.rustup/toolchains/stable-aarch64-apple-darwin/bin/rustdoc",
    cargo:
      "/Users/sterling/.rustup/toolchains/stable-aarch64-apple-darwin/bin/cargo",
    cargoFmt:
      "/Users/sterling/.rustup/toolchains/stable-aarch64-apple-darwin/bin/cargo-fmt",
    cargoClippy:
      "/Users/sterling/.rustup/toolchains/stable-aarch64-apple-darwin/bin/cargo-clippy",
    clang: "/usr/bin/clang",
    ld: "/usr/bin/ld",
    bun,
    node: `${nodePrefix}/bin/node`,
    git: "/usr/bin/git",
    curl: "/usr/bin/curl",
    file: "/usr/bin/file",
    lipo: "/usr/bin/lipo",
    nm: "/usr/bin/nm",
    otool: "/usr/bin/otool",
    strings: "/usr/bin/strings",
    sandboxExec: "/usr/bin/sandbox-exec",
    ps: "/bin/ps",
    sysctl: "/usr/sbin/sysctl",
    sleep: "/bin/sleep",
    time: "/usr/bin/time",
    openCode: join(
      repository,
      "apps/plugin/opencode2/node_modules/.bin/opencode2",
    ),
  };
};

const versionArguments = {
  rustc: ["--version", "--verbose"],
  cargo: ["--version", "--verbose"],
  clang: ["--version"],
  ld: ["-v"],
  bun: ["--version"],
  node: ["--version"],
};

const executableReceipt = (name, path) => {
  const canonicalPath = realpathSync(path);
  if (!statSync(canonicalPath).isFile())
    throw new Error(`SDK_TOOL_PATH_INVALID:${name}`);
  const receipt = {
    path: canonicalPath,
    sha256: sha(readFileSync(canonicalPath)),
  };
  if (!(name in versionArguments)) return receipt;
  const result = spawnSync(canonicalPath, versionArguments[name], {
    encoding: "utf8",
    env: { PATH: MINIMAL_SYSTEM_PATH, LC_ALL: "C" },
  });
  if (result.status !== 0)
    throw new Error(`SDK_TOOL_VERSION_FAILED:${name}:${result.status}`);
  return {
    ...receipt,
    version: `${result.stdout}${result.stderr}`.trim(),
  };
};

const openCodeReceipt = (repository, executablePath) => {
  const packagePath = realpathSync(
    join(
      repository,
      "apps/plugin/opencode2/node_modules/@opencode-ai/cli/package.json",
    ),
  );
  const packageBytes = readFileSync(packagePath);
  const packageJson = JSON.parse(packageBytes);
  if (
    packageJson.name !== "@opencode-ai/cli" ||
    packageJson.version !== "0.0.0-beta-17595"
  )
    throw new Error("SDK_OPENCODE_PIN_INVALID");
  const executable = executableReceipt("openCode", executablePath);
  return {
    ...executable,
    version: packageJson.version,
    packagePath,
    packageSha256: sha(packageBytes),
  };
};

const ambientPackage = (executablePath) => {
  let current = dirname(executablePath);
  while (current !== dirname(current)) {
    const packagePath = join(current, "package.json");
    if (existsSync(packagePath)) {
      const bytes = readFileSync(packagePath);
      const parsed = JSON.parse(bytes);
      if (parsed.name === "@opencode-ai/cli")
        return { packagePath: realpathSync(packagePath), bytes, parsed };
    }
    current = dirname(current);
  }
  return null;
};

export const discoverAmbientOpenCode = (inheritedPath) => {
  for (const directory of inheritedPath.split(":")) {
    if (directory === "") continue;
    const commandPath = join(directory, "opencode2");
    if (!existsSync(commandPath)) continue;
    const metadata = lstatSync(commandPath);
    if (!metadata.isFile() && !metadata.isSymbolicLink()) continue;
    const executablePath = realpathSync(commandPath);
    const foundPackage = ambientPackage(executablePath);
    if (foundPackage === null)
      throw new Error("SDK_AMBIENT_OPENCODE_PACKAGE_INVALID");
    return {
      status: "present-forbidden",
      commandPath: resolve(commandPath),
      executablePath,
      executableSha256: sha(readFileSync(executablePath)),
      packagePath: foundPackage.packagePath,
      packageSha256: sha(foundPackage.bytes),
      version: foundPackage.parsed.version,
      executed: false,
    };
  }
  return {
    status: "absent",
    commandPath: null,
    executablePath: null,
    executableSha256: null,
    packagePath: null,
    packageSha256: null,
    version: null,
    executed: false,
  };
};

const normalizedEnvironmentValues = (tools, repository) => ({
  PATH: MINIMAL_SYSTEM_PATH,
  HOME: "<RUN_ROOT>/home",
  CARGO_HOME: "<CARGO_HOME>",
  CARGO_TARGET_DIR: "<CARGO_TARGET_DIR>",
  CARGO_NET_OFFLINE: "true",
  CARGO: tools.cargo.path,
  CARGO_FMT: tools.cargoFmt.path,
  CARGO_CLIPPY: tools.cargoClippy.path,
  RUSTC: tools.rustc.path,
  RUSTDOC: tools.rustdoc.path,
  CARGO_TARGET_AARCH64_APPLE_DARWIN_LINKER: tools.clang.path,
  MACOSX_DEPLOYMENT_TARGET: "15.0",
  RUSTFLAGS: "-C link-arg=-Wl,-dead_strip_dylibs",
  LC_ALL: "C",
  TMPDIR: "<RUN_ROOT>",
  XDG_CONFIG_HOME: "<RUN_ROOT>/opencode-config",
  XDG_CACHE_HOME: "<RUN_ROOT>/opencode-cache",
  OPENCODE_CONFIG: "<RUN_ROOT>/opencode-test-plugin/opencode.json",
  SDK_REGRESSION_CARGO_TARGET_DIR: join(
    repository,
    "apps/runtime/native/target",
  ),
});

export const createToolPolicy = ({ repository, bunPath, inheritedPath }) => {
  const paths = fixedToolPaths(repository, bunPath);
  const tools = Object.fromEntries(
    Object.entries(paths).map(([name, path]) => [
      name,
      name === "openCode"
        ? openCodeReceipt(repository, path)
        : executableReceipt(name, path),
    ]),
  );
  const normalizedValues = normalizedEnvironmentValues(tools, repository);
  const environment = {
    schemaVersion: 1,
    allowlistedNames: Object.keys(normalizedValues),
    normalizedValues,
    normalizedNamesSha256: sha(`${Object.keys(normalizedValues).join("\n")}\n`),
    normalizedNameValueSha256: sha(
      `${Object.entries(normalizedValues)
        .map(([name, value]) => `${name}=${value}`)
        .join("\n")}\n`,
    ),
  };
  environment.policySha256 = canonicalJsonSha(environment);
  const bound = {
    schemaVersion: 1,
    tools,
    environment,
  };
  return {
    ...bound,
    policySha256: canonicalJsonSha(bound),
    ambientOpenCode: discoverAmbientOpenCode(inheritedPath),
  };
};

export const verifyToolPolicy = (policy) => {
  const bound = {
    schemaVersion: policy.schemaVersion,
    tools: policy.tools,
    environment: policy.environment,
  };
  if (canonicalJsonSha(bound) !== policy.policySha256)
    throw new Error("SDK_TOOL_POLICY_DIGEST_MISMATCH");
  const environmentWithoutDigest = {
    schemaVersion: policy.environment.schemaVersion,
    allowlistedNames: policy.environment.allowlistedNames,
    normalizedValues: policy.environment.normalizedValues,
    normalizedNamesSha256: policy.environment.normalizedNamesSha256,
    normalizedNameValueSha256: policy.environment.normalizedNameValueSha256,
  };
  if (
    canonicalJsonSha(environmentWithoutDigest) !==
    policy.environment.policySha256
  )
    throw new Error("SDK_ENVIRONMENT_POLICY_DIGEST_MISMATCH");
  for (const [name, receipt] of Object.entries(policy.tools)) {
    if (
      !existsSync(receipt.path) ||
      realpathSync(receipt.path) !== receipt.path ||
      sha(readFileSync(receipt.path)) !== receipt.sha256
    )
      throw new Error(`SDK_TOOL_MISMATCH:${name}`);
    if (name === "openCode") {
      if (
        !existsSync(receipt.packagePath) ||
        realpathSync(receipt.packagePath) !== receipt.packagePath ||
        sha(readFileSync(receipt.packagePath)) !== receipt.packageSha256 ||
        JSON.parse(readFileSync(receipt.packagePath)).version !==
          receipt.version
      )
        throw new Error("SDK_TOOL_MISMATCH:openCodePackage");
    }
  }
  return true;
};

export const closedEnvironment = (
  policy,
  {
    runRoot,
    cargoHome,
    cargoTarget,
    home = join(runRoot, "home"),
    overrides = {},
  },
) => {
  const values = policy.environment.normalizedValues;
  const environment = {
    PATH: values.PATH,
    HOME: home,
    CARGO_HOME: cargoHome,
    CARGO_TARGET_DIR: cargoTarget,
    CARGO_NET_OFFLINE: values.CARGO_NET_OFFLINE,
    CARGO: values.CARGO,
    CARGO_FMT: values.CARGO_FMT,
    CARGO_CLIPPY: values.CARGO_CLIPPY,
    RUSTC: values.RUSTC,
    RUSTDOC: values.RUSTDOC,
    CARGO_TARGET_AARCH64_APPLE_DARWIN_LINKER:
      values.CARGO_TARGET_AARCH64_APPLE_DARWIN_LINKER,
    MACOSX_DEPLOYMENT_TARGET: values.MACOSX_DEPLOYMENT_TARGET,
    RUSTFLAGS: values.RUSTFLAGS,
    LC_ALL: values.LC_ALL,
    TMPDIR: runRoot,
    XDG_CONFIG_HOME: join(runRoot, "opencode-config"),
    XDG_CACHE_HOME: join(runRoot, "opencode-cache"),
    OPENCODE_CONFIG: join(runRoot, "opencode-test-plugin/opencode.json"),
    SDK_REGRESSION_CARGO_TARGET_DIR: values.SDK_REGRESSION_CARGO_TARGET_DIR,
    ...overrides,
  };
  const unexpected = Object.keys(environment).filter(
    (name) => !policy.environment.allowlistedNames.includes(name),
  );
  if (unexpected.length !== 0)
    throw new Error(
      `SDK_ENVIRONMENT_ALLOWLIST_INVALID:${unexpected.join(",")}`,
    );
  return environment;
};

export const runBound = (policy, name, args, options = {}) => {
  const tool = policy.tools[name];
  if (tool === undefined) throw new Error(`SDK_UNBOUND_TOOL:${name}`);
  if (options.command !== undefined)
    throw new Error("SDK_EXPLICIT_COMMAND_OVERRIDE_FORBIDDEN");
  return spawnSync(tool.path, args, {
    cwd: options.cwd,
    encoding: "utf8",
    env: options.env,
    timeout: options.timeout,
  });
};
