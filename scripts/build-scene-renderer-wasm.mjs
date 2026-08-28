import { spawnSync } from "node:child_process";
import { renameSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const packageRoot = process.cwd().endsWith(`${path.sep}scene-renderer`) ? process.cwd() : path.resolve(process.cwd(), "packages/scene-renderer");
// Resolve by PATH by default. Absolute overrides remain useful for hermetic
// CI/tool wrappers, but a developer's home directory is not a toolchain
// contract and made clean-checkout builds fail on other machines.
const cargo = process.env.CARGO ?? "cargo";
const wasmBindgen = process.env.WASM_BINDGEN ?? "wasm-bindgen";
const wasmOpt = process.env.WASM_OPT ?? "wasm-opt";
const run = (command, args) => {
  const result = spawnSync(command, args, { cwd: packageRoot, stdio: "inherit" });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
};

run(cargo, ["build", "--target", "wasm32-unknown-unknown", "--release", "--manifest-path", "rust/Cargo.toml"]);
run(wasmBindgen, ["rust/target/wasm32-unknown-unknown/release/crafty_renderer_wasm.wasm", "--out-dir", "pkg", "--target", "web"]);

const output = path.join(packageRoot, "pkg", "crafty_renderer_wasm_bg.wasm");
const before = statSync(output).size;
const wasmOptCheck = spawnSync("which", [wasmOpt], { stdio: "ignore" });
if (wasmOptCheck.status === 0) {
  const optimized = `${output}.optimized`;
  run(wasmOpt, [
    "-O3",
    "--enable-bulk-memory",
    "--enable-multivalue",
    "--enable-mutable-globals",
    "--enable-nontrapping-float-to-int",
    "--enable-reference-types",
    "--enable-sign-ext",
    output,
    "-o",
    optimized,
  ]);
  renameSync(optimized, output);
  const after = statSync(output).size;
  process.stdout.write(`[wasm-opt] ${before} -> ${after} bytes\n`);
} else if (process.env.WASM_OPT_REQUIRED === "1") {
  throw new Error("wasm-opt is required (install Binaryen or set WASM_OPT to its executable).");
} else {
  process.stdout.write("[wasm-opt] unavailable; skipped (set WASM_OPT_REQUIRED=1 in CI)\n");
}

// Permanent patch: wasm-bindgen-futures frees JsFuture once-closures at
// settlement; if the browser fires a cleared reaction again, the freed
// wrapper calls into wasm with a zeroed slot and wasm panics with "closure
// invoked recursively or after being dropped". The guard makes a zeroed slot
// a logged no-op. See scripts/patch-wbg-closures.mjs for the full rationale.
{
  const patch = path.join(path.dirname(fileURLToPath(import.meta.url)), "patch-wbg-closures.mjs");
  run("node", [patch]);
}
