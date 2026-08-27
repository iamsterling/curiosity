import type { CapabilityStatusReport } from "../domain/capability-status.js";
import type { SupervisorReceipt } from "../supervisor/client.js";

const catalogued = (id: string, reason: string) =>
  Object.freeze({
    id,
    qualifiedForProduction: false as const,
    reason,
    state: "catalogued" as const,
  });

const scaffolded = (id: string, reason: string) =>
  Object.freeze({
    id,
    qualifiedForProduction: false as const,
    reason,
    state: "scaffolded" as const,
  });

const available = (id: string, reason: string) =>
  Object.freeze({
    id,
    qualifiedForProduction: false as const,
    reason,
    state: "available" as const,
  });

const qualified = (id: string, reason: string) =>
  Object.freeze({
    id,
    qualifiedForProduction: false as const,
    reason,
    state: "qualified" as const,
  });

export const capabilityStatus = (input: {
  readonly providerConfigured: boolean;
  readonly researchCapabilities: readonly string[];
  readonly supervisor: SupervisorReceipt;
}): CapabilityStatusReport =>
  Object.freeze({
    candidateReady: true,
    capabilities: Object.freeze(
      [
        qualified(
          "auth.local-command",
          "LOCAL_AUTHENTICATED_COMMAND_PORT_ACTIVE",
        ),
        input.providerConfigured
          ? available("child.propose", "DURABLE_CHILD_SCHEDULER_ACTIVE")
          : scaffolded("child.propose", "PROVIDER_ADAPTER_NOT_CONFIGURED"),
        catalogued("deployment", "DEPLOYMENT_SURFACE_ABSENT"),
        input.supervisor.capabilities.filesystemMutation
          ? available(
              "filesystem.mutation",
              "PRECONDITIONED_ATOMIC_WORKSPACE_MUTATION_ACTIVE",
            )
          : scaffolded("filesystem.mutation", "SUPERVISOR_CAPABILITY_DISABLED"),
        input.supervisor.capabilities.filesystemRead
          ? qualified("filesystem.read", "WORKSPACE_READ_SUPERVISOR_ACTIVE")
          : scaffolded("filesystem.read", "SUPERVISOR_CAPABILITY_DISABLED"),
        input.supervisor.capabilities.git
          ? available("git.read", "IDENTITY_BOUND_GIT_READ_ACTIVE")
          : scaffolded("git.read", "SUPERVISOR_CAPABILITY_DISABLED"),
        input.supervisor.capabilities.gitMutation
          ? available(
              "git.mutation",
              "GATED_WORKTREE_AND_REF_MUTATION_ACTIVE",
            )
          : scaffolded("git.mutation", "GIT_MUTATION_PROFILE_DISABLED"),
        catalogued("mobile", "MOBILE_SURFACE_ABSENT"),
        input.researchCapabilities.includes("network.fetch")
          ? available("network.fetch", "BOUNDED_RESEARCH_ADAPTER_ACTIVE")
          : scaffolded("network.fetch", "FETCH_ADAPTER_UNQUALIFIED"),
        input.researchCapabilities.includes("network.search")
          ? available("network.search", "BOUNDED_RESEARCH_ADAPTER_ACTIVE")
          : scaffolded("network.search", "SEARCH_ADAPTER_UNQUALIFIED"),
        qualified(
          "persistence.local-event-journal",
          "LOCAL_EVENT_JOURNAL_ACTIVE",
        ),
        catalogued("platform.windows", "PLATFORM_UNSUPPORTED"),
        input.supervisor.capabilities.process
          ? available("process.execution", "CLOSED_PROCESS_PROFILE_ACTIVE")
          : scaffolded("process.execution", "SUPERVISOR_CAPABILITY_DISABLED"),
        qualified("user.question", "SIGNED_QUESTION_LIFECYCLE_ACTIVE"),
        catalogued("production", "PRODUCTION_QUALIFICATION_ABSENT"),
        input.providerConfigured
          ? available(
              "provider.generate",
              "CANDIDATE_LOCAL_PROVIDER_CONFIGURED",
            )
          : scaffolded("provider.generate", "PROVIDER_ADAPTER_NOT_CONFIGURED"),
        catalogued("publication", "PUBLICATION_SURFACE_ABSENT"),
        catalogued("remote.transport", "REMOTE_TRANSPORT_ABSENT"),
        scaffolded("sandbox.execution", "SANDBOX_QUALIFICATION_ABSENT"),
        scaffolded(
          "storage.hard-reset-durability",
          "HARD_RESET_QUALIFICATION_ABSENT",
        ),
        scaffolded("tool.evidence-read", "TOOL_ADAPTER_UNAVAILABLE"),
        scaffolded("tool.projection-read", "TOOL_ADAPTER_UNAVAILABLE"),
        qualified(
          "tool.semantic-command",
          "DURABLE_SEMANTIC_COMMAND_GATEWAY_ACTIVE",
        ),
        catalogued("updates.automatic", "AUTO_UPDATE_FORBIDDEN"),
        qualified("workflow.loop", "BOUNDED_WORKFLOW_KERNEL_ACTIVE"),
        qualified(
          "workflow.orchestration",
          "BOUNDED_ORCHESTRATION_KERNEL_ACTIVE",
        ),
      ].sort((left, right) => left.id.localeCompare(right.id)),
    ),
    deploymentReady: false,
    lifecycle: "candidate",
    productionReady: false,
    profile: "trusted-local-single-user",
    publicationReady: false,
    schemaVersion: 1,
    supervisor: Object.freeze({
      filesystemMutation: input.supervisor.capabilities.filesystemMutation,
      filesystemRead: input.supervisor.capabilities.filesystemRead,
      git: input.supervisor.capabilities.git,
      gitMutation: input.supervisor.capabilities.gitMutation,
      process: input.supervisor.capabilities.process,
      sandbox: input.supervisor.capabilities.sandbox,
    }),
  });
