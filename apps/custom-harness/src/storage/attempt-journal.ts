import type { Database } from "bun:sqlite";
import { createHash } from "node:crypto";
import type { StoredAction } from "../domain/action.js";
import type {
  AllocatedProviderAttempt,
  AllocatedToolAttempt,
  ProviderAttemptSnapshot,
  ProviderPurpose,
  ToolAttemptSnapshot,
} from "../domain/attempt.js";
import type { ProposedEvent } from "../domain/event.js";
import { canonicalJson } from "../kernel/canonical-json.js";
import {
  admitInTransaction,
  type AdmissionInput,
  type AdmissionResult,
} from "./event-append.js";

interface ActionAttemptRow {
  readonly action_id: string;
  readonly action_schema_version: number;
  readonly action_type: string;
  readonly created_at: string;
  readonly deadline_class: StoredAction["deadlineClass"];
  readonly execution_id: string;
  readonly gate_class: StoredAction["gateClass"];
  readonly input_digest: string;
  readonly input_json: string;
  readonly plugin_id: string;
  readonly reactor_id: string;
  readonly requested_capabilities_json: string;
  readonly resource: string;
  readonly source_event_id: string;
  readonly status: StoredAction["status"];
  readonly updated_at: string;
}

interface ActiveProviderRow extends ActionAttemptRow {
  readonly attempt_id: string;
  readonly call_id: string;
  readonly dispatch_state: "armed" | "dispatched";
  readonly generation: number;
}

interface ActiveToolRow extends ActionAttemptRow {
  readonly attempt_id: string;
  readonly call_id: string;
  readonly dispatch_state: "armed" | "dispatched";
  readonly generation: number;
}

const toAction = (row: ActionAttemptRow): StoredAction => ({
  actionId: row.action_id,
  actionSchemaVersion: row.action_schema_version,
  actionType: row.action_type,
  createdAt: row.created_at,
  deadlineClass: row.deadline_class,
  executionId: row.execution_id,
  gateClass: row.gate_class,
  input: JSON.parse(row.input_json) as unknown,
  inputDigest: row.input_digest,
  pluginId: row.plugin_id,
  reactorId: row.reactor_id,
  requestedCapabilities: JSON.parse(
    row.requested_capabilities_json,
  ) as string[],
  resource: row.resource,
  sourceEventId: row.source_event_id,
  status: row.status,
  updatedAt: row.updated_at,
});

const hash = (value: unknown): string =>
  createHash("sha256").update(canonicalJson(value)).digest("hex");

const runFinalized = (
  database: Database,
  sql: string,
  parameters: readonly (number | string | null)[],
): void => {
  const statement = database.prepare<unknown, (number | string | null)[]>(sql);
  try {
    statement.run(...parameters);
  } finally {
    statement.finalize();
  }
};

export class AttemptJournal {
  constructor(private readonly database: Database) {}

  nextGeneration(executionId: string): number {
    const row = this.database
      .query<{ generation: number }, [string]>(
        "SELECT generation FROM executions WHERE execution_id = ?",
      )
      .get(executionId);
    return (row?.generation ?? 0) + 1;
  }

  allocateProviderAttempt(input: {
    readonly action: StoredAction;
    readonly allocatedAt: string;
    readonly attemptId: string;
    readonly callId: string;
    readonly generation: number;
    readonly leaseExpiresAt: string;
    readonly modelId: string;
    readonly ownerId: string;
    readonly promptSnapshotDigest: string;
    readonly promptSnapshotJson: string;
    readonly providerPurpose: ProviderPurpose;
    readonly requestDigest: string;
    readonly snapshot: ProviderAttemptSnapshot;
    readonly snapshotDigest: string;
    readonly sourceRevision: number;
  }): AllocatedProviderAttempt | undefined {
    return this.database
      .transaction(() => {
        const action = this.database
          .query<{ input_digest: string; status: string }, [string]>(
            "SELECT input_digest,status FROM actions WHERE action_id = ?",
          )
          .get(input.action.actionId);
        if (!action || action.status !== "proposed") return undefined;
        if (action.input_digest !== input.action.inputDigest)
          throw new Error("ATTEMPT_ACTION_DIGEST_MISMATCH");
        if (hash(input.snapshot) !== input.snapshotDigest)
          throw new Error("ATTEMPT_SNAPSHOT_DIGEST_MISMATCH");
        this.database.run(
          "INSERT OR IGNORE INTO executions(execution_id,version,generation,status,cancellation_requested,updated_at) VALUES (?,?,?,?,?,?)",
          [input.action.executionId, 0, 0, "active", 0, input.allocatedAt],
        );
        const execution = this.database
          .query<
            {
              cancellation_requested: number;
              generation: number;
              status: string;
            },
            [string]
          >(
            "SELECT cancellation_requested,generation,status FROM executions WHERE execution_id = ?",
          )
          .get(input.action.executionId);
        if (
          !execution ||
          execution.cancellation_requested === 1 ||
          execution.generation + 1 !== input.generation ||
          !["active", "completed", "failed", "delivery-unknown"].includes(
            execution.status,
          )
        )
          return undefined;
        if (input.action.gateClass === "binding-human-requested") {
          const gate = this.database
            .query<
              { expires_at: string; payload_digest: string; status: string },
              [string]
            >(
              "SELECT expires_at,payload_digest,status FROM gates WHERE action_id = ? ORDER BY created_at DESC LIMIT 1",
            )
            .get(input.action.actionId);
          if (
            gate?.status !== "approved" ||
            gate.payload_digest !== input.action.inputDigest ||
            Date.parse(gate.expires_at) <= Date.parse(input.allocatedAt)
          )
            return undefined;
        }
        const revoked = this.database
          .query<{ capability: string }, []>(
            "SELECT capability FROM capability_revocations",
          )
          .all();
        if (
          input.action.requestedCapabilities.some((capability) =>
            revoked.some((item) => item.capability === capability),
          )
        )
          return undefined;
        this.database.run(
          "UPDATE provider_calls SET status = CASE dispatch_state WHEN 'dispatched' THEN 'delivery-unknown' ELSE 'failed' END, completed_at = ?, error_code = 'ATTEMPT_FENCED', usage_state = 'UNKNOWN', delivery_certainty = CASE dispatch_state WHEN 'dispatched' THEN 'UNKNOWN' ELSE 'NOT_DELIVERED' END WHERE attempt_id IN (SELECT attempt_id FROM attempts WHERE execution_id = ? AND status = 'running') AND status = 'allocated'",
          [input.allocatedAt, input.action.executionId],
        );
        this.database.run(
          "UPDATE tool_calls SET status = CASE dispatch_state WHEN 'dispatched' THEN 'delivery-unknown' ELSE 'failed' END, completed_at = ?, error_code = 'ATTEMPT_FENCED', delivery_certainty = CASE dispatch_state WHEN 'dispatched' THEN 'UNKNOWN' ELSE 'NOT_DELIVERED' END WHERE attempt_id IN (SELECT attempt_id FROM attempts WHERE execution_id = ? AND status = 'running') AND status = 'allocated'",
          [input.allocatedAt, input.action.executionId],
        );
        this.database.run(
          "UPDATE actions SET status = 'delivery-unknown', updated_at = ?, error_code = 'ATTEMPT_FENCED' WHERE action_id IN (SELECT action_id FROM attempts WHERE execution_id = ? AND status = 'running')",
          [input.allocatedAt, input.action.executionId],
        );
        this.database.run(
          "UPDATE attempts SET status = 'delivery-unknown', updated_at = ? WHERE execution_id = ? AND status = 'running'",
          [input.allocatedAt, input.action.executionId],
        );
        this.database.run(
          "UPDATE executions SET version = version + 1, generation = ?, status = 'active', updated_at = ? WHERE execution_id = ?",
          [input.generation, input.allocatedAt, input.action.executionId],
        );
        this.database.run(
          "INSERT INTO attempts(attempt_id,action_id,execution_id,generation,owner_id,status,lease_expires_at,heartbeat_at,snapshot_digest,snapshot_json,catalog_digest,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)",
          [
            input.attemptId,
            input.action.actionId,
            input.action.executionId,
            input.generation,
            input.ownerId,
            "running",
            input.leaseExpiresAt,
            input.allocatedAt,
            input.snapshotDigest,
            canonicalJson(input.snapshot),
            input.snapshot.catalogDigest,
            input.allocatedAt,
            input.allocatedAt,
          ],
        );
        this.database.run(
          "UPDATE actions SET status = 'running', updated_at = ? WHERE action_id = ? AND status = 'proposed'",
          [input.allocatedAt, input.action.actionId],
        );
        this.database.run(
          "INSERT INTO provider_calls(call_id,action_id,attempt_id,generation,purpose,model_id,request_digest,catalog_digest,prompt_snapshot_digest,prompt_snapshot_json,source_revision,dispatch_state,usage_state,delivery_certainty,status,allocated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
          [
            input.callId,
            input.action.actionId,
            input.attemptId,
            input.generation,
            input.providerPurpose,
            input.modelId,
            input.requestDigest,
            input.snapshot.catalogDigest,
            input.promptSnapshotDigest,
            input.promptSnapshotJson,
            input.sourceRevision,
            "armed",
            "UNKNOWN",
            "NOT_DISPATCHED",
            "allocated",
            input.allocatedAt,
          ],
        );
        return {
          actionId: input.action.actionId,
          attemptId: input.attemptId,
          callId: input.callId,
          executionId: input.action.executionId,
          generation: input.generation,
          leaseExpiresAt: input.leaseExpiresAt,
        };
      })
      .immediate();
  }

  allocateToolAttempt(input: {
    readonly action: StoredAction;
    readonly allocatedAt: string;
    readonly attemptId: string;
    readonly callId: string;
    readonly generation: number;
    readonly leaseExpiresAt: string;
    readonly modelToolCallId: string;
    readonly ownerId: string;
    readonly requestDigest: string;
    readonly snapshot: ToolAttemptSnapshot;
    readonly snapshotDigest: string;
    readonly toolName: string;
    readonly toolVersion: string;
  }): AllocatedToolAttempt | undefined {
    return this.database
      .transaction(() => {
        const action = this.database
          .query<{ input_digest: string; status: string }, [string]>(
            "SELECT input_digest,status FROM actions WHERE action_id = ?",
          )
          .get(input.action.actionId);
        if (!action || action.status !== "proposed") return undefined;
        if (action.input_digest !== input.action.inputDigest)
          throw new Error("ATTEMPT_ACTION_DIGEST_MISMATCH");
        if (hash(input.snapshot) !== input.snapshotDigest)
          throw new Error("ATTEMPT_SNAPSHOT_DIGEST_MISMATCH");
        this.database.run(
          "INSERT OR IGNORE INTO executions(execution_id,version,generation,status,cancellation_requested,updated_at) VALUES (?,?,?,?,?,?)",
          [input.action.executionId, 0, 0, "active", 0, input.allocatedAt],
        );
        const execution = this.database
          .query<
            {
              cancellation_requested: number;
              generation: number;
              status: string;
            },
            [string]
          >(
            "SELECT cancellation_requested,generation,status FROM executions WHERE execution_id = ?",
          )
          .get(input.action.executionId);
        if (
          !execution ||
          execution.cancellation_requested === 1 ||
          execution.generation + 1 !== input.generation ||
          !["active", "completed", "failed", "delivery-unknown"].includes(
            execution.status,
          )
        )
          return undefined;
        if (input.action.gateClass === "binding-human-requested") {
          const gate = this.database
            .query<
              { expires_at: string; payload_digest: string; status: string },
              [string]
            >(
              "SELECT expires_at,payload_digest,status FROM gates WHERE action_id = ? ORDER BY created_at DESC LIMIT 1",
            )
            .get(input.action.actionId);
          if (
            gate?.status !== "approved" ||
            gate.payload_digest !== input.action.inputDigest ||
            Date.parse(gate.expires_at) <= Date.parse(input.allocatedAt)
          )
            return undefined;
        }
        const revoked = new Set(
          this.database
            .query<{ capability: string }, []>(
              "SELECT capability FROM capability_revocations",
            )
            .all()
            .map(({ capability }) => capability),
        );
        if (
          input.action.requestedCapabilities.some((capability) =>
            revoked.has(capability),
          )
        )
          return undefined;
        this.database.run(
          "UPDATE provider_calls SET status = CASE dispatch_state WHEN 'dispatched' THEN 'delivery-unknown' ELSE 'failed' END, completed_at = ?, error_code = 'ATTEMPT_FENCED', usage_state = 'UNKNOWN', delivery_certainty = CASE dispatch_state WHEN 'dispatched' THEN 'UNKNOWN' ELSE 'NOT_DELIVERED' END WHERE attempt_id IN (SELECT attempt_id FROM attempts WHERE execution_id = ? AND status = 'running') AND status = 'allocated'",
          [input.allocatedAt, input.action.executionId],
        );
        this.database.run(
          "UPDATE tool_calls SET status = CASE dispatch_state WHEN 'dispatched' THEN 'delivery-unknown' ELSE 'failed' END, completed_at = ?, error_code = 'ATTEMPT_FENCED', delivery_certainty = CASE dispatch_state WHEN 'dispatched' THEN 'UNKNOWN' ELSE 'NOT_DELIVERED' END WHERE attempt_id IN (SELECT attempt_id FROM attempts WHERE execution_id = ? AND status = 'running') AND status = 'allocated'",
          [input.allocatedAt, input.action.executionId],
        );
        this.database.run(
          "UPDATE actions SET status = 'delivery-unknown', updated_at = ?, error_code = 'ATTEMPT_FENCED' WHERE action_id IN (SELECT action_id FROM attempts WHERE execution_id = ? AND status = 'running')",
          [input.allocatedAt, input.action.executionId],
        );
        this.database.run(
          "UPDATE attempts SET status = 'delivery-unknown', updated_at = ? WHERE execution_id = ? AND status = 'running'",
          [input.allocatedAt, input.action.executionId],
        );
        this.database.run(
          "UPDATE executions SET version = version + 1, generation = ?, status = 'active', updated_at = ? WHERE execution_id = ?",
          [input.generation, input.allocatedAt, input.action.executionId],
        );
        this.database.run(
          "INSERT INTO attempts(attempt_id,action_id,execution_id,generation,owner_id,status,lease_expires_at,heartbeat_at,snapshot_digest,snapshot_json,catalog_digest,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)",
          [
            input.attemptId,
            input.action.actionId,
            input.action.executionId,
            input.generation,
            input.ownerId,
            "running",
            input.leaseExpiresAt,
            input.allocatedAt,
            input.snapshotDigest,
            canonicalJson(input.snapshot),
            input.snapshot.catalogDigest,
            input.allocatedAt,
            input.allocatedAt,
          ],
        );
        this.database.run(
          "UPDATE actions SET status = 'running', updated_at = ? WHERE action_id = ? AND status = 'proposed'",
          [input.allocatedAt, input.action.actionId],
        );
        this.database.run(
          "INSERT INTO tool_calls(call_id,action_id,attempt_id,generation,tool_name,tool_version,model_tool_call_id,request_digest,catalog_digest,dispatch_state,delivery_certainty,status,allocated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)",
          [
            input.callId,
            input.action.actionId,
            input.attemptId,
            input.generation,
            input.toolName,
            input.toolVersion,
            input.modelToolCallId,
            input.requestDigest,
            input.snapshot.catalogDigest,
            "armed",
            "NOT_DISPATCHED",
            "allocated",
            input.allocatedAt,
          ],
        );
        return {
          actionId: input.action.actionId,
          attemptId: input.attemptId,
          callId: input.callId,
          executionId: input.action.executionId,
          generation: input.generation,
          leaseExpiresAt: input.leaseExpiresAt,
        };
      })
      .immediate();
  }

  authorizeToolDispatch(input: {
    readonly actionId: string;
    readonly attemptId: string;
    readonly callId: string;
    readonly generation: number;
    readonly now: string;
    readonly requestDigest: string;
  }): "authorized" | "denied" {
    return this.database
      .transaction(() => {
        const row = this.database
          .query<
            {
              action_status: string;
              attempt_status: string;
              cancellation_requested: number;
              current_generation: number;
              dispatch_state: string;
              lease_expires_at: string;
              request_digest: string;
              requested_capabilities_json: string;
              snapshot_json: string;
            },
            [string, string, string]
          >(
            "SELECT actions.status AS action_status,actions.requested_capabilities_json,attempts.status AS attempt_status,attempts.snapshot_json,attempts.lease_expires_at,executions.cancellation_requested,executions.generation AS current_generation,tool_calls.dispatch_state,tool_calls.request_digest FROM tool_calls JOIN attempts ON attempts.attempt_id = tool_calls.attempt_id JOIN actions ON actions.action_id = tool_calls.action_id JOIN executions ON executions.execution_id = attempts.execution_id WHERE tool_calls.call_id = ? AND attempts.attempt_id = ? AND actions.action_id = ?",
          )
          .get(input.callId, input.attemptId, input.actionId);
        const requested = row
          ? (JSON.parse(row.requested_capabilities_json) as string[])
          : [];
        const snapshot = row
          ? (JSON.parse(row.snapshot_json) as ToolAttemptSnapshot)
          : undefined;
        const revoked = new Set(
          this.database
            .query<{ capability: string }, []>(
              "SELECT capability FROM capability_revocations",
            )
            .all()
            .map(({ capability }) => capability),
        );
        if (
          !row ||
          row.action_status !== "running" ||
          row.attempt_status !== "running" ||
          row.cancellation_requested === 1 ||
          row.current_generation !== input.generation ||
          row.dispatch_state !== "armed" ||
          row.request_digest !== input.requestDigest ||
          !snapshot ||
          requested.some(
            (capability) =>
              !snapshot.grantedCapabilities.includes(capability) ||
              revoked.has(capability),
          ) ||
          Date.parse(row.lease_expires_at) <= Date.parse(input.now)
        )
          return "denied";
        this.database.run(
          "UPDATE tool_calls SET dispatch_state = 'dispatched', dispatched_at = ?, delivery_certainty = 'UNKNOWN' WHERE call_id = ? AND dispatch_state = 'armed'",
          [input.now, input.callId],
        );
        return "authorized";
      })
      .immediate();
  }

  authorizeProviderDispatch(input: {
    readonly actionId: string;
    readonly attemptId: string;
    readonly callId: string;
    readonly generation: number;
    readonly now: string;
    readonly requestDigest: string;
  }): "authorized" | "denied" {
    return this.database
      .transaction(() => {
        const row = this.database
          .query<
            {
              action_status: string;
              attempt_status: string;
              cancellation_requested: number;
              current_generation: number;
              dispatch_state: string;
              lease_expires_at: string;
              requested_capabilities_json: string;
              request_digest: string;
              snapshot_json: string;
            },
            [string, string, string]
          >(
            "SELECT actions.status AS action_status,actions.requested_capabilities_json,attempts.status AS attempt_status,attempts.snapshot_json,executions.cancellation_requested,executions.generation AS current_generation,provider_calls.dispatch_state,attempts.lease_expires_at,provider_calls.request_digest FROM provider_calls JOIN attempts ON attempts.attempt_id = provider_calls.attempt_id JOIN actions ON actions.action_id = provider_calls.action_id JOIN executions ON executions.execution_id = attempts.execution_id WHERE provider_calls.call_id = ? AND attempts.attempt_id = ? AND actions.action_id = ?",
          )
          .get(input.callId, input.attemptId, input.actionId);
        const requested = row
          ? (JSON.parse(row.requested_capabilities_json) as string[])
          : [];
        const snapshot = row
          ? (JSON.parse(row.snapshot_json) as ProviderAttemptSnapshot)
          : undefined;
        const revoked = new Set(
          this.database
            .query<{ capability: string }, []>(
              "SELECT capability FROM capability_revocations",
            )
            .all()
            .map(({ capability }) => capability),
        );
        if (
          !row ||
          row.action_status !== "running" ||
          row.attempt_status !== "running" ||
          row.cancellation_requested === 1 ||
          row.current_generation !== input.generation ||
          row.dispatch_state !== "armed" ||
          row.request_digest !== input.requestDigest ||
          !snapshot ||
          requested.some(
            (capability) =>
              !snapshot.grantedCapabilities.includes(capability) ||
              revoked.has(capability),
          ) ||
          Date.parse(row.lease_expires_at) <= Date.parse(input.now)
        )
          return "denied";
        this.database.run(
          "UPDATE provider_calls SET dispatch_state = 'dispatched', dispatched_at = ?, delivery_certainty = 'UNKNOWN' WHERE call_id = ? AND dispatch_state = 'armed'",
          [input.now, input.callId],
        );
        return "authorized";
      })
      .immediate();
  }

  completeProviderCall(input: {
    readonly actionId: string;
    readonly attemptId: string;
    readonly callId: string;
    readonly completedAt: string;
    readonly errorCode?: string;
    readonly event: ProposedEvent;
    readonly generation: number;
    readonly outputDigest: string;
    readonly status: "cancelled" | "delivery-unknown" | "failed" | "succeeded";
    readonly usage: unknown;
    readonly usageState: "ESTIMATED" | "REPORTED" | "UNKNOWN";
  }): "committed" | "stale" {
    return this.database
      .transaction(() => {
        const row = this.database
          .query<
            {
              attempt_status: string;
              cancellation_requested: number;
              current_generation: number;
              execution_id: string;
              lease_expires_at: string;
            },
            [string, string, string]
          >(
            "SELECT attempts.status AS attempt_status,attempts.lease_expires_at,executions.cancellation_requested,executions.generation AS current_generation,attempts.execution_id FROM provider_calls JOIN attempts ON attempts.attempt_id = provider_calls.attempt_id JOIN executions ON executions.execution_id = attempts.execution_id WHERE provider_calls.call_id = ? AND attempts.attempt_id = ? AND provider_calls.action_id = ?",
          )
          .get(input.callId, input.attemptId, input.actionId);
        if (
          !row ||
          row.attempt_status !== "running" ||
          row.current_generation !== input.generation ||
          row.cancellation_requested === 1 ||
          Date.parse(row.lease_expires_at) <= Date.parse(input.completedAt)
        ) {
          const receipt = {
            ...input,
            event: input.event,
            usage: input.usage,
          };
          this.database.run(
            "INSERT OR IGNORE INTO quarantined_receipts(receipt_id,action_id,attempt_id,call_id,generation,reason,body_json,received_at) VALUES (?,?,?,?,?,?,?,?)",
            [
              hash(receipt),
              input.actionId,
              input.attemptId,
              input.callId,
              input.generation,
              "STALE_OR_CANCELLED_GENERATION",
              canonicalJson(receipt),
              input.completedAt,
            ],
          );
          return "stale";
        }
        const attemptStatus =
          input.status === "cancelled" ? "cancelled" : input.status;
        const actionStatus =
          input.status === "cancelled" ? "failed" : input.status;
        const callStatus =
          input.status === "cancelled" ? "failed" : input.status;
        const executionStatus =
          input.status === "succeeded"
            ? "completed"
            : input.status === "delivery-unknown"
              ? "delivery-unknown"
              : input.status === "cancelled"
                ? "cancelled"
                : "failed";
        const certainty =
          input.status === "delivery-unknown"
            ? "UNKNOWN"
            : input.status === "succeeded"
              ? "DELIVERED"
              : "NOT_DELIVERED";
        this.database.run(
          "UPDATE provider_calls SET status = ?, completed_at = ?, output_digest = ?, error_code = ?, usage_state = ?, usage_json = ?, delivery_certainty = ? WHERE call_id = ?",
          [
            callStatus,
            input.completedAt,
            input.outputDigest,
            input.errorCode ?? null,
            input.usageState,
            canonicalJson(input.usage),
            certainty,
            input.callId,
          ],
        );
        this.database.run(
          "UPDATE attempts SET status = ?, updated_at = ? WHERE attempt_id = ? AND generation = ?",
          [attemptStatus, input.completedAt, input.attemptId, input.generation],
        );
        this.database.run(
          "UPDATE actions SET status = ?, updated_at = ?, output_digest = ?, error_code = ? WHERE action_id = ?",
          [
            actionStatus,
            input.completedAt,
            input.outputDigest,
            input.errorCode ?? null,
            input.actionId,
          ],
        );
        this.database.run(
          "UPDATE executions SET status = ?, version = version + 1, updated_at = ? WHERE execution_id = ? AND generation = ? AND NOT EXISTS (SELECT 1 FROM workflow_instances WHERE workflow_instances.execution_id = executions.execution_id)",
          [
            executionStatus,
            input.completedAt,
            row.execution_id,
            input.generation,
          ],
        );
        const result = admitInTransaction(this.database, {
          acceptedAt: input.completedAt,
          actorId: "curiosity-kernel",
          commandDigest: input.outputDigest,
          commandId: `${input.callId}:${input.status}`,
          events: [input.event],
          nonce: `${input.callId}:${input.status}`,
          pluginId: "curiosity.kernel.attempts",
        });
        if (result._tag === "Conflict")
          throw new Error("RECEIPT_EVENT_CONFLICT");
        return "committed";
      })
      .immediate();
  }

  completeToolCall(input: {
    readonly actionId: string;
    readonly attemptId: string;
    readonly callId: string;
    readonly completedAt: string;
    readonly errorCode?: string;
    readonly event: ProposedEvent;
    readonly generation: number;
    readonly outputDigest: string;
    readonly status: "cancelled" | "delivery-unknown" | "failed" | "succeeded";
  }): "committed" | "stale" {
    return this.database
      .transaction(() => {
        const row = this.database
          .query<
            {
              attempt_status: string;
              cancellation_requested: number;
              current_generation: number;
              execution_id: string;
              lease_expires_at: string;
            },
            [string, string, string]
          >(
            "SELECT attempts.status AS attempt_status,attempts.lease_expires_at,executions.cancellation_requested,executions.generation AS current_generation,attempts.execution_id FROM tool_calls JOIN attempts ON attempts.attempt_id = tool_calls.attempt_id JOIN executions ON executions.execution_id = attempts.execution_id WHERE tool_calls.call_id = ? AND attempts.attempt_id = ? AND tool_calls.action_id = ?",
          )
          .get(input.callId, input.attemptId, input.actionId);
        if (
          !row ||
          row.attempt_status !== "running" ||
          row.current_generation !== input.generation ||
          row.cancellation_requested === 1 ||
          Date.parse(row.lease_expires_at) <= Date.parse(input.completedAt)
        ) {
          const receipt = { ...input, event: input.event };
          this.database.run(
            "INSERT OR IGNORE INTO quarantined_receipts(receipt_id,action_id,attempt_id,call_id,generation,reason,body_json,received_at) VALUES (?,?,?,?,?,?,?,?)",
            [
              hash(receipt),
              input.actionId,
              input.attemptId,
              input.callId,
              input.generation,
              "STALE_OR_CANCELLED_GENERATION",
              canonicalJson(receipt),
              input.completedAt,
            ],
          );
          return "stale";
        }
        const attemptStatus =
          input.status === "cancelled" ? "cancelled" : input.status;
        const actionStatus =
          input.status === "cancelled" ? "failed" : input.status;
        const callStatus =
          input.status === "cancelled" ? "failed" : input.status;
        const executionStatus =
          input.status === "succeeded"
            ? "completed"
            : input.status === "delivery-unknown"
              ? "delivery-unknown"
              : input.status === "cancelled"
                ? "cancelled"
                : "failed";
        const certainty =
          input.status === "delivery-unknown"
            ? "UNKNOWN"
            : input.status === "succeeded"
              ? "DELIVERED"
              : "NOT_DELIVERED";
        this.database.run(
          "UPDATE tool_calls SET status = ?, completed_at = ?, output_digest = ?, error_code = ?, delivery_certainty = ? WHERE call_id = ?",
          [
            callStatus,
            input.completedAt,
            input.outputDigest,
            input.errorCode ?? null,
            certainty,
            input.callId,
          ],
        );
        this.database.run(
          "UPDATE attempts SET status = ?, updated_at = ? WHERE attempt_id = ? AND generation = ?",
          [attemptStatus, input.completedAt, input.attemptId, input.generation],
        );
        this.database.run(
          "UPDATE actions SET status = ?, updated_at = ?, output_digest = ?, error_code = ? WHERE action_id = ?",
          [
            actionStatus,
            input.completedAt,
            input.outputDigest,
            input.errorCode ?? null,
            input.actionId,
          ],
        );
        this.database.run(
          "UPDATE executions SET status = ?, version = version + 1, updated_at = ? WHERE execution_id = ? AND generation = ? AND NOT EXISTS (SELECT 1 FROM workflow_instances WHERE workflow_instances.execution_id = executions.execution_id)",
          [
            executionStatus,
            input.completedAt,
            row.execution_id,
            input.generation,
          ],
        );
        const result = admitInTransaction(this.database, {
          acceptedAt: input.completedAt,
          actorId: "curiosity-kernel",
          commandDigest: input.outputDigest,
          commandId: `${input.callId}:${input.status}`,
          events: [input.event],
          nonce: `${input.callId}:${input.status}`,
          pluginId: "curiosity.kernel.attempts",
        });
        if (result._tag === "Conflict")
          throw new Error("RECEIPT_EVENT_CONFLICT");
        return "committed";
      })
      .immediate();
  }

  interruptedProviderCalls(): readonly (StoredAction & {
    readonly attemptId: string;
    readonly callId: string;
    readonly dispatchState: "armed" | "dispatched";
    readonly generation: number;
  })[] {
    return this.database
      .query<ActiveProviderRow, []>(
        "SELECT actions.*,attempts.attempt_id,attempts.generation,provider_calls.call_id,provider_calls.dispatch_state FROM actions JOIN attempts ON attempts.action_id = actions.action_id JOIN provider_calls ON provider_calls.attempt_id = attempts.attempt_id WHERE actions.status = 'running' AND attempts.status = 'running' AND provider_calls.status = 'allocated' ORDER BY actions.action_id,attempts.generation",
      )
      .all()
      .map((row) => ({
        ...toAction(row),
        attemptId: row.attempt_id,
        callId: row.call_id,
        dispatchState: row.dispatch_state,
        generation: row.generation,
      }));
  }

  interruptedToolCalls(): readonly (StoredAction & {
    readonly attemptId: string;
    readonly callId: string;
    readonly dispatchState: "armed" | "dispatched";
    readonly generation: number;
  })[] {
    return this.database
      .query<ActiveToolRow, []>(
        "SELECT actions.*,attempts.attempt_id,attempts.generation,tool_calls.call_id,tool_calls.dispatch_state FROM actions JOIN attempts ON attempts.action_id = actions.action_id JOIN tool_calls ON tool_calls.attempt_id = attempts.attempt_id WHERE actions.status = 'running' AND attempts.status = 'running' AND tool_calls.status = 'allocated' ORDER BY actions.action_id,attempts.generation",
      )
      .all()
      .map((row) => ({
        ...toAction(row),
        attemptId: row.attempt_id,
        callId: row.call_id,
        dispatchState: row.dispatch_state,
        generation: row.generation,
      }));
  }

  cancelExecution(
    input: AdmissionInput & {
      readonly executionId: string;
    },
  ): AdmissionResult {
    return this.database
      .transaction(() => {
        const result = admitInTransaction(this.database, input);
        if (
          result._tag === "Conflict" ||
          result.acknowledgement.disposition === "duplicate"
        )
          return result;
        const execution = this.database
          .query<{ execution_id: string }, [string]>(
            "SELECT execution_id FROM executions WHERE execution_id = ?",
          )
          .get(input.executionId);
        if (!execution) throw new Error("EXECUTION_NOT_FOUND");
        runFinalized(
          this.database,
          "UPDATE executions SET cancellation_requested = 1, generation = generation + 1, status = 'cancelled', version = version + 1, updated_at = ? WHERE execution_id = ? OR execution_id IN (SELECT descendant_execution_id FROM execution_ancestry WHERE ancestor_execution_id = ?)",
          [input.acceptedAt, input.executionId, input.executionId],
        );
        runFinalized(
          this.database,
          "UPDATE attempts SET status = 'cancelled', updated_at = ? WHERE (execution_id = ? OR execution_id IN (SELECT descendant_execution_id FROM execution_ancestry WHERE ancestor_execution_id = ?)) AND status = 'running'",
          [input.acceptedAt, input.executionId, input.executionId],
        );
        runFinalized(
          this.database,
          "UPDATE provider_calls SET status = 'failed', completed_at = ?, error_code = 'ACTION_CANCELLED', usage_state = 'UNKNOWN', delivery_certainty = CASE dispatch_state WHEN 'dispatched' THEN 'UNKNOWN' ELSE 'NOT_DELIVERED' END WHERE attempt_id IN (SELECT attempt_id FROM attempts WHERE execution_id = ? OR execution_id IN (SELECT descendant_execution_id FROM execution_ancestry WHERE ancestor_execution_id = ?)) AND status = 'allocated'",
          [input.acceptedAt, input.executionId, input.executionId],
        );
        runFinalized(
          this.database,
          "UPDATE tool_calls SET status = 'failed', completed_at = ?, error_code = 'ACTION_CANCELLED', delivery_certainty = CASE dispatch_state WHEN 'dispatched' THEN 'UNKNOWN' ELSE 'NOT_DELIVERED' END WHERE attempt_id IN (SELECT attempt_id FROM attempts WHERE execution_id = ? OR execution_id IN (SELECT descendant_execution_id FROM execution_ancestry WHERE ancestor_execution_id = ?)) AND status = 'allocated'",
          [input.acceptedAt, input.executionId, input.executionId],
        );
        runFinalized(
          this.database,
          "UPDATE actions SET status = 'failed', updated_at = ?, error_code = 'ACTION_CANCELLED' WHERE (execution_id = ? OR execution_id IN (SELECT descendant_execution_id FROM execution_ancestry WHERE ancestor_execution_id = ?)) AND status IN ('proposed', 'running')",
          [input.acceptedAt, input.executionId, input.executionId],
        );
        runFinalized(
          this.database,
          "UPDATE workflow_instances SET status = 'cancelled', error_code = 'WORKFLOW_CANCELLED', updated_at = ? WHERE (execution_id = ? OR execution_id IN (SELECT descendant_execution_id FROM execution_ancestry WHERE ancestor_execution_id = ?)) AND status IN ('running', 'completion-requested')",
          [input.acceptedAt, input.executionId, input.executionId],
        );
        return result;
      })
      .immediate();
  }

  isExecutionCancelled(executionId: string): boolean {
    return (
      this.database
        .query<{ cancellation_requested: number }, [string]>(
          "SELECT cancellation_requested FROM executions WHERE execution_id = ?",
        )
        .get(executionId)?.cancellation_requested === 1
    );
  }

  isActionDispatchReady(action: StoredAction, now: string): boolean {
    if (action.gateClass === "none-requested") return true;
    const gate = this.database
      .query<
        { expires_at: string; payload_digest: string; status: string },
        [string]
      >(
        "SELECT expires_at,payload_digest,status FROM gates WHERE action_id = ? ORDER BY proposal_revision DESC LIMIT 1",
      )
      .get(action.actionId);
    return (
      gate?.status === "approved" &&
      gate.payload_digest === action.inputDigest &&
      Date.parse(gate.expires_at) > Date.parse(now)
    );
  }

  createGate(input: {
    readonly actionId: string;
    readonly createdAt: string;
    readonly eligibleActorId: string;
    readonly expiresAt: string;
    readonly gateId: string;
    readonly payloadDigest: string;
    readonly policyVersion: string;
    readonly proposalRevision: number;
  }): void {
    this.database
      .transaction(() => {
        const action = this.database
          .query<{ gate_class: string; input_digest: string }, [string]>(
            "SELECT gate_class,input_digest FROM actions WHERE action_id = ?",
          )
          .get(input.actionId);
        if (
          action?.gate_class !== "binding-human-requested" ||
          action.input_digest !== input.payloadDigest
        )
          throw new Error("GATE_ACTION_BINDING_INVALID");
        this.database.run(
          "INSERT INTO gates(gate_id,action_id,proposal_revision,payload_digest,policy_version,eligible_actor_id,status,expires_at,created_at) VALUES (?,?,?,?,?,?,?,?,?)",
          [
            input.gateId,
            input.actionId,
            input.proposalRevision,
            input.payloadDigest,
            input.policyVersion,
            input.eligibleActorId,
            "pending",
            input.expiresAt,
            input.createdAt,
          ],
        );
      })
      .immediate();
  }

  decideGate(
    input: AdmissionInput & {
      readonly actorId: string;
      readonly decidedAt: string;
      readonly decision: "approved" | "denied";
      readonly decisionCommandId: string;
      readonly gateId: string;
      readonly payloadDigest: string;
      readonly proposalRevision: number;
    },
  ): AdmissionResult {
    return this.database
      .transaction(() => {
        const result = admitInTransaction(this.database, input);
        if (
          result._tag === "Conflict" ||
          result.acknowledgement.disposition === "duplicate"
        )
          return result;
        const gate = this.database
          .query<
            {
              eligible_actor_id: string;
              expires_at: string;
              payload_digest: string;
              proposal_revision: number;
              status: string;
            },
            [string]
          >(
            "SELECT eligible_actor_id,expires_at,payload_digest,proposal_revision,status FROM gates WHERE gate_id = ?",
          )
          .get(input.gateId);
        if (
          gate?.status !== "pending" ||
          gate.eligible_actor_id !== input.actorId ||
          gate.payload_digest !== input.payloadDigest ||
          gate.proposal_revision !== input.proposalRevision ||
          Date.parse(gate.expires_at) <= Date.parse(input.decidedAt)
        )
          throw new Error("GATE_DECISION_DENIED");
        this.database.run(
          "UPDATE gates SET status = ?, decided_at = ?, decision_command_id = ? WHERE gate_id = ? AND status = 'pending'",
          [
            input.decision,
            input.decidedAt,
            input.decisionCommandId,
            input.gateId,
          ],
        );
        if (input.decision === "denied")
          this.database.run(
            "UPDATE actions SET status = 'failed', updated_at = ?, error_code = 'GATE_DENIED' WHERE action_id = (SELECT action_id FROM gates WHERE gate_id = ?) AND status = 'proposed'",
            [input.decidedAt, input.gateId],
          );
        return result;
      })
      .immediate();
  }

  revokeCapability(input: {
    readonly capability: string;
    readonly reason: string;
    readonly revokedAt: string;
  }): void {
    this.database.run(
      "INSERT OR REPLACE INTO capability_revocations(capability,revoked_at,reason) VALUES (?,?,?)",
      [input.capability, input.revokedAt, input.reason],
    );
  }
}
