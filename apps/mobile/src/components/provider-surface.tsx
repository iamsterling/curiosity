import type { ProviderCatalogEntry } from "@curiosity/authority";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { providerConnections } from "../provider-connections";
import { palette } from "../theme";
import { useProviderConnections } from "../use-provider-connections";

const authenticationLabel = (provider: ProviderCatalogEntry): string => {
  const labels = {
    "api-key": "API key on this iPad",
    "device-code": "ChatGPT device authorization",
    "oauth-pkce": "Browser sign-in",
  } as const;
  return provider.authenticationMethods
    .map((method) => labels[method])
    .join(" · ");
};

const ProviderCard = ({
  busy,
  onAuthenticate,
  onDisconnect,
  provider,
}: {
  readonly busy: boolean;
  readonly onAuthenticate: () => void;
  readonly onDisconnect: () => void;
  readonly provider: ProviderCatalogEntry;
}) => {
  const connected = provider.connectionState === "connected";
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleBlock}>
          <View style={styles.nameRow}>
            <Text style={styles.providerName}>{provider.name}</Text>
            {provider.experimental ? (
              <Text style={styles.experimental}>EXPERIMENTAL</Text>
            ) : null}
          </View>
          <Text style={styles.authLabel}>{authenticationLabel(provider)}</Text>
        </View>
        <Text style={[styles.state, connected && styles.connected]}>
          {provider.connectionState.toUpperCase()}
        </Text>
      </View>

      {provider.models.length > 0 ? (
        <View style={styles.models}>
          {provider.models.slice(0, 8).map((model) => (
            <View key={model.id} style={styles.modelRow}>
              <View>
                <Text style={styles.modelName}>{model.name}</Text>
                <Text style={styles.modelId}>{model.id}</Text>
              </View>
              <Text style={styles.source}>{model.source}</Text>
            </View>
          ))}
          {provider.models.length > 8 ? (
            <Text style={styles.moreModels}>
              +{provider.models.length - 8} more provider-qualified models
            </Text>
          ) : null}
        </View>
      ) : (
        <Text style={styles.emptyModels}>
          Models appear after native authentication and OpenAI discovery.
        </Text>
      )}

      <Pressable
        accessibilityRole="button"
        disabled={busy}
        onPress={connected ? onDisconnect : onAuthenticate}
        style={({ pressed }) => [
          styles.action,
          connected && styles.disconnect,
          busy && styles.disabled,
          pressed && styles.pressed,
        ]}
      >
        <Text style={styles.actionText}>
          {busy ? "Working…" : connected ? "Disconnect" : "Authenticate"}
        </Text>
      </Pressable>
    </View>
  );
};

export const ProviderSurface = () => {
  const state = useProviderConnections(providerConnections);
  const { catalog, lastDiagnostic, providerSession, source } = state.view;
  return (
    <ScrollView contentContainerStyle={styles.content} style={styles.root}>
      <Text style={styles.eyebrow}>FRONTIER PROVIDERS</Text>
      <Text style={styles.title}>Connections and models</Text>
      <Text style={styles.summary}>
        Authentication, token refresh, model discovery, and generation run
        directly on this iPad. OAuth credentials remain in native Keychain
        custody and never cross the JavaScript bridge.
      </Text>
      <View style={styles.statusPanel}>
        <Text style={styles.statusTitle}>Standalone native connection</Text>
        <Text style={styles.statusDetail}>
          Catalog: {source} · Session: {providerSession ? "present" : "none"} ·
          Revision: {catalog.revision}
        </Text>
        {lastDiagnostic ? (
          <Text style={styles.statusDetail}>Diagnostic: {lastDiagnostic}</Text>
        ) : null}
      </View>
      {state.error ? <Text style={styles.error}>{state.error}</Text> : null}
      <View style={styles.grid}>
        {catalog.providers.map((provider) => (
          <ProviderCard
            key={provider.id}
            busy={state.busyProviderId === provider.id}
            onAuthenticate={() => void state.authenticate(provider.id)}
            onDisconnect={() => void state.disconnect(provider.id)}
            provider={provider}
          />
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  action: {
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: palette.focus,
    borderRadius: 10,
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  actionText: { color: "#FFFFFF", fontSize: 14, fontWeight: "700" },
  authLabel: { color: palette.textSecondary, fontSize: 13, marginTop: 4 },
  card: {
    backgroundColor: palette.surface,
    borderColor: palette.line,
    borderRadius: 16,
    borderWidth: 1,
    flexBasis: 360,
    flexGrow: 1,
    padding: 18,
  },
  cardHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  cardTitleBlock: { flex: 1, paddingRight: 12 },
  connected: { color: palette.success },
  content: { gap: 16, padding: 28, paddingBottom: 80 },
  disabled: { opacity: 0.38 },
  disconnect: { backgroundColor: palette.danger },
  emptyModels: { color: palette.textMuted, fontSize: 13, marginTop: 18 },
  error: {
    backgroundColor: palette.dangerGlass,
    borderRadius: 10,
    color: palette.danger,
    padding: 12,
  },
  experimental: {
    color: palette.warning,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  eyebrow: {
    color: palette.focus,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.2,
  },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 14 },
  modelId: {
    color: palette.textMuted,
    fontFamily: "Courier",
    fontSize: 11,
    marginTop: 2,
  },
  modelName: { color: palette.textPrimary, fontSize: 13, fontWeight: "600" },
  modelRow: {
    alignItems: "center",
    borderTopColor: palette.line,
    borderTopWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 9,
  },
  models: { marginTop: 12 },
  moreModels: { color: palette.textSecondary, fontSize: 12, marginTop: 8 },
  nameRow: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  pressed: { opacity: 0.72 },
  providerName: { color: palette.textPrimary, fontSize: 18, fontWeight: "700" },
  root: { backgroundColor: palette.canvas, flex: 1 },
  source: { color: palette.textMuted, fontSize: 11 },
  state: {
    color: palette.textMuted,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.7,
  },
  statusDetail: { color: palette.textSecondary, fontSize: 12, marginTop: 4 },
  statusPanel: {
    backgroundColor: palette.focusQuiet,
    borderRadius: 12,
    padding: 14,
  },
  statusTitle: { color: palette.textPrimary, fontSize: 14, fontWeight: "700" },
  summary: {
    color: palette.textSecondary,
    fontSize: 15,
    lineHeight: 22,
    maxWidth: 720,
  },
  title: { color: palette.textPrimary, fontSize: 28, fontWeight: "700" },
});
