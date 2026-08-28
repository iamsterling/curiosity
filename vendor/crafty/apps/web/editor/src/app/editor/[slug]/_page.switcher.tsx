"use client";

import { ChevronDown, Layers3 } from "lucide-react";

import {
  cn,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  PagesPanel,
  useEditorSelector,
  type EditorProjection,
} from "@crafty/editor/ui";

const selectActivePageName = (projection: EditorProjection): string =>
  projection.pages.find((page) => page.id === projection.activePageId)?.name ??
  "Page";

/**
 * The floating top-bar page switcher: the current page name as the trigger,
 * the full page surface (create, rename, reorder, delete, switch) in the
 * dropdown. Pages never occupy a permanent rail — this is their only home in
 * the chrome.
 */
function PageSwitcher() {
  const pageName = useEditorSelector(selectActivePageName);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "flex h-8 items-center gap-1.5 rounded-full px-2.5 text-sm",
          "hover:bg-accent hover:text-accent-foreground",
          "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
          "outline-none",
        )}
        aria-label="Switch page"
      >
        <Layers3
          aria-hidden="true"
          size={14}
          className="text-muted-foreground"
        />
        <span className="max-w-40 truncate font-medium">{pageName}</span>
        <ChevronDown
          aria-hidden="true"
          size={14}
          className="text-muted-foreground"
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="center" className="w-64 p-0">
        <PagesPanel />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export { PageSwitcher };
