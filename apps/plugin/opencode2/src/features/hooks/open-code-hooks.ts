import { digestCanonical } from "../../core/canonical/index.js";
import { DiagnosticError } from "../../core/diagnostics/diagnostic.js";
import { Ledger } from "../ledger/index.js";
import { NativeLoopEngine } from "../loop-engine/index.js";
import type { FeatureCleanup, OpenCodeContext } from "../../plugin/contracts.js";
import { boundedLedgerContext, projectLedgerContext } from "./context-projection.js";
import { EventCapture, type CaptureInput } from "./event-capture.js";
import { capabilityReport, PINNED_REAL_HOST_VERSION } from "../../platform/real-host/index.js";
import { preservePrimaryError, projectRootKey, runAllReverse } from "../../plugin/lifecycle.js";

const activeRoots = new Set<string>();
const string = (value: unknown): string | undefined => (typeof value === "string" ? value : undefined);
const object = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" ? (value as Record<string, unknown>) : {};
export const eventEnvelope = (raw: unknown): CaptureInput => {
  const event = object(raw);
  const data = object(event.data);
  const durable = object(event.durable);
  const id = string(event.id) ?? string(data.eventID);
  const type = string(event.type) ?? "unknown";
  const callID = string(data.callID) ?? string(data.toolCallID);
  const cancelledTool = type === "tool.execute.cancelled" && callID;
  const aggregate =
    string(durable.aggregateID) ??
    string(event.aggregateID) ??
    (cancelledTool ? `tool:${callID}` : undefined) ??
    string(data.sessionID) ??
    "host";
  const sequence =
    cancelledTool && !durable.aggregateID && !event.aggregateID ? 2 : Number(durable.seq ?? event.seq ?? data.seq);
  const optional = Object.fromEntries(
    Object.entries({
      sessionID: string(data.sessionID),
      rootSessionID: string(data.rootSessionID),
      parentSessionID: string(data.parentSessionID),
      messageID: string(data.messageID),
      callID,
      executionID: string(data.executionID),
      causationID: string(data.causationID),
      correlationID: string(data.correlationID),
    }).filter((entry): entry is [string, string] => entry[1] !== undefined),
  );
  return {
    id: id ?? "",
    aggregate,
    sequence,
    type,
    ...optional,
    sourceKind: "host",
    payload: event,
    taint: "untrusted-source" as const,
  };
};

export const registerOpenCodeHooks = async (context: OpenCodeContext): Promise<FeatureCleanup> => {
  const root = await projectRootKey(context);
  if (activeRoots.has(root)) return async () => undefined;
  activeRoots.add(root);
  const registrations: Array<{ dispose(): Promise<void> }> = [];
  const abort = new AbortController();
  try {
    const ledger = await Ledger.open(root);
    const capabilities = capabilityReport({
      hostVersion: context.app.version,
      pluginApiVersion: PINNED_REAL_HOST_VERSION,
    });
    const capture = await EventCapture.open(root, { pluginVersion: "0.1.0", hostVersion: context.app.version });
    const loop = await NativeLoopEngine.open(root, {
      prompt: async (input) => context.session.prompt(input as never),
      interrupt: async (input) => context.session.interrupt(input as never),
    });
    registrations.push(
      await context.session.hook("context", async (input: any) => {
        const projection = await ledger.contextProjection(String(input.sessionID));
        input.system.push({
          type: "text",
          text: boundedLedgerContext(projectLedgerContext(projection)),
        } as never);
      }),
    );
    registrations.push(
      await context.tool.hook("execute.before", async (input: any) => {
        await capture.ingest({
          id: `tool-before:${String(input.id)}`,
          aggregate: `tool:${String(input.id)}`,
          sequence: 1,
          type: "tool.execute.before",
          sessionID: String(input.sessionID),
          messageID: String(input.messageID),
          callID: String(input.id),
          sourceKind: "tool",
          payload: { tool: input.tool, agent: String(input.agent), arguments: "not-retained" },
          taint: "untrusted-tool",
        });
      }),
    );
    registrations.push(
      await context.tool.hook("execute.after", async (input: any) => {
        await capture.ingest({
          id: `tool-after:${String(input.id)}`,
          aggregate: `tool:${String(input.id)}`,
          sequence: 2,
          type: "tool.execute.after",
          sessionID: String(input.sessionID),
          messageID: String(input.messageID),
          callID: String(input.id),
          sourceKind: "tool",
          payload: { tool: input.tool, agent: String(input.agent), status: input.status, result: "not-retained" },
          taint: "untrusted-tool",
        });
      }),
    );
    const events = context.event.subscribe({ signal: abort.signal } as never)[Symbol.asyncIterator]();
    const subscription = (async () => {
      while (!abort.signal.aborted) {
        const next = await events.next();
        if (next.done) break;
        const raw = next.value;
        const envelope = eventEnvelope(raw);
        const captured = await capture.ingest(envelope, "redact").catch((error) => {
          if (
            error instanceof DiagnosticError &&
            ["CAPTURE_EVENT_ID_REQUIRED", "CAPTURE_EVENT_ID_INVALID", "CAPTURE_SEQUENCE_INVALID"].includes(error.code)
          )
            return undefined;
          throw error;
        });
        if (!captured) continue;
        if (
          ["duplicate", "collision"].includes(captured.status) ||
          envelope.correlationID?.startsWith("opencode2-config:self:")
        )
          continue;
        const event = object(raw);
        const data = object(event.data);
        if (envelope.type === "session.input.admitted") {
          const admitted = object(data.input);
          const metadata = object(object(admitted.data).metadata);
          const approvalID = string(metadata.opencode2ApprovalID);
          if (admitted.type === "user" && approvalID && capabilities.authoritativePersistence.status !== "disabled")
            await ledger.confirmApproval(approvalID, {
              kind: "root-user",
              sessionID: envelope.sessionID ?? "",
              correlationID: approvalID,
            });
          await loop
            .observeUserInput({
              sessionID: envelope.sessionID ?? "",
              inputID: string(data.inputID) ?? envelope.id,
              type: object(data.input).type === "synthetic" ? "synthetic" : "user",
            })
            .catch((error) => {
              if (!(error instanceof DiagnosticError) || error.code !== "LOOP_NOT_STARTED") throw error;
            });
        }
        if (
          ["session.execution.succeeded", "session.execution.failed", "session.execution.interrupted"].includes(
            envelope.type,
          )
        )
          await loop
            .observeTerminal({
              id: envelope.id,
              sessionID: envelope.sessionID ?? "",
              evidenceCursor: Number(data.evidenceCursor ?? 0),
              descendantsTerminal: data.descendantsTerminal === true,
              toolsTerminal: data.toolsTerminal === true,
            })
            .catch((error) => {
              if (!(error instanceof DiagnosticError) || error.code !== "LOOP_NOT_STARTED") throw error;
            });
      }
    })();
    let cleaned = false;
    return async () => {
      if (cleaned) return;
      cleaned = true;
      try {
        abort.abort();
        await runAllReverse([
          ...registrations.map((registration) => () => registration.dispose()),
          async () => {
            await events.return?.();
            try {
              await subscription;
            } catch (error) {
              if ((error as Error).name !== "AbortError") throw error;
            }
          },
        ]);
      } finally {
        activeRoots.delete(root);
      }
    };
  } catch (error) {
    abort.abort();
    try {
      await runAllReverse(registrations.map((registration) => () => registration.dispose()));
    } catch (cleanupError) {
      throw preservePrimaryError(error, cleanupError);
    } finally {
      activeRoots.delete(root);
    }
    throw error;
  }
};
