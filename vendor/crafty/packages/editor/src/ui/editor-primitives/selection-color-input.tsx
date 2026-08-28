"use client";

import type { InputHTMLAttributes } from "react";
import { useEditor, useEditorSelector } from "../editor/editor-context.js";
import { layerEqual, selectSelectedLayer } from "./selection-state.js";

export const SelectionColorInput = ({ property, ...props }: { property: "fill" | "stroke" } & Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "value" | "onChange">): React.ReactNode => {
  const editor = useEditor();
  const selected = useEditorSelector(selectSelectedLayer, layerEqual);
  if (!selected) return null;
  const value = selected[property];
  const color = /^#[0-9a-f]{6}$/i.test(value) ? value : "#000000";
  return <input {...props} type="color" value={color} onChange={(event) => editor.dispatch({ type: "set-property", nodeId: selected.id, property, value: event.target.value })} />;
};
