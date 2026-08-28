"use client";

import { forwardRef, type ReactNode } from "react";

import type { EditorTool } from "../../kernel/index.js";
import { cn } from "../lib/cn.js";
import { Kbd } from "../primitives/kbd.js";
import { ToggleGroupItem } from "../primitives/toggle-group.js";

/**
 * A tool-selection button, rendered inside an `EditorToolToggleGroup`. The
 * pressed state comes from the group's value — which the group binds to the
 * kernel's `interaction.tool` — never from local React state. The optional
 * `shortcut` renders a key badge in the pill's corner.
 */
const EditorToolButton = forwardRef<
  HTMLButtonElement,
  {
    tool: EditorTool;
    label: string;
    shortcut?: string;
    showShortcut?: boolean;
    icon: ReactNode;
    className?: string;
  }
>(({ tool, label, shortcut, showShortcut = true, icon, className }, ref) => {
  return (
    <ToggleGroupItem
      ref={ref}
      value={tool}
      aria-label={label}
      title={shortcut ? `${label} (${shortcut})` : label}
      className={cn(
        "relative rounded-full first:rounded-full last:rounded-full p-4",
        className,
      )}
    >
      {icon}
      {shortcut && showShortcut ? (
        <Kbd size="sm" className="absolute right-1.5 bottom-1">
          {shortcut}
        </Kbd>
      ) : null}
    </ToggleGroupItem>
  );
});
EditorToolButton.displayName = "EditorToolButton";

export { EditorToolButton };
