"use client";

import { useCallback } from "react";
import { useEditor, useEditorSelector } from "../editor/editor-context.js";
import type { EditorProjection } from "../editor/harness.js";
import { isCreationStyleTool } from "../editor/creation-style-tools.js";

const selectCreationTool = (projection: EditorProjection) => projection.interaction.tool;

export function CreationColorControl({ property }: { property: "fill" | "stroke" }) {
  const editor = useEditor();
  const selectValue = useCallback(
    (projection: EditorProjection) => projection.creationStyle[property],
    [property],
  );
  const value = useEditorSelector(selectValue);
  const tool = useEditorSelector(selectCreationTool);
  if (!isCreationStyleTool(tool)) return null;
  const label = property === "fill" ? "Creation fill color" : "Creation stroke color";
  return (
    <label
      title={label}
      className="pointer-events-auto relative flex size-10 cursor-pointer items-center justify-center overflow-hidden rounded-xl border border-dashed border-border bg-card p-1.5"
      onPointerDown={(event) => event.stopPropagation()}
    >
      <span
        aria-hidden="true"
        className="size-7 rounded-lg border-2 border-black/15 shadow-inner"
        style={{ backgroundColor: value }}
      />
      <input
        type="color"
        value={value}
        aria-label={label}
        className="absolute inset-0 size-full cursor-pointer opacity-0"
        onChange={(event) => {
          if (property === "fill") editor.setCreationFill(event.currentTarget.value);
          else editor.setCreationStroke(event.currentTarget.value);
        }}
      />
    </label>
  );
}
