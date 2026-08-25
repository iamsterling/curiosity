export const plainRecord = (
  value: unknown,
  code: string,
): Record<string, unknown> => {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value) ||
    Object.getPrototypeOf(value) !== Object.prototype
  )
    throw new Error(code);
  return value as Record<string, unknown>;
};

export const exactObjectKeys = (
  value: Record<string, unknown>,
  allowed: readonly string[],
  code: string,
  required: readonly string[] = allowed,
): void => {
  const unknown = Object.keys(value)
    .filter((key) => !allowed.includes(key))
    .sort()[0];
  if (unknown) throw new Error(`${code}:${unknown}`);
  const missing = required.find((key) => !(key in value));
  if (missing) throw new Error(`${code}_MISSING:${missing}`);
};

export const nonEmptyString = (value: unknown, code: string): string => {
  if (typeof value !== "string" || value.length === 0) throw new Error(code);
  return value;
};

export const uniqueStringArray = (
  value: unknown,
  code: string,
): readonly string[] => {
  if (!Array.isArray(value)) throw new Error(code);
  const values = value.map((item) => nonEmptyString(item, code));
  if (new Set(values).size !== values.length)
    throw new Error(`${code}_DUPLICATE`);
  return values;
};
