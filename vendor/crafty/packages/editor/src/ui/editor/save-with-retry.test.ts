import { describe, expect, it, vi } from "vitest";
import type { EditorDocument } from "../../kernel/index.js";
import { isStaleError, saveWithStaleRetry, type SaveError } from "./save-with-retry.js";

const document = { schemaVersion: 3, id: "doc-stub" } as unknown as EditorDocument;

const staleError = (currentRevision?: number): SaveError => {
  const error: SaveError = new Error("The document was changed by another writer.");
  error.code = "DOCUMENT_REVISION_STALE";
  if (currentRevision !== undefined) error.currentRevision = currentRevision;
  return error;
};

describe("saveWithStaleRetry", () => {
  it("persists once with the snapshot revision on the happy path", async () => {
    const persist = vi.fn(async (expected: number) => ({ revision: expected + 1 }));
    const result = await saveWithStaleRetry(() => ({ document, revision: 3 }), persist);
    expect(result).toEqual({ revision: 4 });
    expect(persist).toHaveBeenCalledTimes(1);
    expect(persist).toHaveBeenNthCalledWith(1, 3, document);
  });

  it("refuses a stale write without retrying it at the store's current revision", async () => {
    const persist = vi.fn<(expected: number, doc: EditorDocument) => Promise<{ revision: number }>>();
    persist.mockRejectedValueOnce(staleError(9)).mockResolvedValueOnce({ revision: 10 });
    await expect(saveWithStaleRetry(() => ({ document, revision: 3 }), persist)).rejects.toMatchObject({ code: "DOCUMENT_REVISION_STALE" });
    expect(persist).toHaveBeenCalledTimes(1);
    expect(persist).toHaveBeenNthCalledWith(1, 3, document);
  });

  it("surfaces the stale code when the store sends no currentRevision", async () => {
    const persist = vi.fn(async () => { throw staleError(); });
    try {
      await saveWithStaleRetry(() => ({ document, revision: 3 }), persist);
      expect.unreachable("the stale error should have propagated");
    } catch (error) {
      expect(isStaleError(error)).toBe(true);
      expect((error as SaveError).code).toBe("DOCUMENT_REVISION_STALE");
    }
    expect(persist).toHaveBeenCalledTimes(1);
  });

  it("never retries on a non-stale error", async () => {
    const persist = vi.fn(async () => { throw new Error("boom"); });
    await expect(saveWithStaleRetry(() => ({ document, revision: 3 }), persist)).rejects.toThrow("boom");
    expect(persist).toHaveBeenCalledTimes(1);
  });
});
