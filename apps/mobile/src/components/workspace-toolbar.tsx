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
import { StyleSheet, View } from "react-native";
import { palette } from "../theme";

export const WorkspaceToolbar = ({
  compact,
  filterOn,
  onFilter,
  onNewSession,
  onSearch,
  onShowSessions,
  showFilter,
  title,
  topInset,
}: {
  readonly compact: boolean;
  readonly filterOn: boolean;
  readonly onFilter: () => void;
  readonly onNewSession: () => void;
  readonly onSearch: () => void;
  readonly onShowSessions: () => void;
  readonly showFilter: boolean;
  readonly title: string;
  readonly topInset: number;
}) => (
  <View style={[styles.shell, { paddingTop: topInset }]}>
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
        {compact ? (
          <Button
            modifiers={[
              axHint("Opens the artifact list. Its leading control opens collections."),
              axLabel("Show sessions"),
              buttonStyle("glass"),
              frame({ height: 44, width: 44 }),
            ]}
            onPress={onShowSessions}
          >
            <Image color={palette.textPrimary} size={18} systemName="sidebar.left" />
          </Button>
        ) : null}

        {compact ? (
          <Text
            modifiers={[
              font({ size: 15, weight: "semibold" }),
              foregroundStyle(palette.textPrimary),
              lineLimit(1),
            ]}
          >
            {title}
          </Text>
        ) : null}

        <Spacer />

        <Button
          modifiers={[
            axHint("Opens the command palette."),
            axLabel("Search"),
            buttonStyle("glass"),
            frame({ height: 44, width: 44 }),
          ]}
          onPress={onSearch}
        >
          <Image color={palette.textPrimary} size={18} systemName="magnifyingglass" />
        </Button>

        {showFilter ? (
          <Button
            modifiers={[
              axLabel(
                filterOn
                  ? "Filter: high priority only"
                  : "Filter: all priorities",
              ),
              buttonStyle("glass"),
              frame({ height: 44, width: 44 }),
              ...(filterOn ? [tint(palette.focus)] : []),
            ]}
            onPress={onFilter}
          >
            <Image
              color={filterOn ? palette.focus : palette.textPrimary}
              size={18}
              systemName="slider.horizontal.3"
            />
          </Button>
        ) : null}

        <Button
          modifiers={[
            axHint("Starts a clean conversation."),
            axLabel("New session"),
            buttonStyle("glassProminent"),
            frame({ height: 44, width: 44 }),
            tint(palette.focus),
          ]}
          onPress={onNewSession}
        >
          <Image color="#FFFFFF" size={18} systemName="square.and.pencil" />
        </Button>
      </HStack>
    </Host>
  </View>
);

const styles = StyleSheet.create({
  host: { width: "100%" },
  shell: {
    alignSelf: "stretch",
    backgroundColor: palette.canvas,
    borderBottomColor: palette.line,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});
