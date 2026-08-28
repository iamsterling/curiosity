"use client";

import { forwardRef, type HTMLAttributes } from "react";
import { Magnet, Ruler, Shapes, Grid3x3, Grid2x2 } from "lucide-react";

import { cn } from "../lib/cn.js";
import { Button } from "../primitives/button.js";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../primitives/popover.js";
import { useEditor, useEditorSelector } from "../editor/editor-context.js";
import { selectSnapSettings } from "./selectors.js";

/**
 * The snap-families surface: per-page authored toggles (one history entry
 * each) for grid / guides / objects / pixel snapping — the settings that
 * were authored-but-invisible. The escape hatch that makes strong snapping
 * tolerable is keyboard-side: hold ⌘ while dragging to bypass.
 */
const EditorSnapSettings = forwardRef<
  HTMLButtonElement,
  HTMLAttributes<HTMLButtonElement>
>(({ className, ...props }, ref) => {
  const editor = useEditor();
  const snap = useEditorSelector(selectSnapSettings);
  const families: Array<{
    key: "grid" | "guides" | "objects" | "pixel";
    label: string;
    icon: React.ReactNode;
  }> = [
    { key: "grid", label: "Grid", icon: <Grid3x3 aria-hidden="true" size={13} /> },
    { key: "guides", label: "Guides", icon: <Ruler aria-hidden="true" size={13} /> },
    { key: "objects", label: "Objects", icon: <Shapes aria-hidden="true" size={13} /> },
    { key: "pixel", label: "Pixel", icon: <Grid2x2 aria-hidden="true" size={13} /> },
  ];
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          ref={ref}
          variant="ghost"
          size="sm"
          title="Snap settings"
          aria-label="Snap settings"
          className={cn(
            "h-9 rounded-full gap-2 px-3 text-xs border border-border bg-card",
            className,
          )}
          {...props}
        >
          <Magnet aria-hidden="true" size={14} />
          Snap
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-44 p-2 flex flex-col gap-1">
        {families.map((family) => (
          <button
            key={family.key}
            className={cn(
              "flex items-center gap-2 rounded-md px-2 py-1.5 text-xs",
              "hover:bg-accent hover:text-accent-foreground",
              "justify-between",
            )}
            aria-pressed={snap[family.key]}
            onClick={() => editor.setSnapSetting(family.key, !snap[family.key])}
          >
            <span className="flex items-center gap-2">
              {family.icon}
              {family.label}
            </span>
            <span
              className={cn(
                "w-7 h-4 rounded-full border transition-colors relative",
                snap[family.key]
                  ? "bg-primary border-primary"
                  : "bg-muted border-border",
              )}
            >
              <span
                className={cn(
                  "absolute top-0.5 w-3 h-3 rounded-full bg-background transition-all",
                  snap[family.key] ? "left-3.5" : "left-0.5",
                )}
              />
            </span>
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
});
EditorSnapSettings.displayName = "EditorSnapSettings";

export { EditorSnapSettings };
