import { spawnSync } from "node:child_process";
import { join } from "node:path";

const root = new URL("..", import.meta.url).pathname;
const run = (command, args, env = {}) => {
  const result = spawnSync(command, args, { cwd: root, env: { ...process.env, ...env }, stdio: "inherit" });
  if (result.status !== 0) process.exit(result.status ?? 1);
};
run("cargo", ["fmt", "--manifest-path", "native/Cargo.toml", "--check"]);
run("cargo", ["clippy", "--manifest-path", "native/Cargo.toml", "--locked", "--all-features", "--all-targets", "--", "-D", "warnings"]);
run("cargo", ["test", "--manifest-path", "native/Cargo.toml", "--locked", "--all-features"]);
run("cargo", ["test", "--manifest-path", "native/Cargo.toml", "--locked", "--no-default-features"]);
run("cargo", ["build", "--manifest-path", "native/Cargo.toml", "--release", "--locked", "--no-default-features"]);
const library = join(root, "native/target/release/libcuriosity_runtime_native.dylib");
const nm = spawnSync("nm", ["-gU", library], { encoding: "utf8" });
if (nm.status !== 0 || nm.stdout.split("\n").filter(Boolean).map((line) => line.trim().split(/\s+/).at(-1)).sort().join("\n") !== "_curiosity_runtime_v0_web_search\n_curiosity_runtime_v1_corpus_query") throw new Error("OWNED_WEB_RELEASE_SYMBOL_MISMATCH");
const links = spawnSync("otool", ["-L", library], { encoding: "utf8" });
if (links.status !== 0 || links.stdout.includes("sqlite") || links.stdout.split("\n").filter((line) => line.includes("compatibility version")).some((line) => !line.includes("libcuriosity_runtime_native.dylib") && !line.includes("/usr/lib/libSystem.B.dylib"))) throw new Error("OWNED_WEB_RELEASE_LINK_MISMATCH");
run("cargo", ["tree", "--manifest-path", "native/Cargo.toml", "--locked", "--all-features"]);
run("cargo", ["tree", "--manifest-path", "native/Cargo.toml", "--locked", "--no-default-features"]);
run("bun", ["run", "check-types"]);
run("bun", ["test", "tests/boundaries.test.ts"]);
run("cargo", ["build", "--manifest-path", "native/Cargo.toml", "--locked", "--all-features"]);
run("sandbox-exec", ["-p", "(version 1)(allow default)(deny network*)", "cargo", "test", "--manifest-path", "native/Cargo.toml", "--offline", "--locked", "--all-features"]);
run("sandbox-exec", ["-p", "(version 1)(allow default)(deny network*)", "bun", "test", "tests/owned-web-qualification.test.ts"], { CURIOSITY_OWNED_WEB_QUALIFICATION: "1" });
run("node", ["tools/owned-web-receipt.mjs", "--check"]);
console.log("owned-web qualification checks passed under the stable operator-root precondition; acceptance remains conditional because approved advisory scanning is unavailable");
