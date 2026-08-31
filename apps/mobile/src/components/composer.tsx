import {
  Button,
  GlassEffectContainer,
  Host,
  HStack,
  Image,
  Menu,
  Text,
  TextField,
  useNativeState,
} from "@expo/ui/swift-ui";
import {
  accessibilityLabel,
  buttonStyle,
  disabled,
  font,
  foregroundStyle,
  frame,
  glassEffect,
  lineLimit,
  menuIndicator,
  menuStyle,
  padding,
  textFieldStyle,
  tint,
} from "@expo/ui/swift-ui/modifiers";
import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import { providerConnections } from "../provider-connections";
import { palette } from "../theme";
import type { MobilePrimaryAgentId } from "../mobile-agent-catalog";
import { useProviderConnections } from "../use-provider-connections";

export const Composer = ({
  answering = false,
  bottomInset = 0,
  agentId,
  busy,
  onAgentChange,
  onChangeText,
  onSend,
  prompt = "Ask Curiosity or direct the work…",
  value,
}: {
  readonly answering?: boolean;
  readonly agentId: MobilePrimaryAgentId;
  readonly bottomInset?: number;
  readonly busy: boolean;
  readonly onAgentChange: (agentId: MobilePrimaryAgentId) => void;
  readonly onChangeText: (value: string) => void;
  readonly onSend: () => void;
  readonly prompt?: string;
  readonly value: string;
}) => {
  const text = useNativeState(value);
  const sendDisabled = busy || !value.trim();
  const providerState = useProviderConnections(providerConnections);
  const routeChoices = providerState.view.catalog.providers.flatMap(
    (provider) =>
      provider.connectionState !== "connected"
        ? []
        : provider.models
            .filter(({ source }) => source === "provider-api")
            .map((model) => ({ model, provider })),
  );
  const selectedRoute = providerState.view.routePreferences[agentId];

  useEffect(() => {
    if (text.get() !== value) text.set(value);
  }, [text, value]);

  return (
    <View style={[styles.root, { paddingBottom: Math.max(bottomInset, 8) }]}>
      <Host
        matchContents={{ vertical: true }}
        seedColor={palette.focus}
        style={styles.host}
        useViewportSizeMeasurement
      >
        <GlassEffectContainer spacing={0}>
          <HStack
            alignment="bottom"
            spacing={8}
            modifiers={[
              frame({ maxWidth: 10_000, minHeight: 54 }),
              padding({ horizontal: 14, vertical: 8 }),
              glassEffect({
                cornerRadius: 29,
                glass: {
                  interactive: true,
                  tint: palette.glassTint,
                  variant: "regular",
                },
                shape: "roundedRectangle",
              }),
            ]}
          >
            <Menu
              label={
                <Image
                  color={palette.textSecondary}
                  size={17}
                  systemName={
                    agentId === "orchestrator" ? "person.2" : "person"
                  }
                />
              }
              modifiers={[
                accessibilityLabel(
                  `Agent role: ${agentId === "orchestrator" ? "Orchestrator" : "Generalist"}`,
                ),
                buttonStyle("plain"),
                disabled(busy || answering),
                frame({ height: 38, width: 30 }),
                menuIndicator("hidden"),
                menuStyle("button"),
              ]}
            >
              <Button onPress={() => onAgentChange("generalist")}>
                <Text>Generalist</Text>
              </Button>
              <Button onPress={() => onAgentChange("orchestrator")}>
                <Text>Orchestrator</Text>
              </Button>
            </Menu>
            <Menu
              label={
                <HStack spacing={4}>
                  <Image
                    color={palette.textSecondary}
                    size={14}
                    systemName="cpu"
                  />
                  <Text
                    modifiers={[
                      font({ size: 11, weight: "medium" }),
                      foregroundStyle(palette.textSecondary),
                      lineLimit(1),
                    ]}
                  >
                    {selectedRoute?.modelId ?? "Select model"}
                  </Text>
                </HStack>
              }
              modifiers={[
                accessibilityLabel(
                  selectedRoute
                    ? `Model route: ${selectedRoute.modelId}`
                    : `No model route selected for ${agentId}`,
                ),
                buttonStyle("plain"),
                disabled(
                  busy ||
                    answering ||
                    providerState.busyRouteAgentId === agentId ||
                    routeChoices.length === 0,
                ),
                frame({ height: 38, maxWidth: 170 }),
                menuIndicator("hidden"),
                menuStyle("button"),
              ]}
            >
              {routeChoices.length === 0 ? (
                <Text>Connect a provider in Settings</Text>
              ) : (
                routeChoices.map(({ model, provider }) => (
                  <Button
                    key={`${provider.id}:${model.id}`}
                    onPress={() =>
                      void providerState.selectRoute(
                        agentId,
                        provider.id,
                        model.id,
                      )
                    }
                  >
                    <Text>
                      {selectedRoute?.providerId === provider.id &&
                      selectedRoute.modelId === model.id
                        ? `✓ ${model.name}`
                        : model.name}
                    </Text>
                  </Button>
                ))
              )}
            </Menu>
            <TextField
              axis="vertical"
              maxLength={answering ? 4_096 : 65_536}
              onTextChange={onChangeText}
              placeholder={prompt}
              text={text}
              modifiers={[
                textFieldStyle("plain"),
                lineLimit({ max: 5, min: 1 }),
                frame({ maxWidth: 10_000, minHeight: 38 }),
                font({ size: 16, weight: "regular" }),
                foregroundStyle(palette.textPrimary),
              ]}
            />
            <Button
              modifiers={[
                accessibilityLabel(answering ? "Send answer" : "Send message"),
                buttonStyle("plain"),
                frame({ height: 38, width: 38 }),
                tint(sendDisabled ? palette.textMuted : palette.focus),
                disabled(sendDisabled),
              ]}
              onPress={sendDisabled ? undefined : onSend}
            >
              <Image
                color={sendDisabled ? palette.textMuted : palette.focus}
                size={18}
                systemName="arrow.up"
              />
            </Button>
          </HStack>
        </GlassEffectContainer>
      </Host>
    </View>
  );
};

const styles = StyleSheet.create({
  host: { width: "100%" },
  root: { paddingHorizontal: 12, paddingTop: 8 },
});
