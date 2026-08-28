import type { ResearchCitationTarget } from "../research/receipt.js";

export const maximumChatRecoveryAttempts = 3;
const maximumRepeatedRecoveryCode = 2;
const maximumCitationTargetBytes = 32 * 1_024;

export interface ChatRecoveryState {
  readonly recoveryAttempts: number;
  readonly recoveryCodes: readonly string[];
}

export const canAttemptChatRecovery = (
  state: ChatRecoveryState,
  code: string,
): boolean =>
  state.recoveryAttempts < maximumChatRecoveryAttempts &&
  state.recoveryCodes.filter((candidate) => candidate === code).length <
    maximumRepeatedRecoveryCode;

export const nextChatRecoveryState = (
  state: ChatRecoveryState,
  code: string,
): ChatRecoveryState => ({
  recoveryAttempts: state.recoveryAttempts + 1,
  recoveryCodes: [...state.recoveryCodes, code],
});

export const citationTargetInventory = (
  targets: readonly ResearchCitationTarget[],
): string => {
  const unique = [
    ...new Map(targets.map((target) => [target.canonicalUrl, target])).values(),
  ];
  const compactLines = unique.map(({ sourceId }) => `- ${sourceId}`);
  const suffixBytes = new Array<number>(compactLines.length + 1).fill(0);
  for (let index = compactLines.length - 1; index >= 0; index -= 1)
    suffixBytes[index] =
      suffixBytes[index + 1]! + Buffer.byteLength(`${compactLines[index]}\n`);
  let used = 0;
  return unique
    .map(({ canonicalUrl }, index) => {
      const compact = compactLines[index]!;
      const readable = `${compact} | ${canonicalUrl}`;
      const line =
        used + Buffer.byteLength(`${readable}\n`) + suffixBytes[index + 1]! <=
        maximumCitationTargetBytes
          ? readable
          : compact;
      used += Buffer.byteLength(`${line}\n`);
      return line;
    })
    .join("\n");
};

export const chatRecoveryInstruction = (input: {
  readonly attempt: number;
  readonly code: string;
  readonly details?: string;
  readonly phase: "model-output" | "tool-execution";
  readonly toolsAvailable: boolean;
}): string =>
  [
    "--- BEGIN TRUSTED KERNEL RECOVERY DIAGNOSTIC ---",
    `Failure code: ${input.code}`,
    `Failure phase: ${input.phase}`,
    `Recovery attempt: ${input.attempt}/${maximumChatRecoveryAttempts}`,
    ...(input.details ? [input.details] : []),
    "Diagnose the failure against the current objective and evidence, then choose the smallest safe action that can resolve it.",
    input.toolsAvailable
      ? "You may use currently granted tools to inspect, correct, or verify the problem. Do not repeat the failed action unchanged."
      : "No tools are available in this finalization step. Correct the response using only evidence already present.",
    "Return a useful final answer when the objective is satisfied. Stop honestly when the failure is non-recoverable or the remaining evidence is insufficient.",
    "--- END TRUSTED KERNEL RECOVERY DIAGNOSTIC ---",
  ].join("\n");
