import { spawnSync } from "node:child_process";
import { chmodSync, copyFileSync, cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { stat as statFile } from "node:fs/promises";
import path from "node:path";

/**
 * Packages Crafty for distribution.
 *
 * Crafty ships Next.js zone servers (the blank base app routing the domain,
 * the editor zone hosting the surface and API, and the admin zone), so the
 * artifact is a self-contained directory rather than a single `bun --compile`
 * executable: `dist/crafty` is a launcher, `dist/bun` is the bundled runtime,
 * and `dist/base`, `dist/web` (the editor zone) and `dist/admin` are the
 * standalone builds. Nothing needs to be installed on the target machine.
 */

const root = process.cwd();
const bun = process.platform === "win32" ? "bun.exe" : "bun";
const buildPackages = [
  "@crafty/scene-model",
  "@crafty/scene-renderer",
  "@crafty/editor",
  "@crafty/pen-import",
  "@crafty/scene-store",
  "@crafty/marketing",
  "@crafty/base",
  "@crafty/editor-web",
  "@crafty/admin",
  "@crafty/crafty"
];

const distDir = path.join(root, "dist");

// Each zone is a Next standalone build: the traced server + node_modules tree.
// The standalone output does NOT include the static assets or the public
// directory — Next expects the packager to copy them.
const zones = [
  { app: "web/base", distName: "base", required: true },
  { app: "web/editor", distName: "web", required: true },
  { app: "web/admin", distName: "admin", required: false }
];

const run = (command, args) => {
  const result = spawnSync(command, args, { cwd: root, stdio: "inherit" });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
};

// Marketing exports before everything else: its static output is baked into
// the base app's public/, and the base's next build must run against the
// final public/ (a stale public/_next would trip Next's conflict check).
run(bun, ["run", "build", "--filter", "@crafty/marketing"]);

// Bake the marketing static export into the base app's public/ so the base
// serves `/` and `/docs/*` with zero extra processes. Two mappings are
// needed: the export's assets live in `_next/` while its HTML references
// `/marketing-static/_next/...` (the zone assetPrefix), so `_next` lands at
// `marketing-static/_next`; and clean URLs (docs.html) become directory-index
// files so the base's static serving resolves `/docs` the way the marketing
// zone's own URLs behave.
const marketingOut = path.join(root, "apps/web/marketing/out");
const basePublic = path.join(root, "apps/web/base/public");
if (existsSync(marketingOut)) {
  rmSync(basePublic, { recursive: true, force: true });
  mkdirSync(basePublic, { recursive: true });
  for (const entry of readdirSync(marketingOut, { withFileTypes: true })) {
    if (entry.isDirectory() && entry.name === "_next") {
      cpSync(path.join(marketingOut, entry.name), path.join(basePublic, "marketing-static/_next"), { recursive: true });
    } else if (entry.isDirectory()) {
      cpSync(path.join(marketingOut, entry.name), path.join(basePublic, entry.name), { recursive: true });
    } else if (entry.name === "index.html") {
      copyFileSync(path.join(marketingOut, entry.name), path.join(basePublic, "index.html"));
    } else if (entry.name.endsWith(".html")) {
      const name = entry.name.slice(0, -".html".length);
      mkdirSync(path.join(basePublic, name), { recursive: true });
      copyFileSync(path.join(marketingOut, entry.name), path.join(basePublic, name, "index.html"));
    }
  }
}

// The wasm encoder is a build unit inside scene-renderer (`rust/` → `pkg/`),
// not part of the package's tsc `build`. It must run FIRST: scene-renderer's
// wasm sources import ../../pkg/*.js, so tsc fails on a clean checkout where
// pkg/ does not exist yet.
run(bun, ["run", "--filter", "@crafty/scene-renderer", "build:wasm"]);

for (const workspace of buildPackages.filter((name) => name !== "@crafty/marketing")) {
  run(bun, ["run", "build", "--filter", workspace]);
}

rmSync(distDir, { recursive: true, force: true });
mkdirSync(distDir, { recursive: true });

// Next's standalone trace does not recurse into bun's symlinked store
// layout: the traced node_modules holds only direct deps (themselves
// symlinks), so transitive runtime deps (next's own deps, react,
// @crafty/*) are missing. Populate the zone's node_modules with the full
// dependency closure of the app's declared dependencies, resolved from the
// repo and copied real.
const findInstalledPackage = (name) => {
  const short = name.startsWith("@crafty/") ? name.slice("@crafty/".length) : name;
  const workspaceModules = [
    ...readdirSync(path.join(root, "packages")).map((workspace) => path.join(root, "packages", workspace, "node_modules", name)),
    ...readdirSync(path.join(root, "apps")).flatMap((app) => [path.join(root, "apps", app, "node_modules", name), path.join(root, "apps", app, "node_modules", "@crafty", short)]),
    ...(existsSync(path.join(root, "apps/web")) ? readdirSync(path.join(root, "apps/web")).flatMap((app) => [path.join(root, "apps/web", app, "node_modules", name), path.join(root, "apps/web", app, "node_modules", "@crafty", short)]) : [])
  ];
  const candidates = [
    path.join(root, "node_modules", name),
    ...workspaceModules,
    ...(existsSync(path.join(root, "node_modules/.bun")) ? readdirSync(path.join(root, "node_modules/.bun"), { withFileTypes: true }) : [])
      // bun's store joins the scope with '+': @next/env lives as @next+env@<ver>
      .filter((entry) => entry.isDirectory() && entry.name.startsWith(`${name.replace("/", "+")}@`))
      .map((entry) => path.join(root, "node_modules/.bun", entry.name, "node_modules", name))
  ];
  return candidates.find((candidate) => existsSync(path.join(candidate, "package.json")));
};

const dependencyClosure = (name, seen = new Set(), kernelOnly = false) => {
  if (seen.has(name)) return [];
  seen.add(name);
  const dir = findInstalledPackage(name);
  if (!dir) return [];
  const manifest = JSON.parse(readFileSync(path.join(dir, "package.json"), "utf8"));
  let deps = Object.keys(manifest.dependencies ?? {});
  // The admin zone ships the editor's kernel only. The kernel's runtime
  // graph is just scene-model, so stop the walk there instead of pulling in
  // the ui subpath's renderer and component libraries.
  if (kernelOnly && name === "@crafty/editor") {
    deps = ["@crafty/scene-model"];
  }
  return [[manifest.name, dir], ...deps.flatMap((dependency) => dependencyClosure(dependency, seen, kernelOnly))];
};

// Copies one package directory into a zone's node_modules, skipping nested
// node_modules trees (each dependency is copied as its own top-level entry;
// copying the nested links would explode the path depth). Symlinks inside a
// package are dereferenced so the dist stays self-contained.
const copyPackage = (src, dest) => {
  mkdirSync(dest, { recursive: true });
  for (const entry of readdirSync(src, { withFileTypes: true })) {
    if (entry.name === "node_modules") continue;
    const source = path.join(src, entry.name);
    const target = path.join(dest, entry.name);
    if (entry.isDirectory()) copyPackage(source, target);
    else if (entry.isSymbolicLink()) copyFileSync(readlinkSync(source), target);
    else copyFileSync(source, target);
  }
};

const zoneRuntimeDependencies = {};
for (const zone of zones) {
  const manifestPath = path.join(root, `apps/${zone.app}/package.json`);
  if (!existsSync(manifestPath)) continue;
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  zoneRuntimeDependencies[zone.app] = Object.keys(manifest.dependencies ?? {});
}

for (const zone of zones) {
  const standalone = path.join(root, `apps/${zone.app}/.next/standalone`);
  if (zone.required && !existsSync(standalone)) {
    process.stderr.write(`The Next standalone build for ${zone.app} is missing. Confirm output: "standalone" in apps/${zone.app}/next.config.mjs.\n`);
    process.exit(1);
  }
  if (!existsSync(standalone)) continue;
  const targetDir = path.join(distDir, zone.distName);
  // dereference: the standalone's node_modules carries bun-store symlinks
  // whose absolute targets only exist in the build workspace; the dist must
  // be self-contained, so resolve them to real copies.
  cpSync(standalone, targetDir, { recursive: true, dereference: true });
  const staticSource = path.join(root, `apps/${zone.app}/.next/static`);
  const staticTarget = path.join(targetDir, `apps/${zone.app}/.next/static`);
  if (existsSync(staticSource)) cpSync(staticSource, staticTarget, { recursive: true });
  const publicSource = path.join(root, `apps/${zone.app}/public`);
  if (existsSync(publicSource)) cpSync(publicSource, path.join(targetDir, `apps/${zone.app}/public`), { recursive: true });
  const zoneModules = path.join(targetDir, `apps/${zone.app}/node_modules`);
  for (const dependency of zoneRuntimeDependencies[zone.app] ?? []) {
    for (const [name, dir] of dependencyClosure(dependency, new Set(), zone.app === "web/admin")) {
      const target = name.startsWith("@") ? path.join(zoneModules, ...name.split("/")) : path.join(zoneModules, name);
      if (existsSync(target)) continue;
      copyPackage(dir, target);
    }
  }
}

// The compiled CLI plus the workspace packages it imports at runtime.
cpSync(path.join(root, "apps/cli/dist"), path.join(distDir, "cli"), { recursive: true });
writeFileSync(path.join(distDir, "cli/package.json"), `${JSON.stringify({ name: "crafty-cli", type: "module", private: true }, null, 2)}\n`, "utf8");
for (const workspace of ["scene-store", "scene-model", "pen-import", "editor"]) {
  const source = path.join(root, "packages", workspace);
  if (!existsSync(path.join(source, "dist"))) continue;
  const target = path.join(distDir, "node_modules/@crafty", workspace);
  mkdirSync(target, { recursive: true });
  cpSync(path.join(source, "dist"), path.join(target, "dist"), { recursive: true });
  copyFileSync(path.join(source, "package.json"), path.join(target, "package.json"));
}

// Bundle the Bun runtime so the target machine needs no toolchain.
const bunBinary = path.join(distDir, process.platform === "win32" ? "bun.exe" : "bun");
copyFileSync(process.execPath, bunBinary);
chmodSync(bunBinary, 0o755);

const launcher = process.platform === "win32"
  ? "@echo off\r\n\"%~dp0bun.exe\" \"%~dp0cli\\index.js\" %*\r\n"
  : "#!/bin/sh\nDIR=$(CDPATH= cd -- \"$(dirname -- \"$0\")\" && pwd)\nexec \"$DIR/bun\" \"$DIR/cli/index.js\" \"$@\"\n";
const launcherPath = path.join(distDir, process.platform === "win32" ? "crafty.cmd" : "crafty");
writeFileSync(launcherPath, launcher, "utf8");
if (process.platform !== "win32") chmodSync(launcherPath, 0o755);

const directorySize = async (directory) => {
  const result = spawnSync("du", ["-sk", directory], { encoding: "utf8" });
  if (result.status === 0) return Number(result.stdout.trim().split(/\s+/u)[0]) * 1024;
  return (await statFile(directory)).size;
};

const bytes = await directorySize(distDir);
const runtime = process.versions.bun ? `Bun ${process.versions.bun}` : `Node ${process.version}`;
process.stdout.write(`Crafty distribution: ${distDir} (${(bytes / 1024 / 1024).toFixed(1)} MB, bundled ${runtime})\n`);
process.stdout.write("Run `./dist/crafty` for the desktop face, `./dist/crafty serve` for the iPad face, `./dist/crafty --help` for the available faces.\n");
