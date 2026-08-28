"use client";

import type { EditorDocument } from "../../kernel/index.js";

/**
 * The HTTP boundary, kept out of component bodies. These call the Next route
 * handlers under `app/api/files/[slug]/`, which are thin adapters over
 * `@crafty/scene-store` — the same module the Server Components read from.
 */

export interface FetchDocumentResult {
  document: EditorDocument;
  revision: number;
  applied: string[];
  converted: boolean;
}

/** The wire error carries the store code plus the details bag; callers detect
 *  a stale write by `error.code === "DOCUMENT_REVISION_STALE"` and read the
 *  store's current revision from `error.currentRevision`. */
export interface RequestError extends Error {
  code?: string;
  currentRevision?: number;
}

interface ApiError {
  error?: { code?: string; message?: string; details?: { currentRevision?: number } };
}

const request = async <T,>(route: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(route, { cache: "no-store", ...init });
  const body = (await response.json()) as T & ApiError;
  if (!response.ok) {
    const error: RequestError = new Error(body.error?.message ?? "Crafty request failed");
    if (body.error?.code !== undefined) error.code = body.error.code;
    if (body.error?.details?.currentRevision !== undefined) error.currentRevision = body.error.details.currentRevision;
    throw error;
  }
  return body;
};

export const fetchDocument = (slug: string): Promise<FetchDocumentResult> =>
  request(`/api/files/${slug}/document`);

export const putDocument = (slug: string, expectedRevision: number, document: EditorDocument): Promise<{ document: EditorDocument; revision: number }> =>
  request(`/api/files/${slug}/document`, {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ expectedRevision, document })
  });

export const postSnapshot = (slug: string): Promise<{ metadata: { sha256: string } }> =>
  request(`/api/files/${slug}/snapshot`, { method: "POST" });
