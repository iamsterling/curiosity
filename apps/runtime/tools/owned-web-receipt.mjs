import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join } from "node:path";

const root = new URL("..", import.meta.url).pathname;
const cargo = spawnSync("cargo", ["metadata", "--manifest-path", join(root, "native/Cargo.toml"), "--locked", "--all-features", "--format-version", "1"], { encoding: "utf8" });
if (cargo.status !== 0) throw new Error("OWNED_WEB_RECEIPT_METADATA_FAILED");
const metadata = JSON.parse(cargo.stdout);
const lock = readFileSync(join(root, "native/Cargo.lock"), "utf8");
const checksums = new Map(lock.split("[[package]]").slice(1).flatMap((block) => {
  const name = block.match(/\nname = "([^"]+)"/)?.[1];
  const version = block.match(/\nversion = "([^"]+)"/)?.[1];
  const checksum = block.match(/\nchecksum = "([^"]+)"/)?.[1];
  return name && version && checksum ? [[`${name}@${version}`, checksum]] : [];
}));
const packageById = new Map(metadata.packages.map((item) => [item.id, item]));
const nodeById = new Map(metadata.resolve.nodes.map((item) => [item.id, item]));
const rootPackage = metadata.packages.find((item) => item.name === "curiosity-runtime-native");
const pending = nodeById.get(rootPackage.id).deps.map((dependency) => dependency.pkg);
const ids = new Set();
while (pending.length) {
  const id = pending.pop();
  if (ids.has(id)) continue;
  ids.add(id);
  pending.push(...nodeById.get(id).deps.map((dependency) => dependency.pkg));
}
const receipt = {
  schema: "curiosity-owned-web-qualification-dependencies/v1",
  cargoLockSha256: createHash("sha256").update(lock).digest("hex"),
  packages: [...ids].map((id) => packageById.get(id)).sort((a, b) => `${a.name}@${a.version}`.localeCompare(`${b.name}@${b.version}`)).map((item) => ({ name: item.name, version: item.version, license: item.license, checksum: checksums.get(`${item.name}@${item.version}`) })),
};
const rendered = `${JSON.stringify(receipt, null, 2)}\n`;
const output = join(root, "docs/licenses/owned-web-qualification-dependencies.json");
if (process.argv.includes("--check")) {
  if (readFileSync(output, "utf8") !== rendered) throw new Error("OWNED_WEB_RECEIPT_MISMATCH");
} else writeFileSync(output, rendered);
