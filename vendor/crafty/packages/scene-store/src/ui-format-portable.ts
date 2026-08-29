import {
  parseDocument,
  serializeDocument,
  type EditorDocument,
  type ValidationDiagnostic,
} from "@crafty/editor/kernel";

export const UI_PACKAGE_FORMAT = "crafty.ui-package" as const;
export const UI_DOCUMENT_FORMAT = "crafty.ui-document" as const;
export const UI_FORMAT_VERSION = 1 as const;
export const UI_DOCUMENT_ROLE = "document" as const;

const KNOWN_ROLES: ReadonlySet<string> = new Set([UI_DOCUMENT_ROLE]);

export interface UiManifest {
  format: typeof UI_PACKAGE_FORMAT;
  formatVersion: typeof UI_FORMAT_VERSION;
  revision: number;
  entries: Record<string, string>;
}

export type UiManifestParseFailure = {
  ok: false;
  code:
    | "UI_PARSE_FAILED"
    | "UI_FORMAT_MISSING"
    | "UI_FORMAT_UNSUPPORTED"
    | "UI_ENTRY_UNSUPPORTED"
    | "UI_ENTRY_PATH_INVALID";
  message: string;
};

export type UiManifestParseResult =
  | { ok: true; value: UiManifest }
  | UiManifestParseFailure;

export type UiDocumentEntryParseResult =
  | { ok: true; document: EditorDocument; applied: string[] }
  | {
      ok: false;
      code:
        | "UI_FORMAT_MISSING"
        | "DOCUMENT_UNSUPPORTED_SCHEMA"
        | "DOCUMENT_INPUT_INVALID";
      diagnostics: ValidationDiagnostic[];
    };

const record = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value);

const isContainedEntryPath = (file: string): boolean => {
  if (
    file.length === 0 ||
    file === "." ||
    /^[/\\]/u.test(file) ||
    /^[a-z]:[/\\]/iu.test(file)
  ) {
    return false;
  }
  const segments = file.split(/[/\\]+/u).filter((segment) => segment.length > 0);
  return !segments.includes("..");
};

export const parseUiManifest = (json: string): UiManifestParseResult => {
  let input: unknown;
  try {
    input = JSON.parse(json) as unknown;
  } catch {
    return {
      ok: false,
      code: "UI_PARSE_FAILED",
      message: "UI_PARSE_FAILED:manifest.ui is not valid JSON",
    };
  }
  if (!record(input)) {
    return {
      ok: false,
      code: "UI_PARSE_FAILED",
      message: "UI_PARSE_FAILED:manifest.ui must be a JSON object",
    };
  }
  if (input.format !== UI_PACKAGE_FORMAT) {
    return {
      ok: false,
      code: "UI_FORMAT_MISSING",
      message:
        "UI_FORMAT_MISSING:a manifest without the crafty.ui-package marker is not a package",
    };
  }
  if (input.formatVersion !== UI_FORMAT_VERSION) {
    return {
      ok: false,
      code: "UI_FORMAT_UNSUPPORTED",
      message: `UI_FORMAT_UNSUPPORTED:${String(input.formatVersion)}`,
    };
  }
  if (
    typeof input.revision !== "number" ||
    !Number.isSafeInteger(input.revision)
  ) {
    return {
      ok: false,
      code: "UI_PARSE_FAILED",
      message: "UI_PARSE_FAILED:manifest.ui revision must be an integer",
    };
  }
  if (!record(input.entries)) {
    return {
      ok: false,
      code: "UI_PARSE_FAILED",
      message: "UI_PARSE_FAILED:manifest.ui entries must be a map of roles to paths",
    };
  }
  for (const [role, file] of Object.entries(input.entries)) {
    if (!KNOWN_ROLES.has(role)) {
      return {
        ok: false,
        code: "UI_ENTRY_UNSUPPORTED",
        message: `UI_ENTRY_UNSUPPORTED:${role}`,
      };
    }
    if (typeof file !== "string" || !isContainedEntryPath(file)) {
      return {
        ok: false,
        code: "UI_ENTRY_PATH_INVALID",
        message: `UI_ENTRY_PATH_INVALID:${role}`,
      };
    }
  }
  return {
    ok: true,
    value: {
      format: UI_PACKAGE_FORMAT,
      formatVersion: UI_FORMAT_VERSION,
      revision: input.revision,
      entries: input.entries as Record<string, string>,
    },
  };
};

export const parseDocumentEntry = (
  json: string,
): UiDocumentEntryParseResult => {
  let envelope: unknown;
  try {
    envelope = JSON.parse(json) as unknown;
  } catch {
    return { ok: false, code: "UI_FORMAT_MISSING", diagnostics: [] };
  }
  if (!record(envelope) || envelope.format !== UI_DOCUMENT_FORMAT) {
    return { ok: false, code: "UI_FORMAT_MISSING", diagnostics: [] };
  }
  const parsed = parseDocument(JSON.stringify(envelope.document) ?? "");
  if (!parsed.ok || !parsed.document) {
    return {
      ok: false,
      code: parsed.diagnostics.some(
        (diagnostic) => diagnostic.code === "DOCUMENT_UNSUPPORTED_SCHEMA",
      )
        ? "DOCUMENT_UNSUPPORTED_SCHEMA"
        : "DOCUMENT_INPUT_INVALID",
      diagnostics: parsed.diagnostics,
    };
  }
  return {
    ok: true,
    document: parsed.document,
    applied: parsed.applied,
  };
};

const canonical = (value: unknown): unknown =>
  Array.isArray(value)
    ? value.map(canonical)
    : record(value)
      ? Object.fromEntries(
          Object.keys(value)
            .sort()
            .map((key) => [key, canonical(value[key])]),
        )
      : value;

export const serializeUiManifest = (manifest: UiManifest): string =>
  JSON.stringify(canonical(manifest));

export const serializeDocumentEntry = (document: EditorDocument): string =>
  `{"document":${serializeDocument(document)},"format":"${UI_DOCUMENT_FORMAT}"}`;

export const serializeUiPackageRevision = (
  document: EditorDocument,
  revision: number,
): { documentEntry: string; documentPath: string; manifest: string } => {
  if (!Number.isSafeInteger(revision) || revision < 1) {
    throw new Error("UI_REVISION_INVALID");
  }
  const documentPath = `document-${revision}.ui`;
  return {
    documentEntry: serializeDocumentEntry(document),
    documentPath,
    manifest: serializeUiManifest({
      entries: { [UI_DOCUMENT_ROLE]: documentPath },
      format: UI_PACKAGE_FORMAT,
      formatVersion: UI_FORMAT_VERSION,
      revision,
    }),
  };
};
