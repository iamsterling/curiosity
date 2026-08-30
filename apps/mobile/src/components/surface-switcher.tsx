import {
  Button,
  Divider,
  Host,
  HStack,
  Image,
  Menu,
  Picker,
  Spacer,
  Text,
} from "@expo/ui/swift-ui";
import {
  accessibilityHint as axHint,
  accessibilityLabel as axLabel,
  buttonStyle,
  disabled,
  font,
  foregroundStyle,
  frame,
  lineLimit,
  menuIndicator,
  menuStyle,
  padding,
  pickerStyle,
  tag,
  tint,
} from "@expo/ui/swift-ui/modifiers";
import { Share, StyleSheet, View } from "react-native";
import type { CuriosityThread } from "../curiosity-client";
import { palette } from "../theme";
import type { WorkspaceView } from "../workspace-types";

const surfaces: readonly {
  readonly label: string;
  readonly view: WorkspaceView;
}[] = Object.freeze([
  { label: "Issues", view: "issues" },
  { label: "Chat", view: "chat" },
  { label: "Craft", view: "craft" },
  { label: "Memory", view: "memory" },
  { label: "Providers", view: "providers" },
  { label: "Audio", view: "audio" },
]);

const collaboratorNames = "2 collaborators and 2 more in this project";

export const SurfaceSwitcher = ({
  activeThreadId,
  compact,
  filterOn,
  onAdd,
  onFilter,
  onNewThread,
  onOpenThread,
  onSearch,
  onSelect,
  runtimeStatusLabel,
  threads,
  view,
}: {
  readonly activeThreadId?: string;
  readonly compact: boolean;
  readonly filterOn: boolean;
  readonly onAdd: () => void;
  readonly onFilter: () => void;
  readonly onNewThread: () => void;
  readonly onOpenThread: (threadId: string) => void;
  readonly onSearch: () => void;
  readonly onSelect: (view: WorkspaceView) => void;
  readonly runtimeStatusLabel: string;
  readonly threads: readonly CuriosityThread[];
  readonly view: WorkspaceView;
}) => (
  <View style={styles.shell}>
    <Host
      matchContents={{ vertical: true }}
      seedColor={palette.focus}
      style={styles.host}
      useViewportSizeMeasurement
    >
      <HStack
        alignment="center"
        spacing={10}
        modifiers={[
          frame({ maxWidth: 10_000 }),
          padding({ horizontal: 12, vertical: 8 }),
        ]}
      >
        <Menu
          label={
            <HStack alignment="center" spacing={8}>
              <Image size={18} systemName="folder" color={palette.focus} />
              <Text
                modifiers={[
                  font({ size: 15, weight: "semibold" }),
                  foregroundStyle(palette.textPrimary),
                  ...(compact ? [lineLimit(1)] : []),
                ]}
              >
                {compact ? "Curiosity" : "Curiosity Super Bench"}
              </Text>
              <Image
                size={14}
                systemName="chevron.down"
                color={palette.textSecondary}
              />
            </HStack>
          }
          modifiers={[
            axHint("Shows projects, conversations, and session status."),
            axLabel("Project menu."),
            buttonStyle("glass"),
            frame({ height: 44 }),
            menuIndicator("hidden"),
            menuStyle("button"),
            padding({ horizontal: 12 }),
          ]}
        >
          <Button
            modifiers={[
              axLabel("Start a clean conversation."),
              font({ size: 14, weight: "medium" }),
            ]}
            onPress={onNewThread}
          >
            <Text modifiers={[font({ size: 14, weight: "medium" })]}>
              New Conversation
            </Text>
          </Button>
          <Divider />
          {threads.slice(0, 8).map((thread) => (
            <Button
              key={thread.threadId}
              modifiers={[
                axLabel(
                  `${thread.title}. Session ${thread.sequence}. Open in Chat.`,
                ),
                font({
                  size: 13,
                  weight:
                    thread.threadId === activeThreadId ? "semibold" : "regular",
                }),
              ]}
              onPress={() => onOpenThread(thread.threadId)}
            >
              <Text
                modifiers={[
                  font({
                    size: 13,
                    weight:
                      thread.threadId === activeThreadId
                        ? "semibold"
                        : "regular",
                  }),
                ]}
              >
                {thread.title} · Session {thread.sequence}
              </Text>
            </Button>
          ))}
          {threads.length === 0 ? (
            <Button modifiers={[disabled(true)]}>
              <Text modifiers={[font({ size: 13 })]}>No conversations yet</Text>
            </Button>
          ) : null}
          <Divider />
          <Button modifiers={[disabled(true)]}>
            <Text
              modifiers={[
                font({ size: 12 }),
                foregroundStyle(palette.textSecondary),
              ]}
            >
              {runtimeStatusLabel}
            </Text>
          </Button>
        </Menu>

        <Picker
          modifiers={[pickerStyle("segmented"), tint(palette.focus)]}
          onSelectionChange={(value) => onSelect(value)}
          selection={view}
        >
          {surfaces.map(({ label, view: surfaceView }) => (
            <Text key={surfaceView} modifiers={[tag(surfaceView)]}>
              {label}
            </Text>
          ))}
        </Picker>

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
          <Image
            size={18}
            systemName="magnifyingglass"
            color={palette.textPrimary}
          />
        </Button>

        {!compact ? (
          <Button
            modifiers={[
              axLabel(
                filterOn
                  ? "Filter: high priority only. Tap to show all priorities."
                  : "Filter: all priorities. Tap to show high priority only.",
              ),
              buttonStyle("glass"),
              frame({ height: 44, width: 44 }),
              ...(filterOn ? [tint(palette.focus)] : []),
            ]}
            onPress={onFilter}
          >
            <Image
              size={18}
              systemName="slider.horizontal.3"
              color={filterOn ? palette.focus : palette.textPrimary}
            />
          </Button>
        ) : null}

        <Button
          modifiers={[
            axHint("Starts a clean conversation."),
            axLabel("New conversation"),
            buttonStyle("glassProminent"),
            frame({ height: 44, minWidth: 44 }),
            padding({ horizontal: 12 }),
            tint(palette.focus),
          ]}
          onPress={onAdd}
        >
          <Image size={18} systemName="plus" color="#FFFFFF" />
        </Button>

        {!compact ? (
          <HStack
            alignment="center"
            spacing={4}
            modifiers={[axLabel(collaboratorNames), padding({ horizontal: 6 })]}
          >
            <Image
              size={24}
              systemName="person.crop.circle.fill"
              color={palette.textSecondary}
            />
            <Image
              size={24}
              systemName="person.crop.circle.fill"
              color={palette.textSecondary}
            />
            <Text
              modifiers={[
                font({ size: 11, weight: "medium" }),
                foregroundStyle(palette.textSecondary),
              ]}
            >
              +2
            </Text>
          </HStack>
        ) : null}

        {!compact ? (
          <Button
            modifiers={[
              axHint("Opens the system share sheet for this project."),
              axLabel("Share project"),
              buttonStyle("glass"),
              frame({ height: 44, width: 44 }),
            ]}
            onPress={() =>
              void Share.share({
                message: "Join me on the Curiosity Project Bench.",
                title: "Curiosity Project Bench",
              })
            }
          >
            <Image
              size={18}
              systemName="square.and.arrow.up"
              color={palette.textPrimary}
            />
          </Button>
        ) : null}
      </HStack>
    </Host>
  </View>
);

const styles = StyleSheet.create({
  host: { width: "100%" },
  // The leading pad clears the system window-control pill in every mode.
  shell: { alignSelf: "stretch", paddingLeft: 60 },
});
