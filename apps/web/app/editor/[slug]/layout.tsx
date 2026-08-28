import {
  CreationColorControl,
  EditorChromeProvider,
  EditorFloatingPanels,
  EditorHistoryActions,
  EditorInspectorToggle,
  EditorLayersToggle,
  EditorProvider,
  EditorSelectionActions,
  EditorToolButton,
  EditorToolToggleGroup,
  EditorZoomInButton,
  EditorZoomOutButton,
  InspectorPanel,
  InspectorPanelContent,
  InspectorPanelHeader,
  SelectionColorControl,
  SelectionHeader,
  SelectionInspector,
  SelectionPresence,
  StagePositioningProvider,
  StatusBar,
  StructurePanel,
  createFileWorkspace,
} from "@crafty/editor/ui";
import { dataDirectory, isValidSlug, readDocument } from "@crafty/scene-store";
import {
  Circle,
  Frame as FrameIcon,
  Hand,
  MousePointer2,
  Package,
  PenTool,
  Slash,
  Square,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageSwitcher } from "./page-switcher";

export const dynamic = "force-dynamic";

type Params = { readonly params: Promise<{ readonly slug: string }> };

export const generateMetadata = async ({ params }: Params) => {
  const { slug } = await params;
  if (!isValidSlug(slug)) return { title: "Craft · Curiosity" };
  const result = readDocument(dataDirectory(), slug);
  return {
    title: result.ok
      ? `${result.value.document.file.name} · Curiosity`
      : "Craft · Curiosity",
  };
};

export default async function CraftCanvasLayout({
  children,
  params,
}: Params & { readonly children: React.ReactNode }) {
  const { slug } = await params;
  if (!isValidSlug(slug)) notFound();
  const result = readDocument(dataDirectory(), slug);
  if (!result.ok) notFound();
  const workspace = createFileWorkspace(slug);

  return (
    <div className="craftViewport">
      <EditorProvider
        initialConverted={result.value.converted}
        initialDocument={result.value.document}
        initialRevision={result.value.revision}
      >
        <StagePositioningProvider>
          <EditorChromeProvider
            initialConverted={result.value.converted}
            workspace={workspace}
          >
            <div className="pointer-events-none absolute inset-0 z-10 flex select-none flex-col p-3">
              <header className="pointer-events-auto flex min-h-10 items-start justify-between gap-3">
                <div className="flex items-center gap-2 rounded-lg border border-border bg-card/95 p-1 shadow-lg">
                  <Link
                    aria-label="All canvases"
                    className="grid size-8 place-items-center rounded-md text-muted-foreground outline-none hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring"
                    href="/editor"
                    title="All canvases"
                  >
                    <Package aria-hidden="true" size={16} />
                  </Link>
                  <PageSwitcher />
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-0.5 rounded-lg border border-border bg-card/95 p-1 shadow-lg">
                    <EditorHistoryActions />
                  </div>
                  <div className="flex items-center gap-0.5 rounded-lg border border-border bg-card/95 p-1 shadow-lg">
                    <EditorLayersToggle />
                    <EditorInspectorToggle />
                  </div>
                </div>
                <div className="flex items-center rounded-lg border border-border bg-card/95 p-1 shadow-lg">
                  <EditorZoomOutButton />
                  <EditorZoomInButton />
                </div>
              </header>

              <EditorFloatingPanels
                className="absolute inset-0"
                inspector={
                  <InspectorPanel className="absolute right-3 top-16 bottom-14 w-72 overflow-y-auto rounded-lg border border-border shadow-xl">
                    <InspectorPanelHeader className="border-b border-border">
                      <SelectionHeader />
                    </InspectorPanelHeader>
                    <InspectorPanelContent className="overflow-y-auto p-4">
                      <SelectionInspector />
                    </InspectorPanelContent>
                  </InspectorPanel>
                }
                layers={
                  <StructurePanel className="editor-layers-surface absolute left-3 top-16 bottom-14 w-72 overflow-hidden rounded-lg border border-border bg-card shadow-xl" />
                }
              />

              <div className="mt-auto flex items-end justify-between gap-4 pb-8">
                <div className="pointer-events-auto flex min-h-10 flex-1 items-center gap-1">
                  <SelectionPresence>
                    {(["fill", "stroke"] as const).map((property) => (
                      <SelectionColorControl
                        key={property}
                        property={property}
                      />
                    ))}
                  </SelectionPresence>
                  {(["fill", "stroke"] as const).map((property) => (
                    <CreationColorControl key={property} property={property} />
                  ))}
                </div>

                <nav
                  className="pointer-events-auto flex items-center gap-1 rounded-xl border border-border bg-card/95 p-1.5 shadow-xl"
                  aria-label="Craft tools"
                >
                  <EditorToolToggleGroup
                    aria-label="Move tools"
                    className="rounded-lg bg-muted/45 p-0.5"
                  >
                    <EditorToolButton
                      tool="select"
                      label="Select"
                      shortcut="V"
                      showShortcut={false}
                      icon={<MousePointer2 size={16} />}
                      className="size-8 flex-none rounded-md p-0"
                    />
                    <EditorToolButton
                      tool="hand"
                      label="Hand"
                      shortcut="H"
                      showShortcut={false}
                      icon={<Hand size={16} />}
                      className="size-8 flex-none rounded-md p-0"
                    />
                  </EditorToolToggleGroup>
                  <EditorToolToggleGroup
                    aria-label="Region tools"
                    className="rounded-lg bg-muted/45 p-0.5"
                  >
                    <EditorToolButton
                      tool="frame"
                      label="Frame"
                      shortcut="F"
                      showShortcut={false}
                      icon={<FrameIcon size={16} />}
                      className="size-8 flex-none rounded-md p-0"
                    />
                  </EditorToolToggleGroup>
                  <EditorToolToggleGroup
                    aria-label="Shape tools"
                    className="rounded-lg bg-muted/45 p-0.5"
                  >
                    <EditorToolButton
                      tool="rectangle"
                      label="Rectangle"
                      shortcut="R"
                      showShortcut={false}
                      icon={<Square size={16} />}
                      className="size-8 flex-none rounded-md p-0"
                    />
                    <EditorToolButton
                      tool="ellipse"
                      label="Ellipse"
                      shortcut="O"
                      showShortcut={false}
                      icon={<Circle size={16} />}
                      className="size-8 flex-none rounded-md p-0"
                    />
                    <EditorToolButton
                      tool="line"
                      label="Line"
                      shortcut="L"
                      showShortcut={false}
                      icon={<Slash size={16} />}
                      className="size-8 flex-none rounded-md p-0"
                    />
                  </EditorToolToggleGroup>
                  <EditorToolToggleGroup
                    aria-label="Vector tools"
                    className="rounded-lg bg-muted/45 p-0.5"
                  >
                    <EditorToolButton
                      tool="pen"
                      label="Pen"
                      shortcut="P"
                      showShortcut={false}
                      icon={<PenTool size={16} />}
                      className="size-8 flex-none rounded-md p-0"
                    />
                  </EditorToolToggleGroup>
                </nav>
                <div className="flex-1" />
              </div>
              <EditorSelectionActions />
              <StatusBar className="pointer-events-auto absolute inset-x-3 bottom-2 color-[var(--text-muted)] font-mono text-[9px]" />
            </div>
            {children}
          </EditorChromeProvider>
        </StagePositioningProvider>
      </EditorProvider>
    </div>
  );
}
