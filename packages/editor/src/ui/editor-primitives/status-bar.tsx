"use client"

import { forwardRef, type HTMLAttributes } from "react"

import { cn } from "../lib/cn.js"
import { useEditorChrome } from "../editor/chrome.js"
import { useEditorSelector } from "../editor/editor-context.js"
import type { EditorProjection } from "../editor/harness.js"

const selectZoom = (projection: EditorProjection): number => projection.viewport.zoom
const selectRevision = (projection: EditorProjection): number => projection.revision
const selectStoryName = (projection: EditorProjection): string =>
  projection.frame?.stories.find((story) => story.id === projection.storyId)?.name ?? "Default"

/** The bottom status strip: save status, zoom, revision and active state. */
const StatusBar = forwardRef<HTMLElement, HTMLAttributes<HTMLElement>>(
  ({ className, ...props }, ref) => {
    const { status, workspace } = useEditorChrome()
    const zoom = useEditorSelector(selectZoom)
    const revision = useEditorSelector(selectRevision)
    const storyName = useEditorSelector(selectStoryName)
    return (
      <footer ref={ref} className={cn("flex w-full items-center justify-between gap-4", className)} role="status" {...props}>
        <span><a className="statusbar-link" href={workspace.file.browserHref}>All files</a> · {workspace.file.href} · {status}</span>
        <span>{workspace.mode} · {Math.round(zoom * 100)}% · revision {revision} · <strong>{storyName}</strong></span>
      </footer>
    )
  }
)
StatusBar.displayName = "StatusBar"

export { StatusBar }
