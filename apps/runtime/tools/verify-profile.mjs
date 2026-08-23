#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const runtimeRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const repositoryRoot = resolve(runtimeRoot, "../..");
const EXPECTED_RUST = "1.97.1";

const run = (command, arguments_, options = {}) => {
  const result = spawnSync(command, arguments_, {
    cwd: options.cwd ?? runtimeRoot,
    encoding: "utf8",
    env: { ...process.env, ...(options.env ?? {}) },
    maxBuffer: 8 * 1024 * 1024,
    stdio: options.capture ? "pipe" : "inherit",
    timeout: 240_000,
  });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${options.code ?? "RUNTIME_PROFILE_COMMAND_FAILED"}:${command}:${result.status}:${result.stderr ?? ""}`);
  return String(result.stdout ?? "").trim();
};

const assertToolchain = () => {
  const rustc = run("rustc", ["--version"], { capture: true }).split(/\s+/u)[1];
  const cargo = run("cargo", ["--version"], { capture: true }).split(/\s+/u)[1];
  if (rustc !== EXPECTED_RUST || cargo !== EXPECTED_RUST) {
    throw new Error(`RUNTIME_RUST_PIN_MISMATCH:rustc=${rustc}:cargo=${cargo}:expected=${EXPECTED_RUST}`);
  }
};

const nativeLibrary = (mode) => join(runtimeRoot, `native/target/${mode}/libcuriosity_runtime_native.${process.platform === "darwin" ? "dylib" : "so"}`);

const verifyCommon = (testProfile) => {
  assertToolchain();
  run("cargo", ["fmt", "--manifest-path", "native/Cargo.toml", "--check"]);
  run("cargo", ["clippy", "--manifest-path", "native/Cargo.toml", "--locked", "--all-targets", "--", "-D", "warnings"]);
  run("cargo", ["test", "--manifest-path", "native/Cargo.toml", "--locked"]);
  run("cargo", ["test", "--manifest-path", "native/Cargo.toml", "--locked", "--no-default-features"]);
  run("bun", ["run", "check-types"]);
  run("cargo", ["build", "--manifest-path", "native/Cargo.toml", "--locked"]);
  run("node", ["tools/run-test-profile.mjs", testProfile]);
  run("node", ["../../tools/verification/native-abi.mjs", "default", nativeLibrary("debug")]);
  run("cargo", ["build", "--manifest-path", "native/Cargo.toml", "--release", "--locked", "--no-default-features"]);
  run("node", ["../../tools/verification/native-abi.mjs", "query-only", nativeLibrary("release")]);
};

export const verifyRuntimeProfile = (profile) => {
  if (profile === "portable-linux") {
    if (process.platform !== "linux") throw new Error("RUNTIME_PORTABLE_LINUX_REQUIRED");
    verifyCommon("portable-linux");
    run("bun", ["run", "build"], { cwd: join(repositoryRoot, "apps/plugin/opencode2"), code: "RUNTIME_PORTABLE_PLUGIN_BUILD_FAILED" });
    run("node", ["tools/verification/runtime-plugin-contract.mjs", "--no-build"], {
      cwd: repositoryRoot,
      code: "RUNTIME_PORTABLE_EXECUTABLE_CONTRACT_FAILED",
    });
    console.log("runtime portable Linux profile passed");
    return;
  }
  if (profile === "darwin-compatibility") {
    if (process.platform !== "darwin" || process.arch !== "arm64") throw new Error("RUNTIME_DARWIN_ARM64_REQUIRED");
    if (process.env.CURIOSITY_TRUSTED_DARWIN_MANUAL !== "1") throw new Error("RUNTIME_DARWIN_TRUSTED_MANUAL_REQUIRED");
    verifyCommon("darwin-compatibility");
    run("bun", ["run", "build"], { cwd: join(repositoryRoot, "apps/plugin/opencode2"), code: "RUNTIME_DARWIN_PLUGIN_BUILD_FAILED" });
    run("node", ["tools/verification/runtime-plugin-contract.mjs", "--no-build"], {
      cwd: repositoryRoot,
      code: "RUNTIME_DARWIN_EXECUTABLE_CONTRACT_FAILED",
    });
    console.log("Darwin compatibility passed; this is not M7 qualification");
    return;
  }
  if (profile === "source") {
    if (!new Set(["darwin", "linux"]).has(process.platform)) throw new Error("RUNTIME_SOURCE_PLATFORM_UNSUPPORTED");
    verifyCommon("source");
    console.log("runtime source verification passed; no M7 or SDK qualification claim");
    return;
  }
  throw new Error(`RUNTIME_PROFILE_UNKNOWN:${profile}`);
};

const [profile, ...extra] = process.argv.slice(2);
if (!profile || extra.length > 0) {
  console.error("usage: node tools/verify-profile.mjs <source|portable-linux|darwin-compatibility>");
  process.exitCode = 2;
} else {
  try {
    verifyRuntimeProfile(profile);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
