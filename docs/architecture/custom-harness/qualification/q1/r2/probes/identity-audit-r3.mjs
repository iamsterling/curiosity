import { createHash } from "node:crypto";
import {
  existsSync,
  lstatSync,
  readFileSync,
  readdirSync,
  readlinkSync,
  realpathSync,
} from "node:fs";
import { createRequire } from "node:module";
import { join, resolve } from "node:path";

import {
  repositoryRoot,
  r2Root,
  sha256Bytes,
  sha256File,
  writeJsonExclusive,
} from "./receipt-lib.mjs";

const args = process.argv.slice(2);
const value = (name) => {
  const index = args.indexOf(name);
  if (index < 0 || index === args.length - 1)
    throw new Error(`missing ${name}`);
  return args[index + 1];
};
const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};
const candidates = JSON.parse(
  readFileSync(join(r2Root, "inputs/candidates.json"), "utf8"),
);
const consumer = resolve(value("--consumer"));
const sourceRoot = resolve(value("--effect-source-root"));
const closurePath = resolve(value("--closure"));
const bunRoot = resolve(value("--extracted-bun-root"));
const nodeRoot = resolve(value("--extracted-node-root"));
const turboRoot = resolve(value("--extracted-turbo-root"));
const diagnosticPath = resolve(value("--source-tree-diagnostic"));
const output = resolve(value("--output"));

const objectHash = (type, bytes) =>
  createHash("sha1")
    .update(Buffer.from(`${type} ${bytes.length}\0`))
    .update(bytes)
    .digest();
const treeHash = (directory) => {
  const entries = readdirSync(directory).map((name) => {
    const path = join(directory, name);
    const stat = lstatSync(path);
    if (stat.isDirectory()) {
      return {
        name,
        sortName: `${name}/`,
        mode: "40000",
        hash: treeHash(path),
      };
    }
    if (stat.isSymbolicLink()) {
      return {
        name,
        sortName: name,
        mode: "120000",
        hash: objectHash("blob", Buffer.from(readlinkSync(path))),
      };
    }
    assert(stat.isFile(), `unsupported source entry: ${path}`);
    return {
      name,
      sortName: name,
      mode: stat.mode & 0o111 ? "100755" : "100644",
      hash: objectHash("blob", readFileSync(path)),
    };
  });
  entries.sort((left, right) =>
    Buffer.from(left.sortName).compare(Buffer.from(right.sortName)),
  );
  const body = Buffer.concat(
    entries.flatMap((entry) => [
      Buffer.from(`${entry.mode} ${entry.name}\0`),
      entry.hash,
    ]),
  );
  return objectHash("tree", body);
};
const files = (directory) => {
  const result = [];
  const visit = (path) => {
    const stat = lstatSync(path);
    if (stat.isDirectory()) {
      readdirSync(path)
        .sort((left, right) => Buffer.from(left).compare(Buffer.from(right)))
        .forEach((name) => visit(join(path, name)));
    } else if (stat.isFile()) {
      result.push(path);
    }
  };
  visit(directory);
  return result;
};
const matchingArtifact = (root, digest) => {
  const matches = files(root).filter((path) => sha256File(path) === digest);
  assert(
    matches.length === 1,
    `expected one artifact digest match under ${root}`,
  );
  return matches[0];
};

const packageSource = join(sourceRoot, "packages/effect");
const repositorySourceTree = treeHash(sourceRoot).toString("hex");
const packageSourceTree = treeHash(packageSource).toString("hex");
const treeMatches = [
  { scope: "repository-root", sha: repositorySourceTree },
  { scope: "packages/effect", sha: packageSourceTree },
].filter(({ sha }) => sha === candidates.effect.sourceTree);
await writeJsonExclusive(diagnosticPath, {
  schemaVersion: "custom-harness-q1-r2-source-tree-diagnostic/v1",
  expectedSha1: candidates.effect.sourceTree,
  repositoryRootSha1: repositorySourceTree,
  effectPackageSha1: packageSourceTree,
  matches: treeMatches,
  rule: "The retained sourceTree field is accepted only when the recomputed Git tree of an explicitly named archive scope equals it exactly.",
});
assert(treeMatches.length === 1, "source tree scope or digest mismatch");

const closure = readFileSync(closurePath, "utf8")
  .trim()
  .split("\n")
  .map((line) => JSON.parse(line))
  .find(({ event }) => event === "summary");
assert(closure?.verdict === "PASS", "syntax closure prerequisite");
assert(closure.syntaxExternalCount === 0, "external runtime imports");
assert(closure.receipt036FalsePositiveCount === 1126, "receipt 036 diagnosis");
const packageRoot = realpathSync(join(consumer, "node_modules/effect"));
const packageJson = JSON.parse(
  readFileSync(join(packageRoot, "package.json"), "utf8"),
);
assert(packageJson.version === candidates.effect.version, "Effect version");
for (const specifier of candidates.effect.importSurface) {
  const target = resolve(
    packageRoot,
    packageJson.exports["./*"].replace("*", specifier.slice("effect/".length)),
  );
  assert(existsSync(target), `public export absent: ${specifier}`);
}
const lock = readFileSync(join(repositoryRoot, "bun.lock"), "utf8");
assert(lock.includes(candidates.effect.lockIntegrity), "Effect lock integrity");
const lockVersions = [
  ...lock.matchAll(/^\s+"effect": \["effect@([^"]+)"/gmu),
].map((match) => match[1]);
assert(
  JSON.stringify(lockVersions) === JSON.stringify([candidates.effect.version]),
  "duplicate Effect lock resolution",
);
const require = createRequire(
  realpathSync(join(repositoryRoot, "node_modules/turbo/package.json")),
);
const localBun = "/Users/sterling/.nvm/versions/node/v24.18.0/bin/bun";
const localNode = "/Users/sterling/.nvm/versions/node/v24.18.0/bin/node";
const localTurbo = require.resolve("@turbo/darwin-arm64/bin/turbo");
const artifactBun = matchingArtifact(
  bunRoot,
  candidates.buildTest.bun.binarySha256,
);
const artifactNode = matchingArtifact(
  nodeRoot,
  candidates.buildTest.nodeWhenInvoked.binarySha256,
);
const artifactTurbo = matchingArtifact(
  turboRoot,
  candidates.buildTest.turbo.platformBinarySha256,
);
for (const [label, path, digest] of [
  ["local Bun", localBun, candidates.buildTest.bun.binarySha256],
  ["artifact Bun", artifactBun, candidates.buildTest.bun.binarySha256],
  ["local Node", localNode, candidates.buildTest.nodeWhenInvoked.binarySha256],
  [
    "artifact Node",
    artifactNode,
    candidates.buildTest.nodeWhenInvoked.binarySha256,
  ],
  ["local Turbo", localTurbo, candidates.buildTest.turbo.platformBinarySha256],
  [
    "artifact Turbo",
    artifactTurbo,
    candidates.buildTest.turbo.platformBinarySha256,
  ],
]) {
  assert(sha256File(path) === digest, `${label} digest`);
}
const manifest = files(packageRoot).map((path) => ({
  path: path.slice(packageRoot.length + 1),
  bytes: lstatSync(path).size,
  mode: lstatSync(path).mode & 0o777,
  sha256: sha256File(path),
}));
await writeJsonExclusive(output, {
  schemaVersion: "custom-harness-q1-r2-identity-observation/v3",
  verdict: "PASS",
  candidateIdentity: candidates,
  effect: {
    ordinaryConsumerPackageRoot: packageRoot,
    publicImports: candidates.effect.importSurface,
    sourceTree: treeMatches[0],
    exactLockVersions: lockVersions,
    packageManifestEntries: manifest.length,
    packageManifestSha256: sha256Bytes(JSON.stringify(manifest)),
    syntaxClosure: closure,
  },
  binaries: {
    localBun: { path: localBun, sha256: sha256File(localBun) },
    artifactBun: { path: artifactBun, sha256: sha256File(artifactBun) },
    localNode: { path: localNode, sha256: sha256File(localNode) },
    artifactNode: { path: artifactNode, sha256: sha256File(artifactNode) },
    localTurbo: { path: localTurbo, sha256: sha256File(localTurbo) },
    artifactTurbo: { path: artifactTurbo, sha256: sha256File(artifactTurbo) },
  },
  assertions: { passed: 21, failed: 0, skipped: 0 },
});
console.log(
  JSON.stringify({
    verdict: "PASS",
    sourceTree: treeMatches[0],
    closureFiles: closure.visitedFileCount,
    receipt036FalsePositives: closure.receipt036FalsePositiveCount,
    artifactTurbo,
  }),
);
