import { createHash } from "node:crypto";

export const hashMutationDiff = ({ file, find, replace }) =>
  createHash("sha256").update(`${file}\0${find}\0${replace}`).digest("hex");

export const scoreMutationReceipts = (receipts) => {
  const seenDiffs = new Set();
  const seenSources = new Set();
  for (const receipt of receipts) {
    if (!receipt.baselineTestPass)
      throw new Error(`MUTANT_BASELINE_FAILED:${receipt.id}`);
    if (!receipt.mutantCompilePass)
      throw new Error(`MUTANT_COMPILE_FAILED:${receipt.id}`);
    if (receipt.observedTest !== receipt.designatedTest)
      throw new Error(`MUTANT_UNRELATED_TEST_FAILURE:${receipt.id}`);
    if (receipt.observedVector !== receipt.designatedVector)
      throw new Error(`MUTANT_WRONG_VECTOR:${receipt.id}`);
    if (receipt.observedField !== receipt.expectedMismatchField)
      throw new Error(`MUTANT_WRONG_FIELD:${receipt.id}`);
    if (receipt.verdict !== "killed")
      throw new Error(`MUTANT_SURVIVED:${receipt.id}`);
    if (seenDiffs.has(receipt.diffHash) || seenSources.has(receipt.sourceHash))
      throw new Error(`MUTANT_DUPLICATE_DIFF:${receipt.id}`);
    seenDiffs.add(receipt.diffHash);
    seenSources.add(receipt.sourceHash);
  }
  return { killed: receipts.length, total: receipts.length };
};
