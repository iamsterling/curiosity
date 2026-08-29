import {
  Button,
  GlassEffectContainer,
  Host,
  HStack,
  Image,
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
  padding,
  textFieldStyle,
  tint,
} from "@expo/ui/swift-ui/modifiers";
import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import { palette } from "../theme";

export const Composer = ({
  bottomInset = 0,
  busy,
  onChangeText,
  onSend,
  prompt = "Ask Curiosity or direct the work…",
  value,
}: {
  readonly bottomInset?: number;
  readonly busy: boolean;
  readonly onChangeText: (value: string) => void;
  readonly onSend: () => void;
  readonly prompt?: string;
  readonly value: string;
}) => {
  const text = useNativeState(value);
  const sendDisabled = busy || !value.trim();

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
            <TextField
              axis="vertical"
              maxLength={65_536}
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
                accessibilityLabel("Send message"),
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
