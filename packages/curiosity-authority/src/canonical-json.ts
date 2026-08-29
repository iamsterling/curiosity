import { PortableAuthorityError } from "./domain.js";

const canonicalObject = (value: Record<string, unknown>): string => {
  const entries = Object.keys(value)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`);
  return `{${entries.join(",")}}`;
};

export const canonicalJson = (value: unknown): string => {
  if (value === null || typeof value === "string" || typeof value === "boolean")
    return JSON.stringify(value);
  if (typeof value === "number" && Number.isFinite(value))
    return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (
    typeof value === "object" &&
    Object.getPrototypeOf(value) === Object.prototype
  )
    return canonicalObject(value as Record<string, unknown>);
  throw new PortableAuthorityError("COMMAND_JSON_CANONICALIZATION_FAILED");
};

const encoder = new TextEncoder();

export const utf8ByteLength = (value: string): number =>
  encoder.encode(value).byteLength;
