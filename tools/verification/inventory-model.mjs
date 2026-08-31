import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Ajv2020 from "ajv/dist/2020.js";

import { createFileRepository } from "../status/status-repository.mjs";
import { assertRepositoryPath } from "../status/status-validation.mjs";
import { ABI_SYMBOLS } from "./native-abi.mjs";
import { verifyPluginProfileContract } from "./plugin-profile-contract.mjs";
import { verifyRuntimeContractEvidence } from "./runtime-contract-evidence.mjs";

const ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);
const schema = JSON.parse(
  readFileSync(path.join(ROOT, "docs/verification/schema.json"), "utf8"),
);
const validateSchema = new Ajv2020({ allErrors: true, strict: false }).compile(
  schema,
);
const sort = (values) =>
  [...values].sort((left, right) =>
    Buffer.from(left).compare(Buffer.from(right)),
  );
const same = (left, right) => JSON.stringify(left) === JSON.stringify(right);
const fail = (code, detail) => {
  throw new Error(`${code}:${detail}`);
};
const canonicalRecords = (values) =>
  [...values].sort((left, right) =>
    JSON.stringify(left).localeCompare(JSON.stringify(right)),
  );
const json = async (repository, relative, code) => {
  try {
    return JSON.parse(await repository.read(relative));
  } catch {
    return fail(code, relative);
  }
};

const PACKAGE_DEPENDENCY_SECTIONS = [
  "dependencies",
  "devDependencies",
  "peerDependencies",
  "optionalDependencies",
];
const PACKAGE_DEPENDENCY_METADATA = ["overrides", "resolutions"];
const BUNDLED_DEPENDENCY_METADATA = [
  "bundledDependencies",
  "bundleDependencies",
];
const NPM_LIFECYCLE_SCRIPTS = new Set([
  "predependencies",
  "dependencies",
  "postdependencies",
  "preinstall",
  "install",
  "postinstall",
  "preuninstall",
  "uninstall",
  "postuninstall",
  "prepack",
  "pack",
  "postpack",
  "preprepare",
  "prepare",
  "postprepare",
  "prepublish",
  "prepublishOnly",
  "publish",
  "postpublish",
  "prestart",
  "start",
  "poststart",
  "prestop",
  "stop",
  "poststop",
  "prerestart",
  "restart",
  "postrestart",
  "pretest",
  "test",
  "posttest",
  "preversion",
  "version",
  "postversion",
]);
const IMPLICIT_PACKAGE_EXECUTION_FILES = ["binding.gyp", "server.js"];
const REQUIRED_RELEASE_ARTIFACTS = {
  "plugin-registry-tarball": {
    source: "apps/plugin/opencode2/package.json",
    profile: "registry-package-candidate",
    authority:
      "apps/plugin/opencode2/docs/decisions/0031-registry-ready-package-and-black-box-proof.md",
    cadence: "per-verification",
    disposition: "publication-forbidden",
    producer: "bun pm pack --ignore-scripts",
    publication: "forbidden",
  },
  "m7-historical-artifact": {
    source:
      "apps/runtime/docs/decisions/0040-m7-private-profile-verification-and-go.md",
    profile: "m7-historical",
    authority:
      "apps/runtime/docs/decisions/0040-m7-private-profile-verification-and-go.md",
    cadence: "immutable",
    disposition: "historical-only",
    sourceCommit: "0dfc71de02393da9aad37bc753724886c00e323c",
    artifactSha256:
      "3aa8e5ba6660cafefb3d3121ba1e652346f4019a78922a0ec689b04b32e06642",
    ci: false,
    immutable: true,
  },
  "m7-current-candidate": {
    source: "apps/runtime/tools/m7-release.mjs",
    profile: "m7-current-candidate",
    authority:
      "apps/runtime/docs/decisions/0042-beta-17595-release-source-profile.md",
    cadence: "manual-only",
    disposition: "deferred",
    producer: "bun tools/m7-release.mjs build",
    status: "deferred",
    manualOnly: true,
    qualified: false,
  },
};
const REQUIRED_CROSS_PACKAGE_CONTRACTS = {
  "query-types": {
    source: "apps/plugin/opencode2/tests/compile/runtime-query-contract.ts",
    profile: "compile-contract",
    authority: "apps/runtime/src/query.ts",
    cadence: "per-verification",
  },
  "staged-query-execution": {
    source: "tools/verification/runtime-plugin-contract.mjs",
    profile: "executable-contract",
    authority: "docs/verification/runtime-plugin-contract-v1.json",
    cadence: "per-verification",
  },
  "runtime-plugin-v1": {
    source: "docs/verification/runtime-plugin-contract-v1.json",
    profile: "runtime-plugin-v1",
    authority: "apps/runtime/src/query.ts",
    cadence: "per-verification",
  },
  "native-abi": {
    source: "tools/verification/native-abi.mjs",
    profile: "native-abi",
    authority: "apps/runtime/native/Cargo.toml",
    cadence: "per-verification",
  },
  "public-plugin-runtime-absence": {
    source:
      "apps/plugin/opencode2/tests/integration/registry-package-contract.test.mjs",
    profile: "package-boundary",
    authority: "apps/plugin/opencode2/package.json",
    cadence: "per-verification",
  },
};

const packageProtocol = (version) => {
  if (version.startsWith("workspace:")) return "workspace";
  if (version === "*") return "wildcard";
  if (version.startsWith("npm:")) return "npm";
  if (version.startsWith("file:")) return "file";
  if (version.startsWith("link:")) return "link";
  if (/^(?:git(?:\+[^:]+)?:|github:)/u.test(version)) return "git";
  if (/^https?:/u.test(version)) return "url";
  if (version.startsWith("^")) return "caret";
  if (version.startsWith("~")) return "tilde";
  if (
    /^(?:v?\d+\.\d+\.\d+)(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/u.test(
      version,
    )
  )
    return "exact";
  if (/[<>=|\s]/u.test(version) || /[xX*]/u.test(version)) return "range";
  if (/^[A-Za-z][A-Za-z0-9._-]*$/u.test(version)) return "tag";
  return "unknown";
};

const dependencyMap = (value, detail) => {
  if (value === undefined) return {};
  if (!value || Array.isArray(value) || typeof value !== "object")
    fail("VERIFICATION_PACKAGE_DEPENDENCY_FORMAT", detail);
  return value;
};

const metadataVersions = (value, prefix = []) => {
  if (typeof value === "string")
    return [{ name: prefix.join(">"), version: value }];
  if (!value || Array.isArray(value) || typeof value !== "object")
    fail("VERIFICATION_PACKAGE_DEPENDENCY_FORMAT", prefix.join(">"));
  return Object.entries(value).flatMap(([name, nested]) =>
    metadataVersions(nested, [...prefix, name]),
  );
};

const canonicalValue = (value) => {
  if (Array.isArray(value)) return value.map(canonicalValue);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    sort(Object.keys(value)).map((key) => [key, canonicalValue(value[key])]),
  );
};

const dependencyClassification = (selector, workspaceNames) =>
  selector.split(">").some((name) => workspaceNames.has(name))
    ? "workspace"
    : "external";

const packageDependencies = (manifest, workspaceNames) => {
  const entries = PACKAGE_DEPENDENCY_SECTIONS.flatMap((section) =>
    Object.entries(dependencyMap(manifest[section], section)).map(
      ([name, version]) => {
        if (typeof version !== "string" || version === "")
          fail("VERIFICATION_PACKAGE_DEPENDENCY_FORMAT", `${section}:${name}`);
        return {
          name,
          section,
          version,
          classification: workspaceNames.has(name) ? "workspace" : "external",
          protocol: packageProtocol(version),
        };
      },
    ),
  );
  for (const section of PACKAGE_DEPENDENCY_METADATA) {
    if (manifest[section] === undefined) continue;
    for (const { name, version } of metadataVersions(
      dependencyMap(manifest[section], section),
    ))
      entries.push({
        name,
        section,
        version,
        classification: dependencyClassification(name, workspaceNames),
        protocol: packageProtocol(version),
      });
  }
  const pnpmOverrides =
    manifest.pnpm &&
    typeof manifest.pnpm === "object" &&
    !Array.isArray(manifest.pnpm)
      ? manifest.pnpm.overrides
      : undefined;
  if (pnpmOverrides !== undefined) {
    for (const { name, version } of metadataVersions(
      dependencyMap(pnpmOverrides, "pnpm.overrides"),
    ))
      entries.push({
        name,
        section: "pnpm.overrides",
        version,
        classification: dependencyClassification(name, workspaceNames),
        protocol: packageProtocol(version),
      });
  }
  if (manifest.peerDependenciesMeta !== undefined) {
    const peers = dependencyMap(manifest.peerDependencies, "peerDependencies");
    for (const [name, metadata] of Object.entries(
      dependencyMap(manifest.peerDependenciesMeta, "peerDependenciesMeta"),
    )) {
      const version = peers[name];
      if (
        typeof version !== "string" ||
        !metadata ||
        Array.isArray(metadata) ||
        typeof metadata !== "object"
      )
        fail(
          "VERIFICATION_PACKAGE_DEPENDENCY_FORMAT",
          `peerDependenciesMeta:${name}`,
        );
      entries.push({
        name,
        section: "peerDependenciesMeta",
        version,
        classification: workspaceNames.has(name) ? "workspace" : "external",
        protocol: packageProtocol(version),
        metadata: JSON.stringify(canonicalValue(metadata)),
      });
    }
  }
  const declaredVersions = new Map(
    entries
      .filter(({ section }) => PACKAGE_DEPENDENCY_SECTIONS.includes(section))
      .map(({ name, version }) => [name, version]),
  );
  for (const section of BUNDLED_DEPENDENCY_METADATA) {
    const metadata = manifest[section];
    if (metadata === undefined || metadata === false) continue;
    const names =
      metadata === true
        ? Object.keys(dependencyMap(manifest.dependencies, "dependencies"))
        : metadata;
    if (
      !Array.isArray(names) ||
      names.some((name) => typeof name !== "string") ||
      new Set(names).size !== names.length
    )
      fail("VERIFICATION_PACKAGE_DEPENDENCY_FORMAT", section);
    for (const name of names) {
      const version = declaredVersions.get(name);
      if (!version)
        fail("VERIFICATION_PACKAGE_DEPENDENCY_FORMAT", `${section}:${name}`);
      entries.push({
        name,
        section,
        version,
        classification: workspaceNames.has(name) ? "workspace" : "external",
        protocol: packageProtocol(version),
      });
    }
  }
  return canonicalRecords(entries);
};

const verifyPackageDependencyPolicy = (dependencies, packagePath) => {
  for (const dependency of dependencies) {
    const valid =
      dependency.classification === "workspace"
        ? ["workspace", "wildcard"].includes(dependency.protocol)
        : ["exact", "caret", "tilde", "range"].includes(dependency.protocol);
    if (!valid)
      fail(
        "VERIFICATION_PACKAGE_DEPENDENCY_POLICY",
        `${packagePath}:${dependency.section}:${dependency.name}:${dependency.protocol}`,
      );
  }
};

const executionObject = (value, detail) => {
  if (value === undefined) return {};
  if (!value || Array.isArray(value) || typeof value !== "object")
    fail("VERIFICATION_PACKAGE_EXECUTION_FORMAT", detail);
  return value;
};

const executionArray = (value, detail) => {
  if (value === undefined) return [];
  if (
    !Array.isArray(value) ||
    value.some((item) => typeof item !== "string") ||
    new Set(value).size !== value.length
  )
    fail("VERIFICATION_PACKAGE_EXECUTION_FORMAT", detail);
  return value;
};

export const packageExecutionMetadata = (manifest, implicitFiles = []) => {
  const entries = [];
  const scripts = executionObject(manifest.scripts, "scripts");
  for (const [name, command] of Object.entries(scripts)) {
    const base = name.replace(/^(?:pre|post)/u, "");
    if (
      !NPM_LIFECYCLE_SCRIPTS.has(name) &&
      (base === name || !(base in scripts))
    )
      continue;
    entries.push({
      kind: "lifecycle-script",
      path: `scripts.${name}`,
      value: command,
    });
  }
  const implicit = new Set(implicitFiles);
  if (implicit.has("server.js") && scripts.start === undefined)
    entries.push({
      kind: "implicit-lifecycle-script",
      path: "server.js",
      key: "start",
      value: "node server.js",
    });
  if (
    implicit.has("binding.gyp") &&
    scripts.preinstall === undefined &&
    scripts.install === undefined
  )
    entries.push({
      kind: "implicit-lifecycle-script",
      path: "binding.gyp",
      key: "install",
      value: "node-gyp rebuild",
    });
  if (Object.hasOwn(manifest, "trustedDependencies")) {
    const trusted = executionArray(
      manifest.trustedDependencies,
      "trustedDependencies",
    );
    entries.push({
      kind: "trust-policy",
      path: "trustedDependencies",
      value: trusted,
    });
    for (const name of trusted)
      entries.push({
        kind: "trusted-dependency",
        path: "trustedDependencies",
        key: name,
        value: true,
      });
  }
  for (const name of executionArray(
    manifest.blockedDependencies,
    "blockedDependencies",
  ))
    entries.push({
      kind: "blocked-dependency",
      path: "blockedDependencies",
      key: name,
      value: true,
    });
  for (const field of ["overrides", "resolutions"]) {
    if (manifest[field] === undefined) continue;
    for (const { name, version } of metadataVersions(
      executionObject(manifest[field], field),
    ))
      entries.push({
        kind: "override",
        path: field,
        key: name,
        value: version,
      });
  }
  if (manifest.patchedDependencies !== undefined) {
    for (const [selector, patchPath] of Object.entries(
      executionObject(manifest.patchedDependencies, "patchedDependencies"),
    ))
      entries.push({
        kind: "patch",
        path: "patchedDependencies",
        key: selector,
        value: patchPath,
      });
  }
  const pnpm = executionObject(manifest.pnpm, "pnpm");
  if (pnpm.overrides !== undefined) {
    for (const { name, version } of metadataVersions(
      executionObject(pnpm.overrides, "pnpm.overrides"),
    ))
      entries.push({
        kind: "override",
        path: "pnpm.overrides",
        key: name,
        value: version,
      });
  }
  if (pnpm.patchedDependencies !== undefined) {
    for (const [selector, patchPath] of Object.entries(
      executionObject(pnpm.patchedDependencies, "pnpm.patchedDependencies"),
    ))
      entries.push({
        kind: "patch",
        path: "pnpm.patchedDependencies",
        key: selector,
        value: patchPath,
      });
  }
  for (const field of [
    "onlyBuiltDependencies",
    "ignoredBuiltDependencies",
    "neverBuiltDependencies",
  ]) {
    for (const name of executionArray(pnpm[field], `pnpm.${field}`))
      entries.push({
        kind: "install-policy",
        path: `pnpm.${field}`,
        key: name,
        value: true,
      });
  }
  if (pnpm.onlyBuiltDependenciesFile !== undefined)
    entries.push({
      kind: "install-policy",
      path: "pnpm.onlyBuiltDependenciesFile",
      value: pnpm.onlyBuiltDependenciesFile,
    });
  for (const [name, allowed] of Object.entries(
    executionObject(pnpm.allowBuilds, "pnpm.allowBuilds"),
  ))
    entries.push({
      kind: "install-policy",
      path: "pnpm.allowBuilds",
      key: name,
      value: allowed,
    });
  return canonicalRecords(entries.map(canonicalValue));
};

const verifyPackageExecutionPolicy = async (
  metadata,
  packagePath,
  repository,
) => {
  if (packagePath === ".") {
    const policies = metadata.filter(({ kind }) => kind === "trust-policy");
    if (policies.length !== 1 || !same(policies[0].value, []))
      fail(
        "VERIFICATION_PACKAGE_TRUST_POLICY",
        "root:trustedDependencies-must-be-empty",
      );
  }
  for (const item of metadata) {
    if (item.classification !== "reviewed")
      fail(
        "VERIFICATION_PACKAGE_EXECUTION_POLICY",
        `${packagePath}:${item.path}:${item.key ?? ""}:unreviewed`,
      );
    if (
      item.kind === "override" &&
      !["exact", "caret", "tilde", "range", "workspace", "wildcard"].includes(
        packageProtocol(String(item.value)),
      )
    )
      fail(
        "VERIFICATION_PACKAGE_EXECUTION_POLICY",
        `${packagePath}:${item.path}:${item.key}:unsafe-override`,
      );
    if (item.kind !== "patch") continue;
    if (
      typeof item.value !== "string" ||
      item.value === "" ||
      path.posix.isAbsolute(item.value) ||
      /^[A-Za-z][A-Za-z0-9+.-]*:/u.test(item.value)
    )
      fail(
        "VERIFICATION_PACKAGE_EXECUTION_POLICY",
        `${packagePath}:${item.path}:${item.key}:unsafe-patch`,
      );
    const patchPath =
      packagePath === "." ? item.value : `${packagePath}/${item.value}`;
    assertRepositoryPath(patchPath);
    if (!(await repository.exists(patchPath)))
      fail(
        "VERIFICATION_PACKAGE_EXECUTION_POLICY",
        `${packagePath}:${item.path}:${item.key}:missing-patch`,
      );
  }
};

const normalizePackageSurface = (manifest) => ({
  scripts: manifest.scripts ?? {},
  exports: manifest.exports ?? null,
  bin: manifest.bin ?? null,
  files: manifest.files ?? [],
});

const packageDirectories = async (repository) => {
  const files = [
    "package.json",
    ...(await repository.listFiles("apps")),
    ...(await repository.listFiles("packages")),
  ].filter(
    (file) =>
      (file === "package.json" || file.endsWith("/package.json")) &&
      !file.includes("/.next/"),
  );
  return sort(
    files.map((file) =>
      file === "package.json" ? "." : path.posix.dirname(file),
    ),
  );
};

const workspaceDirectories = async (repository, rootManifest) => {
  const directories = await packageDirectories(repository);
  const matches = (directory, pattern) =>
    pattern.endsWith("/*")
      ? directory.startsWith(pattern.slice(0, -1)) &&
        !directory.slice(pattern.length).includes("/")
      : directory === pattern;
  return sort(
    directories.filter(
      (directory) =>
        directory !== "." &&
        rootManifest.workspaces.some((pattern) => matches(directory, pattern)),
    ),
  );
};

const exactWorkspacePackages = async (repository, rootManifest) => {
  const packages = [];
  for (const workspacePath of rootManifest.workspaces) {
    if (workspacePath.includes("*")) continue;
    const manifestPath = `${workspacePath}/package.json`;
    assertRepositoryPath(manifestPath);
    if (!(await repository.exists(manifestPath)))
      fail("VERIFICATION_PACKAGE_WORKSPACES", `missing:${workspacePath}`);
    const manifest = await json(
      repository,
      manifestPath,
      "VERIFICATION_PACKAGE_JSON",
    );
    if (typeof manifest.name !== "string" || manifest.name === "")
      fail("VERIFICATION_PACKAGE_IDENTITY", workspacePath);
    packages.push({
      name: manifest.name,
      path: workspacePath,
      scripts: manifest.scripts ?? {},
      workspaceMember: true,
    });
  }
  return packages;
};

const verifyPackages = async (inventory, repository) => {
  const rootManifest = await json(
    repository,
    "package.json",
    "VERIFICATION_PACKAGE_JSON",
  );
  const actualDirectories = await packageDirectories(repository);
  const expectedDirectories = sort(
    inventory.packages.map(({ path: packagePath }) => packagePath),
  );
  if (!same(actualDirectories, expectedDirectories))
    fail(
      "VERIFICATION_PACKAGE_INVENTORY",
      `${actualDirectories.join(",")}!=${expectedDirectories.join(",")}`,
    );
  const actualWorkspaces = await workspaceDirectories(repository, rootManifest);
  const expectedWorkspaces = sort(
    inventory.packages
      .filter(({ workspaceMember }) => workspaceMember)
      .map(({ path: packagePath }) => packagePath),
  );
  if (!same(actualWorkspaces, expectedWorkspaces))
    fail(
      "VERIFICATION_PACKAGE_WORKSPACES",
      `${actualWorkspaces.join(",")}!=${expectedWorkspaces.join(",")}`,
    );
  const byName = new Map(
    inventory.packages
      .filter(({ workspaceMember }) => workspaceMember)
      .map((item) => [item.name, item.path]),
  );
  const workspaceNames = new Set([
    ...byName.keys(),
    ...(await exactWorkspacePackages(repository, rootManifest)).map(
      ({ name }) => name,
    ),
  ]);
  for (const item of inventory.packages) {
    const manifest = await json(
      repository,
      item.manifest,
      "VERIFICATION_PACKAGE_JSON",
    );
    if (
      manifest.name !== item.name ||
      Boolean(manifest.private) !== item.private
    )
      fail("VERIFICATION_PACKAGE_IDENTITY", item.path);
    const expected = normalizePackageSurface(item);
    const actual = normalizePackageSurface(manifest);
    if (!same(actual.scripts, expected.scripts))
      fail("VERIFICATION_PACKAGE_SCRIPTS", item.path);
    if (!same(actual.exports, expected.exports))
      fail("VERIFICATION_PACKAGE_EXPORTS", item.path);
    if (!same(actual.bin, expected.bin))
      fail("VERIFICATION_PACKAGE_BIN", item.path);
    if (!same(actual.files, expected.files))
      fail("VERIFICATION_PACKAGE_FILES", item.path);
    const actualDependencies = packageDependencies(manifest, workspaceNames);
    if (!same(actualDependencies, canonicalRecords(item.dependencies)))
      fail("VERIFICATION_PACKAGE_DEPENDENCIES", item.path);
    verifyPackageDependencyPolicy(actualDependencies, item.path);
    const packageFile = (relative) =>
      item.path === "." ? relative : `${item.path}/${relative}`;
    const implicitFiles = [];
    for (const relative of IMPLICIT_PACKAGE_EXECUTION_FILES)
      if (await repository.exists(packageFile(relative)))
        implicitFiles.push(relative);
    const actualExecutionMetadata = packageExecutionMetadata(
      manifest,
      implicitFiles,
    );
    const expectedExecutionMetadata = canonicalRecords(
      item.executionMetadata.map(
        ({ classification: _classification, reason: _reason, ...entry }) =>
          canonicalValue(entry),
      ),
    );
    if (!same(actualExecutionMetadata, expectedExecutionMetadata))
      fail("VERIFICATION_PACKAGE_EXECUTION_METADATA", item.path);
    await verifyPackageExecutionPolicy(
      item.executionMetadata,
      item.path,
      repository,
    );
    for (const relative of item.implicitConfigSubpaths) {
      const configPath =
        item.path === "." ? relative : `${item.path}/${relative}`;
      assertRepositoryPath(configPath);
      if (!(await repository.exists(configPath)))
        fail("VERIFICATION_PACKAGE_CONFIG", configPath);
    }
  }

  const edges = [];
  for (const item of inventory.packages) {
    const manifest = await json(
      repository,
      item.manifest,
      "VERIFICATION_PACKAGE_JSON",
    );
    for (const section of PACKAGE_DEPENDENCY_SECTIONS) {
      for (const [name, specifier] of Object.entries(manifest[section] ?? {})) {
        const target = byName.get(name);
        if (target)
          edges.push({ from: item.path, to: target, section, specifier });
      }
    }
  }
  if (
    !same(canonicalRecords(edges), canonicalRecords(inventory.workspaceEdges))
  )
    fail("VERIFICATION_WORKSPACE_EDGES", "mismatch");
};

const cargoTables = (source) => {
  const tables = [];
  let current;
  const lines = source.split("\n");
  const stripComment = (raw) => {
    let quote = "";
    for (let index = 0; index < raw.length; index += 1) {
      const character = raw[index];
      if (quote && character === quote && raw[index - 1] !== "\\") quote = "";
      else if (!quote && ['"', "'"].includes(character)) quote = character;
      else if (!quote && character === "#") return raw.slice(0, index);
    }
    return raw;
  };
  const balanced = (value) => {
    let square = 0;
    let curly = 0;
    let quote = "";
    for (let index = 0; index < value.length; index += 1) {
      const character = value[index];
      if (quote && character === quote && value[index - 1] !== "\\") quote = "";
      else if (!quote && ['"', "'"].includes(character)) quote = character;
      else if (!quote && character === "[") square += 1;
      else if (!quote && character === "]") square -= 1;
      else if (!quote && character === "{") curly += 1;
      else if (!quote && character === "}") curly -= 1;
    }
    return !quote && square === 0 && curly === 0;
  };
  for (let index = 0; index < lines.length; index += 1) {
    const line = stripComment(lines[index]).trim();
    if (line === "" || line.startsWith("#")) continue;
    const arrayHeader = /^\[\[([^\]]+)\]\]$/u.exec(line);
    const tableHeader = /^\[([^\]]+)\]$/u.exec(line);
    if (arrayHeader || tableHeader) {
      const name = (arrayHeader ?? tableHeader)[1];
      if (
        !arrayHeader &&
        tables.some((table) => !table.array && table.name === name)
      )
        fail("VERIFICATION_CARGO_PARSE", `duplicate-table:${name}`);
      current = { name, array: Boolean(arrayHeader), values: {} };
      tables.push(current);
      continue;
    }
    const assignment =
      /^(?:"([^"]+)"|'([^']+)'|([A-Za-z0-9_.-]+))\s*=\s*(.+)$/u.exec(line);
    if (current && assignment) {
      const key = assignment.slice(1, 4).find((value) => value !== undefined);
      if (key in current.values)
        fail(
          "VERIFICATION_CARGO_PARSE",
          `duplicate-key:${current.name}:${key}`,
        );
      let value = assignment[4].trim();
      while (!balanced(value) && index + 1 < lines.length) {
        index += 1;
        value += ` ${stripComment(lines[index]).trim()}`;
      }
      if (!balanced(value))
        fail("VERIFICATION_CARGO_PARSE", `${current.name}:${key}`);
      current.values[key] = value;
      continue;
    }
    fail("VERIFICATION_CARGO_PARSE", line);
  }
  return tables;
};

const cargoString = (value) =>
  /^(?:"([^"]*)"|'([^']*)')$/u
    .exec(value ?? "")
    ?.slice(1)
    .find((item) => item !== undefined);
const cargoArrayValue = (value) => {
  if (value === undefined) return [];
  if (!value.startsWith("[") || !value.endsWith("]"))
    fail("VERIFICATION_CARGO_PARSE", value);
  return [...value.matchAll(/["']([^"']+)["']/gu)].map((match) => match[1]);
};
const cargoBoolean = (value, fallback = true) => {
  if (value === undefined) return fallback;
  if (!["true", "false"].includes(value))
    fail("VERIFICATION_CARGO_PARSE", value);
  return value === "true";
};
const cargoName = (packageName) => packageName.replaceAll("-", "_");
const relativeCargoPath = (crateDirectory, targetPath) =>
  `${crateDirectory}/${targetPath}`;

const cargoTargets = async (manifestPath, source, repository) => {
  const tables = cargoTables(source);
  const crateDirectory = path.posix.dirname(manifestPath);
  const files = (await repository.listFiles(crateDirectory)).map((file) =>
    file.slice(crateDirectory.length + 1),
  );
  const packageValues =
    tables.find(({ name, array }) => name === "package" && !array)?.values ??
    {};
  const packageName = cargoString(packageValues.name) ?? "";
  const targets = new Map();
  const add = (target, replace = false) => {
    const key = `${target.kind}:${target.name}`;
    if (
      !replace &&
      [...targets.values()].some(
        (item) => item.kind === target.kind && item.path === target.path,
      )
    )
      return;
    if (replace || !targets.has(key)) targets.set(key, target);
  };
  const explicitLib = tables.find(
    ({ name, array }) => name === "lib" && !array,
  );
  if (explicitLib || files.includes("src/lib.rs")) {
    const values = explicitLib?.values ?? {};
    add(
      {
        kind: "lib",
        name: cargoString(values.name) ?? cargoName(packageName),
        path: relativeCargoPath(
          crateDirectory,
          cargoString(values.path) ?? "src/lib.rs",
        ),
        crateTypes: sort(cargoArrayValue(values["crate-type"])),
        requiredFeatures: sort(cargoArrayValue(values["required-features"])),
      },
      true,
    );
  }
  const buildDeclaration = packageValues.build;
  if (buildDeclaration !== "false") {
    const buildPath =
      buildDeclaration === undefined
        ? files.includes("build.rs")
          ? "build.rs"
          : undefined
        : (cargoString(buildDeclaration) ??
          fail("VERIFICATION_CARGO_PARSE", `${manifestPath}:package:build`));
    if (buildPath) {
      const targetPath = relativeCargoPath(crateDirectory, buildPath);
      const buildSource = await repository
        .read(targetPath)
        .catch(() => fail("VERIFICATION_CARGO_TARGET", targetPath));
      add(
        {
          kind: "build",
          name: "build-script-build",
          path: targetPath,
          crateTypes: [],
          requiredFeatures: [],
          sha256: createHash("sha256").update(buildSource).digest("hex"),
        },
        true,
      );
    }
  }
  const explicitKinds = new Map([
    ["bin", "bin"],
    ["example", "example"],
    ["bench", "bench"],
    ["test", "test"],
  ]);
  for (const table of tables.filter(
    ({ name, array }) => array && explicitKinds.has(name),
  )) {
    const kind = explicitKinds.get(table.name);
    const name = cargoString(table.values.name);
    if (!name) fail("VERIFICATION_CARGO_PARSE", `${manifestPath}:${kind}:name`);
    const defaultDirectory = kind === "bin" ? "src/bin" : `${kind}s`;
    add(
      {
        kind,
        name,
        path: relativeCargoPath(
          crateDirectory,
          cargoString(table.values.path) ?? `${defaultDirectory}/${name}.rs`,
        ),
        crateTypes: [],
        requiredFeatures: sort(
          cargoArrayValue(table.values["required-features"]),
        ),
      },
      true,
    );
  }
  if (cargoBoolean(packageValues.autobins) && files.includes("src/main.rs"))
    add({
      kind: "bin",
      name: packageName,
      path: relativeCargoPath(crateDirectory, "src/main.rs"),
      crateTypes: [],
      requiredFeatures: [],
    });
  const implicitKinds = [
    ["bin", "src/bin", cargoBoolean(packageValues.autobins)],
    ["example", "examples", cargoBoolean(packageValues.autoexamples)],
    ["bench", "benches", cargoBoolean(packageValues.autobenches)],
    ["test", "tests", cargoBoolean(packageValues.autotests)],
  ];
  for (const [kind, directory, enabled] of implicitKinds) {
    if (!enabled) continue;
    for (const file of files) {
      const direct = new RegExp(`^${directory}/([^/]+)\\.rs$`, "u").exec(file);
      const nested = new RegExp(`^${directory}/([^/]+)/main\\.rs$`, "u").exec(
        file,
      );
      const name = (direct ?? nested)?.[1];
      if (name)
        add({
          kind,
          name,
          path: relativeCargoPath(crateDirectory, file),
          crateTypes: [],
          requiredFeatures: [],
        });
    }
  }
  for (const target of targets.values())
    if (!(await repository.exists(target.path)))
      fail("VERIFICATION_CARGO_TARGET", target.path);
  return canonicalRecords(targets.values());
};

const cargoFeatures = (tables) => {
  const featureTable = tables.find(
    ({ name, array }) => name === "features" && !array,
  );
  return Object.fromEntries(
    sort(Object.keys(featureTable?.values ?? {})).map((name) => [
      name,
      cargoArrayValue(featureTable.values[name]),
    ]),
  );
};

const cargoDependencies = (tables) =>
  canonicalRecords(
    tables.flatMap((table) => {
      if (
        /^(?:dependencies|dev-dependencies|build-dependencies|target\..+\.(?:dependencies|dev-dependencies|build-dependencies))$/u.test(
          table.name,
        )
      )
        return Object.entries(table.values).map(([name, declaration]) => ({
          name,
          section: table.name,
          declaration,
        }));
      const subtable =
        /^(dependencies|dev-dependencies|build-dependencies|target\..+\.(?:dependencies|dev-dependencies|build-dependencies))\.([^.]*)$/u.exec(
          table.name,
        );
      if (!subtable) return [];
      const declaration = `{ ${sort(Object.keys(table.values))
        .map((name) => `${name} = ${table.values[name]}`)
        .join(", ")} }`;
      return [{ name: subtable[2], section: subtable[1], declaration }];
    }),
  );

const verifyCargo = async (inventory, repository) => {
  const discovered = sort(
    (await repository.listFiles("apps")).filter((file) =>
      file.endsWith("/Cargo.toml"),
    ),
  );
  const expected = sort(
    inventory.cargoCrates.map(({ path: cratePath }) => cratePath),
  );
  if (!same(discovered, expected))
    fail(
      "VERIFICATION_CARGO_INVENTORY",
      `${discovered.join(",")}!=${expected.join(",")}`,
    );
  for (const item of inventory.cargoCrates) {
    const source = await repository.read(item.path);
    const tables = cargoTables(source);
    const packageValues =
      tables.find(({ name, array }) => name === "package" && !array)?.values ??
      {};
    const actual = {
      name: cargoString(packageValues.name),
      edition: cargoString(packageValues.edition),
      targets: await cargoTargets(item.path, source, repository),
      features: cargoFeatures(tables),
      dependencies: cargoDependencies(tables),
    };
    const expectedSurface = {
      name: item.name,
      edition: item.edition,
      targets: canonicalRecords(
        item.targets.map(
          ({ classification: _classification, ...target }) => target,
        ),
      ),
      features: Object.fromEntries(
        sort(Object.keys(item.features)).map((name) => [
          name,
          item.features[name],
        ]),
      ),
      dependencies: canonicalRecords(item.dependencies),
    };
    if (!same(actual, expectedSurface))
      fail("VERIFICATION_CARGO_SURFACE", item.path);
    for (const target of item.targets.filter(({ kind }) => kind === "build"))
      if (target.classification !== "reviewed-build-script")
        fail("VERIFICATION_CARGO_BUILD_POLICY", target.path);
  }
  if (!same(inventory.abiProfiles, ABI_SYMBOLS))
    fail("VERIFICATION_ABI_PROFILES", "mismatch");
};

const isVerificationTool = (file) =>
  (/^tools\/verification\/.+\.mjs$/u.test(file) &&
    !file.endsWith(".test.mjs")) ||
  /^apps\/runtime\/tools\/(?:[^/]+-profile\.mjs|network-denied-linux\.sh)$/u.test(
    file,
  ) ||
  file === "apps/plugin/opencode2/tools/verification-profile.mjs";

const verifyVerificationTools = async (inventory, repository) => {
  const discovered = sort(
    [
      ...(await repository.listFiles("tools/verification")),
      ...(await repository.listFiles("apps/runtime/tools")),
      ...(await repository.listFiles("apps/plugin/opencode2/tools")),
    ].filter(isVerificationTool),
  );
  const expected = sort(
    inventory.verificationTools.map(({ path: toolPath }) => toolPath),
  );
  if (!same(discovered, expected))
    fail(
      "VERIFICATION_TOOL_INVENTORY",
      `${discovered.join(",")}!=${expected.join(",")}`,
    );
  for (const item of inventory.verificationTools) {
    const expectedOwner = item.path.startsWith("apps/runtime/")
      ? "runtime"
      : item.path.startsWith("apps/plugin/")
        ? "plugin"
        : "repository";
    if (item.owner !== expectedOwner)
      fail("VERIFICATION_TOOL_OWNER", item.path);
    let source;
    try {
      source = await repository.read(item.path);
    } catch {
      fail("VERIFICATION_TOOL_DRIFT", item.path);
    }
    const digest = createHash("sha256").update(source).digest("hex");
    if (digest !== item.sha256) fail("VERIFICATION_TOOL_DRIFT", item.path);
    if (
      item.profiles.length === 0 ||
      item.profiles.some((profile) => !(profile in inventory.testProfiles))
    )
      fail("VERIFICATION_TOOL_CLASSIFICATION", item.path);
    if (item.path === "apps/plugin/opencode2/tools/verification-profile.mjs") {
      const manifest = await json(
        repository,
        "apps/plugin/opencode2/package.json",
        "VERIFICATION_PLUGIN_PROFILE_CONTRACT",
      );
      verifyPluginProfileContract({ source, scripts: manifest.scripts ?? {} });
    }
  }
};

const isTestSource = (file) => {
  if (file.includes("/fixtures/") || file.endsWith("/README.md")) return false;
  if (/^(apps|packages)\/.+\/tests\/.+\.(?:mjs|ts)$/u.test(file)) return true;
  if (
    /^apps\/plugin\/opencode2\/tools\/(?:.+-test|identity-test|staged-release-test)\.mjs$/u.test(
      file,
    )
  )
    return true;
  return /^tools\/(?:status|verification)\/.+\.test\.mjs$/u.test(file);
};

const globExpression = (pattern) => {
  const escaped = pattern
    .replace(/[.+?^${}()|[\]\\]/gu, "\\$&")
    .replaceAll("**", "\0")
    .replaceAll("*", "[^/]*")
    .replaceAll("\0", ".*");
  return new RegExp(`^${escaped}$`, "u");
};

const profileExecution = async (inventory, repository, profileName) => {
  const profile = inventory.testProfiles[profileName];
  const packages = new Map(inventory.packages.map((item) => [item.path, item]));
  const rootManifest = await json(
    repository,
    "package.json",
    "VERIFICATION_PACKAGE_JSON",
  );
  for (const item of await exactWorkspacePackages(repository, rootManifest))
    if (!packages.has(item.path)) packages.set(item.path, item);
  const tests = new Set(inventory.tests.map(({ path: testPath }) => testPath));
  const tools = new Set(
    inventory.verificationTools.map(({ path: toolPath }) => toolPath),
  );
  const executedTests = new Set();
  const executedTools = new Set();
  const visitedFiles = new Set();
  const visitedScripts = new Set();
  const repositoryPath = (packagePath, relative) =>
    path.posix.normalize(
      packagePath === "." ? relative : path.posix.join(packagePath, relative),
    );
  const matches = (pattern) => {
    const expression = globExpression(pattern);
    return [...tests].filter((testPath) => expression.test(testPath));
  };
  const markFile = async (file) => {
    const normalized = path.posix.normalize(file);
    if (tests.has(normalized)) executedTests.add(normalized);
    if (tools.has(normalized)) executedTools.add(normalized);
    if (
      visitedFiles.has(normalized) ||
      (!tests.has(normalized) && !tools.has(normalized))
    )
      return;
    visitedFiles.add(normalized);
    const source = await repository.read(normalized);
    for (const match of source.matchAll(
      /(?:from\s+|import\s*\(\s*)["']([^"']+)["']/gu,
    )) {
      if (!match[1].startsWith(".")) continue;
      const imported = path.posix.normalize(
        path.posix.join(path.posix.dirname(normalized), match[1]),
      );
      await markFile(imported);
    }
  };
  const markPatterns = async (packagePath, arguments_) => {
    const tokens = arguments_
      .trim()
      .split(/\s+/u)
      .map((token) => token.replace(/^["']|["']$/gu, ""))
      .filter((token) => token && !token.startsWith("-"));
    for (const token of tokens) {
      const pattern = repositoryPath(packagePath, token);
      const selected = token.includes("*")
        ? matches(pattern)
        : tests.has(pattern)
          ? [pattern]
          : [];
      for (const testPath of selected) await markFile(testPath);
    }
  };
  const visitCommand = async (packagePath, command) => {
    for (const match of command.matchAll(
      /\bbun run(?:\s+--cwd\s+([^\s;&|)]+))?\s+([A-Za-z0-9:_-]+)/gu,
    )) {
      const targetPackage = match[1]
        ? repositoryPath(packagePath, match[1])
        : packagePath;
      await visitScript(targetPackage, match[2]);
    }
    for (const match of command.matchAll(
      /\b(?:npm|pnpm) run\s+([A-Za-z0-9:_-]+)/gu,
    ))
      await visitScript(packagePath, match[1]);
    for (const match of command.matchAll(
      /\b(?:bunx\s+)?turbo run\s+([A-Za-z0-9:_-]+)([^;&|]*)/gu,
    )) {
      const filters = [...match[2].matchAll(/--filter=([^\s]+)/gu)].map(
        (entry) => entry[1],
      );
      const selected = [...packages.values()].filter(
        ({ workspaceMember, name, path: packageDirectory }) =>
          workspaceMember &&
          (filters.length === 0 ||
            filters.includes(name) ||
            filters.includes(packageDirectory)),
      );
      for (const item of selected)
        if (item.scripts[match[1]]) await visitScript(item.path, match[1]);
    }
    for (const match of command.matchAll(
      /\b(?:node\s+--test|bun\s+test)\s+([^;&|]+)/gu,
    ))
      await markPatterns(packagePath, match[1]);
    for (const match of command.matchAll(
      /\b(?:node|bun|sh)\s+((?:\.\.?\/|[A-Za-z0-9@_])[^\s;&|]*\.(?:mjs|ts|sh))/gu,
    ))
      await markFile(repositoryPath(packagePath, match[1]));
    for (const match of command.matchAll(
      /\btsc\s+(?:[^;&|]*?\s)?-p\s+([^\s;&|]+)/gu,
    )) {
      const configPath = repositoryPath(packagePath, match[1]);
      const config = await json(
        repository,
        configPath,
        "VERIFICATION_PROFILE_TSCONFIG",
      );
      for (const include of config.include ?? [])
        await markPatterns(path.posix.dirname(configPath), include);
    }
    for (const match of command.matchAll(
      /\bnode\s+tools\/run-test-profile\.mjs\s+([A-Za-z0-9:_-]+)/gu,
    )) {
      await markFile(repositoryPath(packagePath, "tools/run-test-profile.mjs"));
      for (const item of inventory.tests.filter(
        ({ path: testPath, profiles }) =>
          testPath.startsWith("apps/runtime/tests/") &&
          profiles.includes(match[1]),
      ))
        await markFile(item.path);
    }
    for (const match of command.matchAll(
      /\bnode\s+tools\/verify-profile\.mjs\s+([A-Za-z0-9:_-]+)/gu,
    )) {
      await markFile(repositoryPath(packagePath, "tools/verify-profile.mjs"));
      await markFile("apps/runtime/tools/run-test-profile.mjs");
      await markFile("tools/verification/native-abi.mjs");
      if (["portable-linux", "darwin-compatibility"].includes(match[1]))
        await markFile("tools/verification/runtime-plugin-contract.mjs");
      for (const item of inventory.tests.filter(
        ({ path: testPath, profiles }) =>
          testPath.startsWith("apps/runtime/tests/") &&
          profiles.includes(match[1]),
      ))
        await markFile(item.path);
    }
    for (const match of command.matchAll(
      /\bnode\s+tools\/verification-profile\.mjs\s+(linux|darwin)/gu,
    )) {
      await visitScript(packagePath, "verify");
      if (match[1] === "darwin")
        await visitScript(packagePath, "test:real-host");
    }
  };
  const visitScript = async (packagePath, scriptName) => {
    const key = `${packagePath}#${scriptName}`;
    if (visitedScripts.has(key)) return;
    visitedScripts.add(key);
    const manifest = packages.get(packagePath);
    if (!manifest)
      fail("VERIFICATION_PROFILE_ENTRYPOINT", `${key}:package-missing`);
    const command = manifest.scripts[scriptName];
    if (!command)
      fail("VERIFICATION_PROFILE_ENTRYPOINT", `${key}:script-missing`);
    const prefix = manifest.scripts[`pre${scriptName}`];
    const suffix = manifest.scripts[`post${scriptName}`];
    if (prefix) await visitScript(packagePath, `pre${scriptName}`);
    await visitCommand(packagePath, command);
    if (suffix) await visitScript(packagePath, `post${scriptName}`);
  };
  for (const entrypoint of profile.entrypoints)
    await visitScript(entrypoint.package, entrypoint.script);
  return { tests: executedTests, tools: executedTools };
};

const verifyTests = async (inventory, repository) => {
  const discovered = sort(
    [
      ...(await repository.listFiles("apps")),
      ...(await repository.listFiles("packages")),
      ...(await repository.listFiles("tools")),
    ].filter(isTestSource),
  );
  const expected = sort(inventory.tests.map(({ path: testPath }) => testPath));
  if (!same(discovered, expected))
    fail(
      "VERIFICATION_TEST_INVENTORY",
      `${discovered.join(",")}!=${expected.join(",")}`,
    );
  const knownProfiles = new Set(Object.keys(inventory.testProfiles));
  for (const item of inventory.tests) {
    assertRepositoryPath(item.path);
    if (
      item.profiles.length === 0 ||
      item.platforms.length === 0 ||
      item.profiles.some((profile) => !knownProfiles.has(profile))
    )
      fail("VERIFICATION_TEST_CLASSIFICATION", item.path);
  }
  for (const [profile, definition] of Object.entries(inventory.testProfiles)) {
    const mapped = sort(
      inventory.tests
        .filter((item) => item.profiles.includes(profile))
        .map(({ path: testPath }) => testPath),
    );
    if (!same(mapped, sort(definition.tests)))
      fail("VERIFICATION_TEST_PROFILE", profile);
    if (
      ["deferred", "legacy-orphan"].includes(definition.disposition) &&
      definition.entrypoints.length !== 0
    )
      fail("VERIFICATION_TEST_CLASSIFICATION", profile);
    if (definition.disposition !== "required") continue;
    const executed = await profileExecution(inventory, repository, profile);
    const required = [
      ...mapped.map((itemPath) => ({ path: itemPath, kind: "test" })),
      ...inventory.verificationTools
        .filter(({ profiles }) => profiles.includes(profile))
        .map(({ path: itemPath }) => ({ path: itemPath, kind: "tool" })),
    ];
    const unexecuted = required.filter(
      (item) =>
        !(item.kind === "test" ? executed.tests : executed.tools).has(
          item.path,
        ),
    );
    if (unexecuted.length > 0)
      fail(
        "VERIFICATION_REQUIRED_PROFILE_UNEXECUTED",
        `${profile}:${unexecuted.map(({ path: itemPath }) => itemPath).join(",")}`,
      );
  }
};

const jobBlock = (source, id) => {
  const match = source.match(
    new RegExp(`^  ${id}:\\n([\\s\\S]*?)(?=^  [a-z0-9-]+:|(?![\\s\\S]))`, "mu"),
  );
  return match?.[1] ?? fail("VERIFICATION_WORKFLOW_JOB", id);
};
const lineValue = (block, key) =>
  block.match(new RegExp(`^    ${key}: (.+)$`, "mu"))?.[1] ?? "";
const yamlList = (value) =>
  value.startsWith("[")
    ? value
        .slice(1, -1)
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
    : value
      ? [value]
      : [];
const APPROVED_JOB_READ_SCOPES = new Set([
  "actions",
  "checks",
  "contents",
  "deployments",
  "discussions",
  "issues",
  "models",
  "packages",
  "pull-requests",
  "security-events",
  "statuses",
]);
const WORKSPACE_VERIFICATION_COMMAND =
  "bunx turbo run verify --filter=@curiosity/custom-harness --filter=docs --filter=web --filter=@repo/ui --filter=@repo/eslint-config --filter=@repo/typescript-config";
const WORKSPACE_RUST_COMMAND =
  "rustup toolchain install 1.97.1 --profile minimal --component rustfmt,clippy";
const REQUIRED_JOB_IDS = [
  "inventory-status",
  "plugin-linux",
  "registry-smoke",
  "runtime-portable",
  "workspace-verification",
];
const REQUIRED_GATE_CONDITION =
  "always() && (github.event_name == 'pull_request' || github.event_name == 'push' || github.event_name == 'merge_group')";
const REQUIRED_RESULT_ENV = {
  "inventory-status": "INVENTORY_STATUS",
  "plugin-linux": "PLUGIN_LINUX",
  "registry-smoke": "REGISTRY_SMOKE",
  "runtime-portable": "RUNTIME_PORTABLE",
  "workspace-verification": "WORKSPACE_VERIFICATION",
};
const REQUIRED_TURBO_EXTERNAL_INPUTS = [
  "$TURBO_ROOT$/apps/runtime/src/**",
  "$TURBO_ROOT$/apps/runtime/package.json",
  "$TURBO_ROOT$/apps/runtime/tsconfig.json",
  "$TURBO_ROOT$/apps/runtime/tsconfig.types.json",
  "$TURBO_ROOT$/apps/plugin/opencode2/src/**",
  "$TURBO_ROOT$/apps/plugin/opencode2/package.json",
  "$TURBO_ROOT$/apps/plugin/opencode2/tsconfig.json",
  "$TURBO_ROOT$/apps/plugin/opencode2/tsconfig.build.json",
  "$TURBO_ROOT$/apps/plugin/opencode2/tsconfig.contract.json",
];

const yamlPermissions = (source, indent) => {
  const prefix = " ".repeat(indent);
  const lines = source.split("\n");
  const matches = lines.flatMap((line, index) =>
    line.startsWith(`${prefix}permissions:`) ? [index] : [],
  );
  if (matches.length === 0) return null;
  if (matches.length !== 1)
    fail("VERIFICATION_WORKFLOW_PERMISSIONS", "duplicate");
  const index = matches[0];
  const inline = lines[index].slice(`${prefix}permissions:`.length).trim();
  if (inline === "{}") return {};
  if (inline.startsWith("{") && inline.endsWith("}")) {
    const values = {};
    for (const item of inline
      .slice(1, -1)
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean)) {
      const entry = /^([a-z-]+):\s*(read|write|none)$/u.exec(item);
      if (!entry || entry[1] in values)
        fail("VERIFICATION_WORKFLOW_PERMISSIONS", item);
      values[entry[1]] = entry[2];
    }
    return values;
  }
  if (inline !== "") return inline;
  const values = {};
  for (let cursor = index + 1; cursor < lines.length; cursor += 1) {
    const line = lines[cursor];
    if (line.trim() === "") continue;
    if (!line.startsWith(`${prefix}  `)) break;
    const entry = new RegExp(
      `^${prefix}  ([a-z-]+):\\s*(read|write|none)\\s*$`,
      "u",
    ).exec(line);
    if (!entry || entry[1] in values)
      fail("VERIFICATION_WORKFLOW_PERMISSIONS", line.trim());
    values[entry[1]] = entry[2];
  }
  return values;
};

const verifyPermissionPolicy = (permissions, detail, topLevel = false) => {
  if (topLevel) {
    if (!same(permissions, { contents: "read" }))
      fail("VERIFICATION_WORKFLOW_PERMISSIONS", detail);
    return;
  }
  if (permissions === null) return;
  if (
    !permissions ||
    typeof permissions !== "object" ||
    Array.isArray(permissions)
  )
    fail("VERIFICATION_WORKFLOW_PERMISSIONS", detail);
  for (const [scope, access] of Object.entries(permissions))
    if (
      !APPROVED_JOB_READ_SCOPES.has(scope) ||
      !["read", "none"].includes(access)
    )
      fail("VERIFICATION_WORKFLOW_PERMISSIONS", `${detail}:${scope}:${access}`);
};

const workflowTriggers = (source) => {
  const lines = source.split("\n");
  const start = lines.findIndex((line) => line === "on:");
  if (start < 0) return [];
  const triggers = [];
  for (let index = start + 1; index < lines.length; index += 1) {
    const line = lines[index];
    if (line !== "" && !line.startsWith(" ")) break;
    const trigger = /^  ([A-Za-z0-9_-]+):/u.exec(line)?.[1];
    if (trigger) triggers.push(trigger);
  }
  return triggers;
};

const verifyRequiredWorkspaceLane = (workflow) => {
  const lane = workflow.jobs.find(({ id }) => id === "workspace-verification");
  if (
    !lane ||
    !same(lane.runsOn, ["ubuntu-latest"]) ||
    !same(lane.commands, [
      WORKSPACE_RUST_COMMAND,
      WORKSPACE_VERIFICATION_COMMAND,
    ])
  )
    fail("VERIFICATION_WORKFLOW_REQUIRED_JOB", "workspace-verification");
  const filters = [
    "@curiosity/custom-harness",
    "docs",
    "web",
    "@repo/ui",
    "@repo/eslint-config",
    "@repo/typescript-config",
  ];
  for (const filter of filters)
    if (
      (
        lane.commands[1].match(
          new RegExp(
            `--filter=${filter.replaceAll("/", "\\/")}(?:\\s|$)`,
            "gu",
          ),
        ) ?? []
      ).length !== 1
    )
      fail(
        "VERIFICATION_WORKFLOW_REQUIRED_JOB",
        `workspace-verification:${filter}`,
      );
  if (/opencode2|@curiosity\/runtime/u.test(lane.commands[1]))
    fail("VERIFICATION_WORKFLOW_REQUIRED_JOB", "workspace-duplication");
};

const verifyRequiredAggregate = (workflow, source) => {
  const gate = workflow.jobs.find(({ id }) => id === "required-gate");
  if (
    !gate ||
    gate.condition !== REQUIRED_GATE_CONDITION ||
    lineValue(jobBlock(source, "required-gate"), "if") !==
      REQUIRED_GATE_CONDITION
  )
    fail("VERIFICATION_WORKFLOW_REQUIRED_AGGREGATE", "if");
  if (!same(sort(gate.needs), sort(REQUIRED_JOB_IDS)))
    fail("VERIFICATION_WORKFLOW_REQUIRED_AGGREGATE", "needs");
  const expectedCommands = REQUIRED_JOB_IDS.map(
    (id) => `test "$${REQUIRED_RESULT_ENV[id]}" = success`,
  );
  if (!same(sort(gate.commands), sort(expectedCommands)))
    fail("VERIFICATION_WORKFLOW_REQUIRED_AGGREGATE", "commands");
  const block = jobBlock(source, "required-gate");
  for (const id of REQUIRED_JOB_IDS) {
    const environment = REQUIRED_RESULT_ENV[id];
    if (
      (
        block.match(
          new RegExp(
            `^          ${environment}: \\$\\{\\{ needs\\.${id}\\.result \\}\\}$`,
            "gmu",
          ),
        ) ?? []
      ).length !== 1
    )
      fail("VERIFICATION_WORKFLOW_REQUIRED_AGGREGATE", `${id}:result`);
    if (
      (
        block.match(
          new RegExp(`^          test "\\$${environment}" = success$`, "gmu"),
        ) ?? []
      ).length !== 1
    )
      fail("VERIFICATION_WORKFLOW_REQUIRED_AGGREGATE", `${id}:assertion`);
  }
  const resultReferences = [
    ...block.matchAll(/needs\.([a-z0-9-]+)\.result/gu),
  ].map((match) => match[1]);
  if (!same(sort(resultReferences), sort(REQUIRED_JOB_IDS)))
    fail("VERIFICATION_WORKFLOW_REQUIRED_AGGREGATE", "result-set");
};

const CANONICAL_WORKFLOW_BUN_INSTALL =
  "bun install --frozen-lockfile --ignore-scripts";
const shellSegments = (command) => {
  const segments = [];
  let current = "";
  let quote = "";
  let escaped = false;
  const flush = () => {
    if (current.trim()) segments.push(current.trim());
    current = "";
  };
  for (let index = 0; index < command.length; index += 1) {
    const character = command[index];
    if (escaped) {
      current += character;
      escaped = false;
      continue;
    }
    if (character === "\\" && quote !== "'") {
      escaped = true;
      current += character;
      continue;
    }
    if (quote) {
      current += character;
      if (character === quote) quote = "";
      continue;
    }
    if (character === "'" || character === '"') {
      quote = character;
      current += character;
      continue;
    }
    if (
      character === "\n" ||
      character === ";" ||
      character === "|" ||
      character === "&"
    ) {
      flush();
      while (command[index + 1] === character) index += 1;
      continue;
    }
    current += character;
  }
  flush();
  return segments;
};
const shellTokens = (segment) => {
  const tokens = [];
  let current = "";
  let quote = "";
  let escaped = false;
  const flush = () => {
    if (current) tokens.push(current);
    current = "";
  };
  for (const character of segment) {
    if (escaped) {
      current += character;
      escaped = false;
      continue;
    }
    if (character === "\\" && quote !== "'") {
      escaped = true;
      continue;
    }
    if (quote) {
      if (character === quote) quote = "";
      else current += character;
      continue;
    }
    if (character === "'" || character === '"') {
      quote = character;
      continue;
    }
    if (/\s/u.test(character)) {
      flush();
      continue;
    }
    current += character;
  }
  flush();
  return tokens;
};
const isBunInstallSegment = (segment) => {
  const tokens = shellTokens(segment);
  for (let index = 0; index < tokens.length; index += 1) {
    const executable = tokens[index].replace(/[()]/gu, "");
    if (path.posix.basename(executable) !== "bun") continue;
    if (
      tokens
        .slice(index + 1)
        .some((token) => token === "install" || token === "i")
    )
      return true;
  }
  return false;
};

export const classifyWorkflowBunInstallCommand = (command) => {
  const install = shellSegments(command).some(isBunInstallSegment);
  if (!install) return "none";
  return command.trim() === CANONICAL_WORKFLOW_BUN_INSTALL
    ? "canonical"
    : "noncanonical";
};

const workflowRunCommands = (source) => {
  const lines = source.split("\n");
  const commands = [];
  for (let index = 0; index < lines.length; index += 1) {
    const match = /^(\s*)(?:-\s+)?run:\s*(.*)$/u.exec(lines[index]);
    if (!match) continue;
    if (!["|", ">", "|-", ">-"].includes(match[2])) {
      commands.push(match[2]);
      continue;
    }
    const indent = match[1].length;
    const block = [];
    while (
      index + 1 < lines.length &&
      (lines[index + 1].trim() === "" ||
        lines[index + 1].match(/^\s*/u)[0].length > indent)
    ) {
      index += 1;
      block.push(lines[index].slice(Math.min(lines[index].length, indent + 2)));
    }
    commands.push(block.join("\n"));
  }
  return commands;
};

const verifyWorkflowInstallPolicy = (workflow, source) => {
  for (const command of workflowRunCommands(source))
    if (classifyWorkflowBunInstallCommand(command) === "noncanonical")
      fail("VERIFICATION_WORKFLOW_INSTALL_POLICY", command.trim());
  for (const job of workflow.jobs) {
    const installs = workflowRunCommands(jobBlock(source, job.id)).filter(
      (command) => classifyWorkflowBunInstallCommand(command) !== "none",
    );
    const usesBun = job.actions.some((action) =>
      action.startsWith("oven-sh/setup-bun@"),
    );
    if (usesBun && !same(installs, [CANONICAL_WORKFLOW_BUN_INSTALL]))
      fail(
        "VERIFICATION_WORKFLOW_INSTALL_POLICY",
        `${job.id}:missing-or-duplicate`,
      );
    if (!usesBun && installs.length > 0)
      fail("VERIFICATION_WORKFLOW_INSTALL_POLICY", `${job.id}:unexpected`);
  }
};

const verifyWorkflows = async (inventory, repository) => {
  const discovered = sort(
    (await repository.listFiles(".github/workflows")).filter((file) =>
      /\.ya?ml$/u.test(file),
    ),
  );
  const expected = sort(
    inventory.workflows.map(({ path: workflowPath }) => workflowPath),
  );
  if (!same(discovered, expected))
    fail("VERIFICATION_WORKFLOW_INVENTORY", "mismatch");
  for (const workflow of inventory.workflows) {
    const source = await repository.read(workflow.path);
    verifyWorkflowInstallPolicy(workflow, source);
    const topLevelPermissions = yamlPermissions(source, 0);
    verifyPermissionPolicy(topLevelPermissions, workflow.path, true);
    if (!same(topLevelPermissions, workflow.permissions))
      fail("VERIFICATION_WORKFLOW_PERMISSION_INVENTORY", workflow.path);
    for (const job of workflow.jobs) {
      const block = jobBlock(source, job.id);
      const permissions = yamlPermissions(block, 4);
      verifyPermissionPolicy(permissions, job.id);
      if (!same(permissions, job.permissions))
        fail("VERIFICATION_WORKFLOW_PERMISSION_INVENTORY", job.id);
      if (
        job.runsOn.includes("self-hosted") &&
        /(?:\b(?:GH_TOKEN|GITHUB_TOKEN)\s*:|\$\{\{\s*(?:secrets\.|github\.token))/u.test(
          block,
        )
      )
        fail("VERIFICATION_WORKFLOW_TOKEN_ESCALATION", job.id);
    }
    const digest = createHash("sha256").update(source).digest("hex");
    if (digest !== workflow.sha256)
      fail("VERIFICATION_WORKFLOW_DRIFT", workflow.path);
    if (!source.startsWith(`name: ${workflow.name}\n`))
      fail("VERIFICATION_WORKFLOW_NAME", workflow.path);
    if (!same(sort(workflowTriggers(source)), sort(workflow.triggers)))
      fail("VERIFICATION_WORKFLOW_TRIGGER", workflow.path);
    if (!source.includes(`cron: "${workflow.cadence}"`))
      fail("VERIFICATION_WORKFLOW_CADENCE", workflow.path);
    const discoveredJobs = [
      ...source.matchAll(
        /^  ([a-z0-9-]+):\n(?=    (?:name|if|runs-on|needs|permissions):)/gmu,
      ),
    ].map((match) => match[1]);
    if (!same(sort(discoveredJobs), sort(workflow.jobs.map(({ id }) => id))))
      fail("VERIFICATION_WORKFLOW_JOB_INVENTORY", workflow.path);
    for (const job of workflow.jobs) {
      const block = jobBlock(source, job.id);
      if (lineValue(block, "if") !== job.condition)
        fail("VERIFICATION_WORKFLOW_CONDITION", job.id);
      if (!same(yamlList(lineValue(block, "runs-on")), job.runsOn))
        fail("VERIFICATION_WORKFLOW_PLATFORM", job.id);
      if (!same(yamlList(lineValue(block, "needs")), job.needs))
        fail("VERIFICATION_WORKFLOW_NEEDS", job.id);
      const actions = [...block.matchAll(/^      - uses: (.+)$/gmu)].map(
        (match) => match[1].split(" #", 1)[0],
      );
      if (!same(actions, job.actions))
        fail("VERIFICATION_WORKFLOW_ACTION", job.id);
      if (actions.some((action) => !/@[a-f0-9]{40}$/u.test(action)))
        fail("VERIFICATION_WORKFLOW_ACTION_PIN", job.id);
      for (const command of job.commands)
        if (!block.includes(command))
          fail("VERIFICATION_WORKFLOW_COMMAND", `${job.id}:${command}`);
      if (
        actions.includes(
          "actions/checkout@d23441a48e516b6c34aea4fa41551a30e30af803",
        ) &&
        !block.includes("persist-credentials: false")
      )
        fail("VERIFICATION_WORKFLOW_CHECKOUT_AUTH", job.id);
      if (
        job.id === "workspace-verification" &&
        (
          block.match(
            new RegExp(
              WORKSPACE_VERIFICATION_COMMAND.replaceAll("$", "\\$&"),
              "gu",
            ),
          ) ?? []
        ).length !== 1
      )
        fail(
          "VERIFICATION_WORKFLOW_REQUIRED_JOB",
          "workspace-verification:duplicate-command",
        );
    }
    verifyRequiredWorkspaceLane(workflow);
    verifyRequiredAggregate(workflow, source);
  }
};

const scriptClosure = (inventory, entrypoints, additionalPackages = []) => {
  const packages = new Map(
    [...inventory.packages, ...additionalPackages].map((item) => [
      item.path,
      item,
    ]),
  );
  const visited = new Set();
  const repositoryPath = (packagePath, relative) =>
    path.posix.normalize(
      packagePath === "." ? relative : path.posix.join(packagePath, relative),
    );
  const visitCommand = (packagePath, command) => {
    for (const match of command.matchAll(
      /\bbun run(?:\s+--cwd\s+([^\s;&|)]+))?\s+([A-Za-z0-9:_-]+)/gu,
    )) {
      const targetPackage = match[1]
        ? repositoryPath(packagePath, match[1])
        : packagePath;
      visitScript(targetPackage, match[2]);
    }
    for (const match of command.matchAll(
      /\b(?:npm|pnpm) run\s+([A-Za-z0-9:_-]+)/gu,
    ))
      visitScript(packagePath, match[1]);
    for (const match of command.matchAll(
      /\b(?:bunx\s+)?turbo run\s+([A-Za-z0-9:_-]+)([^;&|]*)/gu,
    )) {
      const filters = [...match[2].matchAll(/--filter=([^\s]+)/gu)].map(
        (entry) => entry[1],
      );
      const selected = [...packages.values()].filter(
        ({ workspaceMember, name, path: packageDirectory }) =>
          workspaceMember &&
          (filters.length === 0 ||
            filters.includes(name) ||
            filters.includes(packageDirectory)),
      );
      for (const item of selected)
        if (item.scripts[match[1]]) visitScript(item.path, match[1]);
    }
  };
  const visitScript = (packagePath, scriptName) => {
    const key = `${packagePath}#${scriptName}`;
    if (visited.has(key)) return;
    visited.add(key);
    const manifest =
      packages.get(packagePath) ?? fail("VERIFICATION_PROFILE_ENTRYPOINT", key);
    const command =
      manifest.scripts[scriptName] ??
      fail("VERIFICATION_PROFILE_ENTRYPOINT", key);
    const prefix = manifest.scripts[`pre${scriptName}`];
    const suffix = manifest.scripts[`post${scriptName}`];
    if (prefix) visitScript(packagePath, `pre${scriptName}`);
    visitCommand(packagePath, command);
    if (suffix) visitScript(packagePath, `post${scriptName}`);
  };
  for (const entrypoint of entrypoints)
    visitScript(entrypoint.package, entrypoint.script);
  return visited;
};

const verifyPortableAggregates = (inventory, additionalPackages) => {
  const manualEntrypoints = new Set(
    Object.values(inventory.testProfiles)
      .filter(({ disposition }) => disposition === "manual")
      .flatMap(({ entrypoints }) =>
        entrypoints.map(
          ({ package: packagePath, script }) => `${packagePath}#${script}`,
        ),
      ),
  );
  const aggregates = [
    { name: "root-test", entrypoints: [{ package: ".", script: "test" }] },
    { name: "root-verify", entrypoints: [{ package: ".", script: "verify" }] },
    ...Object.entries(inventory.testProfiles)
      .filter(([, { disposition }]) => disposition === "required")
      .map(([name, { entrypoints }]) => ({ name, entrypoints })),
  ];
  for (const aggregate of aggregates) {
    const leaked = [
      ...scriptClosure(
        inventory,
        aggregate.entrypoints,
        additionalPackages,
      ),
    ].filter((key) => manualEntrypoints.has(key));
    if (leaked.length > 0)
      fail(
        "VERIFICATION_MANUAL_PROFILE_LEAK",
        `${aggregate.name}:${sort(leaked).join(",")}`,
      );
  }
};

const verifyTaskGraph = async (inventory, repository) => {
  const root = await json(
    repository,
    "package.json",
    "VERIFICATION_TASK_GRAPH",
  );
  const turbo = await json(repository, "turbo.json", "VERIFICATION_TASK_GRAPH");
  if (
    root.scripts.test !== inventory.taskGraph.rootTest ||
    root.scripts.verify !== inventory.taskGraph.rootVerify
  )
    fail("VERIFICATION_ROOT_TASK", "mismatch");
  if (
    !same(sort(Object.keys(turbo.tasks)), sort(inventory.taskGraph.turboTasks))
  )
    fail("VERIFICATION_TURBO_TASKS", "mismatch");
  for (const task of ["test", "verify"])
    if (!same(turbo.tasks[task].inputs, inventory.taskGraph.testVerifyInputs))
      fail("VERIFICATION_TURBO_INPUTS", task);
    else if (
      REQUIRED_TURBO_EXTERNAL_INPUTS.some(
        (input) => !turbo.tasks[task].inputs.includes(input),
      )
    )
      fail("VERIFICATION_TURBO_INPUTS", `${task}:external-runtime-contract`);
  const authoritative = inventory.packages
    .filter(({ workspaceMember }) => workspaceMember)
    .map(({ path: packagePath }) => packagePath);
  if (
    !same(
      sort(authoritative),
      sort(inventory.taskGraph.authoritativeWorkspaces),
    )
  )
    fail("VERIFICATION_TASK_WORKSPACES", "mismatch");
  for (const item of inventory.packages.filter(
    ({ workspaceMember }) => workspaceMember,
  )) {
    if (!item.scripts.test || !item.scripts.verify)
      fail("VERIFICATION_WORKSPACE_TASK", item.path);
    if (
      /turbo\s+run\s+(?:test|verify)/u.test(
        `${item.scripts.test}\n${item.scripts.verify}`,
      )
    )
      fail("VERIFICATION_TASK_RECURSION", item.path);
  }
  if (
    (root.scripts.test.match(/turbo run test/gu) ?? []).length !== 1 ||
    (root.scripts.verify.match(/turbo run verify/gu) ?? []).length !== 1
  )
    fail("VERIFICATION_TASK_RECURSION", "root");
  verifyPortableAggregates(
    inventory,
    await exactWorkspacePackages(repository, root),
  );
};

const verifyRequiredRecords = (records, registry) => {
  const actualIds = sort(records.map(({ id }) => id));
  const requiredIds = sort(Object.keys(registry));
  if (!same(actualIds, requiredIds))
    fail(
      "VERIFICATION_REQUIRED_RECORDS",
      `${actualIds.join(",")}!=${requiredIds.join(",")}`,
    );
  for (const record of records) {
    const expected = registry[record.id];
    for (const [key, value] of Object.entries(expected))
      if (!same(record[key], value))
        fail("VERIFICATION_REQUIRED_RECORDS", `${record.id}:${key}`);
  }
};

const verifyRepositoryRecords = async (inventory, repository) => {
  for (const record of [
    ...inventory.releaseArtifacts,
    ...inventory.crossPackageContracts,
  ]) {
    assertRepositoryPath(record.source);
    assertRepositoryPath(record.authority);
    const source = await repository
      .read(record.source)
      .catch(() => fail("VERIFICATION_RECORD_SOURCE", record.source));
    const digest = createHash("sha256").update(source).digest("hex");
    if (digest !== record.sha256) fail("VERIFICATION_RECORD_HASH", record.id);
    if (!(await repository.exists(record.authority)))
      fail("VERIFICATION_RECORD_AUTHORITY", record.authority);
  }
};

const verifyBoundaries = async (inventory, repository) => {
  const plugin = await json(
    repository,
    "apps/plugin/opencode2/package.json",
    "VERIFICATION_NEGATIVE_BOUNDARY",
  );
  const serializedPlugin = JSON.stringify({
    dependencies: plugin.dependencies,
    optionalDependencies: plugin.optionalDependencies,
    peerDependencies: plugin.peerDependencies,
    bundledDependencies: plugin.bundledDependencies,
    overrides: plugin.overrides,
    resolutions: plugin.resolutions,
  });
  if (serializedPlugin.includes("@curiosity/runtime"))
    fail("VERIFICATION_NEGATIVE_BOUNDARY", "plugin-runtime-package-edge");
  const workflows = (
    await Promise.all(
      inventory.workflows.map((item) => repository.read(item.path)),
    )
  ).join("\n");
  for (const pattern of [
    "m7:test",
    "m7:build",
    "legacy-memory-node-api-sdk",
    "npm publish",
    "bun publish",
    "deploy",
  ])
    if (workflows.includes(pattern))
      fail("VERIFICATION_NEGATIVE_BOUNDARY", `workflow:${pattern}`);
  const ids = inventory.negativeBoundaries.map(({ id }) => id);
  for (const required of [
    "no-publication",
    "no-deployment",
    "no-m7-ci",
    "no-sdk-v2-ci",
    "no-runtime-plugin-package-edge",
    "no-runner-service",
  ])
    if (!ids.includes(required))
      fail("VERIFICATION_NEGATIVE_BOUNDARY", required);
};

export const validateInventory = (inventory) => {
  if (!validateSchema(inventory))
    fail("VERIFICATION_SCHEMA", JSON.stringify(validateSchema.errors));
  verifyRequiredRecords(inventory.releaseArtifacts, REQUIRED_RELEASE_ARTIFACTS);
  verifyRequiredRecords(
    inventory.crossPackageContracts,
    REQUIRED_CROSS_PACKAGE_CONTRACTS,
  );
  const collections = [
    inventory.packages,
    inventory.cargoCrates,
    inventory.verificationTools,
    inventory.tests,
    inventory.workflows,
  ];
  for (const collection of collections) {
    const identities = collection.map((item) => item.path);
    if (new Set(identities).size !== identities.length)
      fail("VERIFICATION_DUPLICATE", identities.join(","));
  }
  return inventory;
};

export const verifyInventory = async (
  inventory,
  repository = createFileRepository(ROOT),
) => {
  validateInventory(inventory);
  await verifyPackages(inventory, repository);
  await verifyCargo(inventory, repository);
  await verifyVerificationTools(inventory, repository);
  await verifyTests(inventory, repository);
  await verifyWorkflows(inventory, repository);
  await verifyTaskGraph(inventory, repository);
  await verifyRepositoryRecords(inventory, repository);
  await verifyBoundaries(inventory, repository);
  await verifyRuntimeContractEvidence();
  return true;
};
