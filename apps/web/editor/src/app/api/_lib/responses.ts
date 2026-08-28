import { NextResponse } from "next/server";

import type { SceneStoreError } from "@crafty/scene-store";

/**
 * Shared response shaping for the document route handlers. The store's
 * `SceneStoreError` carries the wire code and status together (400 for
 * invalid input, 404 for missing packages, 409 for stale writes), so no
 * separate code→status table is needed. The wire error shape is
 * `{ error: { code, message, details? } }`, unchanged from the previous
 * bespoke HTTP server so existing clients keep working.
 */

const MAX_BODY_BYTES = 1_048_576;

export const errorResponse = (error: SceneStoreError): NextResponse =>
  NextResponse.json(
    {
      error: {
        code: error.code,
        message: error.message,
        ...(error.diagnostics === undefined && error.currentRevision === undefined
          ? {}
          : { details: { ...(error.diagnostics ? { diagnostics: error.diagnostics } : {}), ...(error.currentRevision === undefined ? {} : { currentRevision: error.currentRevision }) } })
      }
    },
    { status: error.status, headers: { "cache-control": "no-store" } }
  );

export const parseJsonBody = async (request: Request): Promise<{ ok: true; value: unknown } | { ok: false; error: SceneStoreError }> => {
  const raw = await request.text();
  if (Buffer.byteLength(raw) > MAX_BODY_BYTES) {
    return { ok: false, error: { code: "DOCUMENT_INPUT_INVALID", status: 400, message: "The request body is too large." } };
  }
  if (raw.length === 0) return { ok: true, value: {} };
  try {
    return { ok: true, value: JSON.parse(raw) as unknown };
  } catch {
    return { ok: false, error: { code: "DOCUMENT_INPUT_INVALID", status: 400, message: "The request body is not valid JSON." } };
  }
};
