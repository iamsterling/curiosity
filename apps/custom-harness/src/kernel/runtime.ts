import { Context, Effect, Layer, ManagedRuntime } from "effect";
import { createHash } from "node:crypto";
import type { ChatTurnResult } from "../domain/chat.js";
import type { CapabilityStatusReport } from "../domain/capability-status.js";
import type { CommandAcknowledgement } from "../domain/event.js";
import type { ChatMessageProjection } from "../projection/chat-projection.js";
import type { ThreadProjection } from "../projection/thread-projection.js";
import { createStockPluginCatalog } from "../plugins/registry.js";
import { makeChatApi } from "../clients/chat-api.js";
import {
  SupervisorClient,
  type GitProfileConfig,
  type ProcessProfileConfig,
} from "../supervisor/client.js";
import { makeAuthority, type AuthorityService } from "./authority.js";
import { PersistenceFailure, SupervisorUnavailable } from "./errors.js";
import type { StaticPluginCatalog } from "./plugin.js";
import type { ProviderRouteConfig, TextGenerator } from "./text-generator.js";
import {
  validateResearchAdapter,
  type ResearchAdapter,
} from "../research/adapter.js";
import type {
  ChildRunProjection,
  RootExecutionAccounting,
} from "../storage/delegation-journal.js";
import type { QuestionProjection } from "../storage/action-journal.js";
import { canonicalJson } from "./canonical-json.js";
import {
  defaultRolePolicy,
  enabledRoleIds,
  validateRolePolicy,
  type PrimaryRoleId,
  type RolePolicyConfig,
} from "./role-policy.js";
export type {
  PrimaryRoleId,
  RolePolicyConfig,
  SubagentRoleId,
} from "./role-policy.js";

export interface CuriosityHarnessConfig {
  readonly actorId: string;
  readonly authenticationSecret: string;
  readonly databasePath: string;
  readonly supervisorPath: string;
  readonly workspaceRoot: string;
  readonly maxClockSkewMs?: number;
  readonly clock?: () => number;
  readonly textGenerator?: TextGenerator;
  readonly providerRoutes?: Readonly<Record<string, ProviderRouteConfig>>;
  readonly researchAdapter?: ResearchAdapter;
  readonly processProfiles?: readonly ProcessProfileConfig[];
  readonly workspaceMutationEnabled?: boolean;
  readonly gitProfile?: GitProfileConfig;
  readonly rolePolicy?: RolePolicyConfig;
}

export interface CuriosityHarness {
  readonly catalog: CuriosityPluginCatalogProjection;
  readonly submit: (input: unknown) => Promise<CommandAcknowledgement>;
  readonly chat: (
    input: unknown,
    onTextDelta?: (delta: string) => void,
  ) => Promise<ChatTurnResult>;
  readonly projections: {
    readonly childAccounting: (
      rootExecutionId: string,
    ) => Promise<RootExecutionAccounting>;
    readonly children: (
      rootExecutionId?: string,
    ) => Promise<readonly ChildRunProjection[]>;
    readonly questions: () => Promise<readonly QuestionProjection[]>;
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
  readonly defaultPrimaryRole: PrimaryRoleId;
  readonly pluginIds: readonly string[];
  readonly promptCommands: readonly {
    readonly agentId?: string;
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

const configIdentityDigest = (config: CuriosityHarnessConfig): string =>
  createHash("sha256")
    .update(
      canonicalJson({
        actorId: config.actorId,
        processProfiles: (config.processProfiles ?? []).map((profile) => ({
          allowedArguments: profile.allowedArguments,
          allowedCwds: profile.allowedCwds,
          environment: profile.environment,
          executable: profile.executable,
          executableSha256: profile.executableSha256,
          id: profile.id,
          maximumOutputBytes: profile.maximumOutputBytes,
          maximumTimeoutMs: profile.maximumTimeoutMs,
        })),
        gitProfile: config.gitProfile ?? null,
        providerRoutes: config.providerRoutes
          ? Object.fromEntries(
              Object.entries(config.providerRoutes)
                .sort(([left], [right]) => left.localeCompare(right))
                .map(([role, route]) => [
                  role,
                  {
                    adapterVersion: route.adapterVersion,
                    effort: route.generator.effort,
                    modelId: route.generator.modelId,
                    routeId: route.routeId,
                  },
                ]),
            )
          : config.textGenerator
            ? {
                shared: {
                  adapterVersion: "shared-v1",
                  effort: config.textGenerator.effort,
                  modelId: config.textGenerator.modelId,
                },
              }
            : {},
        researchAdapter: config.researchAdapter?.receipt ?? null,
        rolePolicy: config.rolePolicy ?? defaultRolePolicy,
        schemaVersion: 1,
        workspaceMutationEnabled: config.workspaceMutationEnabled ?? false,
        workspaceRoot: config.workspaceRoot,
      }),
    )
    .digest("hex");

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
            SupervisorClient.start(
              config.supervisorPath,
              config.workspaceRoot,
              config.processProfiles,
              config.workspaceMutationEnabled,
              config.gitProfile,
            ),
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
              configDigest: configIdentityDigest(config),
              databasePath: config.databasePath,
              maxClockSkewMs: config.maxClockSkewMs ?? 5 * 60 * 1_000,
              now: config.clock ?? Date.now,
              plugins: catalog,
              rolePolicy: config.rolePolicy ?? defaultRolePolicy,
              secret: config.authenticationSecret,
              supervisor,
              ...(config.researchAdapter
                ? { researchAdapter: config.researchAdapter }
                : {}),
              ...(config.textGenerator
                ? { textGenerator: config.textGenerator }
                : {}),
              ...(config.providerRoutes
                ? { providerRoutes: config.providerRoutes }
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
  const allowedKeys = new Set([
    "actorId",
    "authenticationSecret",
    "clock",
    "databasePath",
    "gitProfile",
    "maxClockSkewMs",
    "processProfiles",
    "providerRoutes",
    "researchAdapter",
    "rolePolicy",
    "supervisorPath",
    "textGenerator",
    "workspaceMutationEnabled",
    "workspaceRoot",
  ]);
  if (
    Object.keys(config as unknown as Record<string, unknown>).some(
      (key) => !allowedKeys.has(key),
    )
  )
    throw new Error("HARNESS_CONFIG_UNKNOWN_FIELD");
  if (!config.actorId.trim()) throw new Error("HARNESS_ACTOR_REQUIRED");
  if (Buffer.byteLength(config.authenticationSecret) < 32)
    throw new Error("HARNESS_SECRET_TOO_SHORT");
  if (!config.databasePath.trim())
    throw new Error("HARNESS_DATABASE_PATH_REQUIRED");
  if (!config.supervisorPath.trim())
    throw new Error("HARNESS_SUPERVISOR_PATH_REQUIRED");
  if (!config.workspaceRoot.trim())
    throw new Error("HARNESS_WORKSPACE_ROOT_REQUIRED");
  if (config.researchAdapter) validateResearchAdapter(config.researchAdapter);
  const rolePolicy = config.rolePolicy ?? defaultRolePolicy;
  validateRolePolicy(rolePolicy);
  if (config.textGenerator && config.providerRoutes)
    throw new Error("PROVIDER_ROUTE_CONFIG_CONFLICT");
  if (config.providerRoutes) {
    const expected = [
      ...rolePolicy.enabledPrimaryRoles,
      ...rolePolicy.enabledSubagentRoles,
    ];
    if (
      Object.keys(config.providerRoutes).sort().join(",") !==
      expected.sort().join(",")
    )
      throw new Error("PROVIDER_ROUTE_COVERAGE_INVALID");
    for (const route of Object.values(config.providerRoutes))
      if (
        !/^[A-Za-z0-9][A-Za-z0-9._:-]{0,255}$/u.test(route.routeId) ||
        !/^[A-Za-z0-9][A-Za-z0-9._+-]{0,127}$/u.test(route.adapterVersion) ||
        !route.generator.modelId ||
        !route.generator.effort
      )
        throw new Error("PROVIDER_ROUTE_INVALID");
  }
};

export const createCuriosityHarness = (
  config: CuriosityHarnessConfig,
): CuriosityHarness => {
  validateConfig(config);
  const pluginCatalog = createStockPluginCatalog();
  const rolePolicy = config.rolePolicy ?? defaultRolePolicy;
  const enabledAgentIds = enabledRoleIds(rolePolicy);
  const catalog = Object.freeze({
    agents: Object.freeze(
      pluginCatalog
        .agents()
        .filter(({ id }) => enabledAgentIds.has(id as never))
        .map(({ description, id, mode }) =>
          Object.freeze({ description, id, mode }),
        ),
    ),
    defaultPrimaryRole: rolePolicy.defaultPrimaryRole,
    digest: pluginCatalog.catalogDigest,
    pluginIds: pluginCatalog.pluginIds,
    promptCommands: Object.freeze(
      pluginCatalog
        .promptCommands()
        .filter(({ agentId }) => !agentId || enabledAgentIds.has(agentId as never))
        .map(({ agentId, description, name, status }) =>
          Object.freeze({
            ...(agentId ? { agentId } : {}),
            description,
            name,
            status,
          }),
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
      childAccounting: (rootExecutionId: string) =>
        runtime.runPromise(
          HarnessAuthority.use((authority) =>
            authority.childAccounting(rootExecutionId),
          ),
        ),
      children: (rootExecutionId?: string) =>
        runtime.runPromise(
          HarnessAuthority.use((authority) =>
            authority.children(rootExecutionId),
          ),
        ),
      questions: () =>
        runtime.runPromise(
          HarnessAuthority.use((authority) => authority.questions()),
        ),
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
