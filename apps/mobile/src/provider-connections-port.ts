import {
  decodeProviderCatalogSnapshot,
  embeddedProviderCatalog,
  type ProviderCatalogSnapshot,
} from "@curiosity/authority";
import {
  mobileAgentPolicies,
  type MobileAgentId,
} from "./mobile-agent-catalog.ts";

export interface NativeProviderConnectionStatus {
  readonly hasSession: boolean;
  readonly lastDiagnostic?: string;
}

export interface NativeProviderCatalogResult {
  readonly snapshotJson: string;
  readonly source: "provider-api" | "cache";
}

export interface ProviderRoleRoutePreference {
  readonly agentId: MobileAgentId;
  readonly modelId: string;
  readonly providerId: "openai-oauth";
  readonly routeId: "frontier.openai-oauth";
  readonly selectionPolicyId: "apple-operator-role-route-v1";
}

export interface NativeProviderRoutePreference {
  readonly agentId: string;
  readonly modelId: string;
  readonly providerId: "openai-oauth";
  readonly routeId: "frontier.openai-oauth";
  readonly selectionPolicyId: "apple-operator-role-route-v1";
}

export interface NativeProviderRoutePreferences {
  readonly preferences: readonly NativeProviderRoutePreference[];
}

export interface NativeProviderConnectionModule {
  authenticateProvider(
    providerId: string,
  ): Promise<NativeProviderCatalogResult>;
  disconnectProvider(providerId: string): Promise<NativeProviderCatalogResult>;
  providerConnectionStatus(): Promise<NativeProviderConnectionStatus>;
  providerCatalogSnapshot(): Promise<NativeProviderCatalogResult>;
  providerRoutePreferences(): Promise<NativeProviderRoutePreferences>;
  providerRouteSelection(
    agentId: string,
  ): Promise<NativeProviderRoutePreference>;
  setProviderRoutePreference(
    agentId: string,
    providerId: string,
    modelId: string,
  ): Promise<NativeProviderRoutePreferences>;
}

export interface ProviderConnectionView {
  readonly providerSession: boolean;
  readonly lastDiagnostic?: string;
  readonly catalog: ProviderCatalogSnapshot;
  readonly routePreferences: Readonly<
    Partial<Record<MobileAgentId, ProviderRoleRoutePreference>>
  >;
  readonly source: "provider-api" | "cache" | "embedded";
}

const nativeFailureCode = (error: unknown): string => {
  if (error && typeof error === "object") {
    const code = (error as { readonly code?: unknown }).code;
    if (typeof code === "string" && /^CODEX_[A-Z_]{1,64}$/u.test(code))
      return code;
  }
  if (error instanceof Error && /^CODEX_[A-Z_]{1,64}$/u.test(error.message))
    return error.message;
  return "CODEX_REQUEST_FAILED";
};

const decodeNativeCatalog = (
  result: NativeProviderCatalogResult,
): ProviderCatalogSnapshot => {
  let value: unknown;
  try {
    value = JSON.parse(result.snapshotJson) as unknown;
  } catch {
    throw new Error("CODEX_RESPONSE_INVALID");
  }
  const snapshot = decodeProviderCatalogSnapshot(value);
  if (!snapshot) throw new Error("CODEX_RESPONSE_INVALID");
  return snapshot;
};

const identifier = (value: unknown): value is string =>
  typeof value === "string" &&
  new TextEncoder().encode(value).byteLength <= 256 &&
  /^[^\u0000-\u0020\u007f]+$/u.test(value);

const decodeRoutePreferences = (
  value: NativeProviderRoutePreferences,
): ProviderConnectionView["routePreferences"] => {
  if (!Array.isArray(value.preferences) || value.preferences.length > 8)
    throw new Error("CODEX_RESPONSE_INVALID");
  const preferences: Partial<
    Record<MobileAgentId, ProviderRoleRoutePreference>
  > = {};
  for (const preference of value.preferences) {
    if (
      !preference ||
      typeof preference.agentId !== "string" ||
      !(preference.agentId in mobileAgentPolicies) ||
      preferences[preference.agentId as MobileAgentId] ||
      !identifier(preference.modelId) ||
      preference.providerId !== "openai-oauth" ||
      preference.routeId !== "frontier.openai-oauth" ||
      preference.selectionPolicyId !== "apple-operator-role-route-v1"
    )
      throw new Error("CODEX_RESPONSE_INVALID");
    preferences[preference.agentId as MobileAgentId] = Object.freeze({
      ...preference,
      agentId: preference.agentId as MobileAgentId,
    });
  }
  return Object.freeze(preferences);
};

export const createNativeProviderConnections = (
  native: NativeProviderConnectionModule,
) => {
  const refresh = async (): Promise<ProviderConnectionView> => {
    const [status, nativePreferences] = await Promise.all([
      native.providerConnectionStatus(),
      native.providerRoutePreferences(),
    ]);
    const routePreferences = decodeRoutePreferences(nativePreferences);
    try {
      const result = await native.providerCatalogSnapshot();
      return Object.freeze({
        catalog: decodeNativeCatalog(result),
        ...(status.lastDiagnostic
          ? { lastDiagnostic: status.lastDiagnostic }
          : {}),
        providerSession: status.hasSession,
        routePreferences,
        source: result.source,
      });
    } catch {
      return Object.freeze({
        catalog: embeddedProviderCatalog,
        ...(status.lastDiagnostic
          ? { lastDiagnostic: status.lastDiagnostic }
          : {}),
        providerSession: status.hasSession,
        routePreferences,
        source: "embedded" as const,
      });
    }
  };

  const mutate = async (
    operation: () => Promise<NativeProviderCatalogResult>,
  ): Promise<ProviderConnectionView> => {
    try {
      const result = await operation();
      const [status, nativePreferences] = await Promise.all([
        native.providerConnectionStatus(),
        native.providerRoutePreferences(),
      ]);
      return Object.freeze({
        catalog: decodeNativeCatalog(result),
        ...(status.lastDiagnostic
          ? { lastDiagnostic: status.lastDiagnostic }
          : {}),
        providerSession: status.hasSession,
        routePreferences: decodeRoutePreferences(nativePreferences),
        source: result.source,
      });
    } catch (error) {
      throw new Error(nativeFailureCode(error), { cause: error });
    }
  };

  return Object.freeze({
    authenticate: (providerId: string) =>
      mutate(() => native.authenticateProvider(providerId)),
    disconnect: (providerId: string) =>
      mutate(() => native.disconnectProvider(providerId)),
    refresh,
    selectRoute: async (
      agentId: MobileAgentId,
      providerId: string,
      modelId: string,
    ) => {
      try {
        await native.setProviderRoutePreference(agentId, providerId, modelId);
        return await refresh();
      } catch (error) {
        throw new Error(nativeFailureCode(error), { cause: error });
      }
    },
  });
};

export type NativeProviderConnections = ReturnType<
  typeof createNativeProviderConnections
>;
