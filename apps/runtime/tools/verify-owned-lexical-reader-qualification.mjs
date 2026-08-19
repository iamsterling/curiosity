import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join } from "node:path";

const root = new URL("..", import.meta.url).pathname;
const run = (command, args) => {
  const result = spawnSync(command, args, { cwd: root, stdio: "inherit" });
  if (result.status !== 0) process.exit(result.status ?? 1);
};
const fixture = join(root, "fixtures/owned-lexical-reader/golden-three-v1");
const normativeSource = Buffer.from('{"fixture":"golden-three-v1"}', "utf8");
const pinnedSourceDigest = "aded5d41b2172574277755ce240a0febd1124bf38a0fc1806901b625b0d3f6c2";
const sourceBytes = readFileSync(join(fixture, "source-manifest.json"));
if (!sourceBytes.equals(normativeSource) || createHash("sha256").update(sourceBytes).digest("hex") !== pinnedSourceDigest) throw new Error("COLR_SOURCE_BINDING_MISMATCH");
const manifest = JSON.parse(readFileSync(join(fixture, "manifest.json"), "utf8"));
if (manifest.sourceManifestDigest !== pinnedSourceDigest) throw new Error("COLR_MANIFEST_SOURCE_BINDING_MISMATCH");
const recipe = readFileSync(join(root, "fixtures/owned-lexical-reader/golden-three-v1.recipe.json"));
if (createHash("sha256").update(recipe).digest("hex") !== "e5b202d0b4f2a156aaac5f6216662b926ef62e8bc82da2c0609d7dfa64e54c6f" || !recipe.includes(Buffer.from("independent field-by-field"))) throw new Error("COLR_RECIPE_MISMATCH");
const readerSource = readdirSync(join(root, "native/src/owned_lexical"))
  .filter((name) => name.endsWith(".rs") && name !== "tests.rs")
  .map((name) => readFileSync(join(root, "native/src/owned_lexical", name), "utf8"))
  .join("\n");
if (/\bunsafe\b|std::(?:fs|net)|no_mangle|extern\s+"C"/.test(readerSource)) throw new Error("COLR_BOUNDARY_WIDENED");
const receipt = JSON.parse(readFileSync(join(fixture, "build-receipt.json"), "utf8"));
if (receipt.schema !== "curiosity-owned-lexical-fixture-receipt/v1") throw new Error("COLR_RECEIPT_SCHEMA");
for (const [name, expected] of Object.entries(receipt.files)) {
  const bytes = readFileSync(join(fixture, name));
  if (bytes.length !== expected.length || createHash("sha256").update(bytes).digest("hex") !== expected.sha256) throw new Error(`COLR_RECEIPT_MISMATCH:${name}`);
}
if (readdirSync(fixture).sort().join("\n") !== ["build-receipt.json", "manifest.json", "passages.colr", "postings.colr", "source-manifest.json", "terms.colr"].join("\n")) throw new Error("COLR_FIXTURE_INVENTORY");
run("cargo", ["fmt", "--manifest-path", "native/Cargo.toml", "--check"]);
run("cargo", ["clippy", "--manifest-path", "native/Cargo.toml", "--locked", "--all-features", "--all-targets", "--", "-D", "warnings"]);
run("sandbox-exec", ["-p", "(version 1)(allow default)(deny network*)", "cargo", "test", "--manifest-path", "native/Cargo.toml", "--offline", "--locked", "--features", "owned-lexical-reader-qualification"]);
run("cargo", ["test", "--manifest-path", "native/Cargo.toml", "--locked", "--no-default-features"]);
run("cargo", ["build", "--manifest-path", "native/Cargo.toml", "--release", "--locked", "--no-default-features"]);
const library = join(root, "native/target/release/libcuriosity_runtime_native.dylib");
const symbols = spawnSync("nm", ["-gU", library], { encoding: "utf8" });
const exported = symbols.stdout.split("\n").filter(Boolean).map((line) => line.trim().split(/\s+/).at(-1)).sort().join("\n");
if (symbols.status !== 0 || exported !== "_curiosity_runtime_v0_web_search\n_curiosity_runtime_v1_corpus_query") throw new Error("COLR_RELEASE_SYMBOL_LEAK");
const links = spawnSync("otool", ["-L", library], { encoding: "utf8" });
if (links.status !== 0 || links.stdout.split("\n").filter((line) => line.includes("compatibility version")).some((line) => !line.includes("libcuriosity_runtime_native.dylib") && !line.includes("/usr/lib/libSystem.B.dylib"))) throw new Error("COLR_RELEASE_LINK_MISMATCH");
const baseTree = spawnSync("cargo", ["tree", "--manifest-path", "native/Cargo.toml", "--locked", "--no-default-features", "-e", "normal", "--prefix", "none"], { cwd: root, encoding: "utf8" });
const readerTree = spawnSync("cargo", ["tree", "--manifest-path", "native/Cargo.toml", "--locked", "--no-default-features", "--features", "owned-lexical-reader-qualification", "-e", "normal", "--prefix", "none"], { cwd: root, encoding: "utf8" });
if (baseTree.status !== 0 || readerTree.status !== 0 || baseTree.stdout !== readerTree.stdout) throw new Error("COLR_DEPENDENCY_TREE_CHANGED");
run("bun", ["run", "check-types"]);
run("bun", ["test", "tests/boundaries.test.ts", "tests/package-scripts.test.ts"]);
console.log("owned lexical reader qualification checks passed");
