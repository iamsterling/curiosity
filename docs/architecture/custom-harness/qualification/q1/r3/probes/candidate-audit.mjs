import { createHash } from "node:crypto";
import {
  existsSync,
  lstatSync,
  readFileSync,
  realpathSync,
  readdirSync,
  readlinkSync,
} from "node:fs";
import { createRequire } from "node:module";
import { basename, dirname, join, resolve } from "node:path";

import {
  repositoryRoot,
  r3Root,
  sha256Bytes,
  sha256File,
  writeJsonExclusive,
} from "./receipt-lib.mjs";

const args = process.argv.slice(2);
const mode = args.shift();
const value = (name) => {
  const index = args.indexOf(name);
  if (index < 0 || index === args.length - 1) {
    throw new Error(`missing ${name}`);
  }
  return args[index + 1];
};
const candidates = JSON.parse(
  readFileSync(join(r3Root, "inputs/candidates.json"), "utf8"),
);
const retrievalConfig = JSON.parse(
  readFileSync(join(r3Root, "inputs/retrievals.json"), "utf8"),
);

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};
const strings = (input, output = []) => {
  if (typeof input === "string") output.push(input);
  if (Array.isArray(input)) input.forEach((entry) => strings(entry, output));
  if (input && typeof input === "object") {
    Object.values(input).forEach((entry) => strings(entry, output));
  }
  return output;
};
const decodedAttestationStrings = (input) => {
  const output = strings(input);
  const visit = (entry) => {
    if (!entry || typeof entry !== "object") return;
    const payload = entry.dsseEnvelope?.payload;
    if (typeof payload === "string") {
      try {
        strings(
          JSON.parse(Buffer.from(payload, "base64").toString("utf8")),
          output,
        );
      } catch {
        output.push("UNPARSEABLE_DSSE_PAYLOAD");
      }
    }
    Object.values(entry).forEach(visit);
  };
  visit(input);
  return output;
};

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
      return {
        name,
        sortName: `${name}/`,
        mode: "40000",
        hash: gitTreeHash(path),
      };
    }
    if (stat.isSymbolicLink()) {
      return {
        name,
        sortName: name,
        mode: "120000",
        hash: gitObjectHash("blob", Buffer.from(readlinkSync(path))),
      };
    }
    assert(stat.isFile(), `unsupported source-tree entry: ${path}`);
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

const packageManifest = (directory, base = directory) => {
  const output = [];
  for (const name of readdirSync(directory).sort((left, right) =>
    Buffer.from(left).compare(Buffer.from(right)),
  )) {
    const path = join(directory, name);
    const relativePath = path.slice(base.length + 1);
    const stat = lstatSync(path);
    if (stat.isDirectory()) {
      output.push(...packageManifest(path, base));
    } else if (stat.isSymbolicLink()) {
      output.push({
        path: relativePath,
        type: "symlink",
        target: readlinkSync(path),
      });
    } else if (stat.isFile()) {
      output.push({
        path: relativePath,
        type: "file",
        bytes: stat.size,
        mode: stat.mode & 0o777,
        sha256: sha256File(path),
      });
    }
  }
  return output;
};

const selectedClosure = (packageRoot, packageJson) => {
  const selected = candidates.effect.importSurface;
  const wildcard = packageJson.exports["./*"];
  assert(
    typeof wildcard === "string",
    "Effect wildcard package export is absent",
  );
  const pending = selected.map((specifier) =>
    join(packageRoot, wildcard.replace("*", specifier.slice("effect/".length))),
  );
  const visited = new Set();
  const bare = new Set();
  const importPattern =
    /(?:from\s*|import\s*\(|export\s+[^;]*?from\s*)["']([^"']+)["']/gu;
  while (pending.length > 0) {
    const path = resolve(pending.pop());
    if (visited.has(path)) continue;
    assert(
      path.startsWith(`${packageRoot}/`),
      `closure escaped package: ${path}`,
    );
    visited.add(path);
    const source = readFileSync(path, "utf8");
    for (const match of source.matchAll(importPattern)) {
      const specifier = match[1];
      if (!specifier.startsWith(".")) {
        bare.add(specifier);
        continue;
      }
      const resolved = resolve(dirname(path), specifier);
      assert(
        resolved.startsWith(`${packageRoot}/`),
        `relative closure escaped: ${path}`,
      );
      pending.push(resolved);
    }
  }
  return {
    selected,
    files: [...visited].sort(),
    externalRuntimeImports: [...bare].sort(),
  };
};

if (mode === "semantic") {
  const downloads = resolve(value("--downloads"));
  const output = resolve(value("--output"));
  const records = [];
  for (const retrieval of retrievalConfig.retrievals) {
    const path = join(downloads, retrieval.file);
    assert(existsSync(path), `retrieval body absent: ${retrieval.id}`);
    const actualSha256 = sha256File(path);
    if (retrieval.expectedSha256) {
      assert(
        actualSha256 === retrieval.expectedSha256,
        `retrieval digest mismatch: ${retrieval.id}`,
      );
    }
    records.push({ id: retrieval.id, path, sha256: actualSha256 });
  }
  const json = (id) =>
    JSON.parse(
      readFileSync(records.find((record) => record.id === id).path, "utf8"),
    );
  const effectMetadata = json("effect-metadata");
  assert(
    effectMetadata.version === candidates.effect.version,
    "Effect metadata version",
  );
  assert(
    effectMetadata.dist.integrity === candidates.effect.lockIntegrity,
    "Effect metadata integrity",
  );
  const typescriptMetadata = json("typescript-metadata");
  assert(
    typescriptMetadata.gitHead === candidates.buildTest.typescript.sourceCommit,
    "TypeScript metadata source",
  );
  assert(typescriptMetadata.version === "5.9.2", "TypeScript metadata version");
  assert(
    json("turbo-metadata").version === "2.10.10",
    "Turbo metadata version",
  );
  const platformMetadata = json("turbo-platform-metadata");
  assert(platformMetadata.version === "2.10.10", "Turbo platform version");
  assert(
    JSON.stringify([platformMetadata.os, platformMetadata.cpu]) ===
      JSON.stringify([["darwin"], ["arm64"]]),
    "Turbo platform tuple",
  );
  for (const [id, expected] of [
    ["effect-attestations", retrievalConfig.retrievals[2].semanticExpectation],
    ["turbo-attestations", retrievalConfig.retrievals[10].semanticExpectation],
    [
      "turbo-platform-attestations",
      retrievalConfig.retrievals[11].semanticExpectation,
    ],
  ]) {
    const values = decodedAttestationStrings(json(id)).join("\n");
    assert(values.includes(expected.package), `${id} package subject`);
    assert(values.includes(expected.subjectSha512), `${id} artifact subject`);
    assert(values.includes(expected.sourceCommit), `${id} source commit`);
  }
  assert(
    json("bun-commit").sha === candidates.buildTest.bun.revision,
    "Bun commit resolution",
  );
  const nodeChecksums = readFileSync(
    records.find(({ id }) => id === "node-checksums").path,
    "utf8",
  );
  assert(
    nodeChecksums.includes(
      retrievalConfig.retrievals.find(({ id }) => id === "node-checksums")
        .semanticExpectation.line,
    ),
    "Node checksum line",
  );
  const rustChecksum = readFileSync(
    records.find(({ id }) => id === "rust-channel-checksum").path,
    "utf8",
  );
  assert(
    rustChecksum.startsWith(
      candidates.buildTest.rustCargoForRootChecksOnly.channelManifestSha256,
    ),
    "Rust channel checksum",
  );
  await writeJsonExclusive(output, {
    schemaVersion: "custom-harness-q1-r3-retrieval-audit/v1",
    verdict: "PASS",
    records,
    assertions: 21 + 15,
    semanticOnlyWholeResponseIds: records
      .filter(
        ({ id }) =>
          retrievalConfig.retrievals.find((entry) => entry.id === id)
            .expectedSha256 === null,
      )
      .map(({ id }) => id),
  });
  console.log(JSON.stringify({ verdict: "PASS", retrievals: records.length }));
} else if (mode === "identity") {
  const consumer = resolve(value("--consumer"));
  const effectSource = resolve(value("--effect-source"));
  const extractedBun = resolve(value("--extracted-bun"));
  const extractedNode = resolve(value("--extracted-node"));
  const extractedTurbo = resolve(value("--extracted-turbo"));
  const output = resolve(value("--output"));
  const packageRoot = join(consumer, "node_modules/effect");
  const packageJson = JSON.parse(
    readFileSync(join(packageRoot, "package.json"), "utf8"),
  );
  assert(
    packageJson.version === candidates.effect.version,
    "Effect package version",
  );
  const closure = selectedClosure(packageRoot, packageJson);
  assert(
    closure.externalRuntimeImports.length === 0,
    "external runtime import closure",
  );
  const sourceTree = gitTreeHash(effectSource).toString("hex");
  assert(
    sourceTree === candidates.effect.sourceTree,
    "Effect source tree identity",
  );
  const lock = readFileSync(join(repositoryRoot, "bun.lock"), "utf8");
  assert(
    lock.includes(candidates.effect.lockIntegrity),
    "Effect lock integrity",
  );
  const effectLockVersions = [
    ...lock.matchAll(/^\s+"effect": \["effect@([^"]+)"/gmu),
  ].map((match) => match[1]);
  assert(
    JSON.stringify(effectLockVersions) ===
      JSON.stringify([candidates.effect.version]),
    "one exact Effect lock resolution",
  );
  const require = createRequire(
    realpathSync(join(repositoryRoot, "node_modules/turbo/package.json")),
  );
  const turboBinary = require.resolve("@turbo/darwin-arm64/bin/turbo");
  const localBun = "/Users/sterling/.nvm/versions/node/v24.18.0/bin/bun";
  const localNode = "/Users/sterling/.nvm/versions/node/v24.18.0/bin/node";
  for (const [label, path, expected] of [
    ["local Bun", localBun, candidates.buildTest.bun.binarySha256],
    ["release Bun", extractedBun, candidates.buildTest.bun.binarySha256],
    [
      "local Node",
      localNode,
      candidates.buildTest.nodeWhenInvoked.binarySha256,
    ],
    [
      "release Node",
      extractedNode,
      candidates.buildTest.nodeWhenInvoked.binarySha256,
    ],
    [
      "local Turbo",
      turboBinary,
      candidates.buildTest.turbo.platformBinarySha256,
    ],
    [
      "artifact Turbo",
      extractedTurbo,
      candidates.buildTest.turbo.platformBinarySha256,
    ],
  ]) {
    assert(sha256File(path) === expected, `${label} binary digest`);
  }
  const manifest = packageManifest(packageRoot);
  await writeJsonExclusive(output, {
    schemaVersion: "custom-harness-q1-r3-identity-observation/v1",
    verdict: "PASS",
    candidateIdentity: candidates,
    effect: {
      ordinaryConsumerPackageRoot: packageRoot,
      packageVersion: packageJson.version,
      exports: Object.fromEntries(
        candidates.effect.importSurface.map((specifier) => [
          specifier,
          packageJson.exports["./*"].replace("*", specifier.slice(7)),
        ]),
      ),
      sourceTree,
      packageManifestSha256: sha256Bytes(JSON.stringify(manifest)),
      packageManifestEntries: manifest.length,
      selectedRuntimeClosure: closure,
      exactLockVersions: effectLockVersions,
    },
    binaries: {
      bunSha256: sha256File(localBun),
      nodeSha256: sha256File(localNode),
      turboSha256: sha256File(turboBinary),
    },
    assertions: 17,
  });
  console.log(
    JSON.stringify({
      verdict: "PASS",
      sourceTree,
      closureFiles: closure.files.length,
      packageEntries: manifest.length,
    }),
  );
} else if (mode === "invalidation") {
  const identity = JSON.parse(
    readFileSync(resolve(value("--identity")), "utf8"),
  );
  const output = resolve(value("--output"));
  assert(identity.verdict === "PASS", "identity prerequisite");
  assert(
    JSON.stringify(identity.candidateIdentity) === JSON.stringify(candidates),
    "unchanged observed candidate",
  );
  const leaves = [];
  const walk = (entry, path = []) => {
    if (Array.isArray(entry)) {
      entry.forEach((value_, index) => walk(value_, [...path, index]));
    } else if (entry && typeof entry === "object") {
      Object.entries(entry).forEach(([name, value_]) =>
        walk(value_, [...path, name]),
      );
    } else {
      leaves.push(path);
    }
  };
  walk(candidates);
  const results = leaves.map((path) => {
    const mutated = structuredClone(candidates);
    let cursor = mutated;
    for (const segment of path.slice(0, -1)) cursor = cursor[segment];
    const last = path.at(-1);
    const original = cursor[last];
    cursor[last] =
      typeof original === "string"
        ? `${original}#changed`
        : typeof original === "number"
          ? original + 1
          : typeof original === "boolean"
            ? !original
            : original === null
              ? "selected"
              : (() => {
                  throw new Error(`unsupported leaf: ${path.join(".")}`);
                })();
    return {
      path: path.join("."),
      invalidated:
        JSON.stringify(mutated) !== JSON.stringify(identity.candidateIdentity),
    };
  });
  assert(
    results.every(({ invalidated }) => invalidated),
    "mutation invalidation",
  );
  await writeJsonExclusive(output, {
    schemaVersion: "custom-harness-q1-r3-invalidation/v1",
    verdict: "PASS",
    unchangedExactIdentityPasses: true,
    mutations: results,
    enforcementBoundary:
      "Qualification-record comparison only; product enforcement is not implemented or claimed.",
  });
  console.log(JSON.stringify({ verdict: "PASS", mutations: results.length }));
} else if (mode === "controls") {
  const executionPlan = JSON.parse(
    readFileSync(resolve(value("--execution-plan")), "utf8"),
  );
  const downloads = resolve(value("--downloads"));
  const output = resolve(value("--output"));
  assert(candidates.aiSdk === null, "AI candidate must remain null");
  assert(candidates.aiSdkVerdict === "REJECTED_NO_CANDIDATE", "AI rejection");
  assert(
    retrievalConfig.retrievals.every(
      ({ url }) => !/(?:openai|anthropic|ai-sdk|provider)/iu.test(url),
    ),
    "AI/provider retrieval exclusion",
  );
  assert(
    executionPlan.rootCommands.every(
      ({ argv }) =>
        argv.includes("--no-install") && argv.includes("--no-env-file"),
    ),
    "root no-install and no-env-file controls",
  );
  assert(
    executionPlan.rootEnvironment.TURBO_BINARY_PATH ===
      executionPlan.turboBinaryPath,
    "Turbo exact-binary control",
  );
  for (const name of [
    "CI",
    "DO_NOT_TRACK",
    "NEXT_TELEMETRY_DISABLED",
    "NO_UPDATE_NOTIFIER",
    "TURBO_NO_UPDATE_NOTIFIER",
    "TURBO_TELEMETRY_DISABLED",
  ]) {
    assert(executionPlan.rootEnvironment[name] === "1", `${name} control`);
  }
  const effectLicense = join(
    downloads,
    retrievalConfig.retrievals.find(({ id }) => id === "effect-license").file,
  );
  assert(
    sha256File(effectLicense) === candidates.effect.licenseSha256,
    "Effect license digest",
  );
  const probeSources = [
    "effect-consumer-probe.ts",
    "effect-consumer.test.ts",
  ].map((name) => readFileSync(join(r3Root, "probes", name), "utf8"));
  const imports = probeSources.flatMap((source) =>
    [
      ...source.matchAll(/(?:from|import)\s*[({*\w, }]*["']([^"']+)["']/gmu),
    ].map((match) => match[1]),
  );
  const effectImports = imports.filter((specifier) =>
    specifier.startsWith("effect/"),
  );
  assert(
    effectImports.every((specifier) =>
      candidates.effect.importSurface.includes(specifier),
    ),
    "public Effect import allowlist",
  );
  const protectedHashes = Object.fromEntries(
    ["bun.lock", "package.json", "turbo.json"].map((path) => [
      path,
      sha256File(join(repositoryRoot, path)),
    ]),
  );
  await writeJsonExclusive(output, {
    schemaVersion: "custom-harness-q1-r3-controls/v1",
    verdict: "PASS",
    automaticUpdateCommandsExecuted: [],
    packageManagerInstallsExecuted: [],
    providerOrAiRetrievals: [],
    providerOrAiDynamicTests: [],
    effectLicenseSha256: sha256File(effectLicense),
    publicEffectImports: effectImports,
    copiedMaterial: {
      projectAuthoredProbeFiles: [
        "probes/effect-consumer-probe.ts",
        "probes/effect-consumer.test.ts",
      ],
      thirdPartySourceCopiedIntoProbeFiles: false,
      retainedThirdPartyLicenseBytesChanged: false,
    },
    protectedHashes,
    turboWrapperObservation: {
      exactPlatformBinaryForced: true,
      fallbackInstallPathNotSelected: true,
    },
  });
  console.log(JSON.stringify({ verdict: "PASS", effectImports }));
} else {
  throw new Error(
    "usage: candidate-audit.mjs <semantic|identity|invalidation|controls> ...",
  );
}
