import {
  decodeProviderCatalogSnapshot,
  embeddedProviderCatalog,
  type ProviderCatalogSnapshot,
} from "@curiosity/authority";

export interface NativeProviderConnectionStatus {
  readonly hasSession: boolean;
  readonly lastDiagnostic?: string;
}

export interface NativeProviderCatalogResult {
  readonly snapshotJson: string;
  readonly source: "provider-api" | "cache";
}

export interface NativeProviderConnectionModule {
  authenticateProvider(
    providerId: string,
  ): Promise<NativeProviderCatalogResult>;
  disconnectProvider(providerId: string): Promise<NativeProviderCatalogResult>;
  providerConnectionStatus(): Promise<NativeProviderConnectionStatus>;
  providerCatalogSnapshot(): Promise<NativeProviderCatalogResult>;
}

export interface ProviderConnectionView {
  readonly providerSession: boolean;
  readonly lastDiagnostic?: string;
  readonly catalog: ProviderCatalogSnapshot;
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

export const createNativeProviderConnections = (
  native: NativeProviderConnectionModule,
) => {
  const refresh = async (): Promise<ProviderConnectionView> => {
    const status = await native.providerConnectionStatus();
    try {
      const result = await native.providerCatalogSnapshot();
      return Object.freeze({
        catalog: decodeNativeCatalog(result),
        ...(status.lastDiagnostic
          ? { lastDiagnostic: status.lastDiagnostic }
          : {}),
        providerSession: status.hasSession,
        source: result.source,
      });
    } catch {
      return Object.freeze({
        catalog: embeddedProviderCatalog,
        ...(status.lastDiagnostic
          ? { lastDiagnostic: status.lastDiagnostic }
          : {}),
        providerSession: status.hasSession,
        source: "embedded" as const,
      });
    }
  };

  const mutate = async (
    operation: () => Promise<NativeProviderCatalogResult>,
  ): Promise<ProviderConnectionView> => {
    try {
      const result = await operation();
      const status = await native.providerConnectionStatus();
      return Object.freeze({
        catalog: decodeNativeCatalog(result),
        ...(status.lastDiagnostic
          ? { lastDiagnostic: status.lastDiagnostic }
          : {}),
        providerSession: status.hasSession,
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
  });
};

export type NativeProviderConnections = ReturnType<
  typeof createNativeProviderConnections
>;
