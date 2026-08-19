export const PROVIDER_IDENTIFIER_MAX_BYTES = 32;

const FORBIDDEN_PREFIX = /^(?:bearer|gh[pousr]_|github_pat_|sk[-_]|xox[baprs]-|api[-_]?key)/u;
const FORBIDDEN_SEGMENT = /^(?:secret|sentinel|credential|token|authorization|password|cookie|apikey|key)$/u;

export const validProviderIdentifier = (value: unknown): value is string => {
  if (typeof value !== "string" || Buffer.byteLength(value) > PROVIDER_IDENTIFIER_MAX_BYTES) return false;
  if (!/^[a-z0-9](?:[a-z0-9._-]{0,30}[a-z0-9])?$/u.test(value) || FORBIDDEN_PREFIX.test(value)) return false;
  if (value.split(/[._-]/u).some((segment) => FORBIDDEN_SEGMENT.test(segment))) return false;
  // Provider identifiers are short human-readable names, not opaque material.
  if (value.length >= 20 && new Set(value.replace(/[._-]/gu, "")).size >= 14) return false;
  return true;
};

export const validProviderIdentifierArray = (value: unknown, minimum: number, maximum: number): value is string[] => {
  if (!Array.isArray(value) || value.length < minimum || value.length > maximum) return false;
  const keys = Reflect.ownKeys(value);
  if (keys.some((key) => typeof key !== "string" || (key !== "length" && (!/^(?:0|[1-9][0-9]*)$/u.test(key) || Number(key) >= value.length)))) return false;
  for (let index = 0; index < value.length; index += 1) if (!Object.hasOwn(value, index) || !validProviderIdentifier(value[index])) return false;
  return true;
};
