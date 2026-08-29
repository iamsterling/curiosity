const stableCode = /^[A-Z][A-Z0-9_:-]{0,127}$/u;
const maximumResponseCharacters = 512 * 1_024;

export class CuriosityApiError extends Error {
  readonly status: number;

  constructor(code: string, status = 0) {
    super(code);
    this.name = "CuriosityApiError";
    this.status = status;
  }
}

export const responseRecord = (
  value: unknown,
): Record<string, unknown> | undefined =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;

const responseCode = (value: unknown): string | undefined => {
  const error = responseRecord(responseRecord(value)?.error);
  const code = error?.code;
  return typeof code === "string" && stableCode.test(code) ? code : undefined;
};

export const readCuriosityResponse = async (
  response: Response,
): Promise<Record<string, unknown>> => {
  const declaredLength = Number(response.headers.get("content-length"));
  if (
    Number.isFinite(declaredLength) &&
    declaredLength > maximumResponseCharacters
  )
    throw new CuriosityApiError("MOBILE_RESPONSE_TOO_LARGE", response.status);

  let raw: string;
  try {
    raw = await response.text();
  } catch {
    throw new CuriosityApiError(
      response.ok ? "MOBILE_RESPONSE_INVALID" : `MOBILE_HTTP_${response.status}`,
      response.status,
    );
  }
  if (raw.length > maximumResponseCharacters)
    throw new CuriosityApiError("MOBILE_RESPONSE_TOO_LARGE", response.status);

  let body: unknown;
  try {
    body = JSON.parse(raw) as unknown;
  } catch {
    throw new CuriosityApiError(
      response.ok ? "MOBILE_RESPONSE_INVALID" : `MOBILE_HTTP_${response.status}`,
      response.status,
    );
  }
  if (!response.ok)
    throw new CuriosityApiError(
      responseCode(body) ?? `MOBILE_HTTP_${response.status}`,
      response.status,
    );
  const parsed = responseRecord(body);
  if (!parsed)
    throw new CuriosityApiError("MOBILE_RESPONSE_INVALID", response.status);
  return parsed;
};

const errorCopy: Readonly<Record<string, string>> = Object.freeze({
  ACTION_CANCELLED: "The turn was cancelled.",
  MOBILE_CANCEL_UNAVAILABLE: "Cancellation is unavailable for this remote adapter.",
  MOBILE_RESPONSE_INVALID: "The server returned an invalid response.",
  MOBILE_RESPONSE_TOO_LARGE: "The server response was too large.",
  MOBILE_NETWORK_UNAVAILABLE: "The Curiosity server is unreachable.",
  MOBILE_REQUEST_TIMEOUT: "The Curiosity server did not respond in time.",
  MOBILE_SERVER_URL_INVALID: "The Curiosity server URL is invalid.",
  PROVIDER_ROUTE_UNAVAILABLE: "No local generation route is available yet.",
  OPENAI_OAUTH_AUTHENTICATION_REQUIRED: "Connect the configured OpenAI account.",
  PROMPT_COMMAND_UNKNOWN: "That Curiosity command is not available.",
});

export const presentCuriosityError = (error: unknown): string => {
  const code = error instanceof Error ? error.message : "MOBILE_REQUEST_FAILED";
  return errorCopy[code] ? `${errorCopy[code]} · ${code}` : code;
};
