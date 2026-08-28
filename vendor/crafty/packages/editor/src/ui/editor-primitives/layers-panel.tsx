"use client"

import { forwardRef, useMemo, useRef, useState, type HTMLAttributes, type KeyboardEvent } from "react"
import { ChevronDown, ChevronRight, Eye, EyeOff, GripVertical, Lock, LockOpen, ArrowDown, ArrowUp, AlertTriangle, Component as ComponentIcon, PanelLeftClose } from "lucide-react"
import { shallowArrayEqual, useEditor, useEditorSelector } from "../editor/editor-context.js"
import type { EditorProjection } from "../editor/harness.js"
import type { StructureDiagnostic, StructureRow } from "../editor/structure-projection.js"
import { PanelEyebrow, PanelHeading, PanelSection } from "./panel-shell.js"
import { useEditorChrome } from "../editor/chrome.js"

const selectStructure = (projection: EditorProjection) => projection.structure
const selectSelectedIds = (projection: EditorProjection): string[] => projection.selectedIds

type View = "containment" | "artboards" | "meaning" | "components"

/** The authored hierarchy surface. It deliberately consumes `structure`, not
 * the renderer's compatibility Scene; React owns only view and interaction UI
 * state while every document action goes back through CanvasEditor. */
const LayersPanel = forwardRef<HTMLElement, HTMLAttributes<HTMLElement>>((props, ref) => {
  const editor = useEditor()
  const { togglePanel } = useEditorChrome()
  const structure = useEditorSelector(selectStructure)
  const selectedIds = useEditorSelector(selectSelectedIds, shallowArrayEqual)
  const [view, setView] = useState<View>("containment")
  // Keep the initial mobile/first-open tree shallow: users can progressively
  // expand authored containers without being dropped into a large hierarchy.
  const [collapsed, setCollapsed] = useState<ReadonlySet<string>>(() => new Set(structure.roots.flatMap((row) => row.children.length ? [row.rowId] : [])))
  const [renaming, setRenaming] = useState<{ id: string; draft: string } | undefined>(undefined)
  const [activeRow, setActiveRow] = useState<string>()
  const [dropTarget, setDropTarget] = useState<{ id: string; position: "before" | "after" | "inside" }>()
  const rows = useMemo(() => flatten(structure.roots, collapsed), [structure.roots, collapsed])

  const toggleCollapsed = (id: string) => setCollapsed((old) => { const next = new Set(old); next.has(id) ? next.delete(id) : next.add(id); return next })
  const select = (id: string, additive = false) => additive ? editor.toggleSelection([id]) : editor.setSelection([id])
  const move = (row: StructureRow, direction: -1 | 1) => editor.reorderNode(row.authoredId!, direction)
  const keyboard = (event: KeyboardEvent<HTMLDivElement>, row: StructureRow) => {
    const index = rows.findIndex((candidate) => candidate.rowId === row.rowId)
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault(); const next = rows[index + (event.key === "ArrowDown" ? 1 : -1)]; if (next) { setActiveRow(next.rowId); document.getElementById(`structure-row-${next.rowId}`)?.focus() }
    } else if (event.key === "ArrowRight" && row.children.length > 0) { event.preventDefault(); if (collapsed.has(row.rowId)) toggleCollapsed(row.rowId); else row.children[0] && (setActiveRow(row.children[0].rowId), document.getElementById(`structure-row-${row.children[0].rowId}`)?.focus())
    } else if (event.key === "ArrowLeft") { event.preventDefault(); if (!collapsed.has(row.rowId) && row.children.length) toggleCollapsed(row.rowId); else if (row.parentAuthoredId) { setActiveRow(row.parentAuthoredId); document.getElementById(`structure-row-${row.parentAuthoredId}`)?.focus() } }
    else if (event.key === "Enter" && event.altKey && row.authoredId && row.canContain) { event.preventDefault(); editor.enterIsolation(row.authoredId) }
    else if (event.key === "Enter" || event.key === " ") { event.preventDefault(); if (row.authoredId) select(row.authoredId, event.shiftKey) }
    else if (event.key === "F2" && row.authoredId) { event.preventDefault(); setRenaming({ id: row.authoredId, draft: row.name }) }
  }

  return <PanelSection ref={ref} {...props}>
    <PanelHeading><span>Layers</span><PanelEyebrow>{structure.roots.length ? countRows(structure.roots) : 0} items</PanelEyebrow><button type="button" className="panel-dismiss" aria-label="Minimize layers panel" title="Minimize layers panel" onClick={() => togglePanel("layers")}><PanelLeftClose size={14} aria-hidden="true" /></button></PanelHeading>
    <div className="structure-tabs" role="tablist" aria-label="Structure views">
      {(["containment", "artboards", "meaning", "components"] as const).map((item) => <button key={item} role="tab" aria-selected={view === item} className={view === item ? "active" : ""} onClick={() => setView(item)}>{item === "containment" ? "Layers" : item[0]!.toUpperCase() + item.slice(1)}</button>)}
    </div>
    {structure.isolation.canExit ? <div className="structure-breadcrumb" aria-label="Isolation scope"><button type="button" onClick={() => editor.exitIsolation()} aria-label="Exit isolation">Back to page</button><span>Editing {structure.isolation.rootId}</span></div> : null}
    {view === "containment" ? <div className="layer-tree structure-tree" role="tree" aria-label="Authored structure">
      {structure.roots.map((row, index) => <StructureRowView key={row.rowId} row={row} siblings={structure.roots} rootId={`page-root-${structure.pageId.replace(/^page-/u, "")}`} level={1} position={index + 1} setSize={structure.roots.length} selectedIds={selectedIds} selected={selectedIds.includes(row.authoredId ?? "")} activeRow={activeRow} setActiveRow={setActiveRow} collapsed={collapsed} toggleCollapsed={toggleCollapsed} renaming={renaming} setRenaming={setRenaming} select={select} move={move} dropTarget={dropTarget} setDropTarget={setDropTarget} editor={editor} onKeyDown={keyboard} />)}
    </div> : view === "artboards" ? <ArtboardsView rows={structure.roots} selectedIds={selectedIds} select={select} editor={editor} /> : view === "meaning" ? <MeaningView rows={structure.roots} /> : <ComponentsView definitions={structure.definitions} rows={structure.roots} />}
  </PanelSection>
})
LayersPanel.displayName = "StructurePanel"

function StructureRowView({ row, siblings, rootId, level, position, setSize, selectedIds, selected, activeRow, setActiveRow, collapsed, toggleCollapsed, renaming, setRenaming, select, move, dropTarget, setDropTarget, editor, onKeyDown }: any) {
  const drag = useRef<{ id: string; parent: string | null; index: number } | undefined>(undefined)
  const childrenVisible = row.children.length > 0 && !collapsed.has(row.rowId)
  const finishDrop = () => { const source = drag.current; const target = dropTarget; drag.current = undefined; setDropTarget(undefined); if (!source || !target || !row.authoredId) return; if (target.position === "inside") editor.reparentNode(source.id, row.authoredId, row.children.length, "Move layer"); else { const parentId = row.parentAuthoredId ?? rootId; const targetIndex = siblings.findIndex((candidate: StructureRow) => candidate.rowId === row.rowId); if (targetIndex >= 0) { const index = target.position === "before" ? targetIndex : targetIndex + 1; source.parent === parentId ? editor.moveNodeToIndex(source.id, parentId, index, "Reorder layer") : editor.reparentNode(source.id, parentId, index, "Move layer") } } }
  return <div className="structure-node">
    <div id={`structure-row-${row.rowId}`} className={`layer-row ${selected ? "selected" : ""} ${dropTarget?.id === row.rowId ? `drop-${dropTarget.position}` : ""}`} role="treeitem" tabIndex={activeRow === row.rowId || (!activeRow && position === 1) ? 0 : -1} aria-level={level} aria-posinset={position} aria-setsize={setSize} aria-selected={selected} aria-expanded={row.children.length ? childrenVisible : undefined} aria-label={`${row.name}${row.surface ? `, ${row.surface.role} surface` : ""}${row.component ? `, component ${row.component.name}` : ""}${row.diagnostics?.length ? ", has diagnostic" : ""}`} data-locked={row.locked} onFocus={() => setActiveRow(row.rowId)} onKeyDown={(event) => onKeyDown(event, row)} draggable={row.draggable} onDragStart={(event) => { drag.current = { id: row.authoredId!, parent: row.parentAuthoredId, index: position - 1 }; event.dataTransfer.effectAllowed = "move" }} onDragOver={(event) => { event.preventDefault(); setDropTarget({ id: row.rowId, position: row.canContain ? "inside" : "before" }) }} onDrop={(event) => { event.preventDefault(); finishDrop() }}>
      <button className={`layer-chevron ${row.children.length ? "" : "spacer"}`} aria-label={childrenVisible ? `Collapse ${row.name}` : `Expand ${row.name}`} disabled={!row.children.length} onClick={() => toggleCollapsed(row.rowId)}>{row.children.length ? (childrenVisible ? <ChevronDown size={13} aria-hidden="true" /> : <ChevronRight size={13} aria-hidden="true" />) : null}</button>
      <span className="structure-grip" aria-hidden="true"><GripVertical size={13} /></span>
      {renaming?.id === row.authoredId ? <LayerRenameInput initial={renaming.draft} onCommit={(name: string) => { editor.dispatch({ type: "set-property", nodeId: row.authoredId, property: "name", value: name }, "Rename layer"); setRenaming(undefined) }} onCancel={() => setRenaming(undefined)} /> : <button className="layer-select" aria-label={`Select ${row.name}`} onClick={(event) => select(row.authoredId!, event.shiftKey)} onDoubleClick={() => row.canContain ? editor.enterIsolation(row.authoredId!) : setRenaming({ id: row.authoredId!, draft: row.name })}><span className={`layer-icon ${row.kind}`} aria-hidden="true" /><span className="layer-name">{row.name}</span>{row.surface ? <span className="structure-badge" title={`Surface: ${row.surface.role}`}>{row.surface.role}</span> : null}{row.component ? <span className="structure-badge component" title={`Component: ${row.component.name}`}><ComponentIcon size={10} aria-hidden="true" /> {row.component.overrideCount ? row.component.overrideCount : ""}</span> : null}{row.diagnostics?.map((item: StructureDiagnostic) => <span className="structure-badge diagnostic" key={item.code} title={item.message}><AlertTriangle size={10} aria-hidden="true" /> diagnostic</span>)}</button>}
      <div className="layer-actions"><button type="button" aria-label={row.visible ? `Hide ${row.name}` : `Show ${row.name}`} onClick={() => editor.dispatch({ type: "set-property", nodeId: row.authoredId, property: "visible", value: !row.visible }, row.visible ? "Hide layer" : "Show layer")}>{row.visible ? <Eye size={13} aria-hidden="true" /> : <EyeOff size={13} aria-hidden="true" />}</button><button type="button" aria-label={row.locked ? `Unlock ${row.name}` : `Lock ${row.name}`} onClick={() => editor.dispatch({ type: "set-property", nodeId: row.authoredId, property: "locked", value: !row.locked }, row.locked ? "Unlock layer" : "Lock layer")}>{row.locked ? <Lock size={13} aria-hidden="true" /> : <LockOpen size={13} aria-hidden="true" />}</button><button type="button" aria-label={`Move ${row.name} up`} title="Move up" onClick={() => move(row, -1)} disabled={!row.authoredId}><ArrowUp size={13} aria-hidden="true" /></button><button type="button" aria-label={`Move ${row.name} down`} title="Move down" onClick={() => move(row, 1)} disabled={!row.authoredId}><ArrowDown size={13} aria-hidden="true" /></button></div>
    </div>
    {childrenVisible ? <div className="layer-children">{row.children.map((child: StructureRow, childIndex: number) => <StructureRowView key={child.rowId} row={child} siblings={row.children} rootId={rootId} level={level + 1} position={childIndex + 1} setSize={row.children.length} selectedIds={selectedIds} selected={selectedIds.includes(child.authoredId ?? "")} activeRow={activeRow} setActiveRow={setActiveRow} collapsed={collapsed} toggleCollapsed={toggleCollapsed} renaming={renaming} setRenaming={setRenaming} select={select} move={move} dropTarget={dropTarget} setDropTarget={setDropTarget} editor={editor} onKeyDown={onKeyDown} />)}</div> : null}
  </div>
}

const flatten = (roots: StructureRow[], collapsed: ReadonlySet<string>): StructureRow[] => roots.flatMap((row) => [row, ...(collapsed.has(row.rowId) ? [] : flatten(row.children, collapsed))])
const countRows = (rows: StructureRow[]): number => rows.reduce((count, row) => count + 1 + countRows(row.children), 0)
function ArtboardsView({ rows, selectedIds, select, editor }: { rows: StructureRow[]; selectedIds: string[]; select: (id: string, additive?: boolean) => void; editor: ReturnType<typeof useEditor> }) {
  const artboards = rows.filter((row) => row.kind === "frame" && row.authoredId)
  return <div className="artboards-list structure-list" role="list" aria-label="Artboards">
    {artboards.map((row) => <button type="button" role="listitem" key={row.rowId} className={`artboard-item ${selectedIds.includes(row.authoredId!) ? "selected" : ""}`} onClick={() => { select(row.authoredId!); editor.zoomToSelection() }}>
      <span className="artboard-preview" aria-hidden="true" />
      <span className="artboard-copy"><strong>{row.name}</strong><span>{row.children.length} layer{row.children.length === 1 ? "" : "s"}</span></span>
    </button>)}
    {artboards.length === 0 ? <p className="structure-empty">No top-level artboards yet. Press F and draw one on the canvas.</p> : null}
  </div>
}
function MeaningView({ rows }: { rows: StructureRow[] }) { const items = flatten(rows, new Set()); return <div className="structure-list" role="list">{items.filter((row) => row.surface).map((row) => <div role="listitem" key={row.rowId}><strong>{row.surface!.role}</strong><span>{row.name}</span></div>)}{items.every((row) => !row.surface) ? <p className="structure-empty">No semantic surfaces on this page.</p> : null}</div> }
function ComponentsView({ definitions, rows }: { definitions: { rowId: string; name: string; instanceCount: number; status: string }[]; rows: StructureRow[] }) { const instances = flatten(rows, new Set()).filter((row) => row.component); return <div className="structure-list" role="list">{definitions.map((definition) => <div role="listitem" key={definition.rowId}><strong>{definition.name}</strong><span>{definition.instanceCount} instance{definition.instanceCount === 1 ? "" : "s"}</span></div>)}{instances.map((row) => <div role="listitem" key={`instance-${row.rowId}`}><strong>{row.name}</strong><span>{row.component!.name}</span></div>)}{!definitions.length && !instances.length ? <p className="structure-empty">No local components yet.</p> : null}</div> }
function LayerRenameInput({ initial, onCommit, onCancel }: { initial: string; onCommit: (name: string) => void; onCancel: () => void }) { const [draft, setDraft] = useState(initial); const commit = () => { const name = draft.trim(); name ? onCommit(name) : onCancel() }; return <input autoFocus className="layer-rename" value={draft} aria-label="Layer name" onChange={(event) => setDraft(event.target.value)} onFocus={(event) => event.currentTarget.select()} onBlur={commit} onKeyDown={(event) => { if (event.key === "Enter") commit(); if (event.key === "Escape") onCancel() }} /> }

export { LayersPanel }
export { LayersPanel as StructurePanel }
