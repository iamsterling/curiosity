import type { EditorDocument } from "../../kernel/index.js";

/** The wire error from `persistence.ts`: a store code plus, on a stale
 *  write, the store's current revision. */
export interface SaveError extends Error {
  code?: string;
  currentRevision?: number;
}

export const isStaleError = (error: unknown): error is SaveError =>
  error instanceof Error && (error as SaveError).code === "DOCUMENT_REVISION_STALE";

/**
 * Saves exactly one snapshot. A stale result is a conflict that requires an
 * explicit coherent reload; replaying local bytes at a disclosed revision
 * would silently overwrite the intervening publication.
 */
export const saveWithStaleRetry = async (
  snapshot: () => { document: EditorDocument; revision: number },
  persist: (expectedRevision: number, document: EditorDocument) => Promise<{ revision: number }>
): Promise<{ revision: number }> => {
  const first = snapshot();
  return persist(first.revision, first.document);
};
