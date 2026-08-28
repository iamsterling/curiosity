"use client";

import { useEditorSelector } from "../editor/editor-context.js";
import { layerEqual, selectSelectedLayer } from "./selection-state.js";

export const SelectionPresence = ({ children }: { children: React.ReactNode }): React.ReactNode => {
  const selected = useEditorSelector(selectSelectedLayer, layerEqual);
  return selected ? children : null;
};
