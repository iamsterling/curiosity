import { Effect } from "effect";
import type { HarnessCommand } from "../domain/command.js";
import { InputRejected } from "./errors.js";

export type KernelControlCommand =
  | {
      readonly executionId: string;
      readonly kind: "execution.cancel";
    }
  | {
      readonly decision: "approved" | "denied";
      readonly gateId: string;
      readonly kind: "gate.decide";
      readonly payloadDigest: string;
      readonly proposalRevision: number;
    };

const record = (value: unknown): Record<string, unknown> | undefined =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;

const exactKeys = (
  value: Record<string, unknown>,
  expected: readonly string[],
): boolean =>
  Object.keys(value).sort().join(",") === [...expected].sort().join(",");

export const decodeKernelControlCommand = (
  command: HarnessCommand,
): Effect.Effect<KernelControlCommand | undefined, InputRejected> => {
  if (command.kind !== "execution.cancel" && command.kind !== "gate.decide")
    return Effect.succeed(undefined);
  const payload = record(command.payload);
  if (!payload)
    return Effect.fail(
      new InputRejected({ message: "CONTROL_PAYLOAD_INVALID" }),
    );
  if (command.kind === "execution.cancel") {
    if (
      !exactKeys(payload, ["executionId", "schemaVersion"]) ||
      payload.schemaVersion !== 1 ||
      typeof payload.executionId !== "string" ||
      !payload.executionId ||
      payload.executionId.length > 256
    )
      return Effect.fail(
        new InputRejected({ message: "EXECUTION_CANCEL_PAYLOAD_INVALID" }),
      );
    return Effect.succeed({
      executionId: payload.executionId,
      kind: "execution.cancel",
    });
  }
  if (
    !exactKeys(payload, [
      "decision",
      "gateId",
      "payloadDigest",
      "proposalRevision",
      "schemaVersion",
    ]) ||
    payload.schemaVersion !== 1 ||
    (payload.decision !== "approved" && payload.decision !== "denied") ||
    typeof payload.gateId !== "string" ||
    !payload.gateId ||
    typeof payload.payloadDigest !== "string" ||
    !/^[a-f0-9]{64}$/u.test(payload.payloadDigest) ||
    typeof payload.proposalRevision !== "number" ||
    !Number.isSafeInteger(payload.proposalRevision) ||
    payload.proposalRevision < 1
  )
    return Effect.fail(
      new InputRejected({ message: "GATE_DECISION_PAYLOAD_INVALID" }),
    );
  return Effect.succeed({
    decision: payload.decision,
    gateId: payload.gateId,
    kind: "gate.decide",
    payloadDigest: payload.payloadDigest,
    proposalRevision: payload.proposalRevision,
  });
};
