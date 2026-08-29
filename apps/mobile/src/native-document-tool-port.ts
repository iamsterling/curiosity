import {
  canonicalJson,
  createToolRequestDigest,
  decodeDocumentToolInput,
  decodeDocumentToolOutput,
  nativeDocumentToolVersion,
  PortableAuthorityError,
  verifyActionGrant,
  type DocumentToolPort,
  type DocumentToolReceipt,
  type DocumentToolRequest,
  type Sha256,
} from "@curiosity/authority";
import type {
  NativeDocumentToolReceipt,
  NativeDocumentToolRequest,
} from "../modules/curiosity-runtime/src/CuriosityRuntime.types";

export interface NativeDocumentToolModule {
  cancelDocumentTool(callId: string): Promise<void>;
  executeDocumentTool(
    request: NativeDocumentToolRequest,
  ): Promise<NativeDocumentToolReceipt>;
}

const nativeCodes = new Set([
  "ACTION_CANCELLED",
  "ACTION_GRANT_INVALID",
  "ACTION_GRANT_STALE",
  "NATIVE_AGENT_RECORD_NOT_FOUND",
  "NATIVE_AGENT_REVISION_FENCED",
  "NATIVE_DOCUMENT_INPUT_INVALID",
  "NATIVE_DOCUMENT_NOT_FOUND",
  "NATIVE_DOCUMENT_NOT_UTF8",
  "NATIVE_DOCUMENT_PATH_UNSAFE",
  "NATIVE_DOCUMENT_READ_FAILED",
  "NATIVE_DOCUMENT_ROOT_MISMATCH",
  "NATIVE_DOCUMENT_TOO_LARGE",
  "NATIVE_JOURNAL_ABI_UNSUPPORTED",
  "NATIVE_JOURNAL_STORAGE_UNAVAILABLE",
  "NATIVE_JOURNAL_TRANSACTION_FAILED",
  "NATIVE_TOOL_DISPATCH_DENIED",
  "NATIVE_TOOL_DISPATCH_REPLAY",
]);

const nativeCode = (error: unknown): string => {
  if (error && typeof error === "object") {
    const value = (error as { readonly code?: unknown }).code;
    if (typeof value === "string" && nativeCodes.has(value)) return value;
  }
  if (error instanceof Error && nativeCodes.has(error.message))
    return error.message;
  return "NATIVE_DOCUMENT_READ_FAILED";
};

const record = (value: unknown): Record<string, unknown> => {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new PortableAuthorityError("NATIVE_DOCUMENT_RESULT_INVALID");
  return value as Record<string, unknown>;
};

const exactKeys = (
  value: Record<string, unknown>,
  keys: readonly string[],
): boolean =>
  Object.keys(value).sort().join("\u0000") === [...keys].sort().join("\u0000");

const validateReceipt = async (
  value: unknown,
  request: DocumentToolRequest,
  sha256: Sha256,
): Promise<DocumentToolReceipt> => {
  const receipt = record(value);
  if (
    !exactKeys(receipt, [
      "actionId",
      "attemptId",
      "callId",
      "generation",
      "grantId",
      "inputDigest",
      "output",
      "toolId",
      "toolVersion",
    ]) ||
    receipt.actionId !== request.grant.actionId ||
    receipt.attemptId !== request.grant.attemptId ||
    receipt.callId !== request.grant.callId ||
    receipt.generation !== request.grant.generation ||
    receipt.grantId !== request.grant.grantId ||
    receipt.inputDigest !== request.grant.inputDigest ||
    receipt.toolId !== request.grant.toolId ||
    receipt.toolVersion !== request.grant.toolVersion
  )
    throw new PortableAuthorityError("NATIVE_DOCUMENT_RESULT_STALE");
  const output = decodeDocumentToolOutput(receipt.output);
  if ("documentId" in request.input) {
    if (
      output.kind !== "read" ||
      output.documentId !== request.input.documentId ||
      output.byteCount > request.input.maxBytes ||
      (await sha256(output.content)) !== output.contentDigest
    )
      throw new PortableAuthorityError("NATIVE_DOCUMENT_RESULT_INVALID");
  } else if ("query" in request.input) {
    if (
      output.kind !== "search" ||
      output.matches.length > request.input.maxResults ||
      output.filesScanned > request.input.maxFiles
    )
      throw new PortableAuthorityError("NATIVE_DOCUMENT_RESULT_INVALID");
  } else if (
    output.kind !== "list" ||
    output.documents.length > request.input.maxResults
  ) {
    throw new PortableAuthorityError("NATIVE_DOCUMENT_RESULT_INVALID");
  }
  return Object.freeze({
    actionId: receipt.actionId as string,
    attemptId: receipt.attemptId as string,
    callId: receipt.callId as string,
    generation: receipt.generation as number,
    grantId: receipt.grantId as string,
    inputDigest: receipt.inputDigest as string,
    output,
    toolId: receipt.toolId as string,
    toolVersion: nativeDocumentToolVersion,
  });
};

export const createNativeDocumentTool = (
  native: NativeDocumentToolModule,
  sha256: Sha256,
  now: () => number,
): DocumentToolPort => ({
  execute: async (request) => {
    if (request.signal.aborted)
      throw new PortableAuthorityError("ACTION_CANCELLED");
    const grant = await verifyActionGrant(request.grant, sha256, now());
    if (request.signal.aborted)
      throw new PortableAuthorityError("ACTION_CANCELLED");
    if (
      grant.toolVersion !== nativeDocumentToolVersion ||
      grant.requestedCapabilities.length !== 1 ||
      grant.requestedCapabilities[0] !== "documents.read"
    )
      throw new PortableAuthorityError("ACTION_GRANT_INVALID");
    const input = decodeDocumentToolInput(
      grant.toolId,
      request.input,
      grant.resource,
    );
    const inputDigest = await sha256(canonicalJson(input));
    const requestDigest = await createToolRequestDigest(
      grant.toolId,
      grant.toolVersion,
      input,
      sha256,
    );
    if (request.signal.aborted)
      throw new PortableAuthorityError("ACTION_CANCELLED");
    if (
      inputDigest !== grant.inputDigest ||
      requestDigest !== grant.requestDigest
    )
      throw new PortableAuthorityError("ACTION_GRANT_INVALID");
    const normalizedRequest: DocumentToolRequest = {
      grant,
      input,
      signal: request.signal,
    };
    const cancel = () => {
      void native.cancelDocumentTool(grant.callId);
    };
    request.signal.addEventListener("abort", cancel, { once: true });
    try {
      const result = await native.executeDocumentTool({
        grant,
        inputJSON: canonicalJson(input),
      });
      if (request.signal.aborted)
        throw new PortableAuthorityError("ACTION_CANCELLED");
      return await validateReceipt(result, normalizedRequest, sha256);
    } catch (error) {
      if (request.signal.aborted)
        throw new PortableAuthorityError("ACTION_CANCELLED");
      if (error instanceof PortableAuthorityError) throw error;
      throw new PortableAuthorityError(nativeCode(error));
    } finally {
      request.signal.removeEventListener("abort", cancel);
    }
  },
});
