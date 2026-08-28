"use client"

import { forwardRef, useRef, useState, type HTMLAttributes } from "react"
import { ArrowDown, ArrowUp, Layers3, Plus, Trash2 } from "lucide-react"
import type { PageRecord } from "../../kernel/index.js"

import { shallowArrayEqual, useEditor, useEditorSelector } from "../editor/editor-context.js"
import type { EditorProjection } from "../editor/harness.js"
import { PanelEyebrow, PanelHeading, PanelSection } from "./panel-shell.js"

const selectPages = (projection: EditorProjection): PageRecord[] => projection.pages
const selectActivePageId = (projection: EditorProjection): string => projection.activePageId

/** Navigate, create, rename, reorder, delete pages. Rename is an inline input
 *  owned here; everything else dispatches kernel commands. */
const PagesPanel = forwardRef<HTMLElement, HTMLAttributes<HTMLElement>>(
  (props, ref) => {
    const editor = useEditor()
    const pages = useEditorSelector(selectPages, shallowArrayEqual)
    const activePageId = useEditorSelector(selectActivePageId)
    const [renamingId, setRenamingId] = useState<string | undefined>(undefined)

    return (
      <PanelSection ref={ref} {...props}>
        <PanelHeading>
          <span>Pages</span>
          <PanelEyebrow>{pages.length} page{pages.length === 1 ? "" : "s"}</PanelEyebrow>
          <button className="add-button" aria-label="Add page" title="Add page" onClick={() => editor.createPage(`Page ${pages.length + 1}`)}>
            <Plus aria-hidden="true" size={14} />
          </button>
        </PanelHeading>
        <div className="page-tree">
          {pages.map((page, index) => (
            <div className={`page-row-wrap ${page.id === activePageId ? "active" : ""}`} key={page.id}>
              {renamingId === page.id ? (
                <div className={`page-row ${page.id === activePageId ? "active" : ""}`}>
                  <Layers3 aria-hidden="true" size={15} />
                  <PageRenameInput initial={page.name} onCommit={(name) => { editor.renamePage(page.id, name); setRenamingId(undefined) }} onCancel={() => setRenamingId(undefined)} />
                </div>
              ) : (
                <button className={`page-row ${page.id === activePageId ? "active" : ""}`} aria-pressed={page.id === activePageId} onClick={() => editor.setPage(page.id)} onDoubleClick={() => setRenamingId(page.id)} title="Double-click to rename">
                  <Layers3 aria-hidden="true" size={15} />
                  <span>{page.name}</span>
                </button>
              )}
              <div className="page-actions">
                <button aria-label={`Move ${page.name} up`} title="Move up" disabled={index === 0} onClick={() => editor.reorderPage(page.id, -1)}><ArrowUp aria-hidden="true" size={13} /></button>
                <button aria-label={`Move ${page.name} down`} title="Move down" disabled={index === pages.length - 1} onClick={() => editor.reorderPage(page.id, 1)}><ArrowDown aria-hidden="true" size={13} /></button>
                <button aria-label={`Delete ${page.name}`} title="Delete page" disabled={pages.length <= 1} onClick={() => editor.deletePage(page.id)}><Trash2 aria-hidden="true" size={13} /></button>
              </div>
            </div>
          ))}
        </div>
      </PanelSection>
    )
  }
)
PagesPanel.displayName = "PagesPanel"

function PageRenameInput({ initial, onCommit, onCancel }: { initial: string; onCommit: (name: string) => void; onCancel: () => void }) {
  const [draft, setDraft] = useState(initial)
  const inputRef = useRef<HTMLInputElement>(null)
  const commit = (): void => {
    const name = draft.trim()
    if (name) onCommit(name)
    else onCancel()
  }
  return (
    <input
      ref={inputRef}
      autoFocus
      className="page-rename"
      value={draft}
      aria-label="Page name"
      onChange={(event) => setDraft(event.target.value)}
      onFocus={(event) => event.currentTarget.select()}
      onBlur={commit}
      onKeyDown={(event) => {
        if (event.key === "Enter") commit()
        if (event.key === "Escape") onCancel()
      }}
    />
  )
}

export { PagesPanel }
