import { Effect, Semaphore } from "effect";
import type { CapabilityStatusReport } from "../domain/capability-status.js";
import type { StoredEvent } from "../domain/event.js";
import type { CommandAcknowledgement } from "../domain/event.js";
import {
  projectChatMessages,
  type ChatMessageProjection,
} from "../projection/chat-projection.js";
import {
  projectThreads,
  type ThreadProjection,
} from "../projection/thread-projection.js";
import { EventJournal } from "../storage/event-journal.js";
import type { SupervisorClient } from "../supervisor/client.js";
import type {
  AuthenticatedCommand,
  AuthenticatorConfig,
} from "./authenticator.js";
import { makeAuthenticator } from "./authenticator.js";
import {
  CommandConflict,
  CommandUnavailable,
  InputRejected,
  PersistenceFailure,
  PluginFailure,
  type CommandFailure,
} from "./errors.js";
import type { StaticPluginCatalog } from "./plugin.js";
import {
  decodeKernelControlCommand,
  type KernelControlCommand,
} from "./control-command.js";
import { PromptAssembler } from "./prompt-assembler.js";
import { ProviderGateway, type ActionStreamDelta } from "./provider-gateway.js";
import { ProjectionEngine } from "./projection-engine.js";
import { ReactionEngine } from "./reaction-engine.js";
import type { ProviderRouteConfig, TextGenerator } from "./text-generator.js";
import { WorkflowEngine } from "./workflow-engine.js";
import { capabilityStatus } from "./capability-status.js";
import { ToolGateway } from "./tool-gateway.js";
import type { ResearchAdapter } from "../research/adapter.js";
import type {
  ChildRunProjection,
  RootExecutionAccounting,
} from "../storage/delegation-journal.js";
import type { QuestionProjection } from "../storage/action-journal.js";
import {
  enabledRoleIds,
  type RolePolicyConfig,
} from "./role-policy.js";

export interface AuthorityService {
  readonly childAccounting: (
    rootExecutionId: string,
  ) => Effect.Effect<RootExecutionAccounting, PersistenceFailure>;
  readonly children: (
    rootExecutionId?: string,
  ) => Effect.Effect<readonly ChildRunProjection[], PersistenceFailure>;
  readonly questions: () => Effect.Effect<
    readonly QuestionProjection[],
    PersistenceFailure
  >;
  readonly close: () => void;
  readonly events: () => Effect.Effect<
    readonly StoredEvent[],
    PersistenceFailure
  >;
  readonly messages: (
    threadId?: string,
  ) => Effect.Effect<readonly ChatMessageProjection[], PersistenceFailure>;
  readonly projection: (
    projectionId: string,
  ) => Effect.Effect<unknown, PersistenceFailure | PluginFailure>;
  readonly run: (
    input: unknown,
    onDelta?: (delta: ActionStreamDelta) => void,
  ) => Effect.Effect<CommandAcknowledgement, CommandFailure>;
  readonly submit: (
    input: unknown,
  ) => Effect.Effect<CommandAcknowledgement, CommandFailure>;
  readonly status: () => Effect.Effect<CapabilityStatusReport>;
  readonly threads: () => Effect.Effect<
    readonly ThreadProjection[],
    PersistenceFailure
  >;
}

export interface AuthorityConfig extends AuthenticatorConfig {
  readonly configDigest: string;
  readonly databasePath: string;
  readonly plugins: StaticPluginCatalog;
  readonly supervisor: SupervisorClient;
  readonly researchAdapter?: ResearchAdapter;
  readonly textGenerator?: TextGenerator;
  readonly providerRoutes?: Readonly<Record<string, ProviderRouteConfig>>;
  readonly rolePolicy: RolePolicyConfig;
}

const persistenceFailure = () =>
  new PersistenceFailure({ message: "EVENT_JOURNAL_UNAVAILABLE" });

export const makeAuthority = (config: AuthorityConfig): AuthorityService => {
  const journal = EventJournal.open(
    config.databasePath,
    config.plugins.catalogDigest,
  );
  const authenticate = makeAuthenticator(config);
  const runSemaphore = Semaphore.makeUnsafe(1);
  const coordinationSemaphore = Semaphore.makeUnsafe(1);
  const deltaSinks = new Map<string, (delta: ActionStreamDelta) => void>();
  const routeDelta = (delta: ActionStreamDelta): void => {
    const correlation =
      delta.correlation &&
      typeof delta.correlation === "object" &&
      !Array.isArray(delta.correlation)
        ? (delta.correlation as Record<string, unknown>)
        : undefined;
    if (typeof correlation?.turnId === "string")
      deltaSinks.get(correlation.turnId)?.(delta);
  };
  const enabledAgentIds = enabledRoleIds(config.rolePolicy);
  const promptAssembler = new PromptAssembler(config.plugins, () =>
    journal.readEvents(),
  );
  const projectionEngine = new ProjectionEngine(config.plugins, () =>
    journal.readEvents(),
  );
  const grantedCapabilities = new Set([
    "semantic.command",
    "user.question",
    ...(config.textGenerator || config.providerRoutes
      ? ["child.propose", "provider.generate"]
      : []),
    ...(config.researchAdapter?.receipt.capabilities ?? []),
    ...(config.supervisor.receipt.capabilities.filesystemRead
      ? ["filesystem.read"]
      : []),
    ...(config.supervisor.receipt.capabilities.filesystemMutation
      ? ["filesystem.mutation"]
      : []),
    ...(config.supervisor.receipt.capabilities.process
      ? ["process.execution"]
      : []),
    ...(config.supervisor.receipt.capabilities.git ? ["git.read"] : []),
    ...(config.supervisor.receipt.capabilities.gitMutation
      ? ["git.mutation"]
      : []),
  ]);
  const providerGateway = new ProviderGateway(
    journal.actions,
    journal.attempts,
    promptAssembler,
    config.plugins,
    config.providerRoutes ?? config.textGenerator,
    config.now,
    grantedCapabilities,
    config.configDigest,
    enabledAgentIds,
  );
  const toolGateway = new ToolGateway(
    journal.actions,
    journal.attempts,
    config.plugins,
    config.supervisor,
    config.now,
    grantedCapabilities,
    config.researchAdapter,
    config.actorId,
    config.configDigest,
    enabledAgentIds,
  );
  const reactions = new ReactionEngine(
    journal,
    config.plugins,
    providerGateway,
    toolGateway,
    config.now,
    grantedCapabilities,
    config.actorId,
    config.rolePolicy,
  );
  const workflows = new WorkflowEngine(
    journal,
    config.plugins,
    grantedCapabilities,
    config.actorId,
    config.now,
  );
  const status = capabilityStatus({
    providerConfigured:
      config.textGenerator !== undefined || config.providerRoutes !== undefined,
    researchCapabilities:
      config.researchAdapter?.receipt.capabilities ?? [],
    supervisor: config.supervisor.receipt,
  });

  const readEvents = Effect.fn("HarnessAuthority.readEvents")(() =>
    Effect.try({
      try: () => journal.readEvents(),
      catch: persistenceFailure,
    }),
  );

  const children = Effect.fn("HarnessAuthority.children")(
    (rootExecutionId?: string) =>
      Effect.try({
        try: () => journal.delegations.childRuns(rootExecutionId),
        catch: persistenceFailure,
      }),
  );

  const childAccounting = Effect.fn("HarnessAuthority.childAccounting")(
    (rootExecutionId: string) =>
      Effect.try({
        try: () => journal.delegations.accounting(rootExecutionId),
        catch: persistenceFailure,
      }),
  );

  const questions = Effect.fn("HarnessAuthority.questions")(() =>
    Effect.try({
      try: () => journal.actions.questions(),
      catch: persistenceFailure,
    }),
  );

  const admit = Effect.fn("HarnessAuthority.admit")(function* (
    authenticated: AuthenticatedCommand,
  ) {
    const { command } = authenticated.envelope;
    const owner = config.plugins.find(command.kind);
    if (!owner)
      return yield* new CommandUnavailable({
        kind: command.kind,
        message: "COMMAND_KIND_UNAVAILABLE",
      });
    const currentEvents = yield* readEvents();
    const events = yield* owner
      .decide(command, {
        defaultPrimaryRole: config.rolePolicy.defaultPrimaryRole,
        enabledAgentIds,
        enabledPrimaryAgentIds: new Set(
          config.rolePolicy.enabledPrimaryRoles,
        ),
        events: currentEvents,
        grantedCapabilities,
      })
      .pipe(
      Effect.mapError((error) =>
        error._tag === "InputRejected"
          ? error
          : new PluginFailure({
              pluginId: owner.pluginId,
              message: "PLUGIN_DECISION_FAILED",
            }),
      ),
    );
    if (events.length === 0)
      return yield* new PluginFailure({
        pluginId: owner.pluginId,
        message: "PLUGIN_EVENT_REQUIRED",
      });

    const result = yield* Effect.try({
      try: () =>
        journal.admit({
          acceptedAt: new Date(config.now()).toISOString(),
          actorId: authenticated.envelope.actorId,
          commandDigest: authenticated.commandDigest,
          commandId: command.id,
          contributionId: owner.contributionId,
          contributionVersion: String(owner.contributionVersion),
          events,
          nonce: authenticated.envelope.nonce,
          pluginId: owner.pluginId,
        }),
      catch: persistenceFailure,
    });
    if (result._tag === "Conflict")
      return yield* new CommandConflict({
        commandId: command.id,
        message: "COMMAND_DIGEST_CONFLICT",
      });
    return result.acknowledgement;
  });

  const coordinate = Effect.fn("HarnessAuthority.coordinate")(function* (
    onDelta?: (delta: ActionStreamDelta) => void,
    failureExecutionId?: string,
  ) {
    for (let cycle = 0; cycle < 128; cycle += 1) {
      const before = yield* workflows.drain();
      const reaction = yield* reactions
        .drain(onDelta, failureExecutionId)
        .pipe(Effect.result);
      const after = yield* workflows.drain();
      if (reaction._tag === "Failure") return yield* reaction.failure;
      if (before + after === 0) return;
    }
    return yield* new PluginFailure({
      message: "KERNEL_COORDINATION_LIMIT_EXCEEDED",
      pluginId: "curiosity.kernel.coordinator",
    });
  });

  const control = Effect.fn("HarnessAuthority.control")(function* (
    authenticated: AuthenticatedCommand,
    command: KernelControlCommand,
  ) {
    const { envelope, commandDigest } = authenticated;
    const acceptedAt = new Date(config.now()).toISOString();
    const event =
      command.kind === "execution.cancel"
        ? {
            body: {
              executionId: command.executionId,
              schemaVersion: 1,
            },
            streamId: command.executionId,
            type: "execution.cancelled",
          }
        : command.kind === "question.answer"
          ? {
              body: {
                answer: command.answer,
                questionId: command.questionId,
                schemaVersion: 1,
              },
              streamId: command.questionId,
              type: "question.answered",
            }
          : command.kind === "state.import-observations"
            ? {
                body: {
                  acceptedRows: command.rows.length,
                  rejectedRows: 0,
                  schemaVersion: 1,
                  sourceDigest: command.sourceDigest,
                  sourcePath: command.sourcePath,
                  sourceVersion: command.sourceVersion,
                },
                streamId: `import:${command.sourceDigest}`,
                type: "observation.import-reconciled",
              }
          : {
            body: {
              decision: command.decision,
              gateId: command.gateId,
              payloadDigest: command.payloadDigest,
              proposalRevision: command.proposalRevision,
              schemaVersion: 1,
            },
            streamId: command.gateId,
            type: "gate.decision-recorded",
          };
    const result =
      command.kind === "execution.cancel"
        ? yield* Effect.try({
            try: () =>
              journal.attempts.cancelExecution({
                acceptedAt,
                actorId: envelope.actorId,
                commandDigest,
                commandId: envelope.command.id,
                events: [event],
                executionId: command.executionId,
                nonce: envelope.nonce,
                pluginId: "curiosity.kernel.control",
              }),
            catch: (error) =>
              error instanceof Error &&
              ["EXECUTION_NOT_FOUND", "EXECUTION_NOT_CANCELLABLE"].includes(
                error.message,
              )
                ? new InputRejected({ message: error.message })
                : persistenceFailure(),
          })
        : command.kind === "question.answer"
          ? yield* Effect.try({
              try: () =>
                journal.actions.answerQuestion({
                  acceptedAt,
                  actorId: envelope.actorId,
                  answer: command.answer,
                  answeredAt: acceptedAt,
                  commandDigest,
                  commandId: envelope.command.id,
                  events: [event],
                  nonce: envelope.nonce,
                  pluginId: "curiosity.kernel.control",
                  questionId: command.questionId,
                }),
              catch: (error) =>
                error instanceof Error &&
                [
                  "QUESTION_ACTION_NOT_WAITING",
                  "QUESTION_ANSWER_DENIED",
                  "QUESTION_ANSWER_INVALID",
                ].includes(error.message)
                  ? new InputRejected({ message: error.message })
                  : persistenceFailure(),
            })
          : command.kind === "state.import-observations"
            ? yield* Effect.try({
                try: () =>
                  journal.admit({
                    acceptedAt,
                    actorId: envelope.actorId,
                    commandDigest,
                    commandId: envelope.command.id,
                    events: [
                      ...command.rows.map((row) => ({
                        body: {
                          content: row.content,
                          importAuthority: "non-authoritative",
                          rowId: row.rowId,
                          rowType: row.type,
                          schemaVersion: 1,
                          sourceDigest: command.sourceDigest,
                          sourcePath: command.sourcePath,
                          sourceVersion: command.sourceVersion,
                          taint: "untrusted-import",
                        },
                        streamId: `import:${command.sourceDigest}`,
                        type: "observation.imported",
                      })),
                      event,
                    ],
                    nonce: envelope.nonce,
                    pluginId: "curiosity.kernel.import",
                  }),
                catch: persistenceFailure,
              })
          : yield* Effect.try({
            try: () =>
              journal.attempts.decideGate({
                acceptedAt,
                actorId: envelope.actorId,
                commandDigest,
                commandId: envelope.command.id,
                decidedAt: acceptedAt,
                decision: command.decision,
                decisionCommandId: envelope.command.id,
                events: [event],
                gateId: command.gateId,
                nonce: envelope.nonce,
                payloadDigest: command.payloadDigest,
                pluginId: "curiosity.kernel.control",
                proposalRevision: command.proposalRevision,
              }),
            catch: (error) =>
              error instanceof Error && error.message === "GATE_DECISION_DENIED"
                ? new InputRejected({ message: error.message })
                : persistenceFailure(),
          });
    if (result._tag === "Conflict")
      return yield* new CommandConflict({
        commandId: envelope.command.id,
        message: "COMMAND_DIGEST_CONFLICT",
      });
    if (command.kind === "execution.cancel")
      providerGateway.cancelGovernedExecutions();
    if (command.kind === "execution.cancel")
      toolGateway.cancelGovernedExecutions();
    return result.acknowledgement;
  });

  const admitAuthenticated = Effect.fn("HarnessAuthority.admit")(function* (
    authenticated: AuthenticatedCommand,
  ) {
    yield* config.supervisor.ensureAvailable();
    return yield* admit(authenticated);
  });
  const run: AuthorityService["run"] = (input, onDelta) =>
    authenticate(input).pipe(
      Effect.flatMap((authenticated) =>
        decodeKernelControlCommand(authenticated.envelope.command).pipe(
          Effect.flatMap((command) => {
            const admission = command
              ? control(authenticated, command)
              : admitAuthenticated(authenticated);
            const payload = authenticated.envelope.command.payload;
            const turnId =
              !command &&
              payload &&
              typeof payload === "object" &&
              !Array.isArray(payload) &&
              typeof (payload as Record<string, unknown>).turnId === "string"
                ? ((payload as Record<string, unknown>).turnId as string)
                : undefined;
            const failureExecutionId =
              command?.kind === "question.answer"
                ? journal.actions.questionExecutionId(command.questionId)
                : command?.kind === "gate.decide"
                  ? journal.actions.gateExecutionId(command.gateId)
                  : !command &&
                      payload &&
                      typeof payload === "object" &&
                      !Array.isArray(payload)
                    ? (["turnId", "executionId", "subjectId", "instanceId"]
                        .map((key) => (payload as Record<string, unknown>)[key])
                        .find(
                          (value): value is string =>
                            typeof value === "string" && value.length > 0,
                        ) ?? undefined)
                    : undefined;
            if (turnId && onDelta) deltaSinks.set(turnId, onDelta);
            return runSemaphore.withPermit(admission).pipe(
              Effect.flatMap((acknowledgement) => {
                reactions.notifyAdmission();
                const shouldCoordinate =
                  !command ||
                  command.kind === "question.answer" ||
                  (command.kind === "gate.decide" &&
                    command.decision === "approved");
                return shouldCoordinate
                  ? coordinationSemaphore
                      .withPermit(
                        coordinate(routeDelta, failureExecutionId),
                      )
                      .pipe(
                      Effect.map(() => acknowledgement),
                    )
                  : Effect.succeed(acknowledgement);
              }),
              Effect.ensuring(
                Effect.sync(() => {
                  if (turnId && onDelta && deltaSinks.get(turnId) === onDelta)
                    deltaSinks.delete(turnId);
                }),
              ),
            );
          }),
        ),
      ),
    );
  const submit: AuthorityService["submit"] = (input) => run(input);

  const threads = Effect.fn("HarnessAuthority.projectThreads")(() =>
    Effect.try({
      try: () => projectThreads(journal.readEvents()),
      catch: persistenceFailure,
    }),
  );
  const messages = Effect.fn("HarnessAuthority.projectMessages")(
    (threadId?: string) =>
      Effect.try({
        try: () => projectChatMessages(journal.readEvents(), threadId),
        catch: persistenceFailure,
      }),
  );
  const projection = Effect.fn("HarnessAuthority.projectPlugin")(
    (projectionId: string) =>
      projectionEngine
        .replay(projectionId)
        .pipe(Effect.catchDefect(() => Effect.fail(persistenceFailure()))),
  );

  return {
    childAccounting,
    children,
    close: () => {
      try {
        config.researchAdapter?.close();
      } finally {
        journal.close();
      }
    },
    events: readEvents,
    messages,
    projection,
    questions,
    run,
    status: () => Effect.succeed(status),
    submit,
    threads,
  };
};
