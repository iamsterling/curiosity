import { afterEach, describe, expect, it, vi } from "vitest";
import type { EditorDocument } from "../../kernel/index.js";
import { fetchDocument, postSnapshot, putDocument, type RequestError } from "./persistence.js";

const document = { schemaVersion: 3, id: "doc-stub" } as unknown as EditorDocument;

const stubFetch = (body: unknown, ok: boolean, status: number) => {
  const fetchMock = vi.fn().mockResolvedValue({ ok, status, json: async () => body });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
};

afterEach(() => { vi.unstubAllGlobals(); });

describe("persistence HTTP boundary", () => {
  it("putDocument PUTs the expected revision and document to the document route", async () => {
    const fetchMock = stubFetch({ document, revision: 2 }, true, 200);
    const result = await putDocument("proj", 1, document);
    expect(result.revision).toBe(2);
    expect(fetchMock).toHaveBeenCalledWith("/api/files/proj/document", expect.objectContaining({ cache: "no-store", method: "PUT" }));
    const init = fetchMock.mock.calls[0]?.[1] as RequestInit;
    expect(JSON.parse(init.body as string)).toEqual({ expectedRevision: 1, document });
  });

  it("fetchDocument GETs the document with the migration record", async () => {
    const fetchMock = stubFetch({ document, revision: 5, applied: ["v1-to-v2"], converted: true }, true, 200);
    const result = await fetchDocument("proj");
    expect(result).toEqual({ document, revision: 5, applied: ["v1-to-v2"], converted: true });
    expect(fetchMock).toHaveBeenCalledWith("/api/files/proj/document", expect.objectContaining({ cache: "no-store" }));
  });

  it("postSnapshot POSTs to the snapshot route with no body", async () => {
    const fetchMock = stubFetch({ metadata: { sha256: "abc" } }, true, 200);
    const result = await postSnapshot("proj");
    expect(result.metadata.sha256).toBe("abc");
    expect(fetchMock).toHaveBeenCalledWith("/api/files/proj/snapshot", expect.objectContaining({ method: "POST" }));
    const init = fetchMock.mock.calls[0]?.[1] as RequestInit;
    expect(init.body).toBeUndefined();
  });

  it("attaches the store code and currentRevision to a stale error", async () => {
    stubFetch({ error: { code: "DOCUMENT_REVISION_STALE", message: "The document was changed by another writer.", details: { currentRevision: 7 } } }, false, 409);
    try {
      await putDocument("proj", 1, document);
      expect.unreachable("the stale error should have thrown");
    } catch (error) {
      expect((error as RequestError).code).toBe("DOCUMENT_REVISION_STALE");
      expect((error as RequestError).currentRevision).toBe(7);
      expect((error as Error).message).toBe("The document was changed by another writer.");
    }
  });

  it("attaches the code without currentRevision for other errors", async () => {
    stubFetch({ error: { code: "DOCUMENT_INPUT_INVALID", message: "Save requires expectedRevision and document." } }, false, 400);
    try {
      await putDocument("proj", 1, document);
      expect.unreachable("the invalid-input error should have thrown");
    } catch (error) {
      expect((error as RequestError).code).toBe("DOCUMENT_INPUT_INVALID");
      expect((error as RequestError).currentRevision).toBeUndefined();
    }
  });
});
