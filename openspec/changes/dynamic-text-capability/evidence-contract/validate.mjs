import { createHash } from "node:crypto";
import evidenceSchema from "./schema-v1.json" with { type: "json" };

export class EvidenceContractError extends Error {
  constructor(code, path) {
    super(`${code}:${path}`);
    this.code = code;
    this.path = path;
  }
}

const fail = (code, path) => {
  throw new EvidenceContractError(code, path);
};

const object = (value, path) => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) fail("EVIDENCE_SCHEMA_TYPE", path);
  return value;
};

const array = (value, path) => {
  if (!Array.isArray(value)) fail("EVIDENCE_SCHEMA_TYPE", path);
  return value;
};

const string = (value, path) => {
  if (typeof value !== "string") fail("EVIDENCE_SCHEMA_TYPE", path);
  return value;
};

const uint = (value, path) => {
  if (!Number.isSafeInteger(value) || value < 0) fail("EVIDENCE_NUMBER_UNSAFE", path);
  return value;
};

const shape = (value, path, required, optional = []) => {
  const record = object(value, path);
  for (const key of required) if (!Object.hasOwn(record, key)) fail("EVIDENCE_SCHEMA_REQUIRED", `${path}.${key}`);
  const allowed = new Set([...required, ...optional]);
  for (const key of Object.keys(record)) if (!allowed.has(key)) fail("EVIDENCE_SCHEMA_FIELD_UNKNOWN", `${path}.${key}`);
  return record;
};

const sha = (value, path) => {
  if (!/^[0-9a-f]{64}$/u.test(string(value, path))) fail("EVIDENCE_SCHEMA_TYPE", path);
};

const f64 = (value, path) => {
  const record = shape(value, path, ["f64"]);
  if (!/^0x[0-9a-f]{16}$/u.test(string(record.f64, `${path}.f64`))) fail("EVIDENCE_FLOAT_ENCODING_INVALID", path);
};

const noNull = (value, path = "$") => {
  if (value === null) fail("EVIDENCE_NULL_FORBIDDEN", path);
  if (Array.isArray(value)) value.forEach((entry, index) => noNull(entry, `${path}[${index}]`));
  else if (typeof value === "object") for (const [key, entry] of Object.entries(value)) noNull(entry, `${path}.${key}`);
};

const noNonScalarUnicode = (value, path = "$") => {
  if (typeof value === "string") {
    for (let index = 0; index < value.length; index += 1) {
      const unit = value.charCodeAt(index);
      if (unit >= 0xd800 && unit <= 0xdbff) {
        const next = value.charCodeAt(index + 1);
        if (!(next >= 0xdc00 && next <= 0xdfff)) fail("EVIDENCE_UNICODE_NON_SCALAR", path);
        index += 1;
      } else if (unit >= 0xdc00 && unit <= 0xdfff) fail("EVIDENCE_UNICODE_NON_SCALAR", path);
    }
  } else if (Array.isArray(value)) value.forEach((entry, index) => noNonScalarUnicode(entry, `${path}[${index}]`));
  else if (typeof value === "object" && value !== null) {
    for (const [key, entry] of Object.entries(value)) {
      noNonScalarUnicode(key, `${path}.<key>`);
      noNonScalarUnicode(entry, `${path}.${key}`);
    }
  }
};

const noBudgetFields = (value, path = "$") => {
  if (Array.isArray(value)) value.forEach((entry, index) => noBudgetFields(entry, `${path}[${index}]`));
  else if (typeof value === "object" && value !== null) {
    for (const [key, entry] of Object.entries(value)) {
      if (/budget|threshold|target|limit/iu.test(key)) fail("EVIDENCE_BUDGET_FIELD_FORBIDDEN", `${path}.${key}`);
      noBudgetFields(entry, `${path}.${key}`);
    }
  }
};

const expectedBoundaries = (text) => {
  const entries = [{ sourceOffset: 0, utf8Byte: 0, utf16CodeUnit: 0, codePoint: 0 }];
  let utf8Byte = 0;
  let utf16CodeUnit = 0;
  let codePoint = 0;
  for (const scalar of text) {
    utf8Byte += Buffer.byteLength(scalar, "utf8");
    utf16CodeUnit += scalar.length;
    codePoint += 1;
    entries.push({ sourceOffset: 0, utf8Byte, utf16CodeUnit, codePoint });
  }
  return entries;
};

const validateBoundaryMaps = (maps, text) => {
  const record = shape(maps, "$.input.boundaryMaps", ["utf8", "utf16", "codePoint"]);
  const specifications = [
    ["utf8", "utf8-byte", "utf8Byte"],
    ["utf16", "utf16-code-unit", "utf16CodeUnit"],
    ["codePoint", "unicode-code-point", "codePoint"],
  ];
  const derivationIds = new Set();
  const expected = expectedBoundaries(text);
  for (const [key, unit, sourceKey] of specifications) {
    const mapPath = `$.input.boundaryMaps.${key}`;
    const map = shape(record[key], mapPath, ["sourceUnit", "derivation", "entries"]);
    if (map.sourceUnit !== unit) fail("EVIDENCE_BOUNDARY_MAP_INCOMPLETE", `${mapPath}.sourceUnit`);
    const derivation = shape(map.derivation, `${mapPath}.derivation`, ["id", "method", "artifactSha256"]);
    string(derivation.id, `${mapPath}.derivation.id`);
    string(derivation.method, `${mapPath}.derivation.method`);
    sha(derivation.artifactSha256, `${mapPath}.derivation.artifactSha256`);
    if (derivationIds.has(derivation.id)) fail("EVIDENCE_BOUNDARY_DERIVATION_NOT_INDEPENDENT", `${mapPath}.derivation.id`);
    derivationIds.add(derivation.id);
    const entryOffsets = new Set();
    for (const [index, entry] of array(map.entries, `${mapPath}.entries`).entries()) {
      const entryPath = `${mapPath}.entries[${index}]`;
      const item = shape(entry, entryPath, ["sourceOffset", "utf8Byte", "utf16CodeUnit", "codePoint"]);
      uint(item.sourceOffset, `${entryPath}.sourceOffset`);
      if (entryOffsets.has(item.sourceOffset)) fail("EVIDENCE_BOUNDARY_ENTRY_DUPLICATE_OFFSET", `${entryPath}.sourceOffset`);
      entryOffsets.add(item.sourceOffset);
    }
    const entries = [...array(map.entries, `${mapPath}.entries`)].sort((left, right) => left.sourceOffset - right.sourceOffset);
    if (entries.length !== expected.length) fail("EVIDENCE_BOUNDARY_MAP_INCOMPLETE", `${mapPath}.entries`);
    entries.forEach((entry, index) => {
      const entryPath = `${mapPath}.entries[${index}]`;
      const item = shape(entry, entryPath, ["sourceOffset", "utf8Byte", "utf16CodeUnit", "codePoint"]);
      for (const field of ["sourceOffset", "utf8Byte", "utf16CodeUnit", "codePoint"]) uint(item[field], `${entryPath}.${field}`);
      const wanted = expected[index];
      if (
        item.sourceOffset !== wanted[sourceKey] ||
        item.utf8Byte !== wanted.utf8Byte ||
        item.utf16CodeUnit !== wanted.utf16CodeUnit ||
        item.codePoint !== wanted.codePoint
      ) fail("EVIDENCE_BOUNDARY_MAP_INCOMPLETE", entryPath);
    });
  }
  return {
    utf8Byte: new Map(expected.map((entry) => [entry.utf8Byte, entry])),
    utf16CodeUnit: new Map(expected.map((entry) => [entry.utf16CodeUnit, entry])),
    codePoint: new Map(expected.map((entry) => [entry.codePoint, entry])),
  };
};

const validateRanges = (ranges, candidate, boundaries) => {
  const allowedUnits = new Set(["utf8-byte", "utf16-code-unit", "unicode-code-point", "candidate-defined"]);
  if (!allowedUnits.has(candidate.nativeRangeUnit)) fail("EVIDENCE_RANGE_UNIT_IMPLICIT", "$.candidate.nativeRangeUnit");
  if (candidate.nativeRangeUnit === "candidate-defined" && !candidate.nativeRangeUnitLabel) {
    fail("EVIDENCE_RANGE_UNIT_IMPLICIT", "$.candidate.nativeRangeUnitLabel");
  }
  for (const [index, value] of array(ranges, "$.outputs.nativeRanges").entries()) {
    const path = `$.outputs.nativeRanges[${index}]`;
    const range = shape(value, path, ["id", "role", "unit", "start", "end", "conversionStatus"], ["convertedStart", "convertedEnd", "lossCode"]);
    if (range.unit !== candidate.nativeRangeUnit) fail("EVIDENCE_RANGE_UNIT_IMPLICIT", `${path}.unit`);
    uint(range.start, `${path}.start`);
    uint(range.end, `${path}.end`);
    if (range.start > range.end) fail("EVIDENCE_RANGE_CONVERSION_INVALID", path);
    if (range.conversionStatus === "exact") {
      if (!range.convertedStart || !range.convertedEnd || range.lossCode) fail("EVIDENCE_RANGE_CONVERSION_INVALID", path);
      const sourceKey = { "utf8-byte": "utf8Byte", "utf16-code-unit": "utf16CodeUnit", "unicode-code-point": "codePoint" }[range.unit];
      if (!sourceKey) fail("EVIDENCE_RANGE_CONVERSION_INVALID", path);
      for (const [name, offset, converted] of [
        ["convertedStart", range.start, range.convertedStart],
        ["convertedEnd", range.end, range.convertedEnd],
      ]) {
        const match = boundaries[sourceKey].get(offset);
        if (!match) fail("EVIDENCE_RANGE_CONVERSION_INVALID", `${path}.${name}`);
        const tuple = shape(converted, `${path}.${name}`, ["utf8Byte", "utf16CodeUnit", "codePoint"]);
        if (["utf8Byte", "utf16CodeUnit", "codePoint"].some((key) => tuple[key] !== match[key])) {
          fail("EVIDENCE_RANGE_CONVERSION_INVALID", `${path}.${name}`);
        }
      }
    } else if (!["lossy", "unmappable"].includes(range.conversionStatus) || !range.lossCode || range.convertedStart || range.convertedEnd) {
      fail("EVIDENCE_RANGE_CONVERSION_INVALID", path);
    }
  }
};

const validateGeometry = (outputs) => {
  if (!Object.hasOwn(outputs, "geometry")) fail("EVIDENCE_GEOMETRY_METADATA_REQUIRED", "$.outputs.geometry");
  const geometry = shape(outputs.geometry, "$.outputs.geometry", ["coordinateSpace", "unit", "axes", "origin"], ["coordinateSpaceLabel", "unitLabel", "originLabel"]);
  const spaces = new Set(["candidate-layout", "candidate-device", "candidate-defined"]);
  const units = new Set(["css-px", "device-px", "font-unit", "candidate-defined"]);
  const origins = new Set(["line-box-origin", "candidate-defined"]);
  if (!spaces.has(geometry.coordinateSpace) || !units.has(geometry.unit) || !origins.has(geometry.origin)) fail("EVIDENCE_GEOMETRY_METADATA_UNKNOWN", "$.outputs.geometry");
  if (geometry.coordinateSpace === "candidate-defined" && !geometry.coordinateSpaceLabel) fail("EVIDENCE_GEOMETRY_METADATA_REQUIRED", "$.outputs.geometry.coordinateSpaceLabel");
  if (geometry.unit === "candidate-defined" && !geometry.unitLabel) fail("EVIDENCE_GEOMETRY_METADATA_REQUIRED", "$.outputs.geometry.unitLabel");
  if (geometry.origin === "candidate-defined" && !geometry.originLabel) fail("EVIDENCE_GEOMETRY_METADATA_REQUIRED", "$.outputs.geometry.originLabel");
  const axes = shape(geometry.axes, "$.outputs.geometry.axes", ["x", "y", "inline", "block"]);
  const x = new Set(["right", "left"]);
  const y = new Set(["down", "up"]);
  const directions = new Set(["x-positive", "x-negative", "y-positive", "y-negative"]);
  if (!x.has(axes.x) || !y.has(axes.y) || !directions.has(axes.inline) || !directions.has(axes.block)) fail("EVIDENCE_GEOMETRY_METADATA_UNKNOWN", "$.outputs.geometry.axes");
  if (axes.inline[0] === axes.block[0]) fail("EVIDENCE_GEOMETRY_METADATA_INCOMPATIBLE", "$.outputs.geometry.axes");
};

const indexById = (items, path, duplicateCode = "EVIDENCE_GRAPH_DUPLICATE_ID") => {
  const result = new Map();
  for (const [index, item] of items.entries()) {
    const id = string(item.id, `${path}[${index}].id`);
    if (result.has(id)) fail(duplicateCode, `${path}[${index}].id`);
    result.set(id, item);
  }
  return result;
};

const indexByField = (items, path, field, code) => {
  const result = new Set();
  for (const [index, item] of items.entries()) {
    const itemPath = `${path}[${index}].${field}`;
    const value = string(object(item, `${path}[${index}]`)[field], itemPath);
    if (result.has(value)) fail(code, itemPath);
    result.add(value);
  }
};

const validateAuxiliaryIdentities = (record) => {
  for (const [fontIndex, font] of array(record.outputs.fonts, "$.outputs.fonts").entries()) {
    indexByField(array(object(font, `$.outputs.fonts[${fontIndex}]`).variations, `$.outputs.fonts[${fontIndex}].variations`), `$.outputs.fonts[${fontIndex}].variations`, "tag", "EVIDENCE_FONT_VARIATION_DUPLICATE_TAG");
  }
  indexByField(array(record.provenance.dependencies, "$.provenance.dependencies"), "$.provenance.dependencies", "purl", "EVIDENCE_PROVENANCE_DEPENDENCY_DUPLICATE_PURL");
  indexById(array(record.provenance.artifacts, "$.provenance.artifacts"), "$.provenance.artifacts", "EVIDENCE_PROVENANCE_ARTIFACT_DUPLICATE_ID");
  if (record.realization) indexById(array(record.realization.artifacts, "$.realization.artifacts"), "$.realization.artifacts", "EVIDENCE_REALIZATION_ARTIFACT_DUPLICATE_ID");
};

const validateGraph = (outputs) => {
  const ranges = array(outputs.nativeRanges, "$.outputs.nativeRanges");
  const clusters = array(outputs.clusters, "$.outputs.clusters");
  const lines = array(outputs.lines, "$.outputs.lines");
  const glyphs = array(outputs.glyphs, "$.outputs.glyphs");
  const fonts = array(outputs.fonts, "$.outputs.fonts");
  const rangeById = indexById(ranges, "$.outputs.nativeRanges");
  const clusterById = indexById(clusters, "$.outputs.clusters");
  const lineById = indexById(lines, "$.outputs.lines");
  const glyphById = indexById(glyphs, "$.outputs.glyphs");
  const fontById = indexById(fonts, "$.outputs.fonts");
  void lineById;
  const clusterLineMembership = new Map();
  const glyphClusterMembership = new Map();
  for (const [index, line] of lines.entries()) {
    const path = `$.outputs.lines[${index}]`;
    const record = shape(line, path, ["id", "index", "rangeId", "clusterIds", "originX", "originY", "inlineExtent", "blockExtent"]);
    if (!rangeById.has(string(record.rangeId, `${path}.rangeId`))) fail("EVIDENCE_GRAPH_RANGE_MISSING", `${path}.rangeId`);
    for (const [memberIndex, clusterId] of array(record.clusterIds, `${path}.clusterIds`).entries()) {
      const memberPath = `${path}.clusterIds[${memberIndex}]`;
      const id = string(clusterId, memberPath);
      if (!clusterById.has(id)) fail("EVIDENCE_GRAPH_LINE_CLUSTER_MISSING", memberPath);
      if (clusterLineMembership.has(id)) fail("EVIDENCE_GRAPH_LINE_CLUSTER_MEMBERSHIP", memberPath);
      clusterLineMembership.set(id, record.id);
    }
  }
  for (const [index, cluster] of clusters.entries()) {
    const path = `$.outputs.clusters[${index}]`;
    const record = shape(cluster, path, ["id", "rangeId", "bidiLevel", "affinities", "glyphIds"]);
    if (!rangeById.has(string(record.rangeId, `${path}.rangeId`))) fail("EVIDENCE_GRAPH_RANGE_MISSING", `${path}.rangeId`);
    if (!clusterLineMembership.has(record.id)) fail("EVIDENCE_GRAPH_LINE_CLUSTER_MEMBERSHIP", `${path}.id`);
    for (const [memberIndex, glyphId] of array(record.glyphIds, `${path}.glyphIds`).entries()) {
      const memberPath = `${path}.glyphIds[${memberIndex}]`;
      const id = string(glyphId, memberPath);
      if (!glyphById.has(id)) fail("EVIDENCE_GRAPH_CLUSTER_GLYPH_MISSING", memberPath);
      if (glyphClusterMembership.has(id)) fail("EVIDENCE_GRAPH_CLUSTER_GLYPH_MEMBERSHIP", memberPath);
      glyphClusterMembership.set(id, record.id);
    }
  }
  for (const [index, glyph] of glyphs.entries()) {
    const path = `$.outputs.glyphs[${index}]`;
    const record = shape(glyph, path, ["id", "candidateGlyphId", "rangeId", "clusterId", "fontId", "x", "y", "advanceX", "advanceY", "flags"]);
    if (!rangeById.has(string(record.rangeId, `${path}.rangeId`))) fail("EVIDENCE_GRAPH_RANGE_MISSING", `${path}.rangeId`);
    if (!clusterById.has(string(record.clusterId, `${path}.clusterId`))) fail("EVIDENCE_GRAPH_GLYPH_CLUSTER_MISSING", `${path}.clusterId`);
    if (!fontById.has(string(record.fontId, `${path}.fontId`))) fail("EVIDENCE_GRAPH_GLYPH_FONT_MISSING", `${path}.fontId`);
    if (glyphClusterMembership.get(record.id) !== record.clusterId) fail("EVIDENCE_GRAPH_CLUSTER_GLYPH_MEMBERSHIP", `${path}.clusterId`);
  }
};

const validateF64Fields = (record) => {
  for (const [index, line] of array(record.outputs.lines, "$.outputs.lines").entries()) {
    for (const key of ["originX", "originY", "inlineExtent", "blockExtent"]) f64(line[key], `$.outputs.lines[${index}].${key}`);
  }
  for (const [index, glyph] of array(record.outputs.glyphs, "$.outputs.glyphs").entries()) {
    for (const key of ["x", "y", "advanceX", "advanceY"]) f64(glyph[key], `$.outputs.glyphs[${index}].${key}`);
  }
  for (const [fontIndex, font] of array(record.outputs.fonts, "$.outputs.fonts").entries()) {
    for (const [variationIndex, variation] of array(font.variations, `$.outputs.fonts[${fontIndex}].variations`).entries()) {
      f64(variation.value, `$.outputs.fonts[${fontIndex}].variations[${variationIndex}].value`);
    }
  }
  for (const [observationIndex, observation] of array(record.observations, "$.observations").entries()) {
    const samples = array(observation.samples, `$.observations[${observationIndex}].samples`);
    if (samples.length < 2) fail("EVIDENCE_SCHEMA_REQUIRED", `$.observations[${observationIndex}].samples`);
    samples.forEach((sample, sampleIndex) => f64(sample, `$.observations[${observationIndex}].samples[${sampleIndex}]`));
  }
};

const validateAgainstSchema = (schema, value, path = "$", root = schema) => {
  if (schema.$ref) {
    const target = schema.$ref
      .slice(2)
      .split("/")
      .reduce((current, key) => current[key], root);
    validateAgainstSchema(target, value, path, root);
    return;
  }
  if (Object.hasOwn(schema, "const") && value !== schema.const) fail("EVIDENCE_SCHEMA_TYPE", path);
  if (schema.enum && !schema.enum.includes(value)) fail("EVIDENCE_SCHEMA_TYPE", path);
  if (schema.type === "object") {
    const record = object(value, path);
    for (const key of schema.required ?? []) if (!Object.hasOwn(record, key)) fail("EVIDENCE_SCHEMA_REQUIRED", `${path}.${key}`);
    for (const [key, entry] of Object.entries(record)) {
      const propertySchema = schema.properties?.[key];
      if (propertySchema) validateAgainstSchema(propertySchema, entry, `${path}.${key}`, root);
      else if (schema.additionalProperties === false) fail("EVIDENCE_SCHEMA_FIELD_UNKNOWN", `${path}.${key}`);
      else if (typeof schema.additionalProperties === "object") validateAgainstSchema(schema.additionalProperties, entry, `${path}.${key}`, root);
    }
    for (const [key, dependencies] of Object.entries(schema.dependentRequired ?? {})) {
      if (Object.hasOwn(record, key)) for (const dependency of dependencies) if (!Object.hasOwn(record, dependency)) fail("EVIDENCE_SCHEMA_REQUIRED", `${path}.${dependency}`);
    }
  } else if (schema.type === "array") {
    const entries = array(value, path);
    if (schema.minItems !== undefined && entries.length < schema.minItems) fail("EVIDENCE_SCHEMA_REQUIRED", path);
    entries.forEach((entry, index) => validateAgainstSchema(schema.items, entry, `${path}[${index}]`, root));
  } else if (schema.type === "string") {
    const text = string(value, path);
    if (schema.minLength !== undefined && text.length < schema.minLength) fail("EVIDENCE_SCHEMA_TYPE", path);
    if (schema.pattern && !new RegExp(schema.pattern, "u").test(text)) fail("EVIDENCE_SCHEMA_TYPE", path);
  } else if (schema.type === "integer") {
    if (!Number.isInteger(value) || value < (schema.minimum ?? -Infinity) || value > (schema.maximum ?? Infinity)) fail("EVIDENCE_NUMBER_UNSAFE", path);
  } else if (schema.type === "boolean" && typeof value !== "boolean") fail("EVIDENCE_SCHEMA_TYPE", path);
};

export const validateEvidenceRecord = (value) => {
  noNull(value);
  noNonScalarUnicode(value);
  noBudgetFields(value);
  const record = shape(value, "$", ["contractVersion", "recordId", "input", "candidate", "outputs", "environment", "provenance", "observations"], ["realization"]);
  if (record.contractVersion !== 1) fail("EVIDENCE_SCHEMA_VERSION_UNSUPPORTED", "$.contractVersion");
  const input = shape(record.input, "$.input", ["corpusFixtureId", "configSha256", "logicalText", "logicalTextSha256", "boundaryMaps"]);
  string(input.logicalText, "$.input.logicalText");
  sha(input.logicalTextSha256, "$.input.logicalTextSha256");
  const actualTextHash = createHash("sha256").update(input.logicalText, "utf8").digest("hex");
  if (actualTextHash !== input.logicalTextSha256) fail("EVIDENCE_INPUT_TEXT_HASH_MISMATCH", "$.input.logicalTextSha256");
  const candidate = shape(record.candidate, "$.candidate", ["id", "version", "adapterSha256", "nativeRangeUnit"], ["nativeRangeUnitLabel"]);
  const outputs = shape(record.outputs, "$.outputs", ["nativeRanges", "clusters", "lines", "glyphs", "fonts", "diagnostics"], ["geometry"]);
  validateGeometry(outputs);
  const boundaries = validateBoundaryMaps(input.boundaryMaps, input.logicalText);
  validateRanges(outputs.nativeRanges, candidate, boundaries);
  validateGraph(outputs);
  shape(record.environment, "$.environment", ["id", "browser", "wasmRuntime", "os", "architecture", "hardware", "gpu", "qualificationSha256"]);
  shape(record.provenance, "$.provenance", ["sourceRevision", "buildCommandSha256", "buildEnvironmentSha256", "dependencies", "artifacts"]);
  validateAuxiliaryIdentities(record);
  array(outputs.clusters, "$.outputs.clusters");
  array(outputs.lines, "$.outputs.lines");
  array(outputs.glyphs, "$.outputs.glyphs");
  array(outputs.fonts, "$.outputs.fonts");
  array(outputs.diagnostics, "$.outputs.diagnostics");
  array(record.observations, "$.observations");
  if (record.realization) {
    const realization = shape(record.realization, "$.realization", ["environmentId", "kind", "artifacts"], ["pixelFormat", "pixelWidth", "pixelHeight"]);
    if (realization.environmentId !== record.environment.id) fail("EVIDENCE_REALIZATION_ENVIRONMENT_MISMATCH", "$.realization.environmentId");
    if (realization.pixelFormat) {
      if (!Object.hasOwn(realization, "pixelWidth") || !Object.hasOwn(realization, "pixelHeight")) fail("EVIDENCE_SCHEMA_REQUIRED", "$.realization.pixelWidth");
      uint(realization.pixelWidth, "$.realization.pixelWidth");
      uint(realization.pixelHeight, "$.realization.pixelHeight");
    }
  }
  validateF64Fields(record);
  validateAgainstSchema(evidenceSchema, record);
  return record;
};

export const parseEvidenceRecord = (source) => {
  try {
    return validateEvidenceRecord(JSON.parse(source));
  } catch (error) {
    if (error instanceof EvidenceContractError) throw error;
    fail("EVIDENCE_JSON_PARSE", "$");
  }
};
