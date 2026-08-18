import { createHash } from "node:crypto";

const canonicalize = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, item]) => item !== undefined)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, item]) => [key, canonicalize(item)]),
    );
  }
  return value;
};

export const canonicalJSON = (value: unknown): string => JSON.stringify(canonicalize(value));
export const digestCanonical = (value: unknown): string =>
  `sha256:${createHash("sha256").update(canonicalJSON(value)).digest("hex")}`;
