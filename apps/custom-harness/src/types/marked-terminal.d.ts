declare module "marked-terminal" {
  import type { MarkedExtension } from "marked";

  type TextStyle = (value: string) => string;

  export interface MarkedTerminalOptions {
    readonly blockquote?: TextStyle;
    readonly code?: TextStyle;
    readonly codespan?: TextStyle;
    readonly del?: TextStyle;
    readonly em?: TextStyle;
    readonly emoji?: boolean;
    readonly firstHeading?: TextStyle;
    readonly heading?: TextStyle;
    readonly href?: TextStyle;
    readonly hr?: TextStyle;
    readonly html?: TextStyle;
    readonly link?: TextStyle;
    readonly listitem?: TextStyle;
    readonly paragraph?: TextStyle;
    readonly reflowText?: boolean;
    readonly showSectionPrefix?: boolean;
    readonly strong?: TextStyle;
    readonly tab?: number | string;
    readonly table?: TextStyle;
    readonly text?: TextStyle;
    readonly unescape?: boolean;
    readonly width?: number;
  }

  export const markedTerminal: (
    options?: MarkedTerminalOptions,
    highlightOptions?: Readonly<Record<string, unknown>>,
  ) => MarkedExtension;
}
