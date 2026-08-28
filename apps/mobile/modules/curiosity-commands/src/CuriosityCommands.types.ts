export type CommandModifier = "command" | "control" | "option" | "shift";

export interface NativeCommandDefinition {
  readonly destructive: boolean;
  readonly enabled: boolean;
  readonly id: string;
  readonly key?: string;
  readonly menu: "file" | "help" | "view" | "work";
  readonly modifiers: readonly CommandModifier[];
  readonly section: number;
  readonly selected: boolean;
  readonly symbol?: string;
  readonly title: string;
}

export interface CommandEventPayload {
  readonly id: string;
}

export type CuriosityCommandsModuleEvents = {
  onCommand: (payload: CommandEventPayload) => void;
};
