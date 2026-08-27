#!/usr/bin/env bun
import { createHash } from "node:crypto";
import { chmod, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const supervisor = path.join(
  root,
  "native/supervisor/target/release/curiosity-supervisor",
);
const tui = path.join(root, "native/tui/dist/curiosity-tui");
const runtime = path.join(root, "src/distribution/binary-entry.ts");
const output = path.join(root, "dist/curiosity");
const hash = (...values) => {
  const digest = createHash("sha256");
  for (const value of values) digest.update(value);
  return digest.digest("hex");
};
const sourceFilesResult = Bun.spawnSync(
  ["git", "ls-files", "-co", "--exclude-standard", "-z", "--", "."],
  { cwd: root, stderr: "pipe", stdout: "pipe" },
);
if (sourceFilesResult.exitCode !== 0)
  throw new Error("BINARY_SOURCE_INVENTORY_UNAVAILABLE");
const sourceFiles = sourceFilesResult.stdout
  .toString()
  .split("\0")
  .filter(Boolean)
  .sort();
const sourceHash = createHash("sha256");
for (const file of sourceFiles) {
  sourceHash.update(`${Buffer.byteLength(file)}:${file}:`);
  sourceHash.update(await readFile(path.join(root, file)));
}
const sourceIdentity = sourceHash.digest("hex").slice(0, 12);
const payloadIdentity = hash(
  await readFile(supervisor),
  await readFile(tui),
).slice(0, 12);
const revisionResult = Bun.spawnSync(["git", "rev-parse", "--short", "HEAD"], {
  cwd: root,
  stderr: "pipe",
  stdout: "pipe",
});
if (revisionResult.exitCode !== 0) throw new Error("BINARY_REVISION_UNAVAILABLE");
const revision = revisionResult.stdout.toString().trim();
const statusResult = Bun.spawnSync(["git", "status", "--porcelain", "--", "."], {
  cwd: root,
  stderr: "pipe",
  stdout: "pipe",
});
if (statusResult.exitCode !== 0) throw new Error("BINARY_STATUS_UNAVAILABLE");
const buildIdentity = [
  revision,
  ...(statusResult.stdout.length > 0 ? ["dirty"] : []),
  sourceIdentity,
  `payload${payloadIdentity}`,
  `bun${Bun.version}`,
].join(".");
const target = `${process.platform}-${process.arch}`;
if (target !== "darwin-arm64") throw new Error("BINARY_TARGET_UNQUALIFIED");

const temporary = await mkdtemp(path.join(os.tmpdir(), "curiosity-binary-"));
const entry = path.join(temporary, "entry.ts");
const source = `
import embeddedSupervisorPath from ${JSON.stringify(supervisor)} with { type: "file" };
import embeddedTuiPath from ${JSON.stringify(tui)} with { type: "file" };
import { runExperimentalBinary } from ${JSON.stringify(runtime)};

await runExperimentalBinary({
  embeddedSupervisorPath,
  embeddedTuiPath,
  target: ${JSON.stringify(target)},
  version: ${JSON.stringify(`0.0.0-experimental+${buildIdentity}`)},
}).catch((error) => {
  process.stderr.write(\`${"${error instanceof Error ? error.message : \"CURIOSITY_FAILED\"}"}\\n\`);
  process.exitCode = 1;
});
`;

try {
  await mkdir(path.dirname(output), { recursive: true });
  await writeFile(entry, source);
  const result = await Bun.build({
    entrypoints: [entry],
    compile: {
      autoloadBunfig: false,
      autoloadDotenv: false,
      autoloadPackageJson: false,
      autoloadTsconfig: false,
      outfile: output,
      target: "bun-darwin-arm64",
    },
    minify: true,
  });
  if (!result.success) {
    for (const log of result.logs) process.stderr.write(`${log.message}\n`);
    throw new Error("BINARY_BUILD_FAILED");
  }
  await chmod(output, 0o755);
  process.stdout.write(`experimental binary built: ${output}\n`);
} finally {
  await rm(temporary, { force: true, recursive: true });
}
