import { NextResponse } from "next/server";
import { loadDashboardKernel } from "../../../dashboard-kernel";
import { validateDashboardRequest } from "./request";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const failureCode = (error: unknown): string => {
  const message = error instanceof Error ? error.message : "";
  return /^[A-Z][A-Z0-9_:-]{0,127}$/u.test(message)
    ? message
    : "DASHBOARD_TURN_FAILED";
};

export const POST = async (request: Request): Promise<NextResponse> => {
  const validated = await validateDashboardRequest(request);
  if (!validated.ok)
    return NextResponse.json(
      { error: { code: validated.code } },
      { status: validated.status },
    );

  try {
    const { submitDashboardTurn } = await loadDashboardKernel();
    const result = await submitDashboardTurn(validated.input);
    return NextResponse.json(result, {
      headers: { "cache-control": "no-store" },
    });
  } catch (error) {
    const code = failureCode(error);
    const status =
      code.endsWith("_INVALID") ||
      code.endsWith("_UNKNOWN") ||
      code === "PROMPT_COMMAND_UNKNOWN"
        ? 400
        : code === "OPENAI_OAUTH_AUTHENTICATION_REQUIRED"
          ? 401
          : 500;
    return NextResponse.json(
      { error: { code } },
      { status, headers: { "cache-control": "no-store" } },
    );
  }
};
