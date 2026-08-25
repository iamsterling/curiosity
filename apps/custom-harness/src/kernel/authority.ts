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
import type { TextGenerator } from "./text-generator.js";
import { WorkflowEngine } from "./workflow-engine.js";
import { capabilityStatus } from "./capability-status.js";

export interface AuthorityService {
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
  readonly databasePath: string;
  readonly plugins: StaticPluginCatalog;
  readonly supervisor: SupervisorClient;
  readonly textGenerator?: TextGenerator;
}

const persistenceFailure = () =>
  new PersistenceFailure({ message: "EVENT_JOURNAL_UNAVAILABLE" });

export const makeAuthority = (config: AuthorityConfig): AuthorityService => {
  const journal = EventJournal.open(config.databasePath);
  const authenticate = makeAuthenticator(config);
  const runSemaphore = Semaphore.makeUnsafe(1);
  const promptAssembler = new PromptAssembler(config.plugins, () =>
    journal.readEvents(),
  );
  const projectionEngine = new ProjectionEngine(config.plugins, () =>
    journal.readEvents(),
  );
  const providerGateway = new ProviderGateway(
    journal.actions,
    journal.attempts,
    promptAssembler,
    config.textGenerator,
    config.now,
    new Set(config.textGenerator ? ["provider.generate"] : []),
  );
  const reactions = new ReactionEngine(
    journal,
    config.plugins,
    providerGateway,
    config.now,
    new Set(config.textGenerator ? ["provider.generate"] : []),
    config.actorId,
  );
  const workflows = new WorkflowEngine(
    journal,
    config.plugins,
    new Set(config.textGenerator ? ["provider.generate"] : []),
    config.actorId,
    config.now,
  );
  const status = capabilityStatus({
    providerConfigured: config.textGenerator !== undefined,
    supervisor: config.supervisor.receipt,
  });

  const readEvents = Effect.fn("HarnessAuthority.readEvents")(() =>
    Effect.try({
      try: () => journal.readEvents(),
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
    const events = yield* owner.decide(command, { events: currentEvents }).pipe(
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
  ) {
    for (let cycle = 0; cycle < 128; cycle += 1) {
      const before = yield* workflows.drain();
      const reaction = yield* reactions.drain(onDelta).pipe(Effect.result);
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
              ["EXECUTION_NOT_FOUND"].includes(error.message)
                ? new InputRejected({ message: error.message })
                : persistenceFailure(),
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
    if (command.kind === "gate.decide" && command.decision === "approved")
      yield* runSemaphore.withPermit(coordinate());
    return result.acknowledgement;
  });

  const execute = Effect.fn("HarnessAuthority.run")(function* (
    authenticated: AuthenticatedCommand,
    onDelta?: (delta: ActionStreamDelta) => void,
  ) {
    yield* config.supervisor.ensureAvailable();
    const acknowledgement = yield* admit(authenticated);
    yield* coordinate(onDelta);
    return acknowledgement;
  });
  const run: AuthorityService["run"] = (input, onDelta) =>
    authenticate(input).pipe(
      Effect.flatMap((authenticated) =>
        decodeKernelControlCommand(authenticated.envelope.command).pipe(
          Effect.flatMap((command) =>
            command
              ? control(authenticated, command)
              : runSemaphore.withPermit(execute(authenticated, onDelta)),
          ),
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
    close: () => journal.close(),
    events: readEvents,
    messages,
    projection,
    run,
    status: () => Effect.succeed(status),
    submit,
    threads,
  };
};
