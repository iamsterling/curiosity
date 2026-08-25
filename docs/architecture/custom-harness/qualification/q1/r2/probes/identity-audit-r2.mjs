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
  if (index < 0 || index === args.length - 1) {
    throw new Error(`missing ${name}`);
  }
  return args[index + 1];
};
const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};
const candidates = JSON.parse(
  readFileSync(join(r2Root, "inputs/candidates.json"), "utf8"),
);
const consumer = resolve(value("--consumer"));
const effectSource = resolve(value("--effect-source"));
const closurePath = resolve(value("--closure"));
const extractedBunRoot = resolve(value("--extracted-bun-root"));
const extractedNodeRoot = resolve(value("--extracted-node-root"));
const extractedTurboRoot = resolve(value("--extracted-turbo-root"));
const output = resolve(value("--output"));

const gitObjectHash = (type, bytes) =>
  createHash("sha1")
    .update(Buffer.from(`${type} ${bytes.length}\0`))
    .update(bytes)
    .digest();
const gitTreeHash = (directory) => {
  const entries = readdirSync(directory).map((name) => {
    const path = join(directory, name);
    const stat = lstatSync(path);
    if (stat.isDirectory()) {
      return { name, sortName: `${name}/`, mode: "40000", hash: gitTreeHash(path) };
    }
    if (stat.isSymbolicLink()) {
      return {
        name,
        sortName: name,
        mode: "120000",
        hash: gitObjectHash("blob", Buffer.from(readlinkSync(path))),
      };
    }
    assert(stat.isFile(), `unsupported source entry: ${path}`);
    return {
      name,
      sortName: name,
      mode: stat.mode & 0o111 ? "100755" : "100644",
      hash: gitObjectHash("blob", readFileSync(path)),
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
  return gitObjectHash("tree", body);
};
const files = (directory) => {
  const output_ = [];
  const visit = (path) => {
    const stat = lstatSync(path);
    if (stat.isDirectory()) {
      readdirSync(path)
        .sort((left, right) => Buffer.from(left).compare(Buffer.from(right)))
        .forEach((name) => visit(join(path, name)));
    } else if (stat.isFile()) {
      output_.push(path);
    }
  };
  visit(directory);
  return output_;
};
const matchingArtifact = (root, expectedSha256) => {
  const matches = files(root).filter((path) => sha256File(path) === expectedSha256);
  assert(matches.length === 1, `expected one matching artifact under ${root}`);
  return matches[0];
};
const packageManifest = (directory) =>
  files(directory).map((path) => ({
    path: path.slice(directory.length + 1),
    bytes: lstatSync(path).size,
    mode: lstatSync(path).mode & 0o777,
    sha256: sha256File(path),
  }));

const closureRecords = readFileSync(closurePath, "utf8")
  .trim()
  .split("\n")
  .map((line) => JSON.parse(line));
const closure = closureRecords.find(({ event }) => event === "summary");
assert(closure?.verdict === "PASS", "syntax-aware closure must pass");
assert(closure.syntaxExternalCount === 0, "external runtime imports must be zero");
assert(
  closure.receipt036FalsePositiveCount > 0,
  "receipt 036 must have a retained false-positive diagnosis",
);
const packageRoot = realpathSync(join(consumer, "node_modules/effect"));
const packageJson = JSON.parse(
  readFileSync(join(packageRoot, "package.json"), "utf8"),
);
assert(packageJson.version === candidates.effect.version, "Effect package version");
for (const specifier of candidates.effect.importSurface) {
  const name = specifier.slice("effect/".length);
  const target = resolve(packageRoot, packageJson.exports["./*"].replace("*", name));
  assert(existsSync(target), `public export target absent: ${specifier}`);
}
const sourceTree = gitTreeHash(effectSource).toString("hex");
assert(sourceTree === candidates.effect.sourceTree, "Effect source tree");
const lock = readFileSync(join(repositoryRoot, "bun.lock"), "utf8");
assert(lock.includes(candidates.effect.lockIntegrity), "Effect lock integrity");
const lockVersions = [...lock.matchAll(/^\s+"effect": \["effect@([^"]+)"/gmu)].map(
  (match) => match[1],
);
assert(
  JSON.stringify(lockVersions) === JSON.stringify([candidates.effect.version]),
  "one exact Effect lock resolution",
);
const require = createRequire(
  realpathSync(join(repositoryRoot, "node_modules/turbo/package.json")),
);
const localTurbo = require.resolve("@turbo/darwin-arm64/bin/turbo");
const localBun = "/Users/sterling/.nvm/versions/node/v24.18.0/bin/bun";
const localNode = "/Users/sterling/.nvm/versions/node/v24.18.0/bin/node";
const artifactBun = matchingArtifact(
  extractedBunRoot,
  candidates.buildTest.bun.binarySha256,
);
const artifactNode = matchingArtifact(
  extractedNodeRoot,
  candidates.buildTest.nodeWhenInvoked.binarySha256,
);
const artifactTurbo = matchingArtifact(
  extractedTurboRoot,
  candidates.buildTest.turbo.platformBinarySha256,
);
for (const [label, path, expectedSha256] of [
  ["local Bun", localBun, candidates.buildTest.bun.binarySha256],
  ["artifact Bun", artifactBun, candidates.buildTest.bun.binarySha256],
  ["local Node", localNode, candidates.buildTest.nodeWhenInvoked.binarySha256],
  ["artifact Node", artifactNode, candidates.buildTest.nodeWhenInvoked.binarySha256],
  ["local Turbo", localTurbo, candidates.buildTest.turbo.platformBinarySha256],
  ["artifact Turbo", artifactTurbo, candidates.buildTest.turbo.platformBinarySha256],
]) {
  assert(sha256File(path) === expectedSha256, `${label} digest`);
}
const manifest = packageManifest(packageRoot);
await writeJsonExclusive(output, {
  schemaVersion: "custom-harness-q1-r2-identity-observation/v2",
  verdict: "PASS",
  candidateIdentity: candidates,
  effect: {
    ordinaryConsumerPackageRoot: packageRoot,
    packageVersion: packageJson.version,
    publicImports: candidates.effect.importSurface,
    sourceTree,
    packageManifestEntries: manifest.length,
    packageManifestSha256: sha256Bytes(JSON.stringify(manifest)),
    exactLockVersions: lockVersions,
    syntaxAwareClosure: closure,
  },
  binaries: {
    localBun: { path: localBun, sha256: sha256File(localBun) },
    artifactBun: { path: artifactBun, sha256: sha256File(artifactBun) },
    localNode: { path: localNode, sha256: sha256File(localNode) },
    artifactNode: { path: artifactNode, sha256: sha256File(artifactNode) },
    localTurbo: { path: localTurbo, sha256: sha256File(localTurbo) },
    artifactTurbo: { path: artifactTurbo, sha256: sha256File(artifactTurbo) },
  },
  assertions: { passed: 19, failed: 0, skipped: 0 },
});
console.log(
  JSON.stringify({
    verdict: "PASS",
    sourceTree,
    closureFiles: closure.visitedFileCount,
    receipt036FalsePositives: closure.receipt036FalsePositiveCount,
    artifactTurbo,
  }),
);
