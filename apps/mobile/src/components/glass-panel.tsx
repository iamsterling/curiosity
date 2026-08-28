import {
  GlassEffectContainer,
  Host,
  Spacer,
  VStack,
} from "@expo/ui/swift-ui";
import { frame, glassEffect } from "@expo/ui/swift-ui/modifiers";
import type { ReactNode } from "react";
import {
  type ColorValue,
  StyleSheet,
  type StyleProp,
  View,
  type ViewStyle,
} from "react-native";
import { palette } from "../theme";

export const GlassPanel = ({
  children,
  cornerRadius = 24,
  style,
  tint = palette.glassTint,
}: {
  readonly children: ReactNode;
  readonly cornerRadius?: number;
  readonly style?: StyleProp<ViewStyle>;
  readonly tint?: ColorValue;
}) => (
  <View style={[styles.panel, { borderRadius: cornerRadius }, style]}>
    <Host
      pointerEvents="none"
      seedColor={palette.focus}
      style={StyleSheet.absoluteFill}
      useViewportSizeMeasurement
    >
      <GlassEffectContainer spacing={12}>
        <VStack
          modifiers={[
            frame({ maxHeight: 10_000, maxWidth: 10_000 }),
            glassEffect({
              cornerRadius,
              glass: { interactive: false, tint, variant: "regular" },
              shape: "roundedRectangle",
            }),
          ]}
        >
          <Spacer />
        </VStack>
      </GlassEffectContainer>
    </Host>
    {children}
  </View>
);

const styles = StyleSheet.create({
  panel: {
    backgroundColor: palette.glassFallback,
    borderColor: palette.glassLine,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
});
