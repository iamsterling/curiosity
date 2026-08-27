import { Effect } from "effect";
import { createHash } from "node:crypto";
import type { HarnessCommand } from "../domain/command.js";
import { InputRejected } from "./errors.js";
import { canonicalJson } from "./canonical-json.js";

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
    }
  | {
      readonly answer: string;
      readonly kind: "question.answer";
      readonly questionId: string;
    }
  | {
      readonly format: "opencode2-observation-export";
      readonly kind: "state.import-observations";
      readonly rows: readonly {
        readonly content: string;
        readonly rowId: string;
        readonly type: "evidence" | "fact" | "transcript";
      }[];
      readonly sourceDigest: string;
      readonly sourcePath: string;
      readonly sourceVersion: "1.0.0";
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
  if (
    command.kind !== "execution.cancel" &&
    command.kind !== "gate.decide" &&
    command.kind !== "question.answer" &&
    command.kind !== "state.import-observations"
  )
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
  if (command.kind === "question.answer") {
    if (
      !exactKeys(payload, ["answer", "questionId", "schemaVersion"]) ||
      payload.schemaVersion !== 1 ||
      typeof payload.answer !== "string" ||
      !payload.answer ||
      Buffer.byteLength(payload.answer) > 4_096 ||
      typeof payload.questionId !== "string" ||
      !/^[a-f0-9]{64}$/u.test(payload.questionId)
    )
      return Effect.fail(
        new InputRejected({ message: "QUESTION_ANSWER_PAYLOAD_INVALID" }),
      );
    return Effect.succeed({
      answer: payload.answer,
      kind: "question.answer",
      questionId: payload.questionId,
    });
  }
  if (command.kind === "state.import-observations") {
    if (
      !exactKeys(payload, [
        "format",
        "rows",
        "schemaVersion",
        "sourceDigest",
        "sourcePath",
        "sourceVersion",
      ]) ||
      payload.schemaVersion !== 1 ||
      payload.format !== "opencode2-observation-export" ||
      payload.sourceVersion !== "1.0.0" ||
      typeof payload.sourcePath !== "string" ||
      !payload.sourcePath ||
      Buffer.byteLength(payload.sourcePath) > 4_096 ||
      typeof payload.sourceDigest !== "string" ||
      !/^[a-f0-9]{64}$/u.test(payload.sourceDigest) ||
      !Array.isArray(payload.rows) ||
      payload.rows.length > 256
    )
      return Effect.fail(
        new InputRejected({ message: "OBSERVATION_IMPORT_PAYLOAD_INVALID" }),
      );
    const rows: {
      content: string;
      rowId: string;
      type: "evidence" | "fact" | "transcript";
    }[] = [];
    const rowIds = new Set<string>();
    for (const value of payload.rows) {
      const row = record(value);
      if (
        !row ||
        !exactKeys(row, ["content", "rowId", "type"]) ||
        typeof row.rowId !== "string" ||
        !row.rowId ||
        Buffer.byteLength(row.rowId) > 256 ||
        rowIds.has(row.rowId) ||
        !["evidence", "fact", "transcript"].includes(String(row.type)) ||
        typeof row.content !== "string" ||
        !row.content ||
        Buffer.byteLength(row.content) > 32 * 1_024
      )
        return Effect.fail(
          new InputRejected({ message: "OBSERVATION_IMPORT_ROW_INVALID" }),
        );
      rowIds.add(row.rowId);
      rows.push({
        content: row.content,
        rowId: row.rowId,
        type: row.type as "evidence" | "fact" | "transcript",
      });
    }
    const computedDigest = createHash("sha256")
      .update(
        canonicalJson({
          format: payload.format,
          rows,
          sourceVersion: payload.sourceVersion,
        }),
      )
      .digest("hex");
    if (computedDigest !== payload.sourceDigest)
      return Effect.fail(
        new InputRejected({ message: "OBSERVATION_IMPORT_DIGEST_MISMATCH" }),
      );
    return Effect.succeed({
      format: payload.format,
      kind: "state.import-observations",
      rows,
      sourceDigest: payload.sourceDigest,
      sourcePath: payload.sourcePath,
      sourceVersion: payload.sourceVersion,
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
