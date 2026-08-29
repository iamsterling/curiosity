import type { NativeCommandDefinition } from "../../modules/curiosity-commands";
import type { WorkspaceView } from "../workspace-types";

export const workstationCommandIds = Object.freeze({
  commandPalette: "curiosity.work.commandPalette",
  newChat: "curiosity.file.newChat",
  refreshSession: "curiosity.work.refreshSession",
  showAudio: "curiosity.view.showAudio",
  showChat: "curiosity.view.showChat",
  showCraft: "curiosity.view.showCraft",
  showIssues: "curiosity.view.showIssues",
  showMemory: "curiosity.view.showMemory",
  startBuild: "curiosity.work.startBuild",
  startResearch: "curiosity.work.startResearch",
});

export type WorkstationCommandId =
  (typeof workstationCommandIds)[keyof typeof workstationCommandIds];

export interface WorkstationCommandContext {
  readonly busy: boolean;
  readonly view: WorkspaceView;
}

export interface WorkstationCommand extends NativeCommandDefinition {
  readonly description: string;
  readonly id: WorkstationCommandId;
}

type CommandSpec = Omit<
  WorkstationCommand,
  "enabled" | "selected"
> & {
  readonly enabled?: (context: WorkstationCommandContext) => boolean;
  readonly selected?: (context: WorkstationCommandContext) => boolean;
};

const specs: readonly CommandSpec[] = Object.freeze([
  {
    description: "Start a clean conversation in the active workspace.",
    destructive: false,
    id: workstationCommandIds.newChat,
    key: "n",
    menu: "file",
    modifiers: ["command"],
    section: 0,
    symbol: "square.and.pencil",
    title: "New Chat",
    enabled: ({ busy }) => !busy,
  },
  {
    description: "Show the conversation workspace.",
    destructive: false,
    id: workstationCommandIds.showChat,
    key: "1",
    menu: "view",
    modifiers: ["command"],
    section: 0,
    symbol: "bubble.left",
    title: "Chat",
    selected: ({ view }) => view === "chat",
  },
  {
    description: "Show the Craft visual-design surface.",
    destructive: false,
    id: workstationCommandIds.showCraft,
    key: "2",
    menu: "view",
    modifiers: ["command"],
    section: 0,
    symbol: "square.3.layers.3d",
    title: "Craft",
    selected: ({ view }) => view === "craft",
  },
  {
    description: "Show the active project's issue board.",
    destructive: false,
    id: workstationCommandIds.showIssues,
    key: "3",
    menu: "view",
    modifiers: ["command"],
    section: 0,
    symbol: "rectangle.3.group",
    title: "Issues",
    selected: ({ view }) => view === "issues",
  },
  {
    description: "Inspect evidence, beliefs, recall, and decision impact.",
    destructive: false,
    id: workstationCommandIds.showMemory,
    key: "4",
    menu: "view",
    modifiers: ["command"],
    section: 0,
    symbol: "point.3.connected.trianglepath.dotted",
    title: "Memory",
    selected: ({ view }) => view === "memory",
  },
  {
    description: "Show the future audio timeline surface.",
    destructive: false,
    id: workstationCommandIds.showAudio,
    key: "5",
    menu: "view",
    modifiers: ["command"],
    section: 0,
    symbol: "waveform",
    title: "Audio",
    selected: ({ view }) => view === "audio",
  },
  {
    description: "Search and run every available workstation command.",
    destructive: false,
    id: workstationCommandIds.commandPalette,
    key: "p",
    menu: "work",
    modifiers: ["command", "shift"],
    section: 0,
    symbol: "command",
    title: "Command Palette…",
  },
  {
    description: "Prepare a source-custodied research request in chat.",
    destructive: false,
    id: workstationCommandIds.startResearch,
    menu: "work",
    modifiers: [],
    section: 1,
    symbol: "magnifyingglass",
    title: "Start Research in Chat",
    enabled: ({ busy }) => !busy,
  },
  {
    description: "Prepare a bounded implementation request in chat.",
    destructive: false,
    id: workstationCommandIds.startBuild,
    menu: "work",
    modifiers: [],
    section: 1,
    symbol: "hammer",
    title: "Start Build in Chat",
    enabled: ({ busy }) => !busy,
  },
  {
    description: "Reload the active conversation and session status.",
    destructive: false,
    id: workstationCommandIds.refreshSession,
    menu: "work",
    modifiers: [],
    section: 2,
    symbol: "arrow.clockwise",
    title: "Refresh Session",
    enabled: ({ busy }) => !busy,
  },
]);

export const resolveWorkstationCommands = (
  context: WorkstationCommandContext,
): readonly WorkstationCommand[] =>
  specs.map(({ enabled, selected, ...command }) => ({
    ...command,
    enabled: enabled?.(context) ?? true,
    selected: selected?.(context) ?? false,
  }));

export const shortcutLabel = ({
  key,
  modifiers,
}: Pick<WorkstationCommand, "key" | "modifiers">): string => {
  if (!key) return "";
  const labels = { command: "⌘", control: "⌃", option: "⌥", shift: "⇧" };
  return `${modifiers.map((modifier) => labels[modifier]).join("")}${key.toUpperCase()}`;
};
