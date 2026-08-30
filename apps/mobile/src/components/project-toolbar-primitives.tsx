import { Button, Host, HStack, Image, Spacer, Text } from "@expo/ui/swift-ui";
import {
  accessibilityHint as axHint,
  accessibilityLabel as axLabel,
  buttonStyle,
  font,
  foregroundStyle,
  frame,
  lineLimit,
  padding,
  tint,
} from "@expo/ui/swift-ui/modifiers";
import { forwardRef, type ComponentProps } from "react";
import { StyleSheet, View, type ViewProps } from "react-native";
import { palette } from "../theme";

export interface ProjectToolbarRootProps extends ViewProps {
  readonly topInset: number;
}

export const ProjectToolbarRoot = forwardRef<View, ProjectToolbarRootProps>(
  ({ children, style, topInset, ...props }, ref) => (
    <View
      ref={ref}
      style={[styles.shell, { paddingTop: topInset }, style]}
      {...props}
    >
      <Host
        matchContents={{ vertical: true }}
        seedColor={palette.focus}
        style={styles.host}
        useViewportSizeMeasurement
      >
        <HStack
          alignment="center"
          spacing={8}
          modifiers={[
            frame({ maxWidth: 10_000 }),
            padding({ horizontal: 12, vertical: 8 }),
          ]}
        >
          {children}
        </HStack>
      </Host>
    </View>
  ),
);
ProjectToolbarRoot.displayName = "ProjectToolbarRoot";

export const ProjectToolbarButton = ({
  hint,
  icon,
  label,
  onPress,
  prominent = false,
}: {
  readonly hint?: string;
  readonly icon: ComponentProps<typeof Image>["systemName"];
  readonly label: string;
  readonly onPress: () => void;
  readonly prominent?: boolean;
}) => (
  <Button
    modifiers={[
      ...(hint ? [axHint(hint)] : []),
      axLabel(label),
      buttonStyle(prominent ? "glassProminent" : "glass"),
      frame({ height: 44, width: 44 }),
      ...(prominent ? [tint(palette.focus)] : []),
    ]}
    onPress={onPress}
  >
    <Image
      color={prominent ? "#FFFFFF" : palette.textPrimary}
      size={18}
      systemName={icon}
    />
  </Button>
);

export const ProjectToolbarTitle = ({ children }: { readonly children: string }) => (
  <Text
    modifiers={[
      font({ size: 15, weight: "semibold" }),
      foregroundStyle(palette.textPrimary),
      lineLimit(1),
    ]}
  >
    {children}
  </Text>
);

export const ProjectToolbarSpacer = () => <Spacer />;

const styles = StyleSheet.create({
  host: { width: "100%" },
  shell: {
    alignSelf: "stretch",
    backgroundColor: palette.canvas,
    borderBottomColor: palette.line,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});
