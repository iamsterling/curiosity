import {
  PortableAuthorityError,
  type Awaitable,
  type GenerationPort,
  type GenerationRequest,
  type GenerationSelection,
  type GenerationSelectionRequest,
} from "@curiosity/authority";
import {
  mobilePrimaryAgentIds,
  mobileAgentPolicies,
} from "./mobile-agent-catalog.ts";
import type { NativeProviderConnectionModule } from "./provider-connections-port.ts";

export const mobileFrontierSelectionPolicyId =
  "apple-operator-role-route-v1" as const;

export interface MobileGenerationSelectionRequest extends GenerationSelectionRequest {
  readonly agentId: string;
}

export interface MobileGenerationSelectionPort {
  readonly select: (
    request: MobileGenerationSelectionRequest,
  ) => Awaitable<GenerationSelection>;
}

const validSelection = (
  value: Awaited<
    ReturnType<NativeProviderConnectionModule["providerRouteSelection"]>
  >,
  agentId: string,
): boolean =>
  value.agentId === agentId &&
  typeof value.modelId === "string" &&
  /^[^\u0000-\u0020\u007f]+$/u.test(value.modelId) &&
  new TextEncoder().encode(value.modelId).byteLength <= 256 &&
  value.providerId === "openai-oauth" &&
  value.routeId === "frontier.openai-oauth" &&
  value.selectionPolicyId === mobileFrontierSelectionPolicyId;

export const createMobileGenerationSelection = (
  native: NativeProviderConnectionModule,
): MobileGenerationSelectionPort =>
  Object.freeze({
    select: async ({ agentId, purpose }: MobileGenerationSelectionRequest) => {
      if (purpose !== "agent.step" && purpose !== "turn.answer")
        throw new PortableAuthorityError("GENERATION_SELECTION_INVALID");
      if (!agentId || !(agentId in mobileAgentPolicies))
        throw new PortableAuthorityError("GENERATION_SELECTION_INVALID");
      let selection: Awaited<
        ReturnType<NativeProviderConnectionModule["providerRouteSelection"]>
      >;
      try {
        selection = await native.providerRouteSelection(agentId);
      } catch {
        throw new PortableAuthorityError("PROVIDER_ROUTE_UNAVAILABLE");
      }
      if (!validSelection(selection, agentId))
        throw new PortableAuthorityError("PROVIDER_ROUTE_UNAVAILABLE");
      return Object.freeze({
        adapterVersion: "codex-direct-native-v1",
        locality: "frontier" as const,
        modelId: selection.modelId,
        providerId: selection.providerId,
        purpose,
        requestedRouteId: selection.routeId,
        routeId: selection.routeId,
        selectionPolicyId: selection.selectionPolicyId,
      });
    },
  });

export const connectedFrontierModel = async (
  native: NativeProviderConnectionModule,
): Promise<string | undefined> => {
  for (const agentId of mobilePrimaryAgentIds) {
    try {
      const selection = await native.providerRouteSelection(agentId);
      if (validSelection(selection, agentId)) return selection.modelId;
    } catch {
      // One unconfigured primary role does not make another exact route absent.
    }
  }
  return undefined;
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
