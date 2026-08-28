import { NextResponse } from "next/server";

import { dataDirectory, importPen } from "@crafty/scene-store";

import { errorResponse, parseJsonBody } from "../../../_lib/responses";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ slug: string }> };

export async function POST(request: Request, { params }: Params): Promise<NextResponse> {
  const { slug } = await params;
  const body = await parseJsonBody(request);
  if (!body.ok) return errorResponse(body.error);
  const payload = body.value;
  if (!payload || typeof payload !== "object" || Array.isArray(payload) || !("pen" in payload)) {
    return errorResponse({ code: "PEN_IMPORT_INVALID", status: 400, message: "Import requires a pen property with the .pen document." });
  }
  const result = importPen(dataDirectory(), slug, (payload as { pen: unknown }).pen);
  if (!result.ok) return errorResponse(result.error);
  return NextResponse.json(result.value, { headers: { "cache-control": "no-store" } });
}
