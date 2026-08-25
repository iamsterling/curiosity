import type { Database } from "bun:sqlite";
import type { StoredAction } from "../domain/action.js";
import type { ProposedEvent } from "../domain/event.js";
import { canonicalJson } from "../kernel/canonical-json.js";
import { admitInTransaction } from "./event-append.js";

interface ActionRow {
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
  readonly resource: string;
  readonly requested_capabilities_json: string;
  readonly source_event_id: string;
  readonly status: StoredAction["status"];
  readonly updated_at: string;
}

export interface ProposedActionRecord {
  readonly actionId: string;
  readonly actionSchemaVersion: number;
  readonly actionType: string;
  readonly deadlineClass: StoredAction["deadlineClass"];
  readonly executionId: string;
  readonly gateClass: StoredAction["gateClass"];
  readonly input: unknown;
  readonly inputDigest: string;
  readonly pluginId: string;
  readonly reactorId: string;
  readonly resource: string;
  readonly requestedCapabilities: readonly string[];
  readonly sourceEventId: string;
}

export interface ReactionCommit {
  readonly acceptedAt: string;
  readonly actions: readonly ProposedActionRecord[];
  readonly events: readonly ProposedEvent[];
  readonly outputDigest: string;
  readonly pluginId: string;
  readonly gateEligibleActorId: string;
  readonly gateExpiresAt: string;
  readonly reactionId: string;
  readonly reactorId: string;
  readonly reactorVersion: number;
  readonly sourceEventId: string;
}

const toAction = (row: ActionRow): StoredAction => ({
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
  resource: row.resource,
  requestedCapabilities: JSON.parse(
    row.requested_capabilities_json,
  ) as string[],
  sourceEventId: row.source_event_id,
  status: row.status,
  updatedAt: row.updated_at,
});

export class ActionJournal {
  constructor(private readonly database: Database) {}

  beginReaction(input: {
    readonly pluginId: string;
    readonly reactorId: string;
    readonly reactorVersion: number;
    readonly sourceEventId: string;
    readonly startedAt: string;
  }): "claimed" | "completed" {
    return this.database
      .transaction(() => {
        this.database.run(
          "INSERT OR IGNORE INTO reaction_runs(source_event_id,reactor_id,reactor_version,plugin_id,status,started_at) VALUES (?,?,?,?,?,?)",
          [
            input.sourceEventId,
            input.reactorId,
            input.reactorVersion,
            input.pluginId,
            "running",
            input.startedAt,
          ],
        );
        const row = this.database
          .query<{ status: string }, [string, string, number]>(
            "SELECT status FROM reaction_runs WHERE source_event_id = ? AND reactor_id = ? AND reactor_version = ?",
          )
          .get(input.sourceEventId, input.reactorId, input.reactorVersion);
        if (row?.status === "completed") return "completed";
        this.database.run(
          "UPDATE reaction_runs SET status = 'running', started_at = ?, completed_at = NULL WHERE source_event_id = ? AND reactor_id = ? AND reactor_version = ?",
          [
            input.startedAt,
            input.sourceEventId,
            input.reactorId,
            input.reactorVersion,
          ],
        );
        return "claimed";
      })
      .immediate();
  }

  completeReaction(input: ReactionCommit): void {
    this.database
      .transaction(() => {
        const row = this.database
          .query<{ status: string }, [string, string, number]>(
            "SELECT status FROM reaction_runs WHERE source_event_id = ? AND reactor_id = ? AND reactor_version = ?",
          )
          .get(input.sourceEventId, input.reactorId, input.reactorVersion);
        if (row?.status === "completed") return;
        if (row?.status !== "running") throw new Error("REACTION_NOT_CLAIMED");
        if (input.events.length > 0) {
          const result = admitInTransaction(this.database, {
            acceptedAt: input.acceptedAt,
            actorId: "curiosity-kernel",
            commandDigest: input.outputDigest,
            commandId: input.reactionId,
            events: input.events,
            nonce: input.reactionId,
            pluginId: input.pluginId,
          });
          if (result._tag === "Conflict")
            throw new Error("REACTION_OUTPUT_CONFLICT");
        }
        for (const action of input.actions) {
          this.database.run(
            "INSERT OR IGNORE INTO executions(execution_id,version,generation,status,cancellation_requested,updated_at) VALUES (?,?,?,?,?,?)",
            [action.executionId, 0, 0, "active", 0, input.acceptedAt],
          );
          this.database.run(
            "INSERT INTO actions(action_id,source_event_id,reactor_id,plugin_id,action_type,action_schema_version,execution_id,resource,gate_class,deadline_class,input_json,input_digest,requested_capabilities_json,status,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
            [
              action.actionId,
              action.sourceEventId,
              action.reactorId,
              action.pluginId,
              action.actionType,
              action.actionSchemaVersion,
              action.executionId,
              action.resource,
              action.gateClass,
              action.deadlineClass,
              canonicalJson(action.input),
              action.inputDigest,
              canonicalJson(action.requestedCapabilities),
              "proposed",
              input.acceptedAt,
              input.acceptedAt,
            ],
          );
          if (action.gateClass === "binding-human-requested")
            this.database.run(
              "INSERT INTO gates(gate_id,action_id,proposal_revision,payload_digest,policy_version,eligible_actor_id,status,expires_at,created_at) VALUES (?,?,?,?,?,?,?,?,?)",
              [
                `gate:${action.actionId}:1`,
                action.actionId,
                1,
                action.inputDigest,
                "local-v1",
                input.gateEligibleActorId,
                "pending",
                input.gateExpiresAt,
                input.acceptedAt,
              ],
            );
        }
        this.database.run(
          "UPDATE reaction_runs SET status = 'completed', completed_at = ?, output_digest = ? WHERE source_event_id = ? AND reactor_id = ? AND reactor_version = ?",
          [
            input.acceptedAt,
            input.outputDigest,
            input.sourceEventId,
            input.reactorId,
            input.reactorVersion,
          ],
        );
      })
      .immediate();
  }

  proposedActions(): readonly StoredAction[] {
    return this.database
      .query<ActionRow, []>(
        "SELECT * FROM actions WHERE status = 'proposed' ORDER BY created_at, action_id",
      )
      .all()
      .map(toAction);
  }

  completeAction(input: {
    readonly actionId: string;
    readonly callId?: string;
    readonly completedAt: string;
    readonly errorCode?: string;
    readonly event: ProposedEvent;
    readonly outputDigest: string;
    readonly status: "delivery-unknown" | "failed" | "succeeded";
  }): void {
    this.database
      .transaction(() => {
        const row = this.database
          .query<{ execution_id: string; status: string }, [string]>(
            "SELECT execution_id,status FROM actions WHERE action_id = ?",
          )
          .get(input.actionId);
        if (!row) throw new Error("ACTION_NOT_FOUND");
        if (["succeeded", "failed", "delivery-unknown"].includes(row.status))
          return;
        this.database.run(
          "UPDATE actions SET status = ?, updated_at = ?, output_digest = ?, error_code = ? WHERE action_id = ?",
          [
            input.status,
            input.completedAt,
            input.outputDigest,
            input.errorCode ?? null,
            input.actionId,
          ],
        );
        this.database.run(
          "UPDATE executions SET status = ?, version = version + 1, updated_at = ? WHERE execution_id = ? AND cancellation_requested = 0 AND NOT EXISTS (SELECT 1 FROM workflow_instances WHERE workflow_instances.execution_id = executions.execution_id)",
          [
            input.status === "succeeded"
              ? "completed"
              : input.status === "delivery-unknown"
                ? "delivery-unknown"
                : "failed",
            input.completedAt,
            row.execution_id,
          ],
        );
        if (input.callId)
          this.database.run(
            "UPDATE provider_calls SET status = ?, completed_at = ?, output_digest = ?, error_code = ? WHERE call_id = ?",
            [
              input.status,
              input.completedAt,
              input.outputDigest,
              input.errorCode ?? null,
              input.callId,
            ],
          );
        const result = admitInTransaction(this.database, {
          acceptedAt: input.completedAt,
          actorId: "curiosity-kernel",
          commandDigest: input.outputDigest,
          commandId: `${input.actionId}:${input.status}`,
          events: [input.event],
          nonce: `${input.actionId}:${input.status}`,
          pluginId: "curiosity.kernel.actions",
        });
        if (result._tag === "Conflict")
          throw new Error("ACTION_OUTPUT_CONFLICT");
      })
      .immediate();
  }
}
