import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join } from "node:path";

const root = new URL("..", import.meta.url).pathname;
const lock = join(root, "native/Cargo.lock");
const before = createHash("sha256").update(readFileSync(lock)).digest("hex");
const run = (command, args) => {
  const result = spawnSync(command, args, { cwd: root, stdio: "inherit" });
  if (result.status !== 0) process.exit(result.status ?? 1);
};

run("cargo", ["fmt", "--manifest-path", "native/Cargo.toml", "--check"]);
run("cargo", ["clippy", "--manifest-path", "native/Cargo.toml", "--locked", "--all-features", "--all-targets", "--", "-D", "warnings"]);
run("sandbox-exec", ["-p", "(version 1)(allow default)(deny network*)", "cargo", "test", "--manifest-path", "native/Cargo.toml", "--offline", "--locked", "--no-default-features", "--features", "owned-lexical-builder-qualification"]);
run("node", ["tools/verify-owned-lexical-reader-qualification.mjs"]);
run("node", ["tools/verify-owned-web-qualification.mjs"]);
run("cargo", ["test", "--manifest-path", "native/Cargo.toml", "--locked", "--no-default-features"]);
run("cargo", ["build", "--manifest-path", "native/Cargo.toml", "--release", "--locked", "--no-default-features"]);
run("bun", ["run", "check-types"]);
run("bun", ["test", "tests/boundaries.test.ts", "tests/package-scripts.test.ts"]);

const base = spawnSync("cargo", ["tree", "--manifest-path", "native/Cargo.toml", "--locked", "--no-default-features", "-e", "normal", "--prefix", "none"], { cwd: root, encoding: "utf8" });
const builder = spawnSync("cargo", ["tree", "--manifest-path", "native/Cargo.toml", "--locked", "--no-default-features", "--features", "owned-lexical-builder-qualification", "-e", "normal", "--prefix", "none"], { cwd: root, encoding: "utf8" });
if (base.status !== 0 || builder.status !== 0 || base.stdout !== builder.stdout) throw new Error("COLR_BUILDER_DEPENDENCY_TREE_CHANGED");
if (createHash("sha256").update(readFileSync(lock)).digest("hex") !== before) throw new Error("COLR_BUILDER_LOCKFILE_CHANGED");
const library = join(root, "native/target/release/libcuriosity_runtime_native.dylib");
const symbols = spawnSync("nm", ["-gU", library], { encoding: "utf8" });
const exported = symbols.stdout.split("\n").filter(Boolean).map((line) => line.trim().split(/\s+/).at(-1)).sort().join("\n");
if (symbols.status !== 0 || exported !== "_curiosity_runtime_v0_web_search\n_curiosity_runtime_v1_corpus_query") throw new Error("COLR_BUILDER_RELEASE_SYMBOL_LEAK");
const links = spawnSync("otool", ["-L", library], { encoding: "utf8" });
if (links.status !== 0 || links.stdout.split("\n").filter((line) => line.includes("compatibility version")).some((line) => !line.includes("libcuriosity_runtime_native.dylib") && !line.includes("/usr/lib/libSystem.B.dylib"))) throw new Error("COLR_BUILDER_RELEASE_LINK_MISMATCH");
run("git", ["diff", "--check"]);
console.error("owned lexical builder/publication qualification checks passed for the removable private Darwin qualification tranche under the stable same-UID namespace precondition; no serving, production, or power-loss authority is claimed");
