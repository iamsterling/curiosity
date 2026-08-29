import { describe, expect, test } from "bun:test";
import {
  decodeDocumentToolInput,
  decodeDocumentToolOutput,
  nativeDocumentRootId,
} from "../src/index.js";

describe("governed native document tools", () => {
  test("accepts only exact bounded inputs tied to the granted resource", () => {
    expect(
      decodeDocumentToolInput(
        "document.read",
        {
          documentId: "notes/one.txt",
          maxBytes: 1024,
          rootId: nativeDocumentRootId,
        },
        "document:notes/one.txt",
      ),
    ).toEqual({
      documentId: "notes/one.txt",
      maxBytes: 1024,
      rootId: nativeDocumentRootId,
    });
    for (const value of [
      { documentId: "../secret", maxBytes: 1, rootId: nativeDocumentRootId },
      { documentId: "/secret", maxBytes: 1, rootId: nativeDocumentRootId },
      { documentId: "secret", maxBytes: 0, rootId: nativeDocumentRootId },
      {
        documentId: "secret",
        extra: true,
        maxBytes: 1,
        rootId: nativeDocumentRootId,
      },
    ])
      expect(() =>
        decodeDocumentToolInput("document.read", value, "document:secret"),
      ).toThrow("NATIVE_DOCUMENT_INPUT_INVALID");
  });

  test("labels bounded tool output as untrusted evidence", () => {
    const output = decodeDocumentToolOutput({
      byteCount: 5,
      content: "hello",
      contentDigest: "1".repeat(64),
      documentId: "notes/one.txt",
      kind: "read",
      provenance: "untrusted-evidence",
      rootId: nativeDocumentRootId,
    });
    expect(output.kind).toBe("read");
    expect(output.provenance).toBe("untrusted-evidence");
    expect(() =>
      decodeDocumentToolOutput({ ...output, provenance: "trusted" }),
    ).toThrow("NATIVE_DOCUMENT_RESULT_INVALID");
    expect(() =>
      decodeDocumentToolOutput({ ...output, byteCount: 6 }),
    ).toThrow("NATIVE_DOCUMENT_RESULT_INVALID");
  });
});
