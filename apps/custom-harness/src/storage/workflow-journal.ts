import type { Database } from "bun:sqlite";
import { createHash } from "node:crypto";
import type {
  StoredWorkflowInstance,
  WorkflowActionRecord,
} from "../domain/workflow.js";
import type { RegisteredWorkflow } from "../kernel/plugin.js";
import { canonicalJson } from "../kernel/canonical-json.js";
import { admitInTransaction } from "./event-append.js";

interface WorkflowRow {
  readonly action_count: number;
  readonly capability_ceiling_json: string;
  readonly child_count: number;
  readonly child_key: string | null;
  readonly contribution_id: string;
  readonly contribution_version: string;
  readonly created_at: string;
  readonly depth: number;
  readonly error_code: string | null;
  readonly execution_id: string;
  readonly input_json: string;
  readonly instance_id: string;
  readonly last_progress_key: string | null;
  readonly max_actions: number;
  readonly max_children: number;
  readonly max_delegation_depth: number;
  readonly max_no_progress: number;
  readonly max_steps: number;
  readonly no_progress_count: number;
  readonly parent_instance_id: string | null;
  readonly plugin_id: string;
  readonly source_event_id: string;
  readonly state_json: string;
  readonly status: StoredWorkflowInstance["status"];
  readonly step_count: number;
  readonly updated_at: string;
  readonly workflow_name: string;
}

export interface WorkflowChildAllocation {
  readonly capabilityCeiling: readonly string[];
  readonly childKey: string;
  readonly contribution: RegisteredWorkflow;
  readonly executionId: string;
  readonly instanceId: string;
}

const hash = (value: unknown): string =>
  createHash("sha256").update(canonicalJson(value)).digest("hex");

const toInstance = (row: WorkflowRow): StoredWorkflowInstance => ({
  actionCount: row.action_count,
  capabilityCeiling: JSON.parse(row.capability_ceiling_json) as string[],
  childCount: row.child_count,
  ...(row.child_key ? { childKey: row.child_key } : {}),
  contributionId: row.contribution_id,
  contributionVersion: row.contribution_version,
  createdAt: row.created_at,
  depth: row.depth,
  ...(row.error_code ? { errorCode: row.error_code } : {}),
  executionId: row.execution_id,
  input: JSON.parse(row.input_json) as unknown,
  instanceId: row.instance_id,
  ...(row.last_progress_key ? { lastProgressKey: row.last_progress_key } : {}),
  limits: {
    maxActions: row.max_actions,
    maxChildren: row.max_children,
    maxDelegationDepth: row.max_delegation_depth,
    maxNoProgress: row.max_no_progress,
    maxSteps: row.max_steps,
  },
  noProgressCount: row.no_progress_count,
  ...(row.parent_instance_id
    ? { parentInstanceId: row.parent_instance_id }
    : {}),
  pluginId: row.plugin_id,
  sourceEventId: row.source_event_id,
  state: JSON.parse(row.state_json) as unknown,
  status: row.status,
  stepCount: row.step_count,
  updatedAt: row.updated_at,
  workflowName: row.workflow_name,
});

const actionEvent = (action: WorkflowActionRecord) => ({
  body: {
    actionId: action.actionId,
    actionSchemaVersion: action.actionSchemaVersion,
    actionType: action.actionType,
    deadlineClass: action.deadlineClass,
    executionId: action.executionId,
    gateClass: action.gateClass,
    inputDigest: action.inputDigest,
    requestedCapabilities: action.requestedCapabilities,
    resource: action.resource,
    schemaVersion: 1,
    sourceEventId: action.sourceEventId,
  },
  streamId: action.actionId,
  type: "action.proposed",
});

export class WorkflowJournal {
  constructor(private readonly database: Database) {}

  ensureRoot(input: {
    readonly capabilityCeiling: readonly string[];
    readonly contribution: RegisteredWorkflow;
    readonly input: unknown;
    readonly instanceId: string;
    readonly sourceEventId: string;
    readonly startedAt: string;
  }): "created" | "existing" {
    return this.database
      .transaction(() => {
        const existing = this.database
          .query<WorkflowRow, [string]>(
            "SELECT * FROM workflow_instances WHERE instance_id = ?",
          )
          .get(input.instanceId);
        if (existing) {
          if (
            existing.source_event_id !== input.sourceEventId ||
            existing.contribution_id !== input.contribution.id ||
            existing.contribution_version !== input.contribution.version
          )
            throw new Error("WORKFLOW_INSTANCE_CONFLICT");
          return "existing";
        }
        this.database.run(
          "INSERT OR IGNORE INTO executions(execution_id,version,generation,status,cancellation_requested,updated_at) VALUES (?,?,?,?,?,?)",
          [input.instanceId, 0, 0, "active", 0, input.startedAt],
        );
        this.database.run(
          "INSERT OR IGNORE INTO execution_ancestry(ancestor_execution_id,descendant_execution_id,depth) VALUES (?,?,?)",
          [input.instanceId, input.instanceId, 0],
        );
        this.database.run(
          "INSERT INTO workflow_instances(instance_id,source_event_id,workflow_name,contribution_id,contribution_version,plugin_id,execution_id,parent_instance_id,child_key,depth,status,input_json,state_json,capability_ceiling_json,step_count,no_progress_count,action_count,child_count,max_steps,max_no_progress,max_actions,max_children,max_delegation_depth,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
          [
            input.instanceId,
            input.sourceEventId,
            input.contribution.name,
            input.contribution.id,
            input.contribution.version,
            input.contribution.pluginId,
            input.instanceId,
            null,
            null,
            0,
            "running",
            canonicalJson(input.input),
            canonicalJson(input.contribution.initialState),
            canonicalJson(input.capabilityCeiling),
            0,
            0,
            0,
            0,
            input.contribution.limits.maxSteps,
            input.contribution.limits.maxNoProgress,
            input.contribution.limits.maxActions,
            input.contribution.limits.maxChildren,
            input.contribution.limits.maxDelegationDepth,
            input.startedAt,
            input.startedAt,
          ],
        );
        const source = this.database
          .query<
            {
              correlation_id: string;
              parent_execution_id: string;
              root_execution_id: string;
            },
            [string]
          >(
            "SELECT correlation_id,parent_execution_id,root_execution_id FROM events WHERE event_id = ?",
          )
          .get(input.sourceEventId);
        if (!source) throw new Error("WORKFLOW_SOURCE_EVENT_MISSING");
        const event = {
          body: {
            capabilityCeiling: input.capabilityCeiling,
            instanceId: input.instanceId,
            schemaVersion: 1,
            state: input.contribution.initialState,
            workflowName: input.contribution.name,
            workflowVersion: input.contribution.version,
          },
          streamId: input.instanceId,
          type: "workflow.started",
        };
        const result = admitInTransaction(this.database, {
          acceptedAt: input.startedAt,
          actorId: "curiosity-kernel",
          commandDigest: hash(event),
          commandId: `workflow-start:${input.instanceId}`,
          contributionId: input.contribution.id,
          contributionVersion: input.contribution.version,
          eventContexts: [
            {
              causationId: input.sourceEventId,
              childExecutionId: input.instanceId,
              contributionId: input.contribution.id,
              contributionVersion: input.contribution.version,
              correlationId: source.correlation_id,
              parentExecutionId: source.parent_execution_id,
              rootExecutionId: source.root_execution_id,
            },
          ],
          events: [event],
          nonce: `workflow-start:${input.instanceId}`,
          pluginId: "curiosity.kernel.workflows",
        });
        if (result._tag === "Conflict")
          throw new Error("WORKFLOW_START_CONFLICT");
        return "created";
      })
      .immediate();
  }

  runnable(): readonly StoredWorkflowInstance[] {
    return this.database
      .query<WorkflowRow, []>(
        "SELECT workflow_instances.* FROM workflow_instances WHERE workflow_instances.status = 'running' AND NOT EXISTS (SELECT 1 FROM workflow_instances AS child WHERE child.parent_instance_id = workflow_instances.instance_id AND child.status IN ('running', 'completion-requested')) AND NOT EXISTS (SELECT 1 FROM actions WHERE actions.execution_id = workflow_instances.execution_id AND actions.status IN ('proposed', 'running')) ORDER BY workflow_instances.depth DESC, workflow_instances.instance_id",
      )
      .all()
      .map(toInstance);
  }

  instances(): readonly StoredWorkflowInstance[] {
    return this.database
      .query<WorkflowRow, []>(
        "SELECT * FROM workflow_instances ORDER BY depth, instance_id",
      )
      .all()
      .map(toInstance);
  }

  children(instanceId: string): WorkflowTransitionChild[] {
    return this.database
      .query<
        { child_key: string; status: StoredWorkflowInstance["status"] },
        [string]
      >(
        "SELECT child_key,status FROM workflow_instances WHERE parent_instance_id = ? ORDER BY child_key",
      )
      .all(instanceId)
      .map((row) => ({
        id: row.child_key,
        status: row.status === "completion-requested" ? "running" : row.status,
      }));
  }

  commitTransition(input: {
    readonly actions: readonly WorkflowActionRecord[];
    readonly children: readonly WorkflowChildAllocation[];
    readonly committedAt: string;
    readonly expectedStep: number;
    readonly instanceId: string;
    readonly nextState: unknown;
    readonly progressKey: string;
    readonly terminalRequested: boolean;
    readonly transitionDigest: string;
    readonly gateEligibleActorId: string;
    readonly gateExpiresAt: string;
  }): void {
    this.database
      .transaction(() => {
        const row = this.database
          .query<WorkflowRow, [string]>(
            "SELECT * FROM workflow_instances WHERE instance_id = ?",
          )
          .get(input.instanceId);
        if (!row || row.status !== "running")
          throw new Error("WORKFLOW_NOT_RUNNABLE");
        if (row.step_count !== input.expectedStep)
          throw new Error("WORKFLOW_STEP_FENCED");
        if (row.step_count >= row.max_steps)
          throw new Error("WORKFLOW_STEP_BUDGET_EXCEEDED");
        if (row.action_count + input.actions.length > row.max_actions)
          throw new Error("WORKFLOW_ACTION_BUDGET_EXCEEDED");
        if (row.child_count + input.children.length > row.max_children)
          throw new Error("WORKFLOW_CHILD_BUDGET_EXCEEDED");
        const noProgress =
          row.last_progress_key === input.progressKey
            ? row.no_progress_count + 1
            : 0;
        if (noProgress > row.max_no_progress)
          throw new Error("WORKFLOW_NO_PROGRESS_EXCEEDED");
        const source = this.database
          .query<
            {
              correlation_id: string;
              event_id: string;
              root_execution_id: string;
            },
            [string]
          >(
            "SELECT event_id,correlation_id,root_execution_id FROM events WHERE stream_id = ? ORDER BY aggregate_version DESC LIMIT 1",
          )
          .get(input.instanceId);
        if (!source) throw new Error("WORKFLOW_SOURCE_EVENT_MISSING");
        const parentExecutionId = row.parent_instance_id
          ? this.database
              .query<{ execution_id: string }, [string]>(
                "SELECT execution_id FROM workflow_instances WHERE instance_id = ?",
              )
              .get(row.parent_instance_id)?.execution_id
          : row.execution_id;
        if (!parentExecutionId)
          throw new Error("WORKFLOW_PARENT_EXECUTION_MISSING");
        for (const child of input.children) {
          this.database.run(
            "INSERT INTO executions(execution_id,version,generation,status,cancellation_requested,updated_at) VALUES (?,?,?,?,?,?)",
            [child.executionId, 0, 0, "active", 0, input.committedAt],
          );
          this.database.run(
            "INSERT INTO execution_ancestry(ancestor_execution_id,descendant_execution_id,depth) SELECT ancestor_execution_id,?,depth + 1 FROM execution_ancestry WHERE descendant_execution_id = ?",
            [child.executionId, row.execution_id],
          );
          this.database.run(
            "INSERT INTO execution_ancestry(ancestor_execution_id,descendant_execution_id,depth) VALUES (?,?,?)",
            [child.executionId, child.executionId, 0],
          );
        }
        const events = [
          {
            body: {
              instanceId: input.instanceId,
              progressKey: input.progressKey,
              schemaVersion: 1,
              state: input.nextState,
              step: row.step_count + 1,
              terminalRequested: input.terminalRequested,
              workflowName: row.workflow_name,
            },
            streamId: input.instanceId,
            type: "workflow.advanced",
          },
          ...input.children.map((child) => ({
            body: {
              capabilityCeiling: child.capabilityCeiling,
              childKey: child.childKey,
              instanceId: child.instanceId,
              parentInstanceId: input.instanceId,
              schemaVersion: 1,
              workflowName: child.contribution.name,
              workflowVersion: child.contribution.version,
            },
            streamId: child.instanceId,
            type: "workflow.child-created",
          })),
          ...input.actions.map(actionEvent),
        ];
        const commandId = `workflow-step:${input.instanceId}:${row.step_count + 1}`;
        const result = admitInTransaction(this.database, {
          acceptedAt: input.committedAt,
          actorId: "curiosity-kernel",
          commandDigest: input.transitionDigest,
          commandId,
          eventContexts: [
            {
              causationId: source.event_id,
              childExecutionId: row.execution_id,
              contributionId: row.contribution_id,
              contributionVersion: row.contribution_version,
              correlationId: source.correlation_id,
              parentExecutionId,
              rootExecutionId: source.root_execution_id,
            },
            ...input.children.map((child) => ({
              causationId: source.event_id,
              childExecutionId: child.executionId,
              contributionId: child.contribution.id,
              contributionVersion: child.contribution.version,
              correlationId: source.correlation_id,
              parentExecutionId: row.execution_id,
              rootExecutionId: source.root_execution_id,
            })),
            ...input.actions.map((action) => ({
              causationId: action.sourceEventId,
              childExecutionId: action.executionId,
              contributionId: action.reactorId,
              contributionVersion: "1",
              correlationId: source.correlation_id,
              parentExecutionId: row.execution_id,
              rootExecutionId: source.root_execution_id,
            })),
          ],
          events,
          nonce: commandId,
          pluginId: "curiosity.kernel.workflows",
        });
        if (result._tag === "Conflict")
          throw new Error("WORKFLOW_TRANSITION_CONFLICT");
        for (const action of input.actions) {
          this.database.run(
            "INSERT OR IGNORE INTO executions(execution_id,version,generation,status,cancellation_requested,updated_at) VALUES (?,?,?,?,?,?)",
            [action.executionId, 0, 0, "active", 0, input.committedAt],
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
              input.committedAt,
              input.committedAt,
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
                input.committedAt,
              ],
            );
        }
        for (const child of input.children) {
          const source = this.database
            .query<{ event_id: string }, [string, string]>(
              "SELECT event_id FROM events WHERE command_id = ? AND event_type = 'workflow.child-created' AND stream_id = ?",
            )
            .get(commandId, child.instanceId);
          if (!source) throw new Error("WORKFLOW_CHILD_EVENT_MISSING");
          this.database.run(
            "INSERT INTO workflow_instances(instance_id,source_event_id,workflow_name,contribution_id,contribution_version,plugin_id,execution_id,parent_instance_id,child_key,depth,status,input_json,state_json,capability_ceiling_json,step_count,no_progress_count,action_count,child_count,max_steps,max_no_progress,max_actions,max_children,max_delegation_depth,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
            [
              child.instanceId,
              source.event_id,
              child.contribution.name,
              child.contribution.id,
              child.contribution.version,
              child.contribution.pluginId,
              child.executionId,
              input.instanceId,
              child.childKey,
              row.depth + 1,
              "running",
              canonicalJson({
                childKey: child.childKey,
                parentInstanceId: input.instanceId,
              }),
              canonicalJson(child.contribution.initialState),
              canonicalJson(child.capabilityCeiling),
              0,
              0,
              0,
              0,
              child.contribution.limits.maxSteps,
              child.contribution.limits.maxNoProgress,
              child.contribution.limits.maxActions,
              child.contribution.limits.maxChildren,
              Math.min(
                row.max_delegation_depth,
                child.contribution.limits.maxDelegationDepth,
              ),
              input.committedAt,
              input.committedAt,
            ],
          );
        }
        this.database.run(
          "INSERT INTO workflow_steps(instance_id,step_number,from_state_json,to_state_json,progress_key,transition_digest,committed_at) VALUES (?,?,?,?,?,?,?)",
          [
            input.instanceId,
            row.step_count + 1,
            row.state_json,
            canonicalJson(input.nextState),
            input.progressKey,
            input.transitionDigest,
            input.committedAt,
          ],
        );
        this.database.run(
          "UPDATE workflow_instances SET status = ?, state_json = ?, step_count = step_count + 1, no_progress_count = ?, action_count = action_count + ?, child_count = child_count + ?, last_progress_key = ?, updated_at = ? WHERE instance_id = ? AND step_count = ? AND status = 'running'",
          [
            input.terminalRequested ? "completion-requested" : "running",
            canonicalJson(input.nextState),
            noProgress,
            input.actions.length,
            input.children.length,
            input.progressKey,
            input.committedAt,
            input.instanceId,
            input.expectedStep,
          ],
        );
      })
      .immediate();
  }

  reconcileTerminals(at: string): number {
    let changed = 0;
    const candidates = this.database
      .query<WorkflowRow, []>(
        "SELECT * FROM workflow_instances WHERE status IN ('running', 'completion-requested') ORDER BY depth DESC, instance_id",
      )
      .all();
    for (const row of candidates) {
      const cancelled =
        this.database
          .query<{ cancellation_requested: number }, [string]>(
            "SELECT cancellation_requested FROM executions WHERE execution_id = ?",
          )
          .get(row.execution_id)?.cancellation_requested === 1;
      if (cancelled) {
        changed += this.markTerminal(
          row,
          "cancelled",
          "WORKFLOW_CANCELLED",
          at,
        );
        continue;
      }
      const failedAction = this.database
        .query<{ status: string }, [string]>(
          "SELECT status FROM actions WHERE execution_id = ? AND status IN ('failed', 'delivery-unknown') LIMIT 1",
        )
        .get(row.execution_id);
      const failedChild = this.database
        .query<{ status: string }, [string]>(
          "SELECT status FROM workflow_instances WHERE parent_instance_id = ? AND status IN ('failed', 'cancelled') LIMIT 1",
        )
        .get(row.instance_id);
      if (failedAction || failedChild) {
        changed += this.markTerminal(
          row,
          "failed",
          failedChild ? "WORKFLOW_CHILD_FAILED" : "WORKFLOW_ACTION_FAILED",
          at,
        );
        continue;
      }
      if (row.status !== "completion-requested") continue;
      const pendingAction = this.database
        .query<{ status: string }, [string]>(
          "SELECT status FROM actions WHERE execution_id = ? AND status IN ('proposed', 'running') LIMIT 1",
        )
        .get(row.execution_id);
      const pendingChild = this.database
        .query<{ status: string }, [string]>(
          "SELECT status FROM workflow_instances WHERE parent_instance_id = ? AND status IN ('running', 'completion-requested') LIMIT 1",
        )
        .get(row.instance_id);
      if (!pendingAction && !pendingChild)
        changed += this.markTerminal(row, "completed", undefined, at);
    }
    return changed;
  }

  fail(instance: StoredWorkflowInstance, errorCode: string, at: string): void {
    const row = this.database
      .query<WorkflowRow, [string]>(
        "SELECT * FROM workflow_instances WHERE instance_id = ?",
      )
      .get(instance.instanceId);
    if (row) this.markTerminal(row, "failed", errorCode, at);
  }

  private markTerminal(
    row: WorkflowRow,
    status: "cancelled" | "completed" | "failed",
    errorCode: string | undefined,
    at: string,
  ): number {
    return this.database
      .transaction(() => {
        const updated = this.database.run(
          "UPDATE workflow_instances SET status = ?, error_code = ?, updated_at = ? WHERE instance_id = ? AND status IN ('running', 'completion-requested')",
          [status, errorCode ?? null, at, row.instance_id],
        );
        if (updated.changes !== 1) return 0;
        const source = this.database
          .query<
            {
              correlation_id: string;
              event_id: string;
              root_execution_id: string;
            },
            [string]
          >(
            "SELECT event_id,correlation_id,root_execution_id FROM events WHERE stream_id = ? ORDER BY aggregate_version DESC LIMIT 1",
          )
          .get(row.instance_id);
        if (!source) throw new Error("WORKFLOW_SOURCE_EVENT_MISSING");
        const parentExecutionId = row.parent_instance_id
          ? this.database
              .query<{ execution_id: string }, [string]>(
                "SELECT execution_id FROM workflow_instances WHERE instance_id = ?",
              )
              .get(row.parent_instance_id)?.execution_id
          : row.execution_id;
        if (!parentExecutionId)
          throw new Error("WORKFLOW_PARENT_EXECUTION_MISSING");
        this.database.run(
          "UPDATE executions SET status = ?, version = version + 1, updated_at = ? WHERE execution_id = ?",
          [status === "completed" ? "completed" : status, at, row.execution_id],
        );
        const event = {
          body: {
            ...(errorCode ? { errorCode } : {}),
            instanceId: row.instance_id,
            schemaVersion: 1,
            status,
            workflowName: row.workflow_name,
          },
          streamId: row.instance_id,
          type:
            status === "completed" ? "workflow.completed" : "workflow.failed",
        };
        const commandId = `workflow-terminal:${row.instance_id}:${status}`;
        const result = admitInTransaction(this.database, {
          acceptedAt: at,
          actorId: "curiosity-kernel",
          commandDigest: hash(event),
          commandId,
          eventContexts: [
            {
              causationId: source.event_id,
              childExecutionId: row.execution_id,
              contributionId: row.contribution_id,
              contributionVersion: row.contribution_version,
              correlationId: source.correlation_id,
              parentExecutionId,
              rootExecutionId: source.root_execution_id,
            },
          ],
          events: [event],
          nonce: commandId,
          pluginId: "curiosity.kernel.workflows",
        });
        if (result._tag === "Conflict")
          throw new Error("WORKFLOW_TERMINAL_CONFLICT");
        return 1;
      })
      .immediate();
  }
}

interface WorkflowTransitionChild {
  readonly id: string;
  readonly status: "cancelled" | "completed" | "failed" | "running";
}
