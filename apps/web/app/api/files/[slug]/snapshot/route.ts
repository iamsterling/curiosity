import { dataDirectory, snapshotDocument } from "@crafty/scene-store";
import { NextResponse } from "next/server";
import { errorResponse } from "../../_lib/responses";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
type Params = { readonly params: Promise<{ readonly slug: string }> };

export const POST = async (_request: Request, { params }: Params) => {
  const { slug } = await params;
  const result = snapshotDocument(dataDirectory(), slug);
  if (!result.ok) return errorResponse(result.error);
  return NextResponse.json(result.value, {
    headers: { "cache-control": "no-store" },
  });
};
