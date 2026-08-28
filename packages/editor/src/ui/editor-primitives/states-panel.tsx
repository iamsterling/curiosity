"use client"

import { forwardRef, type HTMLAttributes } from "react"
import { Camera, Plus } from "lucide-react"
import type { Story } from "@crafty/scene-model"

import { shallowArrayEqual, useEditor, useEditorSelector } from "../editor/editor-context.js"
import { useEditorChrome } from "../editor/chrome.js"
import type { EditorProjection } from "../editor/harness.js"
import { PanelHeading, PanelSection } from "./panel-shell.js"

const selectStories = (projection: EditorProjection): Story[] => projection.frame?.stories ?? []
const selectStoryId = (projection: EditorProjection): string => projection.storyId

/** Legacy `Story` overrides, not the component-state model — the
 *  pre-component mechanism, superseded by the component/state system. It is
 *  intentionally labelled as snapshots so it is not confused with component
 *  states. */
const StatesPanel = forwardRef<HTMLElement, HTMLAttributes<HTMLElement>>(
  (props, ref) => {
    const editor = useEditor()
    const { snapshot } = useEditorChrome()
    const stories = useEditorSelector(selectStories, shallowArrayEqual)
    const storyId = useEditorSelector(selectStoryId)
    return (
      <PanelSection ref={ref} className="story-section" {...props}>
        <PanelHeading>
          <span>Legacy snapshots</span>
          <button className="add-button" aria-label="Add state" title="Add state" onClick={() => editor.addStory()}><Plus aria-hidden="true" size={14} /></button>
        </PanelHeading>
        {stories.map((story) => (
          <button className={`story-row ${story.id === storyId ? "active" : ""}`} aria-pressed={story.id === storyId} key={story.id} onClick={() => editor.setStory(story.id)}>
            <span className="story-symbol" aria-hidden="true">{story.id === storyId ? "●" : "○"}</span>
            <span><strong>{story.name}</strong><small>{story.labels.join(" / ")}</small></span>
            {story.id === storyId ? <span className="active-label">ACTIVE</span> : null}
          </button>
        ))}
        <button className="snapshot-button" onClick={() => void snapshot()}><Camera aria-hidden="true" size={14} /> Capture deterministic snapshot</button>
      </PanelSection>
    )
  }
)
StatesPanel.displayName = "StatesPanel"

export { StatesPanel }
