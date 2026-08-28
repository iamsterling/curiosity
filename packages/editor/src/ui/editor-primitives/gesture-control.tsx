"use client";

import { forwardRef, type HTMLAttributes } from "react";

import { cn } from "../lib/cn.js";
import { useEditorChrome } from "../editor/chrome.js";

/** Gesture-sensitivity slider, backed by the chrome preferences. */
const EditorGestureControl = forwardRef<
  HTMLLabelElement,
  HTMLAttributes<HTMLLabelElement>
>(({ className, ...props }, ref) => {
  const { preferences, updatePreferences } = useEditorChrome();
  return (
    <label
      ref={ref}
      className={cn(
        "flex items-center gap-2 text-[11px] text-muted-foreground",
        className,
      )}
      title="Gesture sensitivity — how fast scroll pans and pinch zooms"
      {...props}
    >
      <span>Gestures</span>
      <input
        type="range"
        min={0.5}
        max={2}
        step={0.1}
        value={preferences.gestureSensitivity}
        aria-label="Gesture sensitivity"
        onChange={(event) =>
          updatePreferences({ gestureSensitivity: Number(event.target.value) })
        }
        className="h-4 w-16 accent-primary"
      />
      <span className="min-w-7 text-right tabular-nums">
        {Math.round(preferences.gestureSensitivity * 100)}%
      </span>
    </label>
  );
});
EditorGestureControl.displayName = "EditorGestureControl";

export { EditorGestureControl };
