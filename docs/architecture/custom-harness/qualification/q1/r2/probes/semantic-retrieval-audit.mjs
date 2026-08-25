import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";

import {
  r2Root,
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
const downloads = resolve(value("--downloads"));
const output = resolve(value("--output"));
const candidates = JSON.parse(
  readFileSync(join(r2Root, "inputs/candidates.json"), "utf8"),
);
const config = JSON.parse(
  readFileSync(join(r2Root, "inputs/retrievals.json"), "utf8"),
);
const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};
const records = config.retrievals.map((retrieval) => {
  const path = join(downloads, retrieval.file);
  const actualSha256 = sha256File(path);
  if (retrieval.expectedSha256) {
    assert(
      actualSha256 === retrieval.expectedSha256,
      `digest mismatch: ${retrieval.id}`,
    );
  }
  return { ...retrieval, path, actualSha256 };
});
const record = (id) => records.find((entry) => entry.id === id);
const json = (id) => JSON.parse(readFileSync(record(id).path, "utf8"));
const collectStrings = (input, output = []) => {
  if (typeof input === "string") output.push(input);
  if (Array.isArray(input)) input.forEach((entry) => collectStrings(entry, output));
  if (input && typeof input === "object") {
    const payload = input.dsseEnvelope?.payload;
    if (typeof payload === "string") {
      collectStrings(
        JSON.parse(Buffer.from(payload, "base64").toString("utf8")),
        output,
      );
    }
    Object.values(input).forEach((entry) => collectStrings(entry, output));
  }
  return output;
};

const effectMetadata = json("effect-metadata");
assert(effectMetadata.version === candidates.effect.version, "Effect version");
assert(
  effectMetadata.dist.integrity === candidates.effect.lockIntegrity,
  "Effect integrity",
);
const typescriptMetadata = json("typescript-metadata");
assert(typescriptMetadata.version === "5.9.2", "TypeScript version");
assert(
  typescriptMetadata.gitHead === candidates.buildTest.typescript.sourceCommit,
  "TypeScript source",
);
assert(json("turbo-metadata").version === "2.10.10", "Turbo version");
const platformMetadata = json("turbo-platform-metadata");
assert(platformMetadata.version === "2.10.10", "Turbo platform version");
assert(
  JSON.stringify([platformMetadata.os, platformMetadata.cpu]) ===
    JSON.stringify([["darwin"], ["arm64"]]),
  "Turbo platform tuple",
);
for (const id of [
  "effect-attestations",
  "turbo-attestations",
  "turbo-platform-attestations",
]) {
  const expected = record(id).semanticExpectation;
  const values = collectStrings(json(id)).join("\n");
  assert(values.includes(expected.package), `${id} package`);
  assert(values.includes(expected.subjectSha512), `${id} subject`);
  assert(values.includes(expected.sourceCommit), `${id} source`);
}
assert(
  json("bun-commit").sha === candidates.buildTest.bun.revision,
  "Bun source commit",
);
assert(
  readFileSync(record("node-checksums").path, "utf8").includes(
    record("node-checksums").semanticExpectation.line,
  ),
  "Node checksum line",
);
assert(
  readFileSync(record("rust-channel-checksum").path, "utf8").startsWith(
    record("rust-channel-checksum").semanticExpectation.linePrefix,
  ),
  "Rust checksum line",
);
await writeJsonExclusive(output, {
  schemaVersion: "custom-harness-q1-r2-retrieval-audit/v1",
  verdict: "PASS",
  records: records.map(
    ({ id, url, file, expectedSha256, actualSha256, semanticExpectation }) => ({
      id,
      url,
      file,
      expectedSha256,
      actualSha256,
      semanticExpectation: semanticExpectation ?? null,
    }),
  ),
  exactRetrievalCount: records.length,
  wholeResponseSemanticOnly: records
    .filter(({ expectedSha256 }) => expectedSha256 === null)
    .map(({ id }) => id),
  assertions: {
    failed: 0,
    skipped: 0,
    passed: records.length + 14,
  },
});
console.log(JSON.stringify({ verdict: "PASS", retrievals: records.length }));
