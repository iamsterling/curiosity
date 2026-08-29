import { utf8ByteLength } from "./canonical-json.js";
import { PortableAuthorityError } from "./domain.js";
import type { ActionGrant } from "./action-grant.js";

export const nativeDocumentRootId = "app-documents-v1";
export const nativeDocumentToolVersion = "1";

export type DocumentToolInput =
  | {
      readonly maxResults: number;
      readonly rootId: typeof nativeDocumentRootId;
    }
  | {
      readonly documentId: string;
      readonly maxBytes: number;
      readonly rootId: typeof nativeDocumentRootId;
    }
  | {
      readonly maxBytesPerFile: number;
      readonly maxFiles: number;
      readonly maxResults: number;
      readonly query: string;
      readonly rootId: typeof nativeDocumentRootId;
    };

export interface DocumentDescriptor {
  readonly byteCount: number;
  readonly documentId: string;
  readonly modifiedAt?: string;
  readonly name: string;
}

export interface DocumentMatch {
  readonly documentId: string;
  readonly excerpt: string;
  readonly line: number;
}

export type DocumentToolOutput =
  | {
      readonly documents: readonly DocumentDescriptor[];
      readonly kind: "list";
      readonly provenance: "untrusted-evidence";
      readonly rootId: typeof nativeDocumentRootId;
      readonly truncated: boolean;
    }
  | {
      readonly byteCount: number;
      readonly content: string;
      readonly contentDigest: string;
      readonly documentId: string;
      readonly kind: "read";
      readonly provenance: "untrusted-evidence";
      readonly rootId: typeof nativeDocumentRootId;
    }
  | {
      readonly filesScanned: number;
      readonly kind: "search";
      readonly matches: readonly DocumentMatch[];
      readonly provenance: "untrusted-evidence";
      readonly rootId: typeof nativeDocumentRootId;
      readonly truncated: boolean;
    };

export interface DocumentToolReceipt {
  readonly actionId: string;
  readonly attemptId: string;
  readonly callId: string;
  readonly generation: number;
  readonly grantId: string;
  readonly inputDigest: string;
  readonly output: DocumentToolOutput;
  readonly toolId: string;
  readonly toolVersion: typeof nativeDocumentToolVersion;
}

export interface DocumentToolRequest {
  readonly grant: ActionGrant;
  readonly input: DocumentToolInput;
  readonly signal: AbortSignal;
}

export interface DocumentToolPort {
  readonly execute: (
    request: DocumentToolRequest,
  ) => Promise<DocumentToolReceipt>;
}

const digestPattern = /^[a-f0-9]{64}$/u;
const timestampPattern =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/u;

const record = (value: unknown): Record<string, unknown> | undefined =>
  value &&
  typeof value === "object" &&
  !Array.isArray(value) &&
  Object.getPrototypeOf(value) === Object.prototype
    ? (value as Record<string, unknown>)
    : undefined;

const exactKeys = (
  value: Record<string, unknown>,
  required: readonly string[],
  optional: readonly string[] = [],
): boolean => {
  const keys = Object.keys(value);
  return (
    required.every((key) => keys.includes(key)) &&
    keys.every((key) => required.includes(key) || optional.includes(key))
  );
};

const integer = (value: unknown, minimum: number, maximum: number): value is number =>
  Number.isSafeInteger(value) &&
  (value as number) >= minimum &&
  (value as number) <= maximum;

const documentId = (value: unknown): value is string => {
  if (
    typeof value !== "string" ||
    !value ||
    utf8ByteLength(value) > 512 ||
    value.startsWith("/") ||
    value.includes("\\") ||
    value.includes("\0")
  )
    return false;
  return value
    .split("/")
    .every((component) => component && component !== "." && component !== "..");
};

const inputFailure = (): never => {
  throw new PortableAuthorityError("NATIVE_DOCUMENT_INPUT_INVALID");
};

export const decodeDocumentToolInput = (
  toolId: string,
  value: unknown,
  resource: string,
): DocumentToolInput => {
  const input = record(value);
  if (!input || input.rootId !== nativeDocumentRootId) return inputFailure();
  if (toolId === "document.list") {
    if (
      !exactKeys(input, ["maxResults", "rootId"]) ||
      resource !== `documents:${nativeDocumentRootId}` ||
      !integer(input.maxResults, 1, 128)
    )
      return inputFailure();
    return Object.freeze({
      maxResults: input.maxResults,
      rootId: nativeDocumentRootId,
    });
  }
  if (toolId === "document.read") {
    if (
      !exactKeys(input, ["documentId", "maxBytes", "rootId"]) ||
      !documentId(input.documentId) ||
      resource !== `document:${input.documentId}` ||
      !integer(input.maxBytes, 1, 262_144)
    )
      return inputFailure();
    return Object.freeze({
      documentId: input.documentId,
      maxBytes: input.maxBytes,
      rootId: nativeDocumentRootId,
    });
  }
  if (toolId === "document.search") {
    if (
      !exactKeys(input, [
        "maxBytesPerFile",
        "maxFiles",
        "maxResults",
        "query",
        "rootId",
      ]) ||
      resource !== `documents:${nativeDocumentRootId}` ||
      typeof input.query !== "string" ||
      !input.query.trim() ||
      utf8ByteLength(input.query) > 256 ||
      !integer(input.maxResults, 1, 64) ||
      !integer(input.maxFiles, 1, 128) ||
      !integer(input.maxBytesPerFile, 1, 131_072)
    )
      return inputFailure();
    return Object.freeze({
      maxBytesPerFile: input.maxBytesPerFile,
      maxFiles: input.maxFiles,
      maxResults: input.maxResults,
      query: input.query,
      rootId: nativeDocumentRootId,
    });
  }
  return inputFailure();
};

const descriptor = (value: unknown): DocumentDescriptor => {
  const item = record(value);
  if (
    !item ||
    !exactKeys(item, ["byteCount", "documentId", "name"], ["modifiedAt"]) ||
    !integer(item.byteCount, 0, Number.MAX_SAFE_INTEGER) ||
    !documentId(item.documentId) ||
    typeof item.name !== "string" ||
    !item.name ||
    utf8ByteLength(item.name) > 512 ||
    (item.modifiedAt !== undefined &&
      (typeof item.modifiedAt !== "string" ||
        !timestampPattern.test(item.modifiedAt) ||
        !Number.isFinite(Date.parse(item.modifiedAt))))
  )
    throw new PortableAuthorityError("NATIVE_DOCUMENT_RESULT_INVALID");
  return Object.freeze({
    byteCount: item.byteCount,
    documentId: item.documentId,
    ...(item.modifiedAt === undefined ? {} : { modifiedAt: item.modifiedAt }),
    name: item.name,
  }) as DocumentDescriptor;
};

const match = (value: unknown): DocumentMatch => {
  const item = record(value);
  if (
    !item ||
    !exactKeys(item, ["documentId", "excerpt", "line"]) ||
    !documentId(item.documentId) ||
    typeof item.excerpt !== "string" ||
    utf8ByteLength(item.excerpt) > 2_048 ||
    !integer(item.line, 1, Number.MAX_SAFE_INTEGER)
  )
    throw new PortableAuthorityError("NATIVE_DOCUMENT_RESULT_INVALID");
  return Object.freeze({
    documentId: item.documentId,
    excerpt: item.excerpt,
    line: item.line,
  });
};

export const decodeDocumentToolOutput = (
  value: unknown,
): DocumentToolOutput => {
  const output = record(value);
  if (
    !output ||
    output.rootId !== nativeDocumentRootId ||
    output.provenance !== "untrusted-evidence"
  )
    throw new PortableAuthorityError("NATIVE_DOCUMENT_RESULT_INVALID");
  if (output.kind === "list") {
    if (
      !exactKeys(output, [
        "documents",
        "kind",
        "provenance",
        "rootId",
        "truncated",
      ]) ||
      !Array.isArray(output.documents) ||
      output.documents.length > 128 ||
      typeof output.truncated !== "boolean"
    )
      throw new PortableAuthorityError("NATIVE_DOCUMENT_RESULT_INVALID");
    return Object.freeze({
      documents: Object.freeze(output.documents.map(descriptor)),
      kind: "list",
      provenance: "untrusted-evidence",
      rootId: nativeDocumentRootId,
      truncated: output.truncated,
    });
  }
  if (output.kind === "read") {
    if (
      !exactKeys(output, [
        "byteCount",
        "content",
        "contentDigest",
        "documentId",
        "kind",
        "provenance",
        "rootId",
      ]) ||
      typeof output.content !== "string" ||
      utf8ByteLength(output.content) > 262_144 ||
      output.byteCount !== utf8ByteLength(output.content) ||
      typeof output.contentDigest !== "string" ||
      !digestPattern.test(output.contentDigest) ||
      !documentId(output.documentId)
    )
      throw new PortableAuthorityError("NATIVE_DOCUMENT_RESULT_INVALID");
    return Object.freeze({
      byteCount: output.byteCount,
      content: output.content,
      contentDigest: output.contentDigest,
      documentId: output.documentId,
      kind: "read",
      provenance: "untrusted-evidence",
      rootId: nativeDocumentRootId,
    });
  }
  if (output.kind === "search") {
    if (
      !exactKeys(output, [
        "filesScanned",
        "kind",
        "matches",
        "provenance",
        "rootId",
        "truncated",
      ]) ||
      !integer(output.filesScanned, 0, 128) ||
      !Array.isArray(output.matches) ||
      output.matches.length > 64 ||
      typeof output.truncated !== "boolean"
    )
      throw new PortableAuthorityError("NATIVE_DOCUMENT_RESULT_INVALID");
    return Object.freeze({
      filesScanned: output.filesScanned,
      kind: "search",
      matches: Object.freeze(output.matches.map(match)),
      provenance: "untrusted-evidence",
      rootId: nativeDocumentRootId,
      truncated: output.truncated,
    });
  }
  throw new PortableAuthorityError("NATIVE_DOCUMENT_RESULT_INVALID");
};
