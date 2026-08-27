export type CapabilityMaturity =
  | "catalogued"
  | "scaffolded"
  | "available"
  | "qualified";

export interface CapabilityStatusEntry {
  readonly id: string;
  readonly qualifiedForProduction: false;
  readonly reason: string;
  readonly state: CapabilityMaturity;
}

export interface CapabilityStatusReport {
  readonly candidateReady: true;
  readonly capabilities: readonly CapabilityStatusEntry[];
  readonly deploymentReady: false;
  readonly lifecycle: "candidate";
  readonly productionReady: false;
  readonly profile: "trusted-local-single-user";
  readonly publicationReady: false;
  readonly schemaVersion: 1;
  readonly supervisor: {
    readonly filesystemMutation: boolean;
    readonly filesystemRead: true;
    readonly git: boolean;
    readonly gitMutation: boolean;
    readonly process: boolean;
    readonly sandbox: false;
  };
}
