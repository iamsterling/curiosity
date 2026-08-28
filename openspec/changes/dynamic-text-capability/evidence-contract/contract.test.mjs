import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { canonicalEvidenceSha256, canonicalizeEvidenceRecord } from "./canonicalize.mjs";
import { EvidenceContractError, parseEvidenceRecord, validateEvidenceRecord } from "./validate.mjs";

const directory = path.dirname(fileURLToPath(import.meta.url));
const readJson = async (...parts) => JSON.parse(await readFile(path.join(directory, ...parts), "utf8"));
const expects = (code, mutate) => {
  const record = structuredClone(valid);
  mutate(record);
  assert.throws(() => validateEvidenceRecord(record), (error) => error instanceof EvidenceContractError && error.code === code, code);
};

const valid = await readJson("fixtures", "valid-complete.json");
const withoutGeometry = structuredClone(valid);
delete withoutGeometry.outputs.geometry;
assert.throws(
  () => validateEvidenceRecord(withoutGeometry),
  (error) => error instanceof EvidenceContractError && error.code === "EVIDENCE_GEOMETRY_METADATA_REQUIRED",
  "geometry metadata is mandatory",
);
validateEvidenceRecord(valid);

const reordered = structuredClone(valid);
reordered.outputs.clusters[0].affinities.reverse();
reordered.outputs.glyphs[0].flags.reverse();
reordered.observations[0].samples.reverse();
reordered.input.boundaryMaps.utf8.entries.reverse();
assert.equal(canonicalizeEvidenceRecord(reordered), canonicalizeEvidenceRecord(valid));

const tiedDiagnostics = structuredClone(valid);
tiedDiagnostics.outputs.diagnostics = [
  { code: "candidate.note", severity: "info", stage: "shape", blocking: false, subjectId: "glyph.emoji", data: { value: "b" } },
  { code: "candidate.note", severity: "warning", stage: "shape", blocking: false, subjectId: "glyph.emoji", data: { value: "a" } },
];
const reversedTiedDiagnostics = structuredClone(tiedDiagnostics);
reversedTiedDiagnostics.outputs.diagnostics.reverse();
assert.equal(canonicalizeEvidenceRecord(tiedDiagnostics), canonicalizeEvidenceRecord(reversedTiedDiagnostics));
assert.equal(canonicalEvidenceSha256(tiedDiagnostics), canonicalEvidenceSha256(reversedTiedDiagnostics));

const canonicalHash = canonicalEvidenceSha256(valid);
assert.equal(canonicalHash, "ec8bba71480dae7985ad37f3caa6a13e64b119bd57f5951773771f4960d02db6");

const canonicalVector = await readJson("fixtures", "canonical-contract-vector.json");
const canonicalVectorBytes = await readFile(path.join(directory, "fixtures", "canonical-contract-vector.canonical.json"), "utf8");
const canonicalVectorHash = (await readFile(path.join(directory, "fixtures", "canonical-contract-vector.sha256"), "utf8")).trim();
assert.equal(canonicalizeEvidenceRecord(canonicalVector), canonicalVectorBytes);
assert.equal(canonicalEvidenceSha256(canonicalVector), canonicalVectorHash);

const schema = await readJson("schema-v1.json");
assert.equal(schema.properties.contractVersion.const, 1);
assert.equal(schema.additionalProperties, false);
assert.deepEqual(schema.required, ["contractVersion", "recordId", "input", "candidate", "outputs", "environment", "provenance", "observations"]);
assert.ok(schema.$defs.outputs.required.includes("geometry"));

const expectedCodes = await readJson("fixtures", "invalid", "expected-codes.json");
const invalidNames = (await readdir(path.join(directory, "fixtures", "invalid")))
  .filter((name) => name.endsWith(".json") && name !== "expected-codes.json")
  .sort();
assert.deepEqual(invalidNames, Object.keys(expectedCodes).sort());
for (const name of invalidNames) {
  const source = await readFile(path.join(directory, "fixtures", "invalid", name), "utf8");
  assert.throws(() => parseEvidenceRecord(source), (error) => error instanceof EvidenceContractError && error.code === expectedCodes[name], name);
}

const mutationCases = [
  ["EVIDENCE_INPUT_TEXT_HASH_MISMATCH", (record) => { record.input.logicalTextSha256 = "0".repeat(64); }],
  ["EVIDENCE_BOUNDARY_DERIVATION_NOT_INDEPENDENT", (record) => { record.input.boundaryMaps.utf16.derivation.id = record.input.boundaryMaps.utf8.derivation.id; }],
  ["EVIDENCE_BOUNDARY_MAP_INCOMPLETE", (record) => { record.input.boundaryMaps.codePoint.entries.pop(); }],
  ["EVIDENCE_RANGE_UNIT_IMPLICIT", (record) => { record.outputs.nativeRanges[0].unit = "utf16-code-unit"; }],
  ["EVIDENCE_RANGE_CONVERSION_INVALID", (record) => { record.outputs.nativeRanges[0].convertedEnd.utf16CodeUnit = 2; }],
  ["EVIDENCE_FLOAT_ENCODING_INVALID", (record) => { record.outputs.glyphs[0].x = { f64: "1.0" }; }],
  ["EVIDENCE_REALIZATION_ENVIRONMENT_MISMATCH", (record) => { record.realization.environmentId = "env.other"; }],
  ["EVIDENCE_SCHEMA_FIELD_UNKNOWN", (record) => { record.outputs.glyphs[0].candidatePrivateState = "forbidden"; }],
  ["EVIDENCE_GEOMETRY_METADATA_REQUIRED", (record) => { delete record.outputs.geometry; }],
  ["EVIDENCE_GEOMETRY_METADATA_UNKNOWN", (record) => { record.outputs.geometry.unit = "em"; }],
  ["EVIDENCE_GEOMETRY_METADATA_INCOMPATIBLE", (record) => { record.outputs.geometry.axes.block = "x-negative"; }],
  ["EVIDENCE_GRAPH_DUPLICATE_ID", (record) => { record.outputs.nativeRanges.push(structuredClone(record.outputs.nativeRanges[0])); }],
  ["EVIDENCE_GRAPH_RANGE_MISSING", (record) => { record.outputs.clusters[0].rangeId = "range.none"; }],
  ["EVIDENCE_GRAPH_LINE_CLUSTER_MISSING", (record) => { record.outputs.lines[0].clusterIds = ["cluster.none"]; }],
  ["EVIDENCE_GRAPH_LINE_CLUSTER_MEMBERSHIP", (record) => { record.outputs.lines[0].clusterIds = []; }],
  ["EVIDENCE_GRAPH_CLUSTER_GLYPH_MISSING", (record) => { record.outputs.clusters[0].glyphIds = ["glyph.none"]; }],
  ["EVIDENCE_GRAPH_CLUSTER_GLYPH_MEMBERSHIP", (record) => { record.outputs.clusters[0].glyphIds = []; }],
  ["EVIDENCE_GRAPH_GLYPH_CLUSTER_MISSING", (record) => { record.outputs.glyphs[0].clusterId = "cluster.none"; }],
  ["EVIDENCE_GRAPH_GLYPH_FONT_MISSING", (record) => { record.outputs.glyphs[0].fontId = "font.none"; }],
  ["EVIDENCE_PROVENANCE_ARTIFACT_DUPLICATE_ID", (record) => { record.provenance.artifacts.push(structuredClone(record.provenance.artifacts[0])); }],
  ["EVIDENCE_REALIZATION_ARTIFACT_DUPLICATE_ID", (record) => { record.realization.artifacts.push(structuredClone(record.realization.artifacts[0])); }],
  ["EVIDENCE_UNICODE_NON_SCALAR", (record) => { record.candidate.version = "\ud800"; }],
];
for (const [code, mutate] of mutationCases) expects(code, mutate);

// This deliberately bounded record has only indexed range and graph lookups. Replacing
// either with an array scan makes the guard detect it without a product timing budget.
const indexed = structuredClone(valid);
const count = 2048;
indexed.outputs.nativeRanges = [];
indexed.outputs.clusters = [];
indexed.outputs.lines = [];
indexed.outputs.glyphs = [];
for (let index = 0; index < count; index += 1) {
  const id = String(index);
  indexed.outputs.nativeRanges.push({ ...structuredClone(valid.outputs.nativeRanges[0]), id: `range.${id}` });
  indexed.outputs.clusters.push({ ...structuredClone(valid.outputs.clusters[0]), id: `cluster.${id}`, rangeId: `range.${id}`, glyphIds: [`glyph.${id}`] });
  indexed.outputs.lines.push({ ...structuredClone(valid.outputs.lines[0]), id: `line.${id}`, index, rangeId: `range.${id}`, clusterIds: [`cluster.${id}`] });
  indexed.outputs.glyphs.push({ ...structuredClone(valid.outputs.glyphs[0]), id: `glyph.${id}`, rangeId: `range.${id}`, clusterId: `cluster.${id}` });
}
const originalFind = Array.prototype.find;
Array.prototype.find = () => { throw new Error("range/reference scan is forbidden by the linearity guard"); };
try { validateEvidenceRecord(indexed); } finally { Array.prototype.find = originalFind; }

process.stdout.write(`dynamic-text evidence contract: PASS canonical-sha256=${canonicalHash} invalid=${invalidNames.length + mutationCases.length} linear-records=${count}\n`);
