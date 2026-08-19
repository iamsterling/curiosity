export const validRfc3339 = (value: string): boolean => {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/u.test(value)) return false;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.valueOf())) return false;
  return parsed.toISOString() === value || parsed.toISOString().replace(".000Z", "Z") === value;
};

export const validHttpUrl = (value: string): boolean => {
  if (/[\u0000-\u001f\u007f]/u.test(value)) return false;
  try {
    const url = new URL(value);
    return (["http:", "https:"] as string[]).includes(url.protocol) && !url.username && !url.password;
  } catch {
    return false;
  }
};

export const truncateUtf8 = (value: string, maximum: number): string => {
  let bytes = 0;
  let result = "";
  for (const codePoint of value) {
    const width = Buffer.byteLength(codePoint);
    if (bytes + width > maximum) break;
    result += codePoint;
    bytes += width;
  }
  return result;
};
