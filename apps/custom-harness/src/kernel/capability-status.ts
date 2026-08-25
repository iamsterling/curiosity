import type { CapabilityStatusReport } from "../domain/capability-status.js";
import type { SupervisorReceipt } from "../supervisor/client.js";

const unavailable = (id: string, reason: string) =>
  Object.freeze({
    id,
    qualifiedForProduction: false as const,
    reason,
    state: "unavailable" as const,
  });

const available = (id: string, reason: string) =>
  Object.freeze({
    id,
    qualifiedForProduction: false as const,
    reason,
    state: "available" as const,
  });

export const capabilityStatus = (input: {
  readonly providerConfigured: boolean;
  readonly supervisor: SupervisorReceipt;
}): CapabilityStatusReport =>
  Object.freeze({
    candidateReady: true,
    capabilities: Object.freeze(
      [
        available(
          "auth.local-command",
          "LOCAL_AUTHENTICATED_COMMAND_PORT_ACTIVE",
        ),
        unavailable("deployment", "DEPLOYMENT_SURFACE_ABSENT"),
        unavailable("filesystem.mutation", "SUPERVISOR_CAPABILITY_DISABLED"),
        unavailable("git.mutation", "GIT_QUALIFICATION_ABSENT"),
        unavailable("mobile", "MOBILE_SURFACE_ABSENT"),
        unavailable("network.search", "SEARCH_ADAPTER_UNQUALIFIED"),
        available(
          "persistence.local-event-journal",
          "LOCAL_EVENT_JOURNAL_ACTIVE",
        ),
        unavailable("platform.windows", "PLATFORM_UNSUPPORTED"),
        unavailable("process.execution", "SUPERVISOR_CAPABILITY_DISABLED"),
        unavailable("production", "PRODUCTION_QUALIFICATION_ABSENT"),
        input.providerConfigured
          ? available(
              "provider.generate",
              "CANDIDATE_LOCAL_PROVIDER_CONFIGURED",
            )
          : unavailable("provider.generate", "PROVIDER_ADAPTER_NOT_CONFIGURED"),
        unavailable("publication", "PUBLICATION_SURFACE_ABSENT"),
        unavailable("remote.transport", "REMOTE_TRANSPORT_ABSENT"),
        unavailable("sandbox.execution", "SANDBOX_QUALIFICATION_ABSENT"),
        unavailable(
          "storage.hard-reset-durability",
          "HARD_RESET_QUALIFICATION_ABSENT",
        ),
        unavailable("tool.evidence-read", "TOOL_ADAPTER_UNAVAILABLE"),
        unavailable("tool.projection-read", "TOOL_ADAPTER_UNAVAILABLE"),
        unavailable("updates.automatic", "AUTO_UPDATE_FORBIDDEN"),
        available("workflow.loop", "BOUNDED_WORKFLOW_KERNEL_ACTIVE"),
        available(
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
      git: input.supervisor.capabilities.git,
      process: input.supervisor.capabilities.process,
      sandbox: input.supervisor.capabilities.sandbox,
    }),
  });
