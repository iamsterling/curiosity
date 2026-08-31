import { useCallback, useEffect, useState } from "react";
import { embeddedProviderCatalog } from "@curiosity/authority";
import type {
  NativeProviderConnections,
  ProviderConnectionView,
} from "./provider-connections-port";
import type { MobileAgentId } from "./mobile-agent-catalog";

const initialView: ProviderConnectionView = Object.freeze({
  catalog: embeddedProviderCatalog,
  providerSession: false,
  routePreferences: Object.freeze({}),
  source: "embedded",
});

const presentProviderFailure = (error: unknown): string => {
  const code = error instanceof Error ? error.message : "CODEX_REQUEST_FAILED";
  if (code === "CODEX_AUTHENTICATION_CANCELLED")
    return "Authentication was cancelled.";
  if (code === "CODEX_SESSION_REQUIRED")
    return "Sign in with ChatGPT before managing this provider.";
  if (code === "CODEX_RESPONSE_INVALID")
    return "OpenAI returned an invalid model catalog.";
  if (code === "CODEX_GENERATION_ROUTE_UNAVAILABLE")
    return "That exact model is no longer available on this connection.";
  return "The provider is currently unavailable.";
};

export const useProviderConnections = (
  connections: NativeProviderConnections,
) => {
  const [view, setView] = useState(initialView);
  const [busyProviderId, setBusyProviderId] = useState<string>();
  const [busyRouteAgentId, setBusyRouteAgentId] = useState<MobileAgentId>();
  const [error, setError] = useState<string>();

  const refresh = useCallback(async () => {
    setError(undefined);
    try {
      setView(await connections.refresh());
    } catch (cause) {
      setError(presentProviderFailure(cause));
    }
  }, [connections]);

  useEffect(() => {
    let active = true;
    connections
      .refresh()
      .then((next) => {
        if (active) setView(next);
      })
      .catch((cause: unknown) => {
        if (active) setError(presentProviderFailure(cause));
      });
    return () => {
      active = false;
    };
  }, [connections]);

  const mutate = useCallback(
    async (
      providerId: string,
      operation: (providerId: string) => Promise<ProviderConnectionView>,
    ) => {
      setBusyProviderId(providerId);
      setError(undefined);
      try {
        setView(await operation(providerId));
      } catch (cause) {
        setError(presentProviderFailure(cause));
      } finally {
        setBusyProviderId(undefined);
      }
    },
    [],
  );

  return Object.freeze({
    authenticate: (providerId: string) =>
      mutate(providerId, connections.authenticate),
    busyProviderId,
    busyRouteAgentId,
    disconnect: (providerId: string) =>
      mutate(providerId, connections.disconnect),
    error,
    refresh,
    selectRoute: async (
      agentId: MobileAgentId,
      providerId: string,
      modelId: string,
    ) => {
      setBusyRouteAgentId(agentId);
      setError(undefined);
      try {
        setView(await connections.selectRoute(agentId, providerId, modelId));
      } catch (cause) {
        setError(presentProviderFailure(cause));
      } finally {
        setBusyRouteAgentId(undefined);
      }
    },
    view,
  });
};
