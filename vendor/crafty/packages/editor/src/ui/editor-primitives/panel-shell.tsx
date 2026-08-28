"use client"

import { forwardRef, type HTMLAttributes } from "react"

import { cn } from "../lib/cn.js"

/** The shared chrome of a panel: section, heading, eyebrow. Content-only —
 *  no arrangement, no ordering; the layout decides placement. */
const PanelSection = forwardRef<HTMLElement, HTMLAttributes<HTMLElement>>(
  ({ className, children, ...props }, ref) => {
    return (
      <section ref={ref} className={cn("sidebar-section", className)} {...props}>
        {children}
      </section>
    )
  }
)
PanelSection.displayName = "PanelSection"

const PanelHeading = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => {
    return (
      <div ref={ref} className={cn("panel-heading", className)} {...props}>
        {children}
      </div>
    )
  }
)
PanelHeading.displayName = "PanelHeading"

const PanelEyebrow = forwardRef<HTMLSpanElement, HTMLAttributes<HTMLSpanElement>>(
  ({ className, children, ...props }, ref) => {
    return (
      <span ref={ref} className={cn("eyebrow", className)} {...props}>
        {children}
      </span>
    )
  }
)
PanelEyebrow.displayName = "PanelEyebrow"

export { PanelSection, PanelHeading, PanelEyebrow }
