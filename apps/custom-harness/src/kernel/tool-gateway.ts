import { createHash } from "node:crypto";
import { Effect } from "effect";
import type { StoredAction } from "../domain/action.js";
import type {
  AllocatedToolAttempt,
  ToolAttemptSnapshot,
} from "../domain/attempt.js";
import { ActionJournal } from "../storage/action-journal.js";
import { AttemptJournal } from "../storage/attempt-journal.js";
import type { SupervisorClient } from "../supervisor/client.js";
import { canonicalJson } from "./canonical-json.js";
import { ActionExecutionFailure } from "./errors.js";
import type { StaticPluginCatalog } from "./plugin.js";
import type { ResearchAdapter } from "../research/adapter.js";
import {
  captureFetchResponse,
  captureSearchResponse,
} from "../research/custody.js";

interface WorkspaceActionInput {
  readonly correlation: Record<string, unknown>;
  readonly request: Record<string, unknown>;
  readonly toolCallId: string;
  readonly toolName: string;
  readonly toolVersion: string;
}

const digest = (value: unknown): string =>
  createHash("sha256").update(canonicalJson(value)).digest("hex");

const record = (value: unknown): Record<string, unknown> | undefined =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;

const parseInput = (value: unknown): WorkspaceActionInput => {
  const input = record(value);
  if (Object.keys(input ?? {}).sort().join(",") !== "correlation,request")
    throw new Error("WORKSPACE_ACTION_INPUT_INVALID");
  const correlation = record(input?.correlation);
  const request = record(input?.request);
  if (
    !correlation ||
    !request ||
    typeof correlation.toolCallId !== "string" ||
    !correlation.toolCallId ||
    typeof correlation.toolName !== "string" ||
    typeof correlation.toolVersion !== "string"
  )
    throw new Error("WORKSPACE_ACTION_INPUT_INVALID");
  return {
    correlation,
    request,
    toolCallId: correlation.toolCallId,
    toolName: correlation.toolName,
    toolVersion: correlation.toolVersion,
  };
};

const stableToolError = (cause: unknown): string => {
  const message = cause instanceof Error ? cause.message : "";
  return /^(?:FETCH|GIT|PROCESS|RESEARCH|SEARCH|SUPERVISOR|TOOL|WORKSPACE)_[A-Z0-9_]+$/u.test(message)
    ? message
    : "TOOL_EXECUTION_FAILED";
};

const mutationFailureDefinitelyNotApplied = new Set([
  "WORKSPACE_FILE_NOT_UTF8",
  "WORKSPACE_MUTATION_DELETE_FAILED",
  "WORKSPACE_MUTATION_INVALID",
  "WORKSPACE_MUTATION_RENAME_FAILED",
  "WORKSPACE_MUTATION_TEMP_CONFLICT",
  "WORKSPACE_MUTATION_TOO_LARGE",
  "WORKSPACE_MUTATION_WRITE_FAILED",
  "WORKSPACE_PATCH_OCCURRENCE_MISMATCH",
  "WORKSPACE_PATH_INVALID",
  "WORKSPACE_PATH_UNSAFE",
  "WORKSPACE_PRECONDITION_FAILED",
  "WORKSPACE_PRECONDITION_REQUIRED",
]);
const gitMutationFailureDefinitelyNotApplied = new Set([
  "GIT_CLEAN_PRECONDITION_FAILED",
  "GIT_CLEAN_PRECONDITION_REQUIRED",
  "GIT_EXECUTABLE_DIGEST_MISMATCH",
  "GIT_HEAD_PRECONDITION_FAILED",
  "GIT_OUTPUT_LIMIT_DENIED",
  "GIT_REF_NAME_DENIED",
  "GIT_REF_PRECONDITION_FAILED",
  "GIT_REF_TARGET_INVALID",
  "GIT_WORKTREE_ABSENT",
  "GIT_WORKTREE_ALREADY_EXISTS",
  "GIT_WORKTREE_ID_INVALID",
  "GIT_WORKTREE_UNAVAILABLE",
]);

export class ToolGateway {
  readonly #activeProcesses = new Map<string, string>();
  readonly #activeGitMutations = new Map<string, string>();

  constructor(
    private readonly actions: ActionJournal,
    private readonly attempts: AttemptJournal,
    private readonly catalog: StaticPluginCatalog,
    private readonly supervisor: SupervisorClient,
    private readonly now: () => number,
    private readonly grantedCapabilities: ReadonlySet<string>,
    private readonly researchAdapter?: ResearchAdapter,
    private readonly eligibleActorId = "local-owner",
    private readonly configDigest = digest("default-config"),
    private readonly enabledAgentIds: ReadonlySet<string> = new Set(
      catalog.agents().map(({ id }) => id),
    ),
  ) {}

  cancelGovernedExecutions(): void {
    for (const [executionId, requestId] of this.#activeProcesses)
      if (this.attempts.isExecutionCancelled(executionId))
        this.supervisor.cancelProcess(requestId);
    for (const [executionId, requestId] of this.#activeGitMutations)
      if (this.attempts.isExecutionCancelled(executionId))
        this.supervisor.cancelGitMutation(requestId);
  }

  private failProposedAction(
    action: StoredAction,
    correlation: unknown,
    errorCode: string,
  ): ActionExecutionFailure {
    const completedAt = new Date(this.now()).toISOString();
    const event = {
      body: {
        actionId: action.actionId,
        actionType: action.actionType,
        correlation,
        errorCode,
        schemaVersion: 1,
      },
      streamId: action.actionId,
      type: "action.failed",
    };
    this.actions.completeAction({
      actionId: action.actionId,
      completedAt,
      errorCode,
      event,
      outputDigest: digest(event),
      status: "failed",
    });
    return new ActionExecutionFailure({
      actionId: action.actionId,
      actionType: action.actionType,
      message: errorCode,
      modelId: "",
    });
  }

  reconcileInterrupted = Effect.fn("ToolGateway.reconcileInterrupted")(
    function* (this: ToolGateway) {
      for (const action of this.attempts.interruptedToolCalls()) {
        let correlation: unknown = null;
        try {
          correlation = parseInput(action.input).correlation;
        } catch {
          // Corrupt input remains attributable to the allocated action.
        }
        const dispatched = action.dispatchState === "dispatched";
        const family = action.actionType === "process.run" ? "PROCESS" : "WORKSPACE";
        const errorCode = dispatched
          ? `${family}_DELIVERY_UNKNOWN`
          : `${family}_NOT_DISPATCHED`;
        const completedAt = new Date(this.now()).toISOString();
        const event = {
          body: {
            actionId: action.actionId,
            actionType: action.actionType,
            correlation,
            errorCode,
            schemaVersion: 1,
          },
          streamId: action.actionId,
          type: "action.failed",
        };
        this.attempts.completeToolCall({
          actionId: action.actionId,
          attemptId: action.attemptId,
          callId: action.callId,
          completedAt,
          errorCode,
          event,
          generation: action.generation,
          outputDigest: digest(event),
          status: dispatched ? "delivery-unknown" : "failed",
        });
      }
    },
  );

  private complete(input: {
    readonly action: StoredAction;
    readonly allocation: AllocatedToolAttempt;
    readonly completedAt: string;
    readonly errorCode?: string;
    readonly event: {
      readonly body: unknown;
      readonly streamId: string;
      readonly type: string;
    };
    readonly status: "delivery-unknown" | "failed" | "succeeded";
  }) {
    return this.attempts.completeToolCall({
      actionId: input.action.actionId,
      attemptId: input.allocation.attemptId,
      callId: input.allocation.callId,
      completedAt: input.completedAt,
      ...(input.errorCode ? { errorCode: input.errorCode } : {}),
      event: input.event,
      generation: input.allocation.generation,
      outputDigest: digest(input.event),
      status: input.status,
    });
  }

  execute = Effect.fn("ToolGateway.execute")(function* (
    this: ToolGateway,
    action: StoredAction,
  ) {
    let input: WorkspaceActionInput;
    try {
      input = parseInput(action.input);
    } catch {
      return yield* this.failProposedAction(
        action,
        null,
        "WORKSPACE_ACTION_INPUT_INVALID",
      );
    }
    const agentId = input.correlation.agentId;
    const agent =
      typeof agentId === "string" ? this.catalog.agent(agentId) : undefined;
    if (
      !agent ||
      !this.enabledAgentIds.has(agent.id) ||
      action.requestedCapabilities.some(
        (capability) => !agent.requestedCapabilities.includes(capability),
      )
    )
      return yield* this.failProposedAction(
        action,
        input.correlation,
        "ROLE_CAPABILITY_DENIED",
      );
    const tool = this.catalog.tool(input.toolName);
    const workspaceMutationAction = [
      "workspace.delete",
      "workspace.patch",
      "workspace.write",
    ].includes(action.actionType);
    const gitMutationAction = [
      "git.worktree.create",
      "git.worktree.remove",
      "git.ref.update",
    ].includes(action.actionType);
    const mutationAction = workspaceMutationAction || gitMutationAction;
    if (
      !tool ||
      tool.version !== input.toolVersion ||
      tool.actionType !== action.actionType ||
      (!tool.readOnly && action.actionType !== "process.run" && !mutationAction)
    )
      return yield* this.failProposedAction(
        action,
        input.correlation,
        "WORKSPACE_TOOL_SNAPSHOT_INVALID",
      );
    if (
      workspaceMutationAction &&
      (typeof input.request.path !== "string" ||
        action.resource !==
          `workspace:path:${input.request.path.replaceAll("\\", "/")}`)
    )
      return yield* this.failProposedAction(
        action,
        input.correlation,
        "WORKSPACE_RESOURCE_CLAIM_MISMATCH",
      );
    if (
      action.actionType.startsWith("git.worktree.") &&
      (typeof input.request.worktreeId !== "string" ||
        action.resource !== `git:worktree:${input.request.worktreeId}`)
    )
      return yield* this.failProposedAction(
        action,
        input.correlation,
        "GIT_RESOURCE_CLAIM_MISMATCH",
      );
    if (
      action.actionType.startsWith("git.ref.") &&
      (typeof input.request.refName !== "string" ||
        action.resource !== `git:ref:${input.request.refName}`)
    )
      return yield* this.failProposedAction(
        action,
        input.correlation,
        "GIT_RESOURCE_CLAIM_MISMATCH",
      );
    if (action.actionType === "question.ask") {
      const questionId = digest({
        actionId: action.actionId,
        request: input.request,
        type: "user-question",
      });
      this.actions.askQuestion({
        action,
        allowFreeText: input.request.allowFreeText as boolean,
        askedAt: new Date(this.now()).toISOString(),
        eligibleActorId: this.eligibleActorId,
        options: input.request.options as {
          id: string;
          label: string;
        }[],
        prompt: input.request.prompt as string,
        questionId,
      });
      return;
    }
    const proposed = yield* tool
      .propose(input.request, {
        executionId: action.executionId,
        resource: action.resource,
      })
      .pipe(Effect.result);
    if (
      proposed._tag === "Failure" ||
      proposed.success.actionType !== action.actionType ||
      canonicalJson(proposed.success.requestedCapabilities) !==
        canonicalJson(action.requestedCapabilities)
    )
      return yield* this.failProposedAction(
        action,
        input.correlation,
        "WORKSPACE_TOOL_PROPOSAL_INVALID",
      );

    const requestDigest = digest({
      request: input.request,
      toolName: tool.name,
      toolVersion: tool.version,
    });
    const toolIdentity = {
      description: tool.description,
      inputSchema: tool.inputSchema,
      name: tool.name,
      outputProvenance: tool.outputProvenance,
      pluginId: tool.pluginId,
      pluginVersion: tool.pluginVersion,
      readOnly: tool.readOnly,
      requestedCapabilities: [...tool.requestedCapabilities].sort(),
      version: tool.version,
    };
    const generation = this.attempts.nextGeneration(action.executionId);
    const snapshot: ToolAttemptSnapshot = {
      action: {
        actionId: action.actionId,
        actionType: action.actionType,
        deadlineClass: action.deadlineClass,
        gateClass: action.gateClass,
        inputDigest: action.inputDigest,
        requestedCapabilities: [...action.requestedCapabilities].sort(),
        resource: action.resource,
      },
      catalogDigest: this.catalog.catalogDigest,
      configDigest: this.configDigest,
      generation,
      grantedCapabilities: [...this.grantedCapabilities].sort(),
      policyVersion: "local-v1",
      requestDigest,
      schemaVersion: 1,
      tool: {
        digest: digest(toolIdentity),
        name: tool.name,
        pluginId: tool.pluginId,
        pluginVersion: tool.pluginVersion,
        version: tool.version,
      },
    };
    const snapshotDigest = digest(snapshot);
    const attemptId = digest({
      actionId: action.actionId,
      generation,
      snapshotDigest,
      type: "tool-attempt",
    });
    const callId = digest({ attemptId, requestDigest, type: "tool-call" });
    const allocatedAtMs = this.now();
    const allocatedAt = new Date(allocatedAtMs).toISOString();
    const allocation = this.attempts.allocateToolAttempt({
      action,
      allocatedAt,
      attemptId,
      callId,
      generation,
      leaseExpiresAt: new Date(allocatedAtMs + 30_000).toISOString(),
      modelToolCallId: input.toolCallId,
      ownerId: "curiosity-kernel",
      requestDigest,
      snapshot,
      snapshotDigest,
      toolName: tool.name,
      toolVersion: tool.version,
    });
    if (allocation === "resource-collision")
      return yield* this.failProposedAction(
        action,
        input.correlation,
        "RESOURCE_COLLISION",
      );
    if (!allocation)
      return yield* new ActionExecutionFailure({
        actionId: action.actionId,
        actionType: action.actionType,
        message: "ATTEMPT_AUTHORIZATION_DENIED",
        modelId: "",
      });
    const dispatchAt = new Date(this.now()).toISOString();
    if (
      this.attempts.authorizeToolDispatch({
        actionId: action.actionId,
        attemptId,
        callId,
        generation,
        now: dispatchAt,
        requestDigest,
      }) !== "authorized"
    ) {
      const errorCode = "ATTEMPT_DISPATCH_DENIED";
      const event = {
        body: {
          actionId: action.actionId,
          actionType: action.actionType,
          correlation: input.correlation,
          errorCode,
          schemaVersion: 1,
        },
        streamId: action.actionId,
        type: "action.failed",
      };
      this.complete({
        action,
        allocation,
        completedAt: dispatchAt,
        errorCode,
        event,
        status: "failed",
      });
      return yield* new ActionExecutionFailure({
        actionId: action.actionId,
        actionType: action.actionType,
        message: errorCode,
        modelId: "",
      });
    }

    const result = yield* Effect.tryPromise({
      try: async () => {
        if (action.actionType === "workspace.read")
          return this.supervisor.workspaceRead(callId, {
            maxLines: input.request.maxLines as number,
            path: input.request.path as string,
            startLine: input.request.startLine as number,
          });
        if (action.actionType === "git.status")
          return this.supervisor.gitStatus(
            callId,
            input.request.maxOutputBytes as number,
          );
        if (action.actionType === "git.diff")
          return this.supervisor.gitDiff(callId, {
            maxOutputBytes: input.request.maxOutputBytes as number,
            paths: input.request.paths as string[],
          });
        if (action.actionType === "git.ref.inspect")
          return this.supervisor.gitRefInspect(callId, {
            maxOutputBytes: input.request.maxOutputBytes as number,
            refName: input.request.refName as string,
          });
        if (action.actionType === "git.ref.update") {
          this.#activeGitMutations.set(action.executionId, callId);
          try {
            return await this.supervisor.gitRefUpdate(callId, {
              expectedClean: input.request.expectedClean as true,
              expectedOldHead: input.request.expectedOldHead as string,
              maxOutputBytes: input.request.maxOutputBytes as number,
              newHead: input.request.newHead as string,
              refName: input.request.refName as string,
            });
          } finally {
            if (this.#activeGitMutations.get(action.executionId) === callId)
              this.#activeGitMutations.delete(action.executionId);
          }
        }
        if (action.actionType === "git.worktree.create") {
          this.#activeGitMutations.set(action.executionId, callId);
          try {
            return await this.supervisor.gitWorktreeCreate(callId, {
              expectedClean: input.request.expectedClean as true,
              expectedHead: input.request.expectedHead as string,
              maxOutputBytes: input.request.maxOutputBytes as number,
              worktreeId: input.request.worktreeId as string,
            });
          } finally {
            if (this.#activeGitMutations.get(action.executionId) === callId)
              this.#activeGitMutations.delete(action.executionId);
          }
        }
        if (action.actionType === "git.worktree.inspect")
          return this.supervisor.gitWorktreeInspect(callId, {
            expectedHead: input.request.expectedHead as string,
            maxOutputBytes: input.request.maxOutputBytes as number,
            worktreeId: input.request.worktreeId as string,
          });
        if (action.actionType === "git.worktree.remove") {
          this.#activeGitMutations.set(action.executionId, callId);
          try {
            return await this.supervisor.gitWorktreeRemove(callId, {
              expectedClean: input.request.expectedClean as true,
              expectedHead: input.request.expectedHead as string,
              maxOutputBytes: input.request.maxOutputBytes as number,
              worktreeId: input.request.worktreeId as string,
            });
          } finally {
            if (this.#activeGitMutations.get(action.executionId) === callId)
              this.#activeGitMutations.delete(action.executionId);
          }
        }
        if (action.actionType === "workspace.glob")
          return this.supervisor.workspaceGlob(callId, {
            maxResults: input.request.maxResults as number,
            pattern: input.request.pattern as string,
          });
        if (action.actionType === "workspace.list")
          return this.supervisor.workspaceList(callId, {
            maxEntries: input.request.maxEntries as number,
            path: input.request.path as string,
            recursive: input.request.recursive as boolean,
          });
        if (action.actionType === "workspace.search")
          return this.supervisor.workspaceSearch(callId, {
            maxResults: input.request.maxResults as number,
            query: input.request.query as string,
          });
        if (action.actionType === "workspace.write")
          return this.supervisor.workspaceWrite(callId, {
            content: input.request.content as string,
            expectedSha256: input.request.expectedSha256 as string | null,
            path: input.request.path as string,
          });
        if (action.actionType === "workspace.patch")
          return this.supervisor.workspacePatch(callId, {
            expectedSha256: input.request.expectedSha256 as string,
            path: input.request.path as string,
            replacements: input.request.replacements as {
              expectedOccurrences: number;
              new: string;
              old: string;
            }[],
          });
        if (action.actionType === "workspace.delete")
          return this.supervisor.workspaceDelete(callId, {
            expectedSha256: input.request.expectedSha256 as string,
            path: input.request.path as string,
          });
        if (action.actionType === "process.run") {
          this.#activeProcesses.set(action.executionId, callId);
          try {
            return await this.supervisor.processRun(callId, {
              arguments: input.request.arguments as string[],
              cwd: input.request.cwd as string,
              maxOutputBytes: input.request.maxOutputBytes as number,
              profileId: input.request.profileId as string,
              timeoutMs: input.request.timeoutMs as number,
            });
          } finally {
            if (this.#activeProcesses.get(action.executionId) === callId)
              this.#activeProcesses.delete(action.executionId);
          }
        }
        const adapter = this.researchAdapter;
        if (!adapter) throw new Error("RESEARCH_ADAPTER_UNAVAILABLE");
        if (action.actionType === "search.web") {
          const request = {
            deadlineUnixMs: this.now() + 10_000,
            maxResults: input.request.maxResults as number,
            query: input.request.query as string,
            requestId: callId,
          };
          if (!adapter.search) throw new Error("SEARCH_ADAPTER_UNAVAILABLE");
          return captureSearchResponse({
            adapter: adapter.receipt,
            callId,
            request,
            response: await adapter.search(request),
          });
        }
        if (action.actionType === "fetch.web") {
          const request = {
            deadlineUnixMs: this.now() + 10_000,
            maxBytes: input.request.maxBytes as number,
            requestId: callId,
            url: input.request.url as string,
          };
          if (!adapter.fetch) throw new Error("FETCH_ADAPTER_UNAVAILABLE");
          return captureFetchResponse({
            adapter: adapter.receipt,
            callId,
            request,
            response: await adapter.fetch(request),
          });
        }
        throw new Error("TOOL_ACTION_TYPE_UNAVAILABLE");
      },
      catch: (cause) => stableToolError(cause),
    }).pipe(Effect.result);
    const completedAt = new Date(this.now()).toISOString();
    if (result._tag === "Failure") {
      const errorCode = this.attempts.isExecutionCancelled(action.executionId)
        ? "ACTION_CANCELLED"
        : result.failure;
      const deliveryUnknown =
        (workspaceMutationAction &&
          !mutationFailureDefinitelyNotApplied.has(errorCode)) ||
        (gitMutationAction &&
          !gitMutationFailureDefinitelyNotApplied.has(errorCode));
      const event = {
        body: {
          actionId: action.actionId,
          actionType: action.actionType,
          correlation: input.correlation,
          errorCode,
          schemaVersion: 1,
        },
        streamId: action.actionId,
        type: "action.failed",
      };
      this.complete({
        action,
        allocation,
        completedAt,
        errorCode,
        event,
        status: deliveryUnknown ? "delivery-unknown" : "failed",
      });
      return yield* new ActionExecutionFailure({
        actionId: action.actionId,
        actionType: action.actionType,
        message: errorCode,
        modelId: "",
      });
    }
    if (Buffer.byteLength(canonicalJson(result.success)) > 48 * 1_024) {
      const errorCode = "TOOL_OUTPUT_TOO_LARGE";
      const event = {
        body: {
          actionId: action.actionId,
          actionType: action.actionType,
          correlation: input.correlation,
          errorCode,
          schemaVersion: 1,
        },
        streamId: action.actionId,
        type: "action.failed",
      };
      this.complete({
        action,
        allocation,
        completedAt,
        errorCode,
        event,
        status: "failed",
      });
      return yield* new ActionExecutionFailure({
        actionId: action.actionId,
        actionType: action.actionType,
        message: errorCode,
        modelId: "",
      });
    }
    const event = {
      body: {
        actionId: action.actionId,
        actionType: action.actionType,
        correlation: input.correlation,
        output: result.success,
        schemaVersion: 1,
        toolName: tool.name,
        toolVersion: tool.version,
      },
      streamId: action.actionId,
      type: "action.succeeded",
    };
    if (
      this.complete({
        action,
        allocation,
        completedAt,
        event,
        status: "succeeded",
      }) === "stale"
    )
      return yield* new ActionExecutionFailure({
        actionId: action.actionId,
        actionType: action.actionType,
        message: this.attempts.isExecutionCancelled(action.executionId)
          ? "ACTION_CANCELLED"
          : "TOOL_RECEIPT_STALE",
        modelId: "",
      });
  });
}
