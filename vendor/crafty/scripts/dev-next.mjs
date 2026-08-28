import { existsSync } from "node:fs";
import path from "node:path";
import { spawn, spawnSync } from "node:child_process";
import process from "node:process";

/**
 * Development supervisor for the multi-zone platform.
 *
 * One origin, many servers: the base app owns :4173 (HTTPS) and rewrites to
 * the zone dev servers over loopback — the editor on :4175, the admin on
 * :4176 when it exists. The zone URL contract is the same environment the
 * launcher and the production bundle use, so a flow verified in dev is the
 * flow that ships.
 */

const bun = process.platform === "win32" ? "bun.exe" : "bun";
const root = process.cwd();
const buildPackages = ["@crafty/scene-model", "@crafty/editor", "@crafty/scene-renderer", "@crafty/pen-import", "@crafty/scene-store"];

const certificates = spawnSync(process.execPath, ["scripts/generate-dev-certificate.mjs"], { cwd: root, stdio: "inherit" });
if (certificates.error) throw certificates.error;
if (certificates.status !== 0) process.exit(certificates.status ?? 1);

// The wasm encoder build (scene-renderer `rust/` → `pkg/`) is not part of
// the tsc `build`. It must run FIRST: scene-renderer's wasm sources import
// ../../pkg/*.js, so tsc fails on a clean checkout where pkg/ does not
// exist yet.
const wasmBuild = spawnSync(bun, ["run", "--filter", "@crafty/scene-renderer", "build:wasm"], { cwd: root, stdio: "inherit" });
if (wasmBuild.error) throw wasmBuild.error;
if (wasmBuild.status !== 0) process.exit(wasmBuild.status ?? 1);

for (const workspace of buildPackages) {
  const result = spawnSync(bun, ["run", "build", "--filter", workspace], { cwd: root, stdio: "inherit" });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

// Shared-package hot reload. The zones' `next dev` servers watch their own
// source through Turbopack, but they import the workspace packages by their
// BUILT output (tsc dist, the wasm pkg) — so editing a kernel file must
// re-run that package's build or the change never reaches the zones.
// `turbo watch` re-runs the task when its package's files change: one
// watcher for the tsc builds, one for the wasm encoder (rust/ → pkg/, which
// tsc does not touch). The wasm rebuild is the slow one (~7 s cargo); the
// zone servers serve the previous build until it lands.
const spawnWatcher = (args) =>
  spawn(bun, ["x", "turbo", "watch", ...args], { cwd: root, stdio: "inherit", detached: true });

const zoneEnv = () => ({
  ...process.env,
  ZONE_EDITOR_URL: "http://127.0.0.1:4175",
  ZONE_ADMIN_URL: "http://127.0.0.1:4176",
  ZONE_MARKETING_URL: "http://127.0.0.1:4177"
});

const children = [];
// Package watchers register first so any watcher death takes the stack
// down like any zone death — a silently stale kernel is worse than a crash.
children.push(spawnWatcher(["build", "--filter", "@crafty/scene-model", "--filter", "@crafty/editor", "--filter", "@crafty/scene-renderer", "--filter", "@crafty/pen-import", "--filter", "@crafty/scene-store"]));
children.push(spawnWatcher(["build:wasm", "--filter", "@crafty/scene-renderer"]));
const spawnZone = (workspace, args) => {
  // detached: true gives each zone its own process group, so a shutdown can
  // kill the whole tree — `next dev` runs its server in a forked child that
  // survives a SIGTERM to the bun wrapper otherwise.
  const result = spawn(bun, ["run", "--filter", workspace, ...args], { cwd: root, stdio: "inherit", env: zoneEnv(), detached: true });
  children.push(result);
  return result;
};

// The editor zone: the surface everyone works on; it is the primary dev target.
spawnZone("@crafty/editor-web", ["dev"]);
// The marketing zone: only when it exists (stage 2 of the multi-zone change).
if (existsSync(path.join(root, "apps/web/marketing/package.json"))) spawnZone("@crafty/marketing", ["dev"]);
// The admin zone: only when it exists (stage 2 of the multi-zone change).
if (existsSync(path.join(root, "apps/web/admin/package.json"))) spawnZone("@crafty/admin", ["dev"]);
// The base app: the domain entry, HTTPS on :4173, rewrites to the zones above.
spawnZone("@crafty/base", ["dev"]);

const shutdown = (signal) => {
  for (const child of children) {
    try {
      process.kill(-child.pid, signal);
    } catch {
      child.kill(signal);
    }
  }
};
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
for (const child of children) child.on("exit", (code) => {
  // Any zone dying takes the stack down; a stale half-supervisor is worse.
  shutdown("SIGTERM");
  process.exit(code ?? 0);
});
