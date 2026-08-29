import path from "node:path";

import type { UiManifest } from "./ui-format-portable.js";
export * from "./ui-format-portable.js";

/**
 * The `.ui` package envelope: the manifest and the entry markers. This module
 * owns the container shape only — the `crafty.ui-package` gate, the
 * formatVersion gate, the entries-table vocabulary and path containment, and
 * the byte-canonical serializers. The document payload is the kernel's
 * canonical EditorDocument serialization; it is never re-stringified here.
 */

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
