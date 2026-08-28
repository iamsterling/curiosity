"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  PagesPanel,
  type EditorProjection,
  useEditorSelector,
} from "@crafty/editor/ui";
import { ChevronDown, Layers3 } from "lucide-react";

const selectActivePageName = (projection: EditorProjection): string =>
  projection.pages.find((page) => page.id === projection.activePageId)?.name ??
  "Page";

export const PageSwitcher = () => {
  const pageName = useEditorSelector(selectActivePageName);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex h-8 items-center gap-1.5 rounded-md px-2.5 text-sm outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring">
        <Layers3 aria-hidden="true" size={14} />
        <span className="max-w-40 truncate font-medium">{pageName}</span>
        <ChevronDown
          aria-hidden="true"
          size={13}
          className="text-muted-foreground"
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64 p-0">
        <PagesPanel />
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
