import { Buffer } from "node:buffer";

export const archiveInventoryOrderRule =
  "v1: ascending unsigned UTF-8 bytes of the normalized repository-relative path; equal path bytes compare equal";

export const compareArchiveInventoryPaths = (left, right) =>
  Buffer.compare(Buffer.from(left, "utf8"), Buffer.from(right, "utf8"));

export const orderArchiveInventoryRows = (rows) =>
  [...rows].sort((left, right) =>
    compareArchiveInventoryPaths(left.path, right.path),
  );

export const renderArchiveInventory = (rows) =>
  `${orderArchiveInventoryRows(rows)
    .map(
      ({ path, mode, size, sha256 }) => `${path}\t${mode}\t${size}\t${sha256}`,
    )
    .join("\n")}\n`;

export const adversarialArchiveInventoryPaths = Object.freeze([
  "z",
  "é",
  "a/b",
  "A",
  "a_b",
  "中",
  "!",
  "a.b",
  "Ω",
  "a-b",
  "e\u0301",
  "~",
  "ß",
  "[",
  "0",
  "a",
  "Z",
  "{",
]);

if (import.meta.main && process.argv.includes("--emit-adversarial-order"))
  process.stdout.write(
    `${[...adversarialArchiveInventoryPaths].sort(compareArchiveInventoryPaths).join("\n")}\n`,
  );
