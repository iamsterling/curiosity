import path from "node:path";

import { serializeDocument, type EditorDocument } from "@crafty/editor/kernel";

/**
 * The `.ui` package envelope: the manifest and the entry markers. This module
 * owns the container shape only — the `crafty.ui-package` gate, the
 * formatVersion gate, the entries-table vocabulary and path containment, and
 * the byte-canonical serializers. The document payload is the kernel's
 * canonical EditorDocument serialization; it is never re-stringified here.
 */

export const UI_PACKAGE_FORMAT = "crafty.ui-package" as const;
export const UI_DOCUMENT_FORMAT = "crafty.ui-document" as const;
export const UI_FORMAT_VERSION = 1 as const;
export const UI_DOCUMENT_ROLE = "document" as const;

/** formatVersion 1 knows exactly one entry role; anything else is unknown
 *  to this implementation and rejected (I10). */
const KNOWN_ROLES: ReadonlySet<string> = new Set([UI_DOCUMENT_ROLE]);

export interface UiManifest {
  format: typeof UI_PACKAGE_FORMAT;
  formatVersion: typeof UI_FORMAT_VERSION;
  revision: number;
  entries: Record<string, string>;
}

export type UiManifestParseFailure = {
  ok: false;
  code: "UI_PARSE_FAILED" | "UI_FORMAT_MISSING" | "UI_FORMAT_UNSUPPORTED" | "UI_ENTRY_UNSUPPORTED" | "UI_ENTRY_PATH_INVALID";
  message: string;
};

export type UiManifestParseResult = { ok: true; value: UiManifest } | UiManifestParseFailure;

/**
 * An entry path is a relative path that names a file inside the package: not
 * absolute, no empty/`.` path, no `..` segment (split on both separators, so
 * a path cannot smuggle `..` in as a Windows-style separator on a POSIX host).
 */
const isContainedEntryPath = (file: string): boolean => {
  if (file.length === 0 || file === "." || path.isAbsolute(file)) return false;
  const segments = file.split(/[/\\]+/u).filter((segment) => segment.length > 0);
  return !segments.includes("..");
};

const record = (value: unknown): value is Record<string, unknown> => value !== null && typeof value === "object" && !Array.isArray(value);

export const parseUiManifest = (json: string): UiManifestParseResult => {
  let input: unknown;
  try {
    input = JSON.parse(json);
  } catch {
    return { ok: false, code: "UI_PARSE_FAILED", message: "UI_PARSE_FAILED:manifest.ui is not valid JSON" };
  }
  if (!record(input)) return { ok: false, code: "UI_PARSE_FAILED", message: "UI_PARSE_FAILED:manifest.ui must be a JSON object" };
  if (input.format !== UI_PACKAGE_FORMAT) return { ok: false, code: "UI_FORMAT_MISSING", message: "UI_FORMAT_MISSING:a manifest without the crafty.ui-package marker is not a package" };
  // The formatVersion gate runs before any entry parsing: the entry contract,
  // the entry vocabulary and the transaction rules are all defined by it.
  if (input.formatVersion !== UI_FORMAT_VERSION) return { ok: false, code: "UI_FORMAT_UNSUPPORTED", message: `UI_FORMAT_UNSUPPORTED:${String(input.formatVersion)}` };
  if (typeof input.revision !== "number" || !Number.isSafeInteger(input.revision)) return { ok: false, code: "UI_PARSE_FAILED", message: "UI_PARSE_FAILED:manifest.ui revision must be an integer" };
  if (!record(input.entries)) return { ok: false, code: "UI_PARSE_FAILED", message: "UI_PARSE_FAILED:manifest.ui entries must be a map of roles to paths" };
  for (const [role, file] of Object.entries(input.entries)) {
    if (!KNOWN_ROLES.has(role)) return { ok: false, code: "UI_ENTRY_UNSUPPORTED", message: `UI_ENTRY_UNSUPPORTED:${role}` };
    if (typeof file !== "string" || !isContainedEntryPath(file)) return { ok: false, code: "UI_ENTRY_PATH_INVALID", message: `UI_ENTRY_PATH_INVALID:${role}` };
  }
  return {
    ok: true,
    value: { format: UI_PACKAGE_FORMAT, formatVersion: UI_FORMAT_VERSION, revision: input.revision, entries: input.entries as Record<string, string> }
  };
};

/** Canonical serialization: keys sorted recursively. The fixed key order for
 *  the manifest is `entries`, `format`, `formatVersion`, `revision`. */
export const serializeUiManifest = (manifest: UiManifest): string => {
  const canonical = (value: unknown): unknown =>
    Array.isArray(value) ? value.map(canonical) : record(value) ? Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonical(value[key])])) : value;
  return JSON.stringify(canonical(manifest));
};

/**
 * Resolves an entry role to its absolute path inside the package. Throws with
 * `UI_ENTRY_MISSING:<role>` when the manifest does not declare the role and
 * `UI_ENTRY_PATH_INVALID:<role>` when the declared path escapes the package —
 * containment is re-checked here because reads trust no one.
 */
export const entryFile = (packageDir: string, manifest: UiManifest, role: string): string => {
  const file = manifest.entries[role];
  if (file === undefined) throw new Error(`UI_ENTRY_MISSING:${role}`);
  const root = path.resolve(packageDir);
  const resolved = path.resolve(root, file);
  if (resolved !== root && !resolved.startsWith(`${root}${path.sep}`)) throw new Error(`UI_ENTRY_PATH_INVALID:${role}`);
  return resolved;
};

/**
 * The `document.ui` entry bytes. The payload is `serializeDocument`'s output
 * verbatim — never a re-stringified, reordered object — so the top-level keys
 * come out sorted (`document` then `format`) and the payload is byte-identical
 * to a standalone document serialization.
 */
export const serializeDocumentEntry = (document: EditorDocument): string => `{"document":${serializeDocument(document)},"format":"${UI_DOCUMENT_FORMAT}"}`;
