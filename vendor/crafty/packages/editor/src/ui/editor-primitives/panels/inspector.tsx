"use client";

import { forwardRef, useRef, useState, type HTMLAttributes } from "react";
import {
  AlignHorizontalJustifyCenter,
  AlignHorizontalJustifyEnd,
  AlignHorizontalJustifyStart,
  AlignStartHorizontal,
  Eye,
  EyeOff,
  Lock,
  LockOpen,
} from "lucide-react";
import type { Bounds, Layer } from "@crafty/scene-model";

import { cn } from "../../lib/cn.js";
import { useEditor, useEditorSelector } from "../../editor/editor-context.js";
import { useEditorChrome } from "../../editor/chrome.js";
import type { CanvasEditor, EditorProjection } from "../../editor/harness.js";
import type { LayoutSizing } from "../../../kernel/document.js";
import { ButtonGroup } from "../../primitives/button-group.js";
import { Input } from "../../primitives/input.js";
import { selectSelectedLayer, selectSelectedLayout, layerEqual } from "../selection-state.js";
import { ToggleGroup, ToggleGroupItem } from "../../primitives/toggle-group.js";

/**
 * The Inspector panel: a right-hand inspector column composed of primitives
 * (panel, header, content, group, footer) plus the selection-driven content
 * that fills it. The content changes based on WHAT is selected — the layout
 * slots `SelectionHeader` into the panel header and `SelectionInspector` into
 * the content, and each decides what to render from the kernel state.
 */

const InspectorPanel = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "border-l-1 border-border",
        "bg-card",
        "pointer-events-auto",
        "flex flex-col",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
});
InspectorPanel.displayName = "InspectorPanel";

const InspectorPanelHeader = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
  return (
    <div ref={ref} className={cn("p-4", className)} {...props}>
      {children}
    </div>
  );
});
InspectorPanelHeader.displayName = "InspectorPanelHeader";

const InspectorPanelContent = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
  return (
    <div ref={ref} className={cn("flex-1", className)} {...props}>
      {children}
    </div>
  );
});
InspectorPanelContent.displayName = "InspectorPanelContent";

const InspectorPanelGroup = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
  return (
    <div ref={ref} className={cn(className)} {...props}>
      {children}
    </div>
  );
});
InspectorPanelGroup.displayName = "InspectorPanelGroup";

const InspectorPanelFooter = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
  return (
    <div ref={ref} className={cn("p-4", className)} {...props}>
      {children}
    </div>
  );
});
InspectorPanelFooter.displayName = "InspectorPanelFooter";

// -- Selection content --------------------------------------------------------

const selectSelectedIds = (projection: EditorProjection): string[] =>
  projection.selectedIds;
const idsEqual = (left: string[], right: string[]): boolean =>
  left.length === right.length &&
  left.every((id, index) => id === right[index]);

/** The alignment buttons → the kernel's `align-nodes` axes. The command
 *  aligns the whole selection within its shared parent; mixed-parent
 *  selections fail loudly with the command's precondition code. */
const ALIGN_AXES: Record<
  string,
  "left" | "centerX" | "right" | "top" | "centerY" | "bottom"
> = {
  "align-horizontal-justify-start": "left",
  "align-horizontal-justify-center": "centerX",
  "align-horizontal-justify-end": "right",
  "align-vertical-justify-horizontal": "top",
  "align-vertical-justify-center": "centerY",
  "align-vertical-justify-end": "bottom",
};


/** The panel header content: the selected layer's name and type. */
const SelectionHeader = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement>
>(({ ...props }, ref) => {
  const selected = useEditorSelector(selectSelectedLayer, layerEqual);
  return (
    <div ref={ref} {...props}>
      {selected ? (
        <div className="panel-heading">
          <span>{selected.name}</span>
          <span className="eyebrow">{selected.type}</span>
        </div>
      ) : (
        <span className="font-semibold">Inspector</span>
      )}
    </div>
  );
});
SelectionHeader.displayName = "SelectionHeader";

/** The panel content: fields for the first selected layer, grouped. Every
 *  write is a `set-bounds`/`set-property` command through the kernel; the
 *  component owns only the in-flight text-draft state. */
const SelectionInspector = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement>
>(({ ...props }, ref) => {
  const editor = useEditor();
  const { setStatus } = useEditorChrome();
  const selected = useEditorSelector(selectSelectedLayer, layerEqual);
  const selectedIds = useEditorSelector(selectSelectedIds, idsEqual);
  const selectedLayout = useEditorSelector(selectSelectedLayout);

  const setSizing = (axis: "horizontal" | "vertical", mode: LayoutSizing["horizontal"]): void => {
    const current = selectedLayout?.sizing ?? { horizontal: "fixed", vertical: "fixed" };
    editor.dispatch({ type: "set-sizing", nodeId: selected!.id, sizing: { ...current, [axis]: mode } }, "Set layout sizing");
  };

  const align = (value: string): void => {
    const axis = ALIGN_AXES[value];
    if (!axis || selectedIds.length < 2) return;
    try {
      editor.dispatch(
        { type: "align-nodes", nodeIds: [...selectedIds], axis },
        "Align",
      );
    } catch (error: unknown) {
      setStatus(error instanceof Error ? error.message : String(error));
    }
  };
  const alignDisabled = selectedIds.length < 2;

  if (!selected) {
    return (
      <div ref={ref} className="empty-inspector" {...props}>
        Select a layer from the canvas or Layers panel to inspect its values.
      </div>
    );
  }

  return (
    <div ref={ref} {...props}>
      <InspectorPanelGroup
        className={cn("border-y-1 border-y-border p-4", "flex flex-col gap-2")}
      >
        <label>Alignment</label>
        <div className={cn("flex gap-1")}>
          <ToggleGroup
            type="single"
            onValueChange={(value) => {
              if (value) align(value);
            }}
          >
            <ToggleGroupItem
              value="align-horizontal-justify-start"
              disabled={alignDisabled}
            >
              <AlignHorizontalJustifyStart />
            </ToggleGroupItem>
            <ToggleGroupItem
              value="align-horizontal-justify-center"
              disabled={alignDisabled}
            >
              <AlignHorizontalJustifyCenter />
            </ToggleGroupItem>
            <ToggleGroupItem
              value="align-horizontal-justify-end"
              disabled={alignDisabled}
            >
              <AlignHorizontalJustifyEnd />
            </ToggleGroupItem>
          </ToggleGroup>
          <ToggleGroup
            type="single"
            onValueChange={(value) => {
              if (value) align(value);
            }}
          >
            <ToggleGroupItem
              value="align-vertical-justify-horizontal"
              disabled={alignDisabled}
            >
              <AlignStartHorizontal />
            </ToggleGroupItem>
            <ToggleGroupItem
              value="align-vertical-justify-center"
              disabled={alignDisabled}
            >
              <AlignHorizontalJustifyCenter />
            </ToggleGroupItem>
            <ToggleGroupItem
              value="align-vertical-justify-end"
              disabled={alignDisabled}
            >
              <AlignHorizontalJustifyEnd />
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </InspectorPanelGroup>

      <InspectorPanelGroup className="field-group p-4">
        {/* <LayerNameField key={selected.id} layer={selected} /> */}

        <div className="field-grid">
          <div
            className={cn(
              "flex justify-between items-center",
              "border-1 border-border rounded-md h-fit",
              "bg-border",
              "transition-[border-color,box-shadow]",
              "hover:border-ring/60",
              "focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50",
              "overflow-hidden",
            )}
          >
            <span className={cn("px-3", "bg-border")}>x</span>
            <Input
              aria-label="X position"
              type="number"
              name="x-position"
              value={Math.round(selected.bounds.x)}
              onChange={(event) =>
                updateNumber(editor, selected, "x", event.target.value)
              }
              className={cn(
                "h-7 w-16 m-0 border-0 bg-transparent px-1",
                "outline-0 border-0 ring-0",
                "focus-visible:border-0 focus-visible:ring-0 focus:ring-[unset] focus:outline-0",
                "focus:bg-green-500",
              )}
            />
          </div>
          <div
            className={cn(
              "flex justify-between items-center",
              "border-1 border-border rounded-md h-fit",
              "bg-border",
              "transition-[border-color,box-shadow]",
              "hover:border-ring/60",
              "focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50",
              "overflow-hidden",
            )}
          >
            <span className={cn("px-3", "bg-border")}>w</span>
            <Input
              aria-label="Width"
              type="number"
              name="width"
              value={Math.round(selected.bounds.width)}
              onChange={(event) =>
                updateNumber(editor, selected, "width", event.target.value)
              }
              className={cn(
                "h-7 w-16 m-0 border-0 bg-transparent px-1",
                "outline-0 border-0 ring-0",
                "focus-visible:border-0 focus-visible:ring-0 focus:ring-[unset] focus:outline-0",
                "focus:bg-green-500",
              )}
            />
          </div>
          <div
            className={cn(
              "flex justify-between items-center",
              "border-1 border-border rounded-md h-fit",
              "bg-border",
              "transition-[border-color,box-shadow]",
              "hover:border-ring/60",
              "focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50",
              "overflow-hidden",
            )}
          >
            <span className={cn("px-3", "bg-border")}>h</span>
            <Input
              aria-label="Height"
              type="number"
              name="height"
              value={Math.round(selected.bounds.height)}
              onChange={(event) =>
                updateNumber(editor, selected, "height", event.target.value)
              }
              className={cn(
                "h-7 w-16 m-0 border-0 bg-transparent px-1",
                "focus-visible:ring-0 focus-visible:outline-0 focus-visible:bg-green-500",
                "active:bg-green-500",
              )}
            />
          </div>
        </div>
      </InspectorPanelGroup>

      <InspectorPanelGroup className="field-group border-y-1 border-y-border p-4">
        <label>Layout sizing</label>
        {(["horizontal", "vertical"] as const).map((axis) => (
          <div key={axis} className="flex items-center justify-between gap-2">
            <span className="capitalize">{axis}</span>
            <ToggleGroup type="single" value={selectedLayout?.sizing?.[axis] ?? "fixed"} onValueChange={(value) => { if (value === "fixed" || value === "hug" || value === "fill") setSizing(axis, value); }}>
              <ToggleGroupItem value="fixed">Fixed</ToggleGroupItem>
              <ToggleGroupItem value="hug">Hug</ToggleGroupItem>
              <ToggleGroupItem value="fill">Fill</ToggleGroupItem>
            </ToggleGroup>
          </div>
        ))}
        <div className="flex items-center justify-between gap-2">
          <span>Participation</span>
          <ToggleGroup type="single" value={selectedLayout?.layoutPosition ?? "flow"} onValueChange={(value) => { if (value === "flow" || value === "absolute") editor.dispatch({ type: "set-layout-position", nodeId: selected.id, layoutPosition: value }, "Set layout participation"); }}>
            <ToggleGroupItem value="flow">Flow</ToggleGroupItem>
            <ToggleGroupItem value="absolute">Absolute</ToggleGroupItem>
          </ToggleGroup>
        </div>
      </InspectorPanelGroup>

      <InspectorPanelGroup className="field-group">
        <label className="wide-field">
          Fill
          <input
            aria-label="Fill color"
            type="text"
            value={selected.fill}
            onChange={(event) =>
              editor.dispatch({
                type: "set-property",
                nodeId: selected.id,
                property: "fill",
                value: event.target.value,
              })
            }
          />
        </label>
        <label className="wide-field">
          Stroke
          <input
            aria-label="Stroke color"
            type="text"
            value={selected.stroke}
            onChange={(event) =>
              editor.dispatch({
                type: "set-property",
                nodeId: selected.id,
                property: "stroke",
                value: event.target.value,
              })
            }
          />
        </label>
        {selected.type === "text" ? (
          <label className="wide-field">
            Text
            <input
              aria-label="Text content"
              type="text"
              value={selected.text ?? ""}
              onChange={(event) =>
                editor.dispatch({
                  type: "set-property",
                  nodeId: selected.id,
                  property: "text",
                  value: event.target.value,
                })
              }
            />
          </label>
        ) : null}
        <div className="field-grid">
          <label>
            Corner radius
            <input
              aria-label="Corner radius"
              type="number"
              min="0"
              value={Math.round(selected.cornerRadius)}
              onChange={(event) =>
                updateNumberProperty(
                  editor,
                  selected,
                  "cornerRadius",
                  event.target.value,
                )
              }
            />
          </label>
          <label>
            Opacity
            <input
              aria-label="Opacity"
              type="number"
              min="0"
              max="1"
              step="0.05"
              value={selected.opacity}
              onChange={(event) =>
                editor.dispatch({
                  type: "set-property",
                  nodeId: selected.id,
                  property: "opacity",
                  value: Math.min(1, Math.max(0, Number(event.target.value))),
                })
              }
            />
          </label>
        </div>
      </InspectorPanelGroup>

      <InspectorPanelGroup className="field-group">
        <div className="inspector-toggles">
          <button
            className={selected.visible ? "on" : ""}
            aria-pressed={selected.visible}
            onClick={() =>
              editor.dispatch(
                {
                  type: "set-property",
                  nodeId: selected.id,
                  property: "visible",
                  value: !selected.visible,
                },
                selected.visible ? "Hide layer" : "Show layer",
              )
            }
          >
            {selected.visible ? (
              <Eye aria-hidden="true" size={13} />
            ) : (
              <EyeOff aria-hidden="true" size={13} />
            )}
            {selected.visible ? "Visible" : "Hidden"}
          </button>
          <button
            className={selected.locked ? "on" : ""}
            aria-pressed={selected.locked ?? false}
            onClick={() =>
              editor.dispatch(
                {
                  type: "set-property",
                  nodeId: selected.id,
                  property: "locked",
                  value: !(selected.locked ?? false),
                },
                selected.locked ? "Unlock layer" : "Lock layer",
              )
            }
          >
            {selected.locked ? (
              <Lock aria-hidden="true" size={13} />
            ) : (
              <LockOpen aria-hidden="true" size={13} />
            )}
            {selected.locked ? "Locked" : "Unlocked"}
          </button>
        </div>
        <div className="selection-readout">
          <span>Layer ID</span>
          <strong>{selected.id}</strong>
        </div>
      </InspectorPanelGroup>
    </div>
  );
});
SelectionInspector.displayName = "SelectionInspector";

function LayerNameField({ layer }: { layer: Layer }) {
  const editor = useEditor();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(layer.name);
  const inputRef = useRef<HTMLInputElement>(null);
  if (editing) {
    const commit = (): void => {
      const name = draft.trim();
      if (name)
        editor.dispatch(
          {
            type: "set-property",
            nodeId: layer.id,
            property: "name",
            value: name,
          },
          "Rename layer",
        );
      setEditing(false);
    };
    return (
      <input
        ref={inputRef}
        autoFocus
        className="inspector-name"
        aria-label="Layer name"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onFocus={(event) => event.currentTarget.select()}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === "Enter") commit();
          if (event.key === "Escape") setEditing(false);
        }}
      />
    );
  }
  return (
    <button
      className="inspector-name-readout"
      title="Click to rename"
      onClick={() => {
        setDraft(layer.name);
        setEditing(true);
      }}
    >
      <h2>{layer.name}</h2>
    </button>
  );
}

const updateNumber = (
  editor: CanvasEditor,
  layer: Layer,
  key: keyof Bounds,
  value: string,
): void => {
  const next =
    key === "width" || key === "height"
      ? Math.max(1, Number(value))
      : Number(value);
  if (!Number.isFinite(next)) return;
  editor.dispatch({
    type: "set-bounds",
    nodeId: layer.id,
    bounds: { ...layer.bounds, [key]: next },
  });
};

const updateNumberProperty = (
  editor: CanvasEditor,
  layer: Layer,
  property: "cornerRadius",
  value: string,
): void => {
  const next = Math.max(0, Number(value));
  if (!Number.isFinite(next)) return;
  editor.dispatch({
    type: "set-property",
    nodeId: layer.id,
    property,
    value: next,
  });
};

export {
  InspectorPanel,
  InspectorPanelHeader,
  InspectorPanelContent,
  InspectorPanelGroup,
  InspectorPanelFooter,
  SelectionHeader,
  SelectionInspector,
};
