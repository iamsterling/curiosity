import type { Database } from "bun:sqlite";
import { createHash } from "node:crypto";
import type { StoredAction } from "../domain/action.js";
import type { ProposedEvent } from "../domain/event.js";
import { canonicalJson } from "../kernel/canonical-json.js";
import {
  admitInTransaction,
  type AdmissionInput,
  type AdmissionResult,
} from "./event-append.js";

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

export interface QuestionProjection {
  readonly allowFreeText: boolean;
  readonly executionId: string;
  readonly options: readonly { readonly id: string; readonly label: string }[];
  readonly prompt: string;
  readonly questionId: string;
  readonly status: "pending" | "answered" | "cancelled";
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

  event(eventId: string):
    | {
        readonly body: unknown;
        readonly sequence: number;
        readonly streamId: string;
        readonly type: string;
      }
    | undefined {
    const row = this.database
      .query<
        {
          body_json: string;
          event_type: string;
          global_sequence: number;
          stream_id: string;
        },
        [string]
      >(
        "SELECT body_json,event_type,global_sequence,stream_id FROM events WHERE event_id = ?",
      )
      .get(eventId);
    return row
      ? {
          body: JSON.parse(row.body_json) as unknown,
          sequence: row.global_sequence,
          streamId: row.stream_id,
          type: row.event_type,
        }
      : undefined;
  }

  action(actionId: string): StoredAction | undefined {
    const row = this.database
      .query<ActionRow, [string]>("SELECT * FROM actions WHERE action_id = ?")
      .get(actionId);
    return row ? toAction(row) : undefined;
  }

  createCompactionAction(input: {
    readonly acceptedAt: string;
    readonly actionId: string;
    readonly executionId: string;
    readonly input: unknown;
    readonly inputDigest: string;
    readonly parentActionId: string;
    readonly parentExecutionId: string;
    readonly requestedCapabilities: readonly string[];
    readonly resource: string;
  }): StoredAction {
    return this.database
      .transaction(() => {
        const existing = this.action(input.actionId);
        if (existing) return existing;
        const parent = this.database
          .query<
            { source_event_id: string; status: string },
            [string, string]
          >(
            "SELECT source_event_id,status FROM actions WHERE action_id = ? AND execution_id = ?",
          )
          .get(input.parentActionId, input.parentExecutionId);
        if (!parent || parent.status !== "proposed")
          throw new Error("COMPACTION_PARENT_NOT_PROPOSED");
        const source = this.database
          .query<
            {
              child_execution_id: string;
              correlation_id: string;
              parent_execution_id: string;
              root_execution_id: string;
            },
            [string]
          >(
            "SELECT child_execution_id,correlation_id,parent_execution_id,root_execution_id FROM events WHERE event_id = ?",
          )
          .get(parent.source_event_id);
        if (!source) throw new Error("COMPACTION_SOURCE_EVENT_MISSING");
        const event = {
          body: {
            actionId: input.actionId,
            executionId: input.executionId,
            parentActionId: input.parentActionId,
            parentExecutionId: input.parentExecutionId,
            schemaVersion: 1,
          },
          streamId: input.executionId,
          type: "compaction.requested",
        };
        this.database.run(
          "INSERT INTO executions(execution_id,version,generation,status,cancellation_requested,updated_at) VALUES (?,0,0,'active',0,?)",
          [input.executionId, input.acceptedAt],
        );
        this.database.run(
          "INSERT INTO execution_ancestry(ancestor_execution_id,descendant_execution_id,depth) SELECT ancestor_execution_id,?,depth + 1 FROM execution_ancestry WHERE descendant_execution_id = ? UNION ALL SELECT ?,?,1",
          [
            input.executionId,
            input.parentExecutionId,
            input.parentExecutionId,
            input.executionId,
          ],
        );
        this.database.run(
          "INSERT INTO actions(action_id,source_event_id,reactor_id,plugin_id,action_type,action_schema_version,execution_id,resource,gate_class,deadline_class,input_json,input_digest,requested_capabilities_json,status,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,'proposed',?,?)",
          [
            input.actionId,
            parent.source_event_id,
            "curiosity.kernel.compaction",
            "curiosity.kernel.compaction",
            "provider.generate",
            1,
            input.executionId,
            input.resource,
            "none-requested",
            "background",
            canonicalJson(input.input),
            input.inputDigest,
            canonicalJson(input.requestedCapabilities),
            input.acceptedAt,
            input.acceptedAt,
          ],
        );
        const result = admitInTransaction(this.database, {
          acceptedAt: input.acceptedAt,
          actorId: "curiosity-kernel",
          commandDigest: input.inputDigest,
          commandId: `compaction:${input.actionId}:requested`,
          contributionId: "curiosity.kernel.compaction",
          contributionVersion: "1",
          events: [event],
          lineage: {
            causationId: parent.source_event_id,
            childExecutionId: input.executionId,
            correlationId: source.correlation_id,
            parentExecutionId: input.parentExecutionId,
            rootExecutionId: source.root_execution_id,
          },
          nonce: `compaction:${input.actionId}:requested`,
          pluginId: "curiosity.kernel.compaction",
        });
        if (result._tag === "Conflict")
          throw new Error("COMPACTION_REQUEST_CONFLICT");
        return this.action(input.actionId)!;
      })
      .immediate();
  }

  succeededOutput(actionId: string): unknown | undefined {
    const row = this.database
      .query<{ body_json: string }, [string]>(
        "SELECT body_json FROM events WHERE event_type = 'action.succeeded' AND json_extract(body_json,'$.actionId') = ? ORDER BY global_sequence DESC LIMIT 1",
      )
      .get(actionId);
    if (!row) return undefined;
    const body = JSON.parse(row.body_json) as Record<string, unknown>;
    return body.output;
  }

  askQuestion(input: {
    readonly action: StoredAction;
    readonly allowFreeText: boolean;
    readonly askedAt: string;
    readonly eligibleActorId: string;
    readonly options: readonly { readonly id: string; readonly label: string }[];
    readonly prompt: string;
    readonly questionId: string;
  }): void {
    this.database
      .transaction(() => {
        const action = this.database
          .query<{ status: string }, [string]>(
            "SELECT status FROM actions WHERE action_id = ?",
          )
          .get(input.action.actionId);
        if (action?.status === "running") return;
        if (action?.status !== "proposed")
          throw new Error("QUESTION_ACTION_NOT_PROPOSED");
        const source = this.database
          .query<
            {
              correlation_id: string;
              event_id: string;
              parent_execution_id: string;
              root_execution_id: string;
            },
            [string]
          >(
            "SELECT event_id,correlation_id,parent_execution_id,root_execution_id FROM events WHERE event_id = ?",
          )
          .get(input.action.sourceEventId);
        if (!source) throw new Error("QUESTION_SOURCE_EVENT_MISSING");
        const event = {
          body: {
            actionId: input.action.actionId,
            allowFreeText: input.allowFreeText,
            executionId: input.action.executionId,
            options: input.options,
            prompt: input.prompt,
            questionId: input.questionId,
            schemaVersion: 1,
          },
          streamId: input.questionId,
          type: "question.asked",
        };
        const result = admitInTransaction(this.database, {
          acceptedAt: input.askedAt,
          actorId: "curiosity-kernel",
          commandDigest: input.questionId,
          commandId: `${input.questionId}:asked`,
          eventContexts: [
            {
              causationId: input.action.sourceEventId,
              childExecutionId: input.action.executionId,
              contributionId: "curiosity.kernel.questions",
              contributionVersion: "1",
              correlationId: source.correlation_id,
              parentExecutionId: source.parent_execution_id,
              rootExecutionId: source.root_execution_id,
            },
          ],
          events: [event],
          nonce: `${input.questionId}:asked`,
          pluginId: "curiosity.kernel.questions",
        });
        if (result._tag === "Conflict") throw new Error("QUESTION_ASK_CONFLICT");
        this.database.run(
          "INSERT INTO questions(question_id,action_id,execution_id,eligible_actor_id,prompt,options_json,allow_free_text,status,asked_at) VALUES (?,?,?,?,?,?,?,'pending',?)",
          [
            input.questionId,
            input.action.actionId,
            input.action.executionId,
            input.eligibleActorId,
            input.prompt,
            canonicalJson(input.options),
            input.allowFreeText ? 1 : 0,
            input.askedAt,
          ],
        );
        this.database.run(
          "UPDATE actions SET status = 'running', updated_at = ? WHERE action_id = ? AND status = 'proposed'",
          [input.askedAt, input.action.actionId],
        );
      })
      .immediate();
  }

  answerQuestion(
    input: AdmissionInput & {
      readonly answer: string;
      readonly answeredAt: string;
      readonly questionId: string;
    },
  ): AdmissionResult {
    return this.database
      .transaction(() => {
        const question = this.database
          .query<
            {
              action_id: string;
              allow_free_text: number;
              eligible_actor_id: string;
              execution_id: string;
              options_json: string;
              status: string;
            },
            [string]
          >(
            "SELECT action_id,allow_free_text,eligible_actor_id,execution_id,options_json,status FROM questions WHERE question_id = ?",
          )
          .get(input.questionId);
        if (
          !question ||
          question.status !== "pending" ||
          question.eligible_actor_id !== input.actorId
        )
          throw new Error("QUESTION_ANSWER_DENIED");
        const options = JSON.parse(question.options_json) as {
          id: string;
          label: string;
        }[];
        if (
          !input.answer ||
          Buffer.byteLength(input.answer) > 4_096 ||
          (question.allow_free_text !== 1 &&
            !options.some(({ id }) => id === input.answer))
        )
          throw new Error("QUESTION_ANSWER_INVALID");
        const action = this.database
          .query<{ input_json: string; reactor_id: string }, [string]>(
            "SELECT input_json,reactor_id FROM actions WHERE action_id = ? AND status = 'running'",
          )
          .get(question.action_id);
        if (!action) throw new Error("QUESTION_ACTION_NOT_WAITING");
        const asked = this.database
          .query<
            {
              child_execution_id: string;
              correlation_id: string;
              event_id: string;
              parent_execution_id: string;
              root_execution_id: string;
            },
            [string]
          >(
            "SELECT event_id,correlation_id,root_execution_id,parent_execution_id,child_execution_id FROM events WHERE event_type = 'question.asked' AND stream_id = ? ORDER BY global_sequence DESC LIMIT 1",
          )
          .get(input.questionId);
        if (!asked) throw new Error("QUESTION_ASK_EVENT_MISSING");
        const actionInput = JSON.parse(action.input_json) as Record<
          string,
          unknown
        >;
        const correlation = actionInput.correlation;
        const output = {
          answer: input.answer,
          provenance: "untrusted-user-answer",
          questionId: input.questionId,
          schemaVersion: 1,
        };
        const outputDigest = createHash("sha256")
          .update(canonicalJson(output))
          .digest("hex");
        const result = admitInTransaction(this.database, {
          ...input,
          eventContexts: [
            ...input.events.map(() => ({
              causationId: asked.event_id,
              childExecutionId: asked.child_execution_id,
              contributionId: input.contributionId ?? input.pluginId,
              contributionVersion: input.contributionVersion ?? "1",
              correlationId: asked.correlation_id,
              parentExecutionId: asked.parent_execution_id,
              rootExecutionId: asked.root_execution_id,
            })),
            {
              causationId: asked.event_id,
              childExecutionId: asked.child_execution_id,
              contributionId: action.reactor_id,
              contributionVersion: "1",
              correlationId: asked.correlation_id,
              parentExecutionId: asked.parent_execution_id,
              rootExecutionId: asked.root_execution_id,
            },
          ],
          events: [
            ...input.events,
            {
              body: {
                actionId: question.action_id,
                actionType: "question.ask",
                correlation,
                output,
                schemaVersion: 1,
              },
              streamId: question.action_id,
              type: "action.succeeded",
            },
          ],
        });
        if (
          result._tag === "Conflict" ||
          result.acknowledgement.disposition === "duplicate"
        )
          return result;
        this.database.run(
          "UPDATE questions SET status = 'answered',answer = ?,answered_at = ?,answer_command_id = ? WHERE question_id = ? AND status = 'pending'",
          [
            input.answer,
            input.answeredAt,
            input.commandId,
            input.questionId,
          ],
        );
        this.database.run(
          "UPDATE actions SET status = 'succeeded',updated_at = ?,output_digest = ?,error_code = NULL WHERE action_id = ? AND status = 'running'",
          [input.answeredAt, outputDigest, question.action_id],
        );
        this.database.run(
          "UPDATE executions SET status = 'completed',version = version + 1,updated_at = ? WHERE execution_id = ? AND cancellation_requested = 0",
          [input.answeredAt, question.execution_id],
        );
        return result;
      })
      .immediate();
  }

  questions(): readonly QuestionProjection[] {
    return this.database
      .query<
        {
          allow_free_text: number;
          execution_id: string;
          options_json: string;
          prompt: string;
          question_id: string;
          status: QuestionProjection["status"];
        },
        []
      >(
        "SELECT question_id,execution_id,prompt,options_json,allow_free_text,status FROM questions ORDER BY asked_at,question_id",
      )
      .all()
      .map((row) => ({
        allowFreeText: row.allow_free_text === 1,
        executionId: row.execution_id,
        options: JSON.parse(row.options_json) as QuestionProjection["options"],
        prompt: row.prompt,
        questionId: row.question_id,
        status: row.status,
      }));
  }

  questionExecutionId(questionId: string): string | undefined {
    return this.database
      .query<{ execution_id: string }, [string]>(
        "SELECT actions.execution_id FROM questions JOIN actions ON actions.action_id = questions.action_id WHERE questions.question_id = ?",
      )
      .get(questionId)?.execution_id;
  }

  gateExecutionId(gateId: string): string | undefined {
    return this.database
      .query<{ execution_id: string }, [string]>(
        "SELECT actions.execution_id FROM gates JOIN actions ON actions.action_id = gates.action_id WHERE gates.gate_id = ?",
      )
      .get(gateId)?.execution_id;
  }

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
        const source = this.database
          .query<
            {
              child_execution_id: string;
              correlation_id: string;
              parent_execution_id: string;
              root_execution_id: string;
            },
            [string]
          >(
            "SELECT child_execution_id,correlation_id,parent_execution_id,root_execution_id FROM events WHERE event_id = ?",
          )
          .get(input.sourceEventId);
        if (!source) throw new Error("REACTION_SOURCE_EVENT_MISSING");
        if (row?.status !== "running") throw new Error("REACTION_NOT_CLAIMED");
        if (input.events.length > 0) {
          const actions = new Map(
            input.actions.map((action) => [action.actionId, action] as const),
          );
          const result = admitInTransaction(this.database, {
            acceptedAt: input.acceptedAt,
            actorId: "curiosity-kernel",
            commandDigest: input.outputDigest,
            commandId: input.reactionId,
            contributionId: input.reactorId,
            contributionVersion: String(input.reactorVersion),
            eventContexts: input.events.map((event) => {
              const body =
                event.body &&
                typeof event.body === "object" &&
                !Array.isArray(event.body)
                  ? (event.body as Record<string, unknown>)
                  : undefined;
              const action =
                typeof body?.actionId === "string"
                  ? actions.get(body.actionId)
                  : undefined;
              return {
                causationId: input.sourceEventId,
                childExecutionId:
                  action?.executionId ?? source.child_execution_id,
                contributionId: input.reactorId,
                contributionVersion: String(input.reactorVersion),
                correlationId: source.correlation_id,
                parentExecutionId: action
                  ? source.child_execution_id
                  : source.parent_execution_id,
                rootExecutionId: source.root_execution_id,
              };
            }),
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
          const parentExecutionExists = this.database
            .query<{ present: number }, [string]>(
              "SELECT 1 AS present FROM executions WHERE execution_id = ?",
            )
            .get(source.child_execution_id);
          if (
            action.executionId !== source.child_execution_id &&
            parentExecutionExists
          ) {
            this.database.run(
              "INSERT OR IGNORE INTO execution_ancestry(ancestor_execution_id,descendant_execution_id,depth) SELECT ancestor_execution_id,?,depth + 1 FROM execution_ancestry WHERE descendant_execution_id = ?",
              [action.executionId, source.child_execution_id],
            );
            this.database.run(
              "INSERT OR IGNORE INTO execution_ancestry(ancestor_execution_id,descendant_execution_id,depth) VALUES (?,?,1)",
              [source.child_execution_id, action.executionId],
            );
          }
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
        "SELECT * FROM actions WHERE status = 'proposed' AND COALESCE(json_extract(input_json,'$.correlation.kind'),'') != 'curiosity.compaction' ORDER BY created_at, action_id",
      )
      .all()
      .map(toAction);
  }

  completeAction(input: {
    readonly actionId: string;
    readonly additionalEvents?: readonly ProposedEvent[];
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
          events: [input.event, ...(input.additionalEvents ?? [])],
          nonce: `${input.actionId}:${input.status}`,
          pluginId: "curiosity.kernel.actions",
        });
        if (result._tag === "Conflict")
          throw new Error("ACTION_OUTPUT_CONFLICT");
      })
      .immediate();
  }
}
