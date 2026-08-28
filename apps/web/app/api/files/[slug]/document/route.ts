import {
  dataDirectory,
  readDocument,
  writeDocument,
} from "@crafty/scene-store";
import { NextResponse } from "next/server";
import { errorResponse, parseJsonBody } from "../../_lib/responses";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
type Params = { readonly params: Promise<{ readonly slug: string }> };

export const GET = async (_request: Request, { params }: Params) => {
  const { slug } = await params;
  const result = readDocument(dataDirectory(), slug);
  if (!result.ok) return errorResponse(result.error);
  return NextResponse.json(result.value, {
    headers: { "cache-control": "no-store" },
  });
};

export const PUT = async (request: Request, { params }: Params) => {
  const { slug } = await params;
  const body = await parseJsonBody(request);
  if (!body.ok) return errorResponse(body.error);
  const payload = body.value;
  if (
    !payload ||
    typeof payload !== "object" ||
    Array.isArray(payload) ||
    !("expectedRevision" in payload) ||
    !("document" in payload)
  )
    return errorResponse({
      code: "DOCUMENT_INPUT_INVALID",
      message: "Save requires expectedRevision and document.",
      status: 400,
    });
  const candidate = payload as {
    readonly document: unknown;
    readonly expectedRevision: unknown;
  };
  const result = writeDocument(
    dataDirectory(),
    slug,
    candidate.expectedRevision,
    candidate.document,
  );
  if (!result.ok) return errorResponse(result.error);
  return NextResponse.json(result.value, {
    headers: { "cache-control": "no-store" },
  });
};
