import { Context, Effect, Layer, ManagedRuntime } from "effect";
import type { ChatTurnResult } from "../domain/chat.js";
import type { CapabilityStatusReport } from "../domain/capability-status.js";
import type { CommandAcknowledgement } from "../domain/event.js";
import type { ChatMessageProjection } from "../projection/chat-projection.js";
import type { ThreadProjection } from "../projection/thread-projection.js";
import { createStockPluginCatalog } from "../plugins/registry.js";
import { makeChatApi } from "../clients/chat-api.js";
import { SupervisorClient } from "../supervisor/client.js";
import { makeAuthority, type AuthorityService } from "./authority.js";
import { PersistenceFailure, SupervisorUnavailable } from "./errors.js";
import type { StaticPluginCatalog } from "./plugin.js";
import type { TextGenerator } from "./text-generator.js";

export interface CuriosityHarnessConfig {
  readonly actorId: string;
  readonly authenticationSecret: string;
  readonly databasePath: string;
  readonly supervisorPath: string;
  readonly workspaceRoot: string;
  readonly maxClockSkewMs?: number;
  readonly clock?: () => number;
  readonly textGenerator?: TextGenerator;
}

export interface CuriosityHarness {
  readonly catalog: CuriosityPluginCatalogProjection;
  readonly submit: (input: unknown) => Promise<CommandAcknowledgement>;
  readonly chat: (
    input: unknown,
    onTextDelta?: (delta: string) => void,
  ) => Promise<ChatTurnResult>;
  readonly projections: {
    readonly messages: (
      threadId?: string,
    ) => Promise<readonly ChatMessageProjection[]>;
    readonly plugin: (projectionId: string) => Promise<unknown>;
    readonly threads: () => Promise<readonly ThreadProjection[]>;
  };
  readonly status: () => Promise<CapabilityStatusReport>;
  readonly dispose: () => Promise<void>;
}

export interface CuriosityPluginCatalogProjection {
  readonly agents: readonly {
    readonly description: string;
    readonly id: string;
    readonly mode: "primary" | "subagent";
  }[];
  readonly digest: string;
  readonly pluginIds: readonly string[];
  readonly promptCommands: readonly {
    readonly description: string;
    readonly name: string;
    readonly status: "active" | "compatibility-deprecated";
  }[];
  readonly skills: readonly string[];
  readonly tools: readonly string[];
  readonly workflows: readonly string[];
}

class HarnessAuthority extends Context.Service<
  HarnessAuthority,
  AuthorityService
>()("@curiosity/custom-harness/HarnessAuthority") {}

const authorityLayer = (
  config: CuriosityHarnessConfig,
  catalog: StaticPluginCatalog,
) =>
  Layer.effect(
    HarnessAuthority,
    Effect.gen(function* () {
      const supervisor = yield* Effect.acquireRelease(
        Effect.tryPromise({
          try: () =>
            SupervisorClient.start(config.supervisorPath, config.workspaceRoot),
          catch: (error) =>
            error instanceof SupervisorUnavailable
              ? error
              : new SupervisorUnavailable({
                  message: "SUPERVISOR_START_FAILED",
                }),
        }),
        (client) => Effect.promise(() => client.close()),
      );
      return yield* Effect.acquireRelease(
        Effect.try({
          try: () =>
            makeAuthority({
              actorId: config.actorId,
              databasePath: config.databasePath,
              maxClockSkewMs: config.maxClockSkewMs ?? 5 * 60 * 1_000,
              now: config.clock ?? Date.now,
              plugins: catalog,
              secret: config.authenticationSecret,
              supervisor,
              ...(config.textGenerator
                ? { textGenerator: config.textGenerator }
                : {}),
            }),
          catch: () =>
            new PersistenceFailure({ message: "EVENT_JOURNAL_UNAVAILABLE" }),
        }),
        (authority) => Effect.sync(authority.close),
      );
    }),
  );

const validateConfig = (config: CuriosityHarnessConfig): void => {
  if (!config.actorId.trim()) throw new Error("HARNESS_ACTOR_REQUIRED");
  if (Buffer.byteLength(config.authenticationSecret) < 32)
    throw new Error("HARNESS_SECRET_TOO_SHORT");
  if (!config.databasePath.trim())
    throw new Error("HARNESS_DATABASE_PATH_REQUIRED");
  if (!config.supervisorPath.trim())
    throw new Error("HARNESS_SUPERVISOR_PATH_REQUIRED");
  if (!config.workspaceRoot.trim())
    throw new Error("HARNESS_WORKSPACE_ROOT_REQUIRED");
};

export const createCuriosityHarness = (
  config: CuriosityHarnessConfig,
): CuriosityHarness => {
  validateConfig(config);
  const pluginCatalog = createStockPluginCatalog();
  const catalog = Object.freeze({
    agents: Object.freeze(
      pluginCatalog.agents().map(({ description, id, mode }) =>
        Object.freeze({ description, id, mode }),
      ),
    ),
    digest: pluginCatalog.catalogDigest,
    pluginIds: pluginCatalog.pluginIds,
    promptCommands: Object.freeze(
      pluginCatalog
        .promptCommands()
        .map(({ description, name, status }) =>
          Object.freeze({ description, name, status }),
        ),
    ),
    skills: Object.freeze(pluginCatalog.skills().map(({ name }) => name)),
    tools: Object.freeze(pluginCatalog.tools().map(({ name }) => name)),
    workflows: Object.freeze(
      pluginCatalog.workflows().map(({ name }) => name),
    ),
  });
  const runtime = ManagedRuntime.make(authorityLayer(config, pluginCatalog));
  const run = (
    input: unknown,
    onDelta?: Parameters<AuthorityService["run"]>[1],
  ) =>
    runtime.runPromise(
      HarnessAuthority.use((authority) => authority.run(input, onDelta)),
    );
  const messages = (threadId?: string) =>
    runtime.runPromise(
      HarnessAuthority.use((authority) => authority.messages(threadId)),
    );
  const chat = makeChatApi({
    events: () =>
      runtime.runPromise(
        HarnessAuthority.use((authority) => authority.events()),
      ),
    messages: (threadId) => messages(threadId),
    run,
  });
  return Object.freeze({
    catalog,
    chat,
    submit: (input: unknown) =>
      runtime.runPromise(
        HarnessAuthority.use((authority) => authority.submit(input)),
      ),
    projections: Object.freeze({
      messages,
      plugin: (projectionId: string) =>
        runtime.runPromise(
          HarnessAuthority.use((authority) =>
            authority.projection(projectionId),
          ),
        ),
      threads: () =>
        runtime.runPromise(
          HarnessAuthority.use((authority) => authority.threads()),
        ),
    }),
    status: () =>
      runtime.runPromise(
        HarnessAuthority.use((authority) => authority.status()),
      ),
    dispose: () => runtime.dispose(),
  });
};
