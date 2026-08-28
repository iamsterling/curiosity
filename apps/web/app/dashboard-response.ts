const stableCode = /^[A-Z][A-Z0-9_:-]{0,127}$/u;

const responseErrorCode = (body: unknown): string | undefined => {
  if (!body || typeof body !== "object" || Array.isArray(body)) return undefined;
  const error = "error" in body ? body.error : undefined;
  if (!error || typeof error !== "object" || Array.isArray(error))
    return undefined;
  const code = "code" in error ? error.code : undefined;
  return typeof code === "string" && stableCode.test(code) ? code : undefined;
};

export const readDashboardResponse = async <Result>(
  response: Response,
  invalidSuccessCode: string,
): Promise<Result> => {
  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new Error(
      response.ok ? invalidSuccessCode : `DASHBOARD_HTTP_${response.status}`,
    );
  }
  if (!response.ok)
    throw new Error(
      responseErrorCode(body) ?? `DASHBOARD_HTTP_${response.status}`,
    );
  return body as Result;
};

const errorCopy: Readonly<Record<string, string>> = Object.freeze({
  DASHBOARD_ORIGIN_DENIED:
    "This browser address was rejected by the server. Reload and try again.",
  DASHBOARD_RESPONSE_INVALID:
    "The dashboard received an invalid server response. Try again.",
  DASHBOARD_SESSION_UNAVAILABLE:
    "The durable Curiosity session is unavailable right now.",
  DASHBOARD_TURN_FAILED: "Curiosity could not complete that turn.",
  OPENAI_OAUTH_AUTHENTICATION_REQUIRED:
    "Connect the configured OpenAI account before sending a turn.",
});

export const presentDashboardError = (code: string): string =>
  errorCopy[code] ? `${errorCopy[code]} · ${code}` : code;
