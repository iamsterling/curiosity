"use client";

import type { HTMLAttributes } from "react";
import { useEditorSelector } from "../editor/editor-context.js";
import { layerEqual, selectSelectedLayer } from "./selection-state.js";

export const SelectionColorValue = ({ property, kind = "fill", ...props }: { property: "fill" | "stroke"; kind?: "fill" | "stroke" } & HTMLAttributes<HTMLSpanElement>): React.ReactNode => {
  const selected = useEditorSelector(selectSelectedLayer, layerEqual);
  if (!selected) return null;
  return <span {...props} style={{ ...props.style, ...(kind === "fill" ? { backgroundColor: selected[property] } : { backgroundColor: "transparent", borderColor: selected[property] }) }} />;
};
