import { NextResponse } from "next/server";

import { dataDirectory, readDocument, writeDocument } from "@crafty/scene-store";

import { errorResponse, parseJsonBody } from "../../../_lib/responses";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ slug: string }> };

export async function GET(_request: Request, { params }: Params): Promise<NextResponse> {
  const { slug } = await params;
  const result = readDocument(dataDirectory(), slug);
  if (!result.ok) return errorResponse(result.error);
  return NextResponse.json(result.value, { headers: { "cache-control": "no-store" } });
}

export async function PUT(request: Request, { params }: Params): Promise<NextResponse> {
  const { slug } = await params;
  const body = await parseJsonBody(request);
  if (!body.ok) return errorResponse(body.error);
  const payload = body.value;
  if (!payload || typeof payload !== "object" || Array.isArray(payload) || !("expectedRevision" in payload) || !("document" in payload)) {
    return errorResponse({ code: "DOCUMENT_INPUT_INVALID", status: 400, message: "Save requires expectedRevision and document." });
  }
  const candidate = payload as { expectedRevision: unknown; document: unknown };
  const result = writeDocument(dataDirectory(), slug, candidate.expectedRevision, candidate.document);
  if (!result.ok) return errorResponse(result.error);
  return NextResponse.json(result.value, { headers: { "cache-control": "no-store" } });
}
