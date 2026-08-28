import { createHash } from "node:crypto";
import { validateEvidenceRecord } from "./validate.mjs";

// Validation rejects non-scalars, so UTF-8 byte order is shared by JS and Rust.
const byteCompare = (left, right) => Buffer.compare(Buffer.from(String(left), "utf8"), Buffer.from(String(right), "utf8"));
const scalarCompare = (left, right) =>
  typeof left === "number" && typeof right === "number" ? left - right : byteCompare(left, right);

const escapeJsonString = (value) => {
  let result = '"';
  for (let index = 0; index < value.length; index += 1) {
    const unit = value.charCodeAt(index);
    if (unit === 0x22) result += '\\"';
    else if (unit === 0x5c) result += "\\\\";
    else if (unit === 0x08) result += "\\b";
    else if (unit === 0x09) result += "\\t";
    else if (unit === 0x0a) result += "\\n";
    else if (unit === 0x0c) result += "\\f";
    else if (unit === 0x0d) result += "\\r";
    else if (unit < 0x20) result += `\\u${unit.toString(16).padStart(4, "0")}`;
    else if (unit >= 0xd800 && unit <= 0xdbff) {
      const next = value.charCodeAt(index + 1);
      if (!(next >= 0xdc00 && next <= 0xdfff)) throw new Error("EVIDENCE_UNICODE_NON_SCALAR");
      result += value[index] + value[index + 1];
      index += 1;
    } else if (unit >= 0xdc00 && unit <= 0xdfff) throw new Error("EVIDENCE_UNICODE_NON_SCALAR");
    else result += value[index];
  }
  return `${result}"`;
};
const canonicalJson = (value, parentKey = "") => {
  if (typeof value === "string") return escapeJsonString(value);
  if (typeof value === "number") {
    if (!Number.isSafeInteger(value)) throw new Error("EVIDENCE_NUMBER_UNSAFE");
    return String(value);
  }
  if (typeof value === "boolean") return value ? "true" : "false";
  if (Array.isArray(value)) {
    const rule = sortRule(parentKey);
    const entries = rule ? [...value].sort(rule) : value;
    return `[${entries.map((entry) => canonicalJson(entry)).join(",")}]`;
  }
  if (typeof value === "object" && value !== null) {
    return `{${Object.keys(value).sort(byteCompare).map((key) => `${escapeJsonString(key)}:${canonicalJson(value[key], key)}`).join(",")}}`;
  }
  throw new Error("EVIDENCE_SCHEMA_TYPE");
};
const tuple = (...keys) => (left, right) => {
  for (const key of keys) {
    const order = scalarCompare(left[key], right[key]);
    if (order !== 0) return order;
  }
  return byteCompare(canonicalJson(left), canonicalJson(right));
};

const sortRule = (key) => {
  if (key === "entries") return tuple("sourceOffset");
  if (["nativeRanges", "clusters", "glyphs", "fonts", "artifacts"].includes(key)) return tuple("id");
  if (key === "lines") return tuple("index", "id");
  if (key === "diagnostics") return tuple("code", "stage", "subjectId");
  if (key === "dependencies") return tuple("purl", "sha256");
  if (key === "observations") return tuple("metric", "unit", "state");
  if (key === "variations") return tuple("tag");
  if (key === "affinities") return tuple("edge", "label");
  if (key === "flags") return (left, right) => byteCompare(left, right);
  if (key === "samples") return (left, right) => byteCompare(left.f64, right.f64);
  return undefined;
};

export const canonicalizeEvidenceRecord = (value) => {
  validateEvidenceRecord(value);
  return `${canonicalJson(value)}\n`;
};

export const canonicalEvidenceSha256 = (value) =>
  createHash("sha256").update(canonicalizeEvidenceRecord(value), "utf8").digest("hex");
