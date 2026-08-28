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

const headerAuthority = (value: string | null): string | undefined => {
  const candidate = value?.trim();
  return candidate || undefined;
};

const normalizedOrigin = (
  protocol: string,
  authority: string | undefined,
): string | undefined => {
  if (!authority) return undefined;
  const scheme = protocol.replace(/:$/u, "").toLowerCase();
  if (scheme !== "http" && scheme !== "https") return undefined;
  try {
    return new URL(`${scheme}://${authority}`).origin;
  } catch {
    return undefined;
  }
};

export const requestAllowsOrigin = (request: Request): boolean => {
  const supplied = request.headers.get("origin");
  if (!supplied) return true;

  let requestUrl: URL;
  let suppliedOrigin: string;
  try {
    requestUrl = new URL(request.url);
    suppliedOrigin = new URL(supplied).origin;
  } catch {
    return false;
  }

  const host = headerAuthority(request.headers.get("host"));
  const allowed = new Set<string>([requestUrl.origin]);
  const hostOrigin = normalizedOrigin(requestUrl.protocol, host);
  if (hostOrigin) allowed.add(hostOrigin);
  return allowed.has(suppliedOrigin);
};

export const validateDashboardRequest = async (
  request: Request,
): Promise<DashboardRequestValidation> => {
  if (!requestAllowsOrigin(request))
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
