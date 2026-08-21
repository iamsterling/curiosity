import { createHash } from "node:crypto";
import { lstatSync, readFileSync, realpathSync } from "node:fs";
import { relative, resolve } from "node:path";

export const generatedExecutablePolicyRule =
  "v1: generated executable canonical path must be strictly beneath the current invocation runRoot, must not be a symlink escape, and may execute only after binding exact identity, SHA-256, and build-recipe SHA-256";

const fail = (code) => {
  throw Object.assign(new Error(code), { code });
};
const sha = (bytes) => createHash("sha256").update(bytes).digest("hex");
const isDigest = (value) => /^[0-9a-f]{64}$/.test(value);

export const createGeneratedExecutablePolicy = (runRoot) => ({
  runRoot: realpathSync(runRoot),
  receipts: new Map(),
});

const canonicalGeneratedPath = (policy, path) => {
  const requestedPath = resolve(path);
  if (lstatSync(requestedPath).isSymbolicLink())
    fail("SDK_GENERATED_EXECUTABLE_SYMLINK_FORBIDDEN");
  const canonicalPath = realpathSync(requestedPath);
  const fromRoot = relative(policy.runRoot, canonicalPath);
  if (fromRoot === "" || fromRoot === ".." || fromRoot.startsWith("../"))
    fail("SDK_GENERATED_EXECUTABLE_OUTSIDE_RUN_ROOT");
  if (!lstatSync(canonicalPath).isFile())
    fail("SDK_GENERATED_EXECUTABLE_NOT_FILE");
  return canonicalPath;
};

export const bindGeneratedExecutable = (
  policy,
  { path, identity, sha256, recipeSha256 },
) => {
  if (
    typeof identity !== "string" ||
    identity.length === 0 ||
    !isDigest(sha256) ||
    !isDigest(recipeSha256)
  )
    fail("SDK_GENERATED_EXECUTABLE_RECEIPT_INVALID");
  const canonicalPath = canonicalGeneratedPath(policy, path);
  if (sha(readFileSync(canonicalPath)) !== sha256)
    fail("SDK_GENERATED_EXECUTABLE_HASH_MISMATCH");
  const receipt = { identity, sha256, recipeSha256 };
  policy.receipts.set(canonicalPath, receipt);
  return { path: canonicalPath, ...receipt };
};

export const resolveGeneratedExecutable = (policy, path) => {
  const canonicalPath = canonicalGeneratedPath(policy, path);
  const receipt = policy.receipts.get(canonicalPath);
  if (receipt === undefined) fail("SDK_GENERATED_EXECUTABLE_RECEIPT_REQUIRED");
  if (sha(readFileSync(canonicalPath)) !== receipt.sha256)
    fail("SDK_GENERATED_EXECUTABLE_HASH_MISMATCH");
  return canonicalPath;
};
