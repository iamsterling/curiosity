import type { SceneStoreError } from "@crafty/scene-store";
import { NextResponse } from "next/server";

const maximumBodyBytes = 1_048_576;

export const errorResponse = (error: SceneStoreError): NextResponse =>
  NextResponse.json(
    {
      error: {
        code: error.code,
        message: error.message,
        ...(error.diagnostics === undefined &&
        error.currentRevision === undefined
          ? {}
          : {
              details: {
                ...(error.diagnostics
                  ? { diagnostics: error.diagnostics }
                  : {}),
                ...(error.currentRevision === undefined
                  ? {}
                  : { currentRevision: error.currentRevision }),
              },
            }),
      },
    },
    { status: error.status, headers: { "cache-control": "no-store" } },
  );

export const parseJsonBody = async (
  request: Request,
): Promise<
  | { readonly ok: true; readonly value: unknown }
  | { readonly error: SceneStoreError; readonly ok: false }
> => {
  const raw = await request.text();
  if (Buffer.byteLength(raw) > maximumBodyBytes)
    return {
      error: {
        code: "DOCUMENT_INPUT_INVALID",
        message: "The request body is too large.",
        status: 400,
      },
      ok: false,
    };
  if (!raw) return { ok: true, value: {} };
  try {
    return { ok: true, value: JSON.parse(raw) as unknown };
  } catch {
    return {
      error: {
        code: "DOCUMENT_INPUT_INVALID",
        message: "The request body is not valid JSON.",
        status: 400,
      },
      ok: false,
    };
  }
};
