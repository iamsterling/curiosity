import { NextResponse } from "next/server";

import { dataDirectory, snapshotDocument } from "@crafty/scene-store";

import { errorResponse } from "../../../_lib/responses";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ slug: string }> };

export async function POST(_request: Request, { params }: Params): Promise<NextResponse> {
  const { slug } = await params;
  const result = snapshotDocument(dataDirectory(), slug);
  if (!result.ok) return errorResponse(result.error);
  return NextResponse.json(result.value, { headers: { "cache-control": "no-store" } });
}
