import { useMemo, useState } from "react";
import {
  FlatList,
  Modal,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import type { WorkstationCommand } from "../commands/workstation-commands";
import {
  shortcutLabel,
  workstationCommandIds,
} from "../commands/workstation-commands";
import { styles } from "./command-palette.styles";

const menuLabels = Object.freeze({
  file: "File",
  help: "Help",
  view: "View",
  work: "Work",
});

export const CommandPalette = ({
  commands,
  onClose,
  onRun,
  visible,
}: {
  readonly commands: readonly WorkstationCommand[];
  readonly onClose: () => void;
  readonly onRun: (id: string) => void;
  readonly visible: boolean;
}) => {
  const [query, setQuery] = useState("");
  const close = () => {
    setQuery("");
    onClose();
  };
  const filtered = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase();
    return commands.filter(({ description, id, menu, title }) => {
      if (id === workstationCommandIds.commandPalette) return false;
      if (!needle) return true;
      return `${menuLabels[menu]} ${title} ${description}`
        .toLocaleLowerCase()
        .includes(needle);
    });
  }, [commands, query]);

  const run = (command: WorkstationCommand) => {
    if (!command.enabled) return;
    close();
    onRun(command.id);
  };

  return (
    <Modal
      animationType="fade"
      onRequestClose={close}
      presentationStyle="overFullScreen"
      transparent
      visible={visible}
    >
      <View style={styles.backdrop}>
        <Pressable
          accessibilityLabel="Close command palette"
          accessibilityRole="button"
          onPress={close}
          style={styles.dismissTarget}
        />
        <View
          accessibilityViewIsModal
          style={styles.panel}
        >
          <TextInput
            autoCapitalize="none"
            autoCorrect={false}
            autoFocus
            clearButtonMode="while-editing"
            onChangeText={setQuery}
            placeholder="Type a command"
            placeholderTextColor={styles.placeholder.color}
            style={styles.search}
            value={query}
          />
          <FlatList
            data={filtered}
            keyboardShouldPersistTaps="handled"
            keyExtractor={({ id }) => id}
            ListEmptyComponent={
              <Text style={styles.empty}>No matching commands</Text>
            }
            renderItem={({ item }) => (
              <Pressable
                accessibilityRole="button"
                disabled={!item.enabled}
                onPress={() => run(item)}
                style={({ pressed }) => [
                  styles.command,
                  pressed && styles.pressed,
                  !item.enabled && styles.disabled,
                ]}
              >
                <View style={styles.commandCopy}>
                  <Text style={styles.commandTitle}>{item.title}</Text>
                  <Text numberOfLines={1} style={styles.commandDescription}>
                    {menuLabels[item.menu]} · {item.description}
                  </Text>
                </View>
                {item.selected ? <Text style={styles.check}>✓</Text> : null}
                {item.key ? (
                  <Text style={styles.shortcut}>{shortcutLabel(item)}</Text>
                ) : null}
              </Pressable>
            )}
            showsVerticalScrollIndicator={false}
            style={styles.list}
          />
        </View>
      </View>
    </Modal>
  );
};
