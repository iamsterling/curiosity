"use client"

import { forwardRef, type HTMLAttributes } from "react"
import { RotateCcw, Save } from "lucide-react"

import { useEditorChrome } from "../editor/chrome.js"
import { PanelHeading, PanelSection } from "./panel-shell.js"

/** Save / reload over the chrome context. */
const SceneActions = forwardRef<HTMLElement, HTMLAttributes<HTMLElement>>(
  (props, ref) => {
    const { reload, save } = useEditorChrome()
    return (
      <PanelSection ref={ref} {...props}>
        <PanelHeading>
          <span>Scene</span>
        </PanelHeading>
        <div className="save-actions">
          <button className="quiet" onClick={() => void reload()}><RotateCcw aria-hidden="true" size={15} /> Reload</button>
          <button className="primary" onClick={() => void save()}><Save aria-hidden="true" size={15} /> Save</button>
        </div>
        <p className="panel-foot">Visual representations only<br /><span>Source execution is not enabled</span></p>
      </PanelSection>
    )
  }
)
SceneActions.displayName = "SceneActions"

export { SceneActions }
