const maximumBodyBytes = 68 * 1_024;
const allowedKeys = new Set(["agentId", "text", "threadId"]);

export interface DashboardChatInput {
  readonly agentId?: string;
  readonly text: string;
  readonly threadId?: string;
}

export type DashboardRequestValidation =
  | { readonly input: DashboardChatInput; readonly ok: true }
  | { readonly code: string; readonly ok: false; readonly status: number };

const rejected = (
  code: string,
  status: number,
): DashboardRequestValidation => ({ code, ok: false, status });

export const validateDashboardRequest = async (
  request: Request,
): Promise<DashboardRequestValidation> => {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin)
    return rejected("DASHBOARD_ORIGIN_DENIED", 403);
  if (!request.headers.get("content-type")?.startsWith("application/json"))
    return rejected("DASHBOARD_CONTENT_TYPE_INVALID", 415);
  const raw = await request.text();
  if (Buffer.byteLength(raw) > maximumBodyBytes)
    return rejected("DASHBOARD_BODY_TOO_LARGE", 413);

  let input: unknown;
  try {
    input = JSON.parse(raw) as unknown;
  } catch {
    return rejected("DASHBOARD_BODY_INVALID", 400);
  }
  if (
    !input ||
    typeof input !== "object" ||
    Array.isArray(input) ||
    Object.keys(input).some((key) => !allowedKeys.has(key)) ||
    !("text" in input) ||
    typeof input.text !== "string" ||
    ("threadId" in input &&
      input.threadId !== undefined &&
      typeof input.threadId !== "string") ||
    ("agentId" in input &&
      input.agentId !== undefined &&
      typeof input.agentId !== "string")
  )
    return rejected("DASHBOARD_BODY_INVALID", 400);
  const candidate = input as DashboardChatInput;
  return {
    input: {
      text: candidate.text,
      ...(typeof candidate.agentId === "string"
        ? { agentId: candidate.agentId }
        : {}),
      ...(typeof candidate.threadId === "string"
        ? { threadId: candidate.threadId }
        : {}),
    },
    ok: true,
  };
};
