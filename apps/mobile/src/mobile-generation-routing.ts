import {
  decodeProviderCatalogSnapshot,
  PortableAuthorityError,
  type GenerationPort,
  type GenerationRequest,
  type GenerationSelectionRequest,
  type GenerationSelectionPort,
} from "@curiosity/authority";
import type { NativeProviderConnectionModule } from "./provider-connections-port.ts";

export const createMobileGenerationSelection = (
  native: NativeProviderConnectionModule,
): GenerationSelectionPort =>
  Object.freeze({
    select: async ({ purpose }: GenerationSelectionRequest) => {
      if (purpose !== "agent.step" && purpose !== "turn.answer")
        throw new PortableAuthorityError("GENERATION_SELECTION_INVALID");
      const modelId = await connectedFrontierModel(native);
      if (!modelId)
        throw new PortableAuthorityError("PROVIDER_ROUTE_UNAVAILABLE");
      return Object.freeze({
        adapterVersion: "codex-direct-native-v1",
        locality: "frontier" as const,
        modelId,
        providerId: "openai-oauth",
        purpose,
        requestedRouteId: "frontier.openai-oauth",
        routeId: "frontier.openai-oauth",
        selectionPolicyId: "ipados-frontier-connected-v1",
      });
    },
  });

export const connectedFrontierModel = async (
  native: NativeProviderConnectionModule,
): Promise<string | undefined> => {
  try {
    const status = await native.providerConnectionStatus();
    if (!status.hasSession) return undefined;
    const result = await native.providerCatalogSnapshot();
    const snapshot = decodeProviderCatalogSnapshot(
      JSON.parse(result.snapshotJson) as unknown,
    );
    const provider = snapshot?.providers.find(
      ({ id }) => id === "openai-oauth",
    );
    if (provider?.connectionState !== "connected") return undefined;
    return provider.models.find(({ source }) => source === "provider-api")?.id;
  } catch {
    return undefined;
  }
};

export const createRoutedGeneration = (
  device: GenerationPort,
  frontier: GenerationPort,
): GenerationPort =>
  Object.freeze({
    generate: (
      request: GenerationRequest,
      onDelta?: (delta: string) => void,
    ) => {
      if (request.route.locality === "device")
        return device.generate(request, onDelta);
      if (request.route.locality === "frontier")
        return frontier.generate(request, onDelta);
      throw new PortableAuthorityError("GENERATION_ROUTE_MISMATCH");
    },
  });
