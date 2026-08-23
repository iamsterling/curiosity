#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const ABI_SYMBOLS = Object.freeze({
  default: Object.freeze([
    "curiosity_runtime_v0_web_search",
    "curiosity_runtime_v1_corpus_admin",
    "curiosity_runtime_v1_corpus_query",
    "curiosity_runtime_v2_owned_job_transition",
    "curiosity_runtime_v2_owned_job_transition_canonical",
    "curiosity_runtime_v2_owned_state_write",
  ]),
  "query-only": Object.freeze([
    "curiosity_runtime_v0_web_search",
    "curiosity_runtime_v1_corpus_query",
  ]),
});

const sorted = (values) => [...values].sort((left, right) => Buffer.from(left).compare(Buffer.from(right)));

export const nativeLibraryFilename = (platform) => {
  if (platform === "linux") return "libcuriosity_runtime_native.so";
  if (platform === "darwin") return "libcuriosity_runtime_native.dylib";
  throw new Error("ABI_PLATFORM_UNSUPPORTED");
};

export const resolveNativeLibrary = ({ platform, directory, entries }) => {
  const filename = nativeLibraryFilename(platform);
  if (!entries.includes(filename)) throw new Error(`ABI_LIBRARY_MISSING:${filename}`);
  return path.join(directory, filename);
};

export const normalizedAbiSymbols = (output) => sorted(
  String(output)
    .split(/\r?\n/u)
    .map((line) => line.trim().split(/\s+/u).at(-1) ?? "")
    .map((symbol) => symbol.startsWith("_") ? symbol.slice(1) : symbol)
    .filter((symbol) => symbol.startsWith("curiosity_runtime_")),
);

export const verifyAbiSymbols = ({ profile, output }) => {
  const expected = ABI_SYMBOLS[profile];
  if (!expected) throw new Error(`ABI_PROFILE_UNKNOWN:${profile}`);
  const actual = normalizedAbiSymbols(output);
  if (JSON.stringify(actual) !== JSON.stringify(sorted(expected))) {
    throw new Error(`ABI_SYMBOL_MISMATCH:${profile}:${actual.join(",")}`);
  }
  return true;
};

export const readNativeSymbols = ({ platform, library }) => {
  const arguments_ = platform === "linux"
    ? ["-D", "--defined-only", library]
    : platform === "darwin"
      ? ["-gU", library]
      : undefined;
  if (!arguments_) throw new Error("ABI_PLATFORM_UNSUPPORTED");
  const result = spawnSync("nm", arguments_, { encoding: "utf8", maxBuffer: 1024 * 1024, timeout: 30_000 });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`ABI_NM_FAILED:${result.status}:${result.stderr}`);
  return result.stdout;
};

export const verifyNativeAbi = ({ profile, library, platform = process.platform }) =>
  verifyAbiSymbols({ profile, output: readNativeSymbols({ platform, library }) });

if (path.resolve(process.argv[1] ?? "") === fileURLToPath(import.meta.url)) {
  const [profile, library, ...extra] = process.argv.slice(2);
  if (extra.length > 0 || !profile || !library) {
    console.error("usage: node tools/verification/native-abi.mjs <default|query-only> LIBRARY");
    process.exitCode = 2;
  } else {
    try {
      verifyNativeAbi({ profile, library: path.resolve(library) });
      console.log(`native ABI ${profile} passed`);
    } catch (error) {
      console.error(error instanceof Error ? error.message : String(error));
      process.exitCode = 1;
    }
  }
}
