import { NextResponse } from "next/server";
import { loadDashboardKernel } from "../../../dashboard-kernel";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const GET = async (request: Request): Promise<NextResponse> => {
  const threadId =
    new URL(request.url).searchParams.get("threadId") ?? undefined;
  try {
    const { readDashboardSession } = await loadDashboardKernel();
    const session = await readDashboardSession(threadId);
    return NextResponse.json(session, {
      headers: { "cache-control": "no-store" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    const code = /^[A-Z][A-Z0-9_:-]{0,127}$/u.test(message)
      ? message
      : "DASHBOARD_SESSION_UNAVAILABLE";
    return NextResponse.json(
      { error: { code } },
      {
        status: code === "DASHBOARD_THREAD_ID_INVALID" ? 400 : 503,
        headers: { "cache-control": "no-store" },
      },
    );
  }
};
