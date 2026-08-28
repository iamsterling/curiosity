import { useCallback, useEffect, useMemo, useState } from "react";
import CuriosityCommands, {
  type NativeCommandDefinition,
} from "../../modules/curiosity-commands";
import {
  resolveWorkstationCommands,
  workstationCommandIds,
  type WorkstationCommand,
  type WorkstationCommandContext,
} from "./workstation-commands";

export const useWorkstationCommands = (
  context: WorkstationCommandContext,
  actions: {
    readonly newChat: () => void;
    readonly preparePrompt: (prefix: string) => void;
    readonly refreshSession: () => void;
    readonly showAudio: () => void;
    readonly showChat: () => void;
    readonly showCraft: () => void;
    readonly showIssues: () => void;
    readonly showMemory: () => void;
    readonly toggleSidebar: () => void;
  },
) => {
  const [paletteVisible, setPaletteVisible] = useState(false);
  const { busy, sidebarVisible, view } = context;
  const commands = useMemo(
    () => resolveWorkstationCommands({ busy, sidebarVisible, view }),
    [busy, sidebarVisible, view],
  );

  const execute = useCallback(
    (id: string) => {
      const command = commands.find((candidate) => candidate.id === id);
      if (!command?.enabled) return;

      switch (id) {
        case workstationCommandIds.commandPalette:
          setPaletteVisible(true);
          return;
        case workstationCommandIds.newChat:
          actions.newChat();
          return;
        case workstationCommandIds.refreshSession:
          actions.refreshSession();
          return;
        case workstationCommandIds.showChat:
          actions.showChat();
          return;
        case workstationCommandIds.showCraft:
          actions.showCraft();
          return;
        case workstationCommandIds.showIssues:
          actions.showIssues();
          return;
        case workstationCommandIds.showMemory:
          actions.showMemory();
          return;
        case workstationCommandIds.showAudio:
          actions.showAudio();
          return;
        case workstationCommandIds.startBuild:
          actions.preparePrompt("/task ");
          return;
        case workstationCommandIds.startResearch:
          actions.preparePrompt("/research ");
          return;
        case workstationCommandIds.toggleSidebar:
          actions.toggleSidebar();
      }
    },
    [actions, commands],
  );

  useEffect(() => {
    if (!CuriosityCommands) return;
    const subscription = CuriosityCommands.addListener(
      "onCommand",
      ({ id }) => execute(id),
    );
    return () => subscription.remove();
  }, [execute]);

  useEffect(() => {
    const nativeCommands: readonly NativeCommandDefinition[] = commands.map(
      ({ description: _description, ...command }) => command,
    );
    void CuriosityCommands?.setCommands(nativeCommands);
  }, [commands]);

  return Object.freeze({
    closePalette: () => setPaletteVisible(false),
    commands: commands as readonly WorkstationCommand[],
    execute,
    paletteVisible,
  });
};
