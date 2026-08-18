import type { Diagnostic } from "../../core/diagnostics/diagnostic.js";
import { capabilityReport, PINNED_REAL_HOST_VERSION, type RealHostCapabilityReport } from "../real-host/index.js";

export interface DoctorInput {
  readonly pluginApiVersion: string;
  readonly hostVersion: string;
  readonly setupCount: number;
  readonly agents: Readonly<Record<string, { enabled: boolean; model?: string }>>;
  readonly defaultAgent?: string;
  readonly subagentDepth?: number;
  readonly hooks: readonly string[];
  readonly directShellDetected: boolean;
  readonly writerState?: "healthy" | "contended" | "stale" | "corrupt";
  readonly featureIDs?: readonly string[];
  readonly routeIDs?: readonly string[];
  readonly resourceDrift?: readonly string[];
  readonly stateStatus?: "healthy" | "missing" | "corrupt";
  readonly observationErrors?: readonly string[];
  readonly materialErrors?: readonly string[];
  readonly realHostCapabilities?: RealHostCapabilityReport;
}
export interface DoctorDiagnostic extends Diagnostic {
  readonly severity?: "warning" | "error";
}
export const diagnose = (input: DoctorInput): DoctorDiagnostic[] => {
  const diagnostics: DoctorDiagnostic[] = [];
  if (input.pluginApiVersion !== PINNED_REAL_HOST_VERSION) diagnostics.push({ code: "DOCTOR_PLUGIN_API_PIN_MISMATCH" });
  if (input.hostVersion !== PINNED_REAL_HOST_VERSION) diagnostics.push({ code: "DOCTOR_HOST_VERSION_UNSUPPORTED" });
  if (input.setupCount > 1) diagnostics.push({ code: "DOCTOR_DUPLICATE_LOAD_DETECTED" });
  if (!input.defaultAgent || !input.agents[input.defaultAgent]?.enabled)
    diagnostics.push({ code: "DOCTOR_DEFAULT_AGENT_INVALID" });
  if (Object.values(input.agents).some((agent) => agent.enabled && (!agent.model || !agent.model.includes("/"))))
    diagnostics.push({ code: "DOCTOR_MODEL_ROUTE_UNQUALIFIED" });
  if (input.subagentDepth !== 3) diagnostics.push({ code: "DOCTOR_SUBAGENT_DEPTH_UNPROVEN" });
  for (const hook of ["session.context", "tool.execute.before", "tool.execute.after", "event.subscribe"])
    if (!input.hooks.includes(hook)) diagnostics.push({ code: "DOCTOR_HOOK_MISSING", path: hook });
  if (input.directShellDetected) diagnostics.push({ code: "DOCTOR_DIRECT_SHELL_PROHIBITED" });
  if (input.writerState && input.writerState !== "healthy")
    diagnostics.push({ code: "DOCTOR_WRITER_UNHEALTHY", path: input.writerState, severity: "error" });
  for (const feature of ["hook-foundation", "structured-tools"])
    if (input.featureIDs && !input.featureIDs.includes(feature))
      diagnostics.push({ code: "DOCTOR_FEATURE_MISSING", path: feature, severity: "error" });
  for (const route of Object.keys(input.agents).filter((id) => input.agents[id]?.enabled))
    if (input.routeIDs && !input.routeIDs.includes(route))
      diagnostics.push({ code: "DOCTOR_ROUTE_MISSING", path: route, severity: "error" });
  for (const resource of input.resourceDrift ?? [])
    diagnostics.push({ code: "DOCTOR_RESOURCE_DRIFT", path: resource, severity: "error" });
  if (input.stateStatus === "corrupt") diagnostics.push({ code: "DOCTOR_STATE_CORRUPT", severity: "error" });
  for (const observation of input.observationErrors ?? [])
    diagnostics.push({ code: "DOCTOR_OBSERVATION_UNAVAILABLE", path: observation, severity: "warning" });
  for (const material of input.materialErrors ?? [])
    diagnostics.push({ code: "DOCTOR_MATERIAL_AUTHORITY_BLOCKED", path: material, severity: "error" });
  const realHostCapabilities =
    input.realHostCapabilities ??
    capabilityReport({ hostVersion: input.hostVersion, pluginApiVersion: input.pluginApiVersion });
  for (const capability of Object.values(realHostCapabilities))
    if (capability.status === "disabled") diagnostics.push({ code: capability.code, severity: "error" });
  diagnostics.push({ code: "DOCTOR_NATIVE_CHILD_LINEAGE_UNSUPPORTED" });
  diagnostics.push({ code: "DOCTOR_FILESYSTEM_AUTHORITY_BOUNDED" });
  diagnostics.push({ code: "DOCTOR_BOUNDED_ROOT_ACTIVATION_DISABLED" });
  return diagnostics;
};
