export type ActionStatus =
  "proposed" | "running" | "succeeded" | "failed" | "delivery-unknown";

export interface StoredAction {
  readonly actionId: string;
  readonly actionSchemaVersion: number;
  readonly actionType: string;
  readonly createdAt: string;
  readonly deadlineClass: "interactive" | "background";
  readonly executionId: string;
  readonly gateClass: "none-requested" | "binding-human-requested";
  readonly input: unknown;
  readonly inputDigest: string;
  readonly pluginId: string;
  readonly reactorId: string;
  readonly resource: string;
  readonly requestedCapabilities: readonly string[];
  readonly sourceEventId: string;
  readonly status: ActionStatus;
  readonly updatedAt: string;
}
