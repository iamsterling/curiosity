import { notFound } from "next/navigation";

import { dataDirectory, isValidSlug, readDocument } from "@crafty/scene-store";

import {
  createFileWorkspace,
  EditorChromeProvider,
  StagePositioningProvider,
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@crafty/editor/ui";
import { EditorProvider } from "@crafty/editor/ui";
import { StatusBar } from "@crafty/editor/ui";
import {
  EditorHistoryActions,
  EditorSelectionActions,
  EditorToolButton,
  EditorToolToggleGroup,
  EditorZoomInButton,
  EditorZoomOutButton,
  EditorZoomPreset,
  EditorZoomTrigger,
  EditorLayersToggle,
  EditorInspectorToggle,
  EditorFloatingPanels,
  SelectionColorControl,
  CreationColorControl,
  SelectionPresence,
} from "@crafty/editor/ui";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@crafty/editor/ui";
import { Separator } from "@crafty/editor/ui";
import { cn } from "@crafty/editor/ui";
import {
  Hand,
  MousePointerIcon,
  Package,
  PenTool,
  Square,
  Circle,
  Slash,
  Frame as FrameIcon,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@crafty/editor/ui";
import { StructurePanel } from "@crafty/editor/ui";
import Link from "next/link";
import { PageSwitcher } from "./_page.switcher";

/**
 * The editor shell, defined here in the layout — a Server Component composing
 * the editor primitives. The document is read on the server and handed to the
 * client kernel provider as serializable props; the page's content (the
 * canvas island) slots into the canvas area via `children`. Client-ness
 * degrades only where state demands it: the kernel provider, the chrome
 * provider (save status, preferences, panel open state, refs) and the leaf
 * panels are client; the shell structure is server.
 *
 * The chrome floats above the canvas and never occludes it by default: file
 * navigation at top-left, separate centered history and panel-toggle pills,
 * zoom controls at stage-right, and grouped creation tools at the bottom.
 * Layers and inspector are dismissible floating surfaces — closed by default,
 * opened from the top bar — and the layout decides their placement and size.
 * Everything sits on a pointer-events-none overlay; only the chrome itself
 * is interactive, so the canvas beneath stays the focus.
 */
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params) {
  const { slug } = await params;
  if (!isValidSlug(slug)) return { title: "Crafty" };
  const result = readDocument(dataDirectory(), slug);
  return {
    title: result.ok ? `${result.value.document.file.name} — Crafty` : "Crafty",
  };
}

export default async function FileLayout({
  params,
  children,
}: Params & { children: React.ReactNode }) {
  const { slug } = await params;
  if (!isValidSlug(slug)) notFound();
  const result = readDocument(dataDirectory(), slug);
  if (!result.ok) notFound();
  const workspace = createFileWorkspace(slug);

  return (
    <EditorProvider
      initialDocument={result.value.document}
      initialRevision={result.value.revision}
      initialConverted={result.value.converted}
    >
      <StagePositioningProvider>
        <EditorChromeProvider
          workspace={workspace}
          initialConverted={result.value.converted}
        >
        <div className={cn("flex flex-col pointer-events-none select-none")}>
          <div
            className={cn(
              "absolute inset-0 z-10 p-4",
              "pointer-events-none select-none",
              // "bg-blue-500",
              "flex flex-col"
            )}
          >
            {/* Top chrome: navigation, separate action pills, and account. */}
            <header
              className={cn(
                "flex items-center justify-between gap-0.5",
                "pointer-events-auto",
                "w-full",
              )}
            >
              <div
                className={cn(
                  "flex-1",
                  "flex gap-2 w-fit items-center justify-start",
                )}
              >
                <Link
                  href={workspace.file.browserHref}
                  aria-label="All files"
                  title="All files"
                  className={cn(
                    "hover:bg-accent hover:text-accent-foreground",
                    "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
                    "outline-none",
                  )}
                >
                  <Package size={18} />
                </Link>
                <PageSwitcher />
              </div>
              <div
                className={cn(
                  "flex flex-1 items-center justify-center gap-2",
                )}
              >
                <div
                  className={cn(
                    "flex items-center gap-0.5 w-fit",
                    "rounded-full border border-border bg-card/95 px-1.5 py-1 shadow-lg backdrop-blur-sm",
                  )}
                  data-chrome-glass
                  data-chrome-radius="999"
                >
                  <EditorHistoryActions />
                </div>
                <div
                  className={cn(
                    "flex items-center gap-0.5 w-fit",
                    "rounded-full border border-border bg-card/95 px-1.5 py-1 shadow-lg backdrop-blur-sm",
                  )}
                  data-chrome-glass
                  data-chrome-radius="999"
                >
                  <EditorLayersToggle />
                  <EditorInspectorToggle />
                </div>
              </div>

              <div className={cn("flex-1", "flex justify-end")}>
                <Sheet>
                  <SheetTrigger
                    aria-label="Account"
                    title="Account"
                    className={cn(
                      "relative z-20 rounded-full hover:bg-accent",
                      "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
                      "outline-none",
                    )}
                  >
                    <Avatar className="account-avatar size-7">
                      <AvatarFallback>AV</AvatarFallback>
                    </Avatar>
                  </SheetTrigger>
                  <SheetContent side="right">
                    <div className="flex flex-col gap-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="border border-border bg-muted">
                          <AvatarFallback>AV</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-semibold">Crafty</p>
                          <p className="text-xs text-muted-foreground">
                            Signed in
                          </p>
                        </div>
                      </div>
                      <Separator />
                      <Link
                        href={workspace.file.browserHref}
                        className="text-sm text-muted-foreground hover:text-foreground"
                      >
                        All files
                      </Link>
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            </header>

            <div className={cn(
              "relative flex-1 h-full",
              "pointer-events-none select-none",
              "flex justify-between"
            )}>
              <div>
                LAYERS!
              </div>

              <div>
                <div className="flex items-center">
                    <EditorZoomOutButton />
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <EditorZoomTrigger />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="center"
                        className="w-fit px-2 py-1"
                      >
                        <EditorZoomPreset value={0.25} />
                        <EditorZoomPreset value={0.5} />
                        <EditorZoomPreset value={1} />
                        <EditorZoomPreset value={2} />
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <EditorZoomInButton />
                  </div>
              </div>
            </div>


            <div className={cn("flex justify-between")}>
              <div className="pointer-events-none flex flex-1 items-center gap-1">
                <SelectionPresence>
                  {(["fill", "stroke"] as const).map((property) => (
                    <SelectionColorControl key={property} property={property} />
                  ))}
                </SelectionPresence>
                <span aria-hidden="true" className="ml-auto" />
                {(["fill", "stroke"] as const).map((property) => (
                  <CreationColorControl key={property} property={property} />
                ))}
              </div>
              <nav className={cn(
                "self-center flex items-end gap-1",
                "w-fit p-1.5",
                "rounded-2xl border border-border/80 bg-card/95 shadow-xl backdrop-blur-xl",
                "pointer-events-auto",
              )}>
                <div className="flex flex-col items-center gap-1">
                  <span className="px-1 text-[9px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Move</span>
                  <EditorToolToggleGroup aria-label="Navigation tools" className="rounded-xl bg-muted/45 p-0.5">
                    <EditorToolButton tool="select" label="Select" shortcut="V" showShortcut={false} icon={<MousePointerIcon size={16} />} className="h-8 w-8 flex-none rounded-lg p-0" />
                    <EditorToolButton tool="hand" label="Hand" shortcut="H" showShortcut={false} icon={<Hand size={16} />} className="h-8 w-8 flex-none rounded-lg p-0" />
                  </EditorToolToggleGroup>
                </div>
                <Separator orientation="vertical" className="mx-0.5 h-6" />
                <div className="flex flex-col items-center gap-1">
                  <span className="px-1 text-[9px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Region</span>
                  <EditorToolToggleGroup aria-label="Region tools" className="rounded-xl bg-muted/45 p-0.5">
                    <EditorToolButton tool="frame" label="Frame" shortcut="F" showShortcut={false} icon={<FrameIcon size={16} />} className="h-8 w-8 flex-none rounded-lg p-0" />
                  </EditorToolToggleGroup>
                </div>
                <Separator orientation="vertical" className="mx-0.5 h-6" />
                <div className="flex flex-col items-center gap-1">
                  <span className="px-1 text-[9px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Shapes</span>
                  <EditorToolToggleGroup aria-label="Shape tools" className="rounded-xl bg-muted/45 p-0.5">
                    <EditorToolButton tool="rectangle" label="Rectangle" shortcut="R" showShortcut={false} icon={<Square size={16} />} className="h-8 w-8 flex-none rounded-lg p-0" />
                    <EditorToolButton tool="ellipse" label="Ellipse" shortcut="O" showShortcut={false} icon={<Circle size={16} />} className="h-8 w-8 flex-none rounded-lg p-0" />
                    <EditorToolButton tool="line" label="Line" shortcut="L" showShortcut={false} icon={<Slash size={16} />} className="h-8 w-8 flex-none rounded-lg p-0" />
                  </EditorToolToggleGroup>
                </div>
                <Separator orientation="vertical" className="mx-0.5 h-6" />
                <div className="flex flex-col items-center gap-1">
                  <span className="px-1 text-[9px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Vector</span>
                  <EditorToolToggleGroup aria-label="Vector tools" className="rounded-xl bg-muted/45 p-0.5">
                    <EditorToolButton tool="pen" label="Pen" shortcut="P" showShortcut={false} icon={<PenTool size={16} />} className="h-8 w-8 flex-none rounded-lg p-0" />
                  </EditorToolToggleGroup>
                </div>
              </nav>
              <EditorSelectionActions />
              <div className="flex-1" />
            </div>
          </div>
          { children }
        </div>
        </EditorChromeProvider>
      </StagePositioningProvider>
    </EditorProvider>
  );
}
