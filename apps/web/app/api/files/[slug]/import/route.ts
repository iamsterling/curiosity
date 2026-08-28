import { dataDirectory, importPen } from "@crafty/scene-store";
import { NextResponse } from "next/server";
import { errorResponse, parseJsonBody } from "../../_lib/responses";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
type Params = { readonly params: Promise<{ readonly slug: string }> };

export const POST = async (request: Request, { params }: Params) => {
  const { slug } = await params;
  const body = await parseJsonBody(request);
  if (!body.ok) return errorResponse(body.error);
  const payload = body.value;
  if (
    !payload ||
    typeof payload !== "object" ||
    Array.isArray(payload) ||
    !("pen" in payload)
  )
    return errorResponse({
      code: "PEN_IMPORT_INVALID",
      message: "Import requires a pen property with the .pen document.",
      status: 400,
    });
  const result = importPen(
    dataDirectory(),
    slug,
    (payload as { readonly pen: unknown }).pen,
  );
  if (!result.ok) return errorResponse(result.error);
  return NextResponse.json(result.value, {
    headers: { "cache-control": "no-store" },
  });
};
