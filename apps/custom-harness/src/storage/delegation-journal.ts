import type { Database } from "bun:sqlite";
import { createHash } from "node:crypto";
import type { StoredAction } from "../domain/action.js";
import { canonicalJson } from "../kernel/canonical-json.js";
import { admitInTransaction } from "./event-append.js";

export interface ChildAllocationRecord {
  readonly agentId: string;
  readonly agentRunId: string;
  readonly agentSessionId: string;
  readonly agentVersion: string;
  readonly budgetSnapshot: {
    readonly maximumProviderCalls: number;
    readonly maximumToolCalls: number;
  };
  readonly capabilityCeiling: readonly string[];
  readonly catalogDigest: string;
  readonly childExecutionId: string;
  readonly childProviderActionId: string;
  readonly childProviderInput: unknown;
  readonly continuationExpectedRevision?: number;
  readonly delegationGroupId: string;
  readonly expectedChildren: number;
  readonly modelToolCallId: string;
  readonly ordinal: number;
  readonly parentExecutionId: string;
  readonly parentProviderActionId: string;
  readonly rootExecutionId: string;
  readonly resourceClaims: {
    readonly mode: "shared-read";
    readonly resources: readonly string[];
    readonly scopeState: "declared" | "unknown-no-write-authority";
  };
  readonly sessionRevision: number;
  readonly task: unknown;
  readonly taskMessage: string;
  readonly toolCeiling: readonly string[];
}

export interface StoredAgentSession {
  readonly agentId: string;
  readonly agentVersion: string;
  readonly capabilityCeiling: readonly string[];
  readonly depth: number;
  readonly messages: readonly {
    readonly content: string;
    readonly role: "assistant" | "user";
  }[];
  readonly parentExecutionId: string;
  readonly revision: number;
  readonly rootExecutionId: string;
  readonly status: "busy" | "idle";
  readonly toolCeiling: readonly string[];
}

export interface ChildRunProjection {
  readonly agentId: string;
  readonly agentRunId: string;
  readonly agentSessionId: string;
  readonly budget: {
    readonly maximumProviderCalls: number;
    readonly maximumToolCalls: number;
  };
  readonly childExecutionId: string;
  readonly delegationGroupId: string;
  readonly ordinal: number;
  readonly parentExecutionId: string;
  readonly resourceClaims: {
    readonly mode: string;
    readonly resources: readonly string[];
    readonly scopeState: string;
  };
  readonly rootExecutionId: string;
  readonly sessionRevision: number;
  readonly status:
    | "allocated"
    | "running"
    | "completed"
    | "failed"
    | "cancelled"
    | "delivery-unknown";
  readonly terminalResult?: unknown;
}

export interface RootExecutionAccounting {
  readonly physicalCalls: readonly {
    readonly actionId: string;
    readonly agentRunId?: string;
    readonly callId: string;
    readonly deliveryCertainty:
      | "NOT_DISPATCHED"
      | "DELIVERED"
      | "NOT_DELIVERED"
      | "UNKNOWN";
    readonly executionId: string;
    readonly generation: number;
    readonly kind: "provider" | "tool";
    readonly purpose?: "normal" | "child" | "compaction";
    readonly status: string;
    readonly usageState?: "REPORTED" | "ESTIMATED" | "UNKNOWN";
  }[];
  readonly rootExecutionId: string;
  readonly totals: {
    readonly childCalls: number;
    readonly compactionCalls: number;
    readonly providerCalls: number;
    readonly toolCalls: number;
    readonly unknownUsageCalls: number;
  };
}

interface RunRow {
  readonly agent_id: string;
  readonly agent_run_id: string;
  readonly agent_session_id: string;
  readonly child_execution_id: string;
  readonly delegation_action_id: string;
  readonly delegation_group_id: string;
  readonly ordinal: number;
  readonly provider_action_id: string;
  readonly provider_error_code: string | null;
  readonly provider_status: StoredAction["status"];
}

const hash = (value: unknown): string =>
  createHash("sha256").update(canonicalJson(value)).digest("hex");

const record = (value: unknown): Record<string, unknown> | undefined =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;

const actionProposedEvent = (input: {
  readonly actionId: string;
  readonly inputDigest: string;
  readonly record: ChildAllocationRecord;
  readonly sourceEventId: string;
}) => ({
  body: {
    actionId: input.actionId,
    actionSchemaVersion: 1,
    actionType: "provider.generate",
    deadlineClass: "background",
    executionId: input.record.childExecutionId,
    gateClass: "none-requested",
    inputDigest: input.inputDigest,
    requestedCapabilities: ["provider.generate"],
    resource: `agent-session:${input.record.agentSessionId}`,
    schemaVersion: 1,
    sourceEventId: input.sourceEventId,
  },
  streamId: input.actionId,
  type: "action.proposed",
});

export class DelegationJournal {
  constructor(private readonly database: Database) {}

  childRuns(rootExecutionId?: string): readonly ChildRunProjection[] {
    const rows = this.database
      .query<
        {
          agent_id: string;
          agent_run_id: string;
          agent_session_id: string;
          budget_json: string;
          child_execution_id: string;
          delegation_group_id: string;
          ordinal: number;
          parent_execution_id: string;
          resource_claims_json: string;
          root_execution_id: string;
          session_revision: number;
          status: ChildRunProjection["status"];
          terminal_result_json: string | null;
        },
        [string | null, string | null]
      >(
        "SELECT agent_sessions.agent_id,agent_runs.agent_run_id,agent_runs.agent_session_id,agent_runs.budget_json,agent_runs.child_execution_id,agent_runs.delegation_group_id,agent_runs.ordinal,agent_sessions.parent_execution_id,agent_runs.resource_claims_json,agent_sessions.root_execution_id,COALESCE(json_extract(agent_runs.task_json, '$.continuation.expectedRevision'), 0) AS session_revision,agent_runs.status,agent_runs.terminal_result_json FROM agent_runs JOIN agent_sessions ON agent_sessions.agent_session_id = agent_runs.agent_session_id WHERE (? IS NULL OR agent_sessions.root_execution_id = ?) ORDER BY agent_sessions.root_execution_id,agent_runs.delegation_group_id,agent_runs.ordinal,agent_runs.agent_run_id",
      )
      .all(rootExecutionId ?? null, rootExecutionId ?? null);
    return rows.map((row) => ({
      agentId: row.agent_id,
      agentRunId: row.agent_run_id,
      agentSessionId: row.agent_session_id,
      budget: JSON.parse(row.budget_json) as ChildRunProjection["budget"],
      childExecutionId: row.child_execution_id,
      delegationGroupId: row.delegation_group_id,
      ordinal: row.ordinal,
      parentExecutionId: row.parent_execution_id,
      resourceClaims: JSON.parse(
        row.resource_claims_json,
      ) as ChildRunProjection["resourceClaims"],
      rootExecutionId: row.root_execution_id,
      sessionRevision: row.session_revision,
      status: row.status,
      ...(row.terminal_result_json
        ? { terminalResult: JSON.parse(row.terminal_result_json) as unknown }
        : {}),
    }));
  }

  accounting(rootExecutionId: string): RootExecutionAccounting {
    const rows = this.database
      .query<
        {
          action_id: string;
          agent_run_id: string | null;
          call_id: string;
          delivery_certainty: RootExecutionAccounting["physicalCalls"][number]["deliveryCertainty"];
          execution_id: string;
          generation: number;
          kind: "provider" | "tool";
          purpose: "normal" | "child" | "compaction" | null;
          status: string;
          usage_state: "REPORTED" | "ESTIMATED" | "UNKNOWN" | null;
        },
        [string, string, string, string]
      >(
        "SELECT provider_calls.action_id,agent_runs.agent_run_id,provider_calls.call_id,provider_calls.delivery_certainty,attempts.execution_id,provider_calls.generation,'provider' AS kind,provider_calls.purpose,provider_calls.status,provider_calls.usage_state FROM provider_calls JOIN attempts ON attempts.attempt_id = provider_calls.attempt_id LEFT JOIN agent_runs ON agent_runs.child_execution_id = attempts.execution_id WHERE attempts.execution_id = ? OR attempts.execution_id IN (SELECT descendant_execution_id FROM execution_ancestry WHERE ancestor_execution_id = ?) UNION ALL SELECT tool_calls.action_id,agent_runs.agent_run_id,tool_calls.call_id,tool_calls.delivery_certainty,attempts.execution_id,tool_calls.generation,'tool' AS kind,NULL AS purpose,tool_calls.status,NULL AS usage_state FROM tool_calls JOIN attempts ON attempts.attempt_id = tool_calls.attempt_id LEFT JOIN agent_runs ON agent_runs.child_execution_id = attempts.execution_id WHERE attempts.execution_id = ? OR attempts.execution_id IN (SELECT descendant_execution_id FROM execution_ancestry WHERE ancestor_execution_id = ?) ORDER BY kind,call_id",
      )
      .all(rootExecutionId, rootExecutionId, rootExecutionId, rootExecutionId);
    const physicalCalls = rows.map((row) => ({
      actionId: row.action_id,
      ...(row.agent_run_id ? { agentRunId: row.agent_run_id } : {}),
      callId: row.call_id,
      deliveryCertainty: row.delivery_certainty,
      executionId: row.execution_id,
      generation: row.generation,
      kind: row.kind,
      ...(row.purpose ? { purpose: row.purpose } : {}),
      status: row.status,
      ...(row.usage_state ? { usageState: row.usage_state } : {}),
    }));
    return {
      physicalCalls,
      rootExecutionId,
      totals: {
        childCalls: physicalCalls.filter(({ purpose }) => purpose === "child")
          .length,
        compactionCalls: physicalCalls.filter(
          ({ purpose }) => purpose === "compaction",
        ).length,
        providerCalls: physicalCalls.filter(({ kind }) => kind === "provider")
          .length,
        toolCalls: physicalCalls.filter(({ kind }) => kind === "tool").length,
        unknownUsageCalls: physicalCalls.filter(
          ({ usageState }) => usageState === "UNKNOWN",
        ).length,
      },
    };
  }

  session(agentSessionId: string): StoredAgentSession | undefined {
    const row = this.database
      .query<
        {
          agent_id: string;
          agent_version: string;
          capability_ceiling_json: string;
          depth: number;
          parent_execution_id: string;
          revision: number;
          root_execution_id: string;
          status: "busy" | "idle";
          tool_ceiling_json: string;
        },
        [string]
      >("SELECT * FROM agent_sessions WHERE agent_session_id = ?")
      .get(agentSessionId);
    if (!row) return undefined;
    const messages = this.database
      .query<
        { content: string; role: "assistant" | "user" },
        [string, number]
      >(
        "SELECT role,content FROM agent_session_messages WHERE agent_session_id = ? AND revision <= ? ORDER BY ordinal",
      )
      .all(agentSessionId, row.revision);
    return {
      agentId: row.agent_id,
      agentVersion: row.agent_version,
      capabilityCeiling: JSON.parse(row.capability_ceiling_json) as string[],
      depth: row.depth,
      messages,
      parentExecutionId: row.parent_execution_id,
      revision: row.revision,
      rootExecutionId: row.root_execution_id,
      status: row.status,
      toolCeiling: JSON.parse(row.tool_ceiling_json) as string[],
    };
  }

  parentToolCallVisible(input: {
    readonly modelToolCallId: string;
    readonly parentProviderActionId: string;
    readonly toolName: string;
    readonly toolVersion: string;
  }): boolean {
    const call = this.database
      .query<{ prompt_snapshot_json: string }, [string]>(
        "SELECT prompt_snapshot_json FROM provider_calls WHERE action_id = ? AND status = 'succeeded'",
      )
      .get(input.parentProviderActionId);
    const receipt = this.database
      .query<{ body_json: string }, [string]>(
        "SELECT body_json FROM events WHERE event_type = 'action.succeeded' AND json_extract(body_json, '$.actionId') = ? ORDER BY global_sequence DESC LIMIT 1",
      )
      .get(input.parentProviderActionId);
    if (!call || !receipt) return false;
    const snapshot = record(JSON.parse(call.prompt_snapshot_json));
    const tools = Array.isArray(snapshot?.tools) ? snapshot.tools : [];
    const toolVisible = tools.some((value) => {
      const tool = record(value);
      return tool?.name === input.toolName && tool.version === input.toolVersion;
    });
    const body = record(JSON.parse(receipt.body_json));
    const output = record(body?.output);
    const toolCalls = Array.isArray(output?.toolCalls) ? output.toolCalls : [];
    const callVisible = toolCalls.some((value) => {
      const toolCall = record(value);
      return (
        toolCall?.toolCallId === input.modelToolCallId &&
        toolCall.toolName === input.toolName &&
        toolCall.toolVersion === input.toolVersion
      );
    });
    return toolVisible && callVisible;
  }

  allocate(
    action: StoredAction,
    allocation: ChildAllocationRecord,
    allocatedAt: string,
  ): "allocated" | "duplicate" {
    return this.database
      .transaction(() => {
        const current = this.database
          .query<{ status: string }, [string]>(
            "SELECT status FROM actions WHERE action_id = ?",
          )
          .get(action.actionId);
        if (current?.status === "running") return "duplicate";
        if (current?.status !== "proposed")
          throw new Error("DELEGATION_ACTION_NOT_PROPOSED");

        this.database.run(
          "INSERT OR IGNORE INTO execution_ancestry(ancestor_execution_id,descendant_execution_id,depth) VALUES (?,?,0)",
          [allocation.parentExecutionId, allocation.parentExecutionId],
        );
        this.database.run(
          "INSERT INTO executions(execution_id,version,generation,status,cancellation_requested,updated_at) VALUES (?,?,?,?,?,?)",
          [allocation.childExecutionId, 0, 0, "active", 0, allocatedAt],
        );
        this.database.run(
          "INSERT INTO execution_ancestry(ancestor_execution_id,descendant_execution_id,depth) SELECT ancestor_execution_id,?,depth + 1 FROM execution_ancestry WHERE descendant_execution_id = ?",
          [allocation.childExecutionId, allocation.parentExecutionId],
        );
        this.database.run(
          "INSERT INTO execution_ancestry(ancestor_execution_id,descendant_execution_id,depth) VALUES (?,?,0)",
          [allocation.childExecutionId, allocation.childExecutionId],
        );

        this.database.run(
          "INSERT OR IGNORE INTO delegation_groups(delegation_group_id,root_execution_id,parent_execution_id,parent_provider_action_id,expected_children,status,allocated_at) VALUES (?,?,?,?,?,'allocated',?)",
          [
            allocation.delegationGroupId,
            allocation.rootExecutionId,
            allocation.parentExecutionId,
            allocation.parentProviderActionId,
            allocation.expectedChildren,
            allocatedAt,
          ],
        );
        const group = this.database
          .query<
            {
              expected_children: number;
              parent_execution_id: string;
              parent_provider_action_id: string;
              root_execution_id: string;
            },
            [string]
          >(
            "SELECT expected_children,parent_execution_id,parent_provider_action_id,root_execution_id FROM delegation_groups WHERE delegation_group_id = ?",
          )
          .get(allocation.delegationGroupId);
        if (
          !group ||
          group.expected_children !== allocation.expectedChildren ||
          group.parent_execution_id !== allocation.parentExecutionId ||
          group.parent_provider_action_id !== allocation.parentProviderActionId ||
          group.root_execution_id !== allocation.rootExecutionId
        )
          throw new Error("DELEGATION_GROUP_CONFLICT");

        if (allocation.continuationExpectedRevision === undefined) {
          this.database.run(
            "INSERT INTO agent_sessions(agent_session_id,root_execution_id,parent_execution_id,agent_id,agent_version,depth,revision,capability_ceiling_json,tool_ceiling_json,status,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,'busy',?,?)",
            [
              allocation.agentSessionId,
              allocation.rootExecutionId,
              allocation.parentExecutionId,
              allocation.agentId,
              allocation.agentVersion,
              1,
              0,
              canonicalJson(allocation.capabilityCeiling),
              canonicalJson(allocation.toolCeiling),
              allocatedAt,
              allocatedAt,
            ],
          );
        } else {
          const session = this.session(allocation.agentSessionId);
          if (!session) throw new Error("CHILD_SESSION_UNKNOWN");
          if (session.status !== "idle") throw new Error("CHILD_SESSION_BUSY");
          if (session.revision !== allocation.continuationExpectedRevision)
            throw new Error("CHILD_SESSION_REVISION_CONFLICT");
          if (
            session.agentId !== allocation.agentId ||
            session.agentVersion !== allocation.agentVersion
          )
            throw new Error("CHILD_SESSION_AGENT_CONFLICT");
          if (
            session.parentExecutionId !== allocation.parentExecutionId ||
            session.rootExecutionId !== allocation.rootExecutionId ||
            session.depth !== 1
          )
            throw new Error("CHILD_SESSION_LINEAGE_CONFLICT");
          if (
            canonicalJson(session.capabilityCeiling) !==
              canonicalJson(allocation.capabilityCeiling) ||
            canonicalJson(session.toolCeiling) !==
              canonicalJson(allocation.toolCeiling)
          )
            throw new Error("CHILD_SESSION_AUTHORITY_CONFLICT");
          const providerInput = record(allocation.childProviderInput);
          const messages = Array.isArray(providerInput?.messages)
            ? providerInput.messages
            : [];
          if (
            canonicalJson(messages) !==
            canonicalJson([
              ...session.messages,
              { content: allocation.taskMessage, role: "user" },
            ])
          )
            throw new Error("CHILD_SESSION_PROMPT_CONFLICT");
          const updated = this.database.run(
            "UPDATE agent_sessions SET status = 'busy', updated_at = ? WHERE agent_session_id = ? AND status = 'idle' AND revision = ?",
            [
              allocatedAt,
              allocation.agentSessionId,
              allocation.continuationExpectedRevision,
            ],
          );
          if (updated.changes !== 1) throw new Error("CHILD_SESSION_BUSY");
        }

        const requestedEvent = {
          body: {
            agentId: allocation.agentId,
            delegationActionId: action.actionId,
            delegationGroupId: allocation.delegationGroupId,
            modelToolCallId: allocation.modelToolCallId,
            ordinal: allocation.ordinal,
            parentExecutionId: allocation.parentExecutionId,
            parentProviderActionId: allocation.parentProviderActionId,
            rootExecutionId: allocation.rootExecutionId,
            schemaVersion: 1,
          },
          streamId: allocation.delegationGroupId,
          type: "delegation.requested",
        };
        const allocatedEvent = {
          body: {
            agentId: allocation.agentId,
            agentRunId: allocation.agentRunId,
            agentSessionId: allocation.agentSessionId,
            budgetSnapshot: allocation.budgetSnapshot,
            capabilityCeiling: allocation.capabilityCeiling,
            catalogDigest: allocation.catalogDigest,
            childExecutionId: allocation.childExecutionId,
            delegationActionId: action.actionId,
            delegationGroupId: allocation.delegationGroupId,
            depth: 1,
            ordinal: allocation.ordinal,
            parentExecutionId: allocation.parentExecutionId,
            rootExecutionId: allocation.rootExecutionId,
            resourceClaims: allocation.resourceClaims,
            schemaVersion: 1,
            sessionRevision: allocation.sessionRevision,
            toolCeiling: allocation.toolCeiling,
          },
          streamId: allocation.agentSessionId,
          type: "child.allocated",
        };
        const allocationCommandId = `child-allocation:${action.actionId}`;
        const allocationEvents = [requestedEvent, allocatedEvent];
        const admitted = admitInTransaction(this.database, {
          acceptedAt: allocatedAt,
          actorId: "curiosity-kernel",
          commandDigest: hash(allocationEvents),
          commandId: allocationCommandId,
          events: allocationEvents,
          nonce: allocationCommandId,
          pluginId: "curiosity.kernel.delegation",
        });
        if (admitted._tag === "Conflict")
          throw new Error("CHILD_ALLOCATION_EVENT_CONFLICT");
        const source = this.database
          .query<{ event_id: string }, [string]>(
            "SELECT event_id FROM events WHERE command_id = ? AND event_type = 'child.allocated'",
          )
          .get(allocationCommandId);
        if (!source) throw new Error("CHILD_ALLOCATION_EVENT_MISSING");

        const childInputDigest = hash(allocation.childProviderInput);
        this.database.run(
          "INSERT INTO actions(action_id,source_event_id,reactor_id,plugin_id,action_type,action_schema_version,execution_id,resource,gate_class,deadline_class,input_json,input_digest,requested_capabilities_json,status,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,'proposed',?,?)",
          [
            allocation.childProviderActionId,
            source.event_id,
            "curiosity.kernel.delegation.scheduler",
            "curiosity.stock.delegation",
            "provider.generate",
            1,
            allocation.childExecutionId,
            `agent-session:${allocation.agentSessionId}`,
            "none-requested",
            "background",
            canonicalJson(allocation.childProviderInput),
            childInputDigest,
            canonicalJson(["provider.generate"]),
            allocatedAt,
            allocatedAt,
          ],
        );
        this.database.run(
          "INSERT INTO agent_runs(agent_run_id,agent_session_id,delegation_group_id,ordinal,child_execution_id,delegation_action_id,provider_action_id,model_tool_call_id,task_json,budget_json,resource_claims_json,catalog_digest,status,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,'allocated',?,?)",
          [
            allocation.agentRunId,
            allocation.agentSessionId,
            allocation.delegationGroupId,
            allocation.ordinal,
            allocation.childExecutionId,
            action.actionId,
            allocation.childProviderActionId,
            allocation.modelToolCallId,
            canonicalJson(allocation.task),
            canonicalJson(allocation.budgetSnapshot),
            canonicalJson(allocation.resourceClaims),
            allocation.catalogDigest,
            allocatedAt,
            allocatedAt,
          ],
        );
        this.database.run(
          "UPDATE actions SET status = 'running', updated_at = ? WHERE action_id = ? AND status = 'proposed'",
          [allocatedAt, action.actionId],
        );

        const proposedEvent = actionProposedEvent({
          actionId: allocation.childProviderActionId,
          inputDigest: childInputDigest,
          record: allocation,
          sourceEventId: source.event_id,
        });
        const proposalCommandId = `child-provider-proposal:${allocation.agentRunId}`;
        const proposed = admitInTransaction(this.database, {
          acceptedAt: allocatedAt,
          actorId: "curiosity-kernel",
          commandDigest: hash(proposedEvent),
          commandId: proposalCommandId,
          events: [proposedEvent],
          nonce: proposalCommandId,
          pluginId: "curiosity.kernel.delegation",
        });
        if (proposed._tag === "Conflict")
          throw new Error("CHILD_PROVIDER_PROPOSAL_CONFLICT");
        return "allocated";
      })
      .immediate();
  }

  reconcileTerminals(at: string): number {
    let changed = 0;
    const runs = this.database
      .query<RunRow, []>(
        "SELECT agent_runs.agent_run_id,agent_runs.agent_session_id,agent_runs.delegation_group_id,agent_runs.ordinal,agent_runs.child_execution_id,agent_runs.delegation_action_id,agent_runs.provider_action_id,agent_sessions.agent_id,actions.status AS provider_status,actions.error_code AS provider_error_code FROM agent_runs JOIN agent_sessions ON agent_sessions.agent_session_id = agent_runs.agent_session_id JOIN actions ON actions.action_id = agent_runs.provider_action_id WHERE agent_runs.status IN ('allocated','running') AND actions.status IN ('succeeded','failed','delivery-unknown') ORDER BY agent_runs.agent_run_id",
      )
      .all();
    for (const run of runs)
      changed += this.completeRun(run, at);
    changed += this.reconcileDeliveries(at);
    return changed;
  }

  private completeRun(run: RunRow, at: string): number {
    return this.database
      .transaction(() => {
        const current = this.database
          .query<{ status: string }, [string]>(
            "SELECT status FROM agent_runs WHERE agent_run_id = ?",
          )
          .get(run.agent_run_id);
        if (!current || !["allocated", "running"].includes(current.status))
          return 0;
        const providerReceipt = this.database
          .query<
            { body_json: string; event_id: string; event_type: string },
            [string]
          >(
            "SELECT event_id,event_type,body_json FROM events WHERE event_type IN ('action.succeeded','action.failed') AND json_extract(body_json, '$.actionId') = ? ORDER BY global_sequence DESC LIMIT 1",
          )
          .get(run.provider_action_id);
        const cancellationReceipt = this.database
          .query<
            { body_json: string; event_id: string; event_type: string },
            [string]
          >(
            "SELECT events.event_id,events.event_type,events.body_json FROM events WHERE events.event_type = 'execution.cancelled' AND json_extract(events.body_json, '$.executionId') IN (SELECT ancestor_execution_id FROM execution_ancestry WHERE descendant_execution_id = ?) ORDER BY events.global_sequence DESC LIMIT 1",
          )
          .get(run.child_execution_id);
        const cancelled = run.provider_error_code === "ACTION_CANCELLED";
        const receipt = providerReceipt ?? (cancelled ? cancellationReceipt : undefined);
        if (!receipt) throw new Error("CHILD_PROVIDER_RECEIPT_MISSING");
        const body = providerReceipt
          ? record(JSON.parse(providerReceipt.body_json))
          : undefined;
        const output = record(body?.output);
        const toolCalls = Array.isArray(output?.toolCalls) ? output.toolCalls : [];
        const providerText = typeof output?.text === "string" ? output.text : "";
        const completed =
          run.provider_status === "succeeded" &&
          toolCalls.length === 0 &&
          Buffer.byteLength(providerText) <= 32 * 1_024;
        const status = cancelled
          ? "cancelled"
          : completed
          ? "completed"
          : run.provider_status === "delivery-unknown"
            ? "delivery-unknown"
            : "failed";
        const errorCode = cancelled
          ? "ACTION_CANCELLED"
          : completed
          ? undefined
          : run.provider_status === "delivery-unknown"
            ? "PROVIDER_DELIVERY_UNKNOWN"
            : toolCalls.length > 0
              ? "CHILD_TOOL_LOOP_UNAVAILABLE"
              : Buffer.byteLength(providerText) > 32 * 1_024
                ? "CHILD_RESULT_TOO_LARGE"
                : run.provider_error_code || "CHILD_PROVIDER_FAILED";
        const resultBase = {
          agentId: run.agent_id,
          agentRunId: run.agent_run_id,
          agentSessionId: run.agent_session_id,
          artifactRefs: [] as readonly string[],
          childExecutionId: run.child_execution_id,
          ...(errorCode ? { errorCode } : {}),
          evidenceEventIds: [receipt.event_id],
          schemaVersion: 1 as const,
          status,
          ...(completed ? { text: providerText } : {}),
          usage: { state: "UNKNOWN" as const },
        };
        const terminalDigest = hash({
          agentId: resultBase.agentId,
          agentRunId: resultBase.agentRunId,
          agentSessionId: resultBase.agentSessionId,
          artifactRefs: resultBase.artifactRefs,
          childExecutionId: resultBase.childExecutionId,
          ...(errorCode ? { errorCode } : {}),
          schemaVersion: resultBase.schemaVersion,
          status: resultBase.status,
          ...(completed ? { text: providerText } : {}),
          usage: resultBase.usage,
        });
        const result = { ...resultBase, terminalDigest };
        this.database.run(
          "UPDATE agent_runs SET status = ?, terminal_result_json = ?, terminal_digest = ?, updated_at = ? WHERE agent_run_id = ? AND status IN ('allocated','running')",
          [
            status,
            canonicalJson(result),
            terminalDigest,
            at,
            run.agent_run_id,
          ],
        );
        const session = this.database
          .query<{ revision: number }, [string]>(
            "SELECT revision FROM agent_sessions WHERE agent_session_id = ? AND status = 'busy'",
          )
          .get(run.agent_session_id);
        if (!session) throw new Error("CHILD_SESSION_NOT_BUSY");
        const providerAction = this.database
          .query<{ input_json: string }, [string]>(
            "SELECT input_json FROM actions WHERE action_id = ?",
          )
          .get(run.provider_action_id);
        const providerInput = record(
          providerAction ? JSON.parse(providerAction.input_json) : undefined,
        );
        const providerMessages = Array.isArray(providerInput?.messages)
          ? providerInput.messages
          : [];
        const taskMessage = [...providerMessages]
          .reverse()
          .map(record)
          .find((message) => message?.role === "user")?.content;
        if (typeof taskMessage !== "string")
          throw new Error("CHILD_TASK_MESSAGE_MISSING");
        const nextRevision = session.revision + 1;
        const nextOrdinal =
          (this.database
            .query<{ ordinal: number }, [string]>(
              "SELECT ordinal FROM agent_session_messages WHERE agent_session_id = ? ORDER BY ordinal DESC LIMIT 1",
            )
            .get(run.agent_session_id)?.ordinal ?? -1) + 1;
        this.database.run(
          "INSERT INTO agent_session_messages(agent_session_id,ordinal,revision,agent_run_id,role,content,created_at) VALUES (?,?,?,?,?,?,?)",
          [
            run.agent_session_id,
            nextOrdinal,
            nextRevision,
            run.agent_run_id,
            "user",
            taskMessage,
            at,
          ],
        );
        if (completed)
          this.database.run(
            "INSERT INTO agent_session_messages(agent_session_id,ordinal,revision,agent_run_id,role,content,created_at) VALUES (?,?,?,?,?,?,?)",
            [
              run.agent_session_id,
              nextOrdinal + 1,
              nextRevision,
              run.agent_run_id,
              "assistant",
              providerText,
              at,
            ],
          );
        this.database.run(
          "UPDATE agent_sessions SET status = 'idle', revision = ?, updated_at = ? WHERE agent_session_id = ? AND status = 'busy' AND revision = ?",
          [nextRevision, at, run.agent_session_id, session.revision],
        );
        const parentCancelled =
          this.database
            .query<{ cancellation_requested: number }, [string]>(
              "SELECT executions.cancellation_requested FROM delegation_groups JOIN executions ON executions.execution_id = delegation_groups.parent_execution_id WHERE delegation_groups.delegation_group_id = ?",
            )
            .get(run.delegation_group_id)?.cancellation_requested === 1;
        if (!parentCancelled)
          this.database.run(
            "UPDATE actions SET status = 'succeeded', output_digest = ?, error_code = NULL, updated_at = ? WHERE action_id = ? AND status = 'running'",
            [terminalDigest, at, run.delegation_action_id],
          );
        const delegationAction = this.database
          .query<{ input_json: string }, [string]>(
            "SELECT input_json FROM actions WHERE action_id = ?",
          )
          .get(run.delegation_action_id);
        if (!delegationAction)
          throw new Error("DELEGATION_ACTION_MISSING");
        const delegationInput = record(JSON.parse(delegationAction.input_json));
        const events: Array<{
          body: unknown;
          streamId: string;
          type: string;
        }> = [
          {
            body: {
              ...result,
              delegationGroupId: run.delegation_group_id,
              ordinal: run.ordinal,
            },
            streamId: run.agent_session_id,
            type: completed
              ? "child.completed"
              : cancelled
                ? "child.cancelled"
                : "child.failed",
          },
        ];
        if (!parentCancelled)
          events.push({
            body: {
              actionId: run.delegation_action_id,
              actionType: "agent.delegate",
              correlation: delegationInput?.correlation ?? null,
              output: result,
              schemaVersion: 1,
            },
            streamId: run.delegation_action_id,
            type: "action.succeeded",
          });
        const group = this.database
          .query<{ expected_children: number; status: string }, [string]>(
            "SELECT expected_children,status FROM delegation_groups WHERE delegation_group_id = ?",
          )
          .get(run.delegation_group_id);
        const terminals = this.database
          .query<
            { ordinal: number; terminal_digest: string; terminal_result_json: string },
            [string]
          >(
            "SELECT ordinal,terminal_digest,terminal_result_json FROM agent_runs WHERE delegation_group_id = ? AND terminal_result_json IS NOT NULL ORDER BY ordinal",
          )
          .all(run.delegation_group_id);
        if (
          group?.status === "allocated" &&
          terminals.length === group.expected_children
        ) {
          const resultDigest = hash(
            terminals.map(({ ordinal, terminal_digest }) => ({
              ordinal,
              terminalDigest: terminal_digest,
            })),
          );
          this.database.run(
            "UPDATE delegation_groups SET status = 'ready', result_digest = ?, ready_at = ? WHERE delegation_group_id = ? AND status = 'allocated'",
            [resultDigest, at, run.delegation_group_id],
          );
          events.push({
            body: {
              delegationGroupId: run.delegation_group_id,
              orderedResults: terminals.map(
                ({ terminal_result_json }) => JSON.parse(terminal_result_json),
              ),
              resultDigest,
              schemaVersion: 1,
            },
            streamId: run.delegation_group_id,
            type: parentCancelled
              ? "delegation.group-cancelled"
              : "delegation.group-ready",
          });
        }
        const commandId = `child-terminal:${run.agent_run_id}`;
        const admitted = admitInTransaction(this.database, {
          acceptedAt: at,
          actorId: "curiosity-kernel",
          commandDigest: hash(events),
          commandId,
          events,
          nonce: commandId,
          pluginId: "curiosity.kernel.delegation",
        });
        if (admitted._tag === "Conflict")
          throw new Error("CHILD_TERMINAL_EVENT_CONFLICT");
        return 1;
      })
      .immediate();
  }

  private reconcileDeliveries(at: string): number {
    const result = this.database.run(
      "UPDATE delegation_groups SET status = 'delivered', delivered_at = ? WHERE status = 'ready' AND EXISTS (SELECT 1 FROM events WHERE event_type = 'delegation.results-delivered' AND json_extract(body_json, '$.delegationGroupId') = delegation_groups.delegation_group_id)",
      [at],
    );
    return result.changes;
  }
}
