import React, { useEffect, useMemo } from "react";
import type { ReactNode } from "react";
import type { DrawPathGeometry } from "@crafty/scene-renderer";
import type { Color, SceneDescription, SceneNode, SceneViewport, Stroke, Transform2D } from "../index.js";
import { resolveScene } from "../index.js";

export interface SceneCanvasProps {
  canvas: SceneDescription["canvas"];
  viewport: SceneViewport;
  submit: (frame: ReturnType<typeof resolveScene>) => void;
  children?: ReactNode;
}
export interface SceneNodeProps { id: string; transform?: Transform2D; opacity?: number; zIndex?: number; children?: ReactNode }
export interface ScenePaintProps extends SceneNodeProps { bounds: { x: number; y: number; width: number; height: number }; fill: Color; stroke?: Stroke; cornerRadius?: number }

// These components are intentionally inert markers. SceneCanvas walks their
// React element tree, keeping the binding disposable and free of DOM state.
export const SceneRect = (_props: ScenePaintProps): null => null;
export const ScenePath = (_props: ScenePaintProps & { geometry: DrawPathGeometry; fillRule?: "nonzero" | "evenodd" }): null => null;
export const SceneText = (_props: SceneNodeProps & { bounds: ScenePaintProps["bounds"]; text: string; fill: Color; fontSize?: number }): null => null;
export const SceneGroup = (_props: SceneNodeProps): null => null;

const toNodes = (children: ReactNode): SceneNode[] => React.Children.toArray(children).flatMap((child): SceneNode[] => {
  if (!React.isValidElement(child)) return [];
  const props = child.props as Record<string, unknown>;
  const common = { id: props.id as string, ...(props.transform === undefined ? {} : { transform: props.transform as Transform2D }), ...(props.opacity === undefined ? {} : { opacity: props.opacity as number }), ...(props.zIndex === undefined ? {} : { zIndex: props.zIndex as number }) };
  if (child.type === SceneGroup) return [{ kind: "group", ...common, children: toNodes(props.children as ReactNode) }];
  if (child.type === SceneRect) return [{ kind: "rect", ...common, bounds: props.bounds as ScenePaintProps["bounds"], fill: props.fill as Color, ...(props.cornerRadius === undefined ? {} : { cornerRadius: props.cornerRadius as number }), ...(props.stroke ? { stroke: props.stroke as Stroke } : {}) }];
  if (child.type === ScenePath) return [{ kind: "path", ...common, bounds: props.bounds as ScenePaintProps["bounds"], fill: props.fill as Color, geometry: props.geometry as DrawPathGeometry, ...(props.fillRule ? { fillRule: props.fillRule as "nonzero" | "evenodd" } : {}), ...(props.stroke ? { stroke: props.stroke as Stroke } : {}) }];
  if (child.type === SceneText) return [{ kind: "text", ...common, bounds: props.bounds as ScenePaintProps["bounds"], text: props.text as string, fill: props.fill as Color, ...(props.fontSize === undefined ? {} : { fontSize: props.fontSize as number }) }];
  return [];
});

export const descriptionFromChildren = (canvas: SceneDescription["canvas"], children: ReactNode): SceneDescription => ({ canvas, children: toNodes(children) });

export const SceneCanvas = ({ canvas, viewport, submit, children }: SceneCanvasProps): null => {
  const description = useMemo(() => descriptionFromChildren(canvas, children), [canvas, children]);
  useEffect(() => {
    let cancelled = false;
    const run = (): void => { if (!cancelled) submit(resolveScene(description, viewport)); };
    const win = typeof window === "undefined" ? undefined : window;
    const handle = win?.requestAnimationFrame ? win.requestAnimationFrame(run) : setTimeout(run, 0);
    return () => { cancelled = true; if (win?.cancelAnimationFrame && typeof handle === "number") win.cancelAnimationFrame(handle); else clearTimeout(handle); };
  }, [description, viewport, submit]);
  return null;
};
