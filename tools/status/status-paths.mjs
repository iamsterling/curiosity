import path from "node:path";

const REPOSITORY_PATH = /^[A-Za-z0-9@._-]+(?:\/[A-Za-z0-9@._-]+)*$/u;

export const isCanonicalRepositoryPath = (value) => {
  if (typeof value !== "string" || value.length === 0) return false;
  if (value !== value.normalize("NFC") || !REPOSITORY_PATH.test(value)) return false;
  if (path.posix.isAbsolute(value) || path.posix.normalize(value) !== value) return false;
  return value.split("/").every((segment) => segment !== "." && segment !== "..");
};
