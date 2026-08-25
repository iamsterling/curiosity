import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  chmodSync,
  copyFileSync,
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  readlinkSync,
  realpathSync,
  readdirSync,
  renameSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import prettier from "prettier";

const repositoryRoot = resolve(import.meta.dirname, "../../../../../../..");
const r2Root = resolve(import.meta.dirname, "..");
const scratchRoot =
  "/private/var/folders/wr/8bsbkjgd46v11_cpt9rfqm2r0000gn/T/opencode/custom-harness-q1-r2";
const backupRoot = join(scratchRoot, "preexisting-output-backup");
const generatedRoot = join(scratchRoot, "new-generated-output");

const sha256Bytes = (bytes) =>
  createHash("sha256").update(bytes).digest("hex");
const sha256File = (path) => sha256Bytes(readFileSync(path));
const writeJson = async (path, value) => {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(
    path,
    await prettier.format(JSON.stringify(value), { parser: "json" }),
    { flag: "wx" },
  );
};

const directOutput = (executable, argv) => {
  const result = spawnSync(executable, argv, {
    encoding: "utf8",
    env: { LC_ALL: "C", PATH: "/usr/bin:/bin" },
    shell: false,
  });
  return {
    exitCode: result.status,
    signal: result.signal,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
  };
};

const extendedMetadata = (path) => {
  const flagsResult = directOutput("/usr/bin/stat", ["-f", "%Sf", path]);
  const aclResult = directOutput("/bin/ls", ["-ldeO", path]);
  const namesResult = directOutput("/usr/bin/xattr", [path]);
  const xattrs = {};
  if (namesResult.exitCode === 0) {
    for (const name of namesResult.stdout.split("\n").filter(Boolean).sort()) {
      const value = directOutput("/usr/bin/xattr", ["-px", name, path]);
      xattrs[name] = {
        exitCode: value.exitCode,
        valueHexSha256: sha256Bytes(value.stdout.trim()),
      };
    }
  }
  return {
    flags:
      flagsResult.exitCode === 0 ? flagsResult.stdout.trim() : "UNAVAILABLE",
    flagsError: flagsResult.exitCode === 0 ? null : flagsResult.stderr.trim(),
    aclDigest:
      aclResult.exitCode === 0 ? sha256Bytes(aclResult.stdout) : null,
    aclError: aclResult.exitCode === 0 ? null : aclResult.stderr.trim(),
    xattrs,
    xattrError: namesResult.exitCode === 0 ? null : namesResult.stderr.trim(),
  };
};

const inventoryEntry = (absolute, displayPath) => {
  const stat = lstatSync(absolute, { bigint: true });
  const common = {
    path: displayPath,
    mode: Number(stat.mode),
    uid: Number(stat.uid),
    gid: Number(stat.gid),
    dev: stat.dev.toString(),
    ino: stat.ino.toString(),
    nlink: stat.nlink.toString(),
    bytes: stat.size.toString(),
    atimeNs: stat.atimeNs.toString(),
    mtimeNs: stat.mtimeNs.toString(),
    ctimeNs: stat.ctimeNs.toString(),
    birthtimeNs: stat.birthtimeNs.toString(),
    ...extendedMetadata(absolute),
  };
  if (stat.isSymbolicLink()) {
    return [{ ...common, type: "symlink", symlinkTarget: readlinkSync(absolute) }];
  }
  if (stat.isFile()) {
    return [{ ...common, type: "file", sha256: sha256File(absolute) }];
  }
  if (!stat.isDirectory()) return [{ ...common, type: "other" }];
  const children = readdirSync(absolute)
    .sort((a, b) => a.localeCompare(b, "en"))
    .flatMap((name) =>
      inventoryEntry(join(absolute, name), `${displayPath}/${name}`),
    );
  return [{ ...common, type: "directory" }, ...children];
};

const inventoryPaths = (paths) => {
  const roots = [];
  const entries = [];
  for (const path of paths) {
    const absolute = join(repositoryRoot, path);
    if (!existsSync(absolute)) {
      roots.push({ path, state: "absent" });
      continue;
    }
    const rootEntries = inventoryEntry(absolute, path);
    roots.push({
      path,
      state: "present",
      entryCount: rootEntries.length,
      manifestSha256: sha256Bytes(JSON.stringify(rootEntries)),
    });
    entries.push(...rootEntries);
  }
  return { roots, entries };
};

const normalizedRestorable = (inventory) =>
  inventory.entries.map((entry) => {
    const {
      atimeNs: _atimeNs,
      birthtimeNs: _birthtimeNs,
      ctimeNs: _ctimeNs,
      dev: _dev,
      ino: _ino,
      nlink: _nlink,
      ...restorable
    } = entry;
    return restorable;
  });

const args = process.argv.slice(2);
const action = args.shift();
const arg = (name) => {
  const index = args.indexOf(name);
  if (index < 0 || index === args.length - 1) {
    throw new Error(`missing argument ${name}`);
  }
  return args[index + 1];
};

if (action === "manifest-q1") {
  const q1Root = resolve(repositoryRoot, arg("--q1"));
  const output = resolve(repositoryRoot, arg("--output"));
  const files = [];
  const visit = (absolute) => {
    const relativePath = relative(q1Root, absolute);
    if (
      relativePath === "r2" ||
      relativePath.startsWith(`r2${sep}`)
    ) {
      return;
    }
    const stat = lstatSync(absolute, { bigint: true });
    if (stat.isDirectory()) {
      for (const name of readdirSync(absolute).sort()) visit(join(absolute, name));
      return;
    }
    files.push({
      path: relativePath,
      type: stat.isSymbolicLink() ? "symlink" : "file",
      bytes: stat.size.toString(),
      mode: Number(stat.mode),
      sha256: stat.isSymbolicLink()
        ? sha256Bytes(readlinkSync(absolute))
        : sha256File(absolute),
      symlinkTarget: stat.isSymbolicLink() ? readlinkSync(absolute) : null,
    });
  };
  visit(q1Root);
  const manifest = {
    schemaVersion: "custom-harness-q1-r2-original-q1-manifest/v1",
    q1Root,
    excluded: ["r2/**"],
    fileCount: files.length,
    aggregateSha256: sha256Bytes(JSON.stringify(files)),
    files,
  };
  await writeJson(output, manifest);
  console.log(JSON.stringify({ output, ...manifest }, null, 2));
} else if (action === "inventory-generated") {
  const config = JSON.parse(
    readFileSync(resolve(repositoryRoot, arg("--config")), "utf8"),
  );
  const output = resolve(repositoryRoot, arg("--output"));
  const inventory = inventoryPaths(config.paths);
  const result = {
    schemaVersion: "custom-harness-q1-r2-generated-inventory/v1",
    repositoryRoot,
    roots: inventory.roots,
    entries: inventory.entries,
    aggregateSha256: sha256Bytes(JSON.stringify(inventory.entries)),
    restorableAggregateSha256: sha256Bytes(
      JSON.stringify(normalizedRestorable(inventory)),
    ),
  };
  await writeJson(output, result);
  console.log(JSON.stringify({ output, roots: result.roots }, null, 2));
} else if (action === "inventory-list") {
  const listPath = resolve(repositoryRoot, arg("--nul-list"));
  const output = resolve(repositoryRoot, arg("--output"));
  const paths = readFileSync(listPath)
    .toString("utf8")
    .split("\0")
    .filter(Boolean)
    .map((path) => path.replace(/\/$/, ""))
    .filter(
      (path) =>
        path !== "node_modules" &&
        !path.startsWith("node_modules/") &&
        path !== "docs/architecture/custom-harness/qualification/q1/r2" &&
        !path.startsWith(
          "docs/architecture/custom-harness/qualification/q1/r2/",
        ),
    )
    .sort();
  const inventory = inventoryPaths(paths);
  const result = {
    schemaVersion: "custom-harness-q1-r2-ignored-inventory/v1",
    sourceList: listPath,
    excluded: ["node_modules/**", "qualification/q1/r2/**"],
    paths,
    roots: inventory.roots,
    entries: inventory.entries,
    aggregateSha256: sha256Bytes(JSON.stringify(inventory.entries)),
    restorableAggregateSha256: sha256Bytes(
      JSON.stringify(normalizedRestorable(inventory)),
    ),
  };
  await writeJson(output, result);
  console.log(JSON.stringify({ output, pathCount: paths.length }, null, 2));
} else if (action === "move-aside") {
  const config = JSON.parse(
    readFileSync(resolve(repositoryRoot, arg("--config")), "utf8"),
  );
  const baseline = JSON.parse(
    readFileSync(resolve(repositoryRoot, arg("--baseline")), "utf8"),
  );
  const output = resolve(repositoryRoot, arg("--output"));
  if (!existsSync(scratchRoot)) throw new Error("scratch root is absent");
  if (statSync(repositoryRoot).dev !== statSync(scratchRoot).dev) {
    throw new Error("repository and scratch are not on the same filesystem");
  }
  if (readdirSync(backupRoot).length !== 0) {
    throw new Error("preexisting-output-backup is not empty");
  }
  if (readdirSync(generatedRoot).length !== 0) {
    throw new Error("new-generated-output is not empty");
  }
  const actions = [];
  for (const path of config.paths) {
    const state = baseline.roots.find((root) => root.path === path);
    if (!state) throw new Error(`baseline omitted ${path}`);
    const source = join(repositoryRoot, path);
    const backup = join(backupRoot, path);
    if (state.state === "absent") {
      if (existsSync(source)) throw new Error(`baseline absence changed: ${path}`);
      actions.push({ path, action: "confirmed-absent" });
      continue;
    }
    mkdirSync(dirname(backup), { recursive: true });
    renameSync(source, backup);
    if (path === config.trackedWorkingCopyPath) {
      copyFileSync(backup, source);
      chmodSync(source, lstatSync(backup).mode);
      actions.push({ path, action: "renamed-and-seeded-working-copy" });
    } else {
      actions.push({ path, action: "renamed-to-backup" });
    }
  }
  const result = {
    schemaVersion: "custom-harness-q1-r2-move-aside/v1",
    repositoryDevice: String(statSync(repositoryRoot).dev),
    scratchDevice: String(statSync(scratchRoot).dev),
    sameFilesystem: true,
    actions,
  };
  await writeJson(output, result);
  console.log(JSON.stringify(result, null, 2));
} else if (action === "restore") {
  const config = JSON.parse(
    readFileSync(resolve(repositoryRoot, arg("--config")), "utf8"),
  );
  const baseline = JSON.parse(
    readFileSync(resolve(repositoryRoot, arg("--baseline")), "utf8"),
  );
  const output = resolve(repositoryRoot, arg("--output"));
  const actions = [];
  for (const path of [...config.paths].reverse()) {
    const state = baseline.roots.find((root) => root.path === path);
    if (!state) throw new Error(`baseline omitted ${path}`);
    const canonical = join(repositoryRoot, path);
    const backup = join(backupRoot, path);
    const generated = join(generatedRoot, path);
    if (existsSync(canonical)) {
      mkdirSync(dirname(generated), { recursive: true });
      if (existsSync(generated)) {
        throw new Error(`generated retention destination exists: ${path}`);
      }
      renameSync(canonical, generated);
      actions.push({ path, action: "retained-generated-output" });
    }
    if (state.state === "present") {
      if (!existsSync(backup)) throw new Error(`backup is absent: ${path}`);
      mkdirSync(dirname(canonical), { recursive: true });
      renameSync(backup, canonical);
      actions.push({ path, action: "restored-preexisting-output" });
    } else {
      actions.push({ path, action: "restored-absence" });
    }
  }
  const result = {
    schemaVersion: "custom-harness-q1-r2-restore/v1",
    actions,
    generatedOutputsRetainedUntilScratchCleanup: true,
  };
  await writeJson(output, result);
  console.log(JSON.stringify(result, null, 2));
} else if (action === "compare-inventories") {
  const before = JSON.parse(
    readFileSync(resolve(repositoryRoot, arg("--before")), "utf8"),
  );
  const after = JSON.parse(
    readFileSync(resolve(repositoryRoot, arg("--after")), "utf8"),
  );
  const output = resolve(repositoryRoot, arg("--output"));
  const beforeNormalized = normalizedRestorable(before);
  const afterNormalized = normalizedRestorable(after);
  const exact = JSON.stringify(beforeNormalized) === JSON.stringify(afterNormalized);
  const result = {
    schemaVersion: "custom-harness-q1-r2-inventory-comparison/v1",
    before: resolve(repositoryRoot, arg("--before")),
    after: resolve(repositoryRoot, arg("--after")),
    beforeRestorableSha256: sha256Bytes(JSON.stringify(beforeNormalized)),
    afterRestorableSha256: sha256Bytes(JSON.stringify(afterNormalized)),
    rootsEqual: JSON.stringify(before.roots) === JSON.stringify(after.roots),
    restorableFieldsEqual: exact,
    excludedFromExactRestorationClaim: [
      "atimeNs",
      "birthtimeNs",
      "ctimeNs",
      "dev",
      "ino",
      "nlink",
      "parent-directory metadata",
    ],
  };
  await writeJson(output, result);
  console.log(JSON.stringify(result, null, 2));
  if (!exact) process.exitCode = 1;
} else {
  throw new Error(`unknown action: ${action}`);
}
