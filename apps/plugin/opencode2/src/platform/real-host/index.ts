export const PINNED_REAL_HOST_VERSION = "0.0.0-beta-17595";

export type RealHostCapabilityName =
  | "reload"
  | "interrupt"
  | "compaction"
  | "childLineage"
  | "concurrentSetup"
  | "authoritativePersistence";
export type RealHostCapabilityCode =
  | "REAL_HOST_RELOAD_UNPROVEN"
  | "REAL_HOST_INTERRUPT_UNPROVEN"
  | "REAL_HOST_COMPACTION_UNSUPPORTED"
  | "REAL_HOST_CHILD_LINEAGE_UNSUPPORTED"
  | "REAL_HOST_WRITER_ELECTION_UNPROVEN"
  | "PERSISTENCE_AUTOMATION_UNSUPPORTED"
  | "REAL_HOST_VERSION_PIN_MISMATCH";

export interface RealHostCapability {
  readonly status: "disabled";
  readonly code: RealHostCapabilityCode;
}

export type RealHostCapabilityReport = Readonly<Record<RealHostCapabilityName, RealHostCapability>>;

const unsupportedCapabilities: RealHostCapabilityReport = {
  reload: { status: "disabled", code: "REAL_HOST_RELOAD_UNPROVEN" },
  interrupt: { status: "disabled", code: "REAL_HOST_INTERRUPT_UNPROVEN" },
  compaction: { status: "disabled", code: "REAL_HOST_COMPACTION_UNSUPPORTED" },
  childLineage: { status: "disabled", code: "REAL_HOST_CHILD_LINEAGE_UNSUPPORTED" },
  concurrentSetup: { status: "disabled", code: "REAL_HOST_WRITER_ELECTION_UNPROVEN" },
  authoritativePersistence: { status: "disabled", code: "PERSISTENCE_AUTOMATION_UNSUPPORTED" },
};

const versionMismatchCapabilities: RealHostCapabilityReport = Object.fromEntries(
  Object.keys(unsupportedCapabilities).map((name) => [
    name,
    { status: "disabled", code: "REAL_HOST_VERSION_PIN_MISMATCH" },
  ]),
) as RealHostCapabilityReport;

export const capabilityReport = ({
  hostVersion,
  pluginApiVersion,
}: {
  hostVersion: string;
  pluginApiVersion: string;
}): RealHostCapabilityReport =>
  hostVersion === PINNED_REAL_HOST_VERSION && pluginApiVersion === PINNED_REAL_HOST_VERSION
    ? unsupportedCapabilities
    : versionMismatchCapabilities;
