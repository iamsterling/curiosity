import { createHash } from "node:crypto";
import { lstatSync, readFileSync } from "node:fs";
import { join } from "node:path";

export const approvedReviewPaths = Object.freeze([
  "apps/runtime/docs/licenses/legacy-memory-node-api-sdk-v2.json",
  "apps/runtime/docs/licenses/legacy-memory-node-api-sdk-v2.md",
  "apps/runtime/docs/licenses/legacy-memory-node-api-sdk-v2.sha256",
  "apps/runtime/docs/specifications/legacy-memory-node-api-sdk-v2-abi.json",
  "apps/runtime/docs/specifications/legacy-memory-node-api-sdk-v2-abi.sha256",
  "apps/runtime/docs/specifications/legacy-memory-node-api-sdk-v2-undefined-imports.txt",
  "apps/runtime/docs/specifications/legacy-memory-node-api-sdk-v2-undefined-imports.sha256",
  "apps/runtime/docs/specifications/legacy-memory-node-api-sdk-v2-normal-receipt.json",
  "apps/runtime/docs/specifications/legacy-memory-node-api-sdk-v2-normal-receipt.sha256",
  "apps/runtime/docs/specifications/legacy-memory-node-api-sdk-v2-panic-receipt.json",
  "apps/runtime/docs/specifications/legacy-memory-node-api-sdk-v2-panic-receipt.sha256",
  "apps/runtime/docs/specifications/legacy-memory-node-api-sdk-v2-allocation-failure-receipt.json",
  "apps/runtime/docs/specifications/legacy-memory-node-api-sdk-v2-allocation-failure-receipt.sha256",
  "apps/runtime/docs/specifications/legacy-memory-node-api-sdk-v2-queue-failure-receipt.json",
  "apps/runtime/docs/specifications/legacy-memory-node-api-sdk-v2-queue-failure-receipt.sha256",
  "apps/runtime/docs/specifications/legacy-memory-node-api-sdk-v2-control-flow-observation-receipt.json",
  "apps/runtime/docs/specifications/legacy-memory-node-api-sdk-v2-control-flow-observation-receipt.sha256",
  "apps/runtime/docs/specifications/legacy-memory-node-api-sdk-v2-candidate-receipt.json",
  "apps/runtime/docs/specifications/legacy-memory-node-api-sdk-v2-candidate-receipt.sha256",
]);

const sha = (bytes) => createHash("sha256").update(bytes).digest("hex");

export const materializeApprovedReviewSet = (root) =>
  approvedReviewPaths.map((path) => {
    const absolutePath = join(root, path);
    if (!lstatSync(absolutePath).isFile())
      throw new Error(`SDK_APPROVED_REVIEW_PATH_INVALID:${path}`);
    return { path, sha256: sha(readFileSync(absolutePath)) };
  });

export const validateApprovedReviewSet = (entries) => {
  if (!Array.isArray(entries) || entries.length !== approvedReviewPaths.length)
    throw new Error("SDK_APPROVED_REVIEW_SET_INVALID");
  entries.forEach((entry, index) => {
    if (
      entry === null ||
      typeof entry !== "object" ||
      JSON.stringify(Object.keys(entry)) !==
        JSON.stringify(["path", "sha256"]) ||
      entry.path !== approvedReviewPaths[index] ||
      !/^[0-9a-f]{64}$/.test(entry.sha256)
    )
      throw new Error("SDK_APPROVED_REVIEW_SET_INVALID");
  });
  return true;
};
