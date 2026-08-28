import type {
  DrawFillRule,
  DrawLineCap,
  DrawLineJoin,
  DrawPathGeometry,
  DrawStrokeDescriptor,
} from "@crafty/scene-renderer";
import type { Bounds, Transform2D } from "@crafty/scene-model";

export type Color = [number, number, number, number];
export type Stroke = DrawStrokeDescriptor;

export interface SceneCanvas {
  id: string;
  width: number;
  height: number;
  pixelRatio: number;
  background: Color;
}

export interface SceneRect {
  kind: "rect";
  id: string;
  bounds: Bounds;
  transform?: Transform2D;
  fill: Color;
  opacity?: number;
  cornerRadius?: number;
  stroke?: Stroke;
  zIndex?: number;
}

export interface ScenePath {
  kind: "path";
  id: string;
  bounds: Bounds;
  geometry: DrawPathGeometry;
  fill: Color;
  fillRule?: DrawFillRule;
  opacity?: number;
  transform?: Transform2D;
  stroke?: Stroke;
  zIndex?: number;
}

export interface SceneText {
  kind: "text";
  id: string;
  bounds: Bounds;
  text: string;
  fill: Color;
  fontSize?: number;
  opacity?: number;
  transform?: Transform2D;
  zIndex?: number;
}

export interface SceneGroup {
  kind: "group";
  id: string;
  children: SceneNode[];
  transform?: Transform2D;
  opacity?: number;
  zIndex?: number;
}

export type SceneNode = SceneRect | ScenePath | SceneText | SceneGroup;
export interface SceneDescription { canvas: SceneCanvas; children: SceneNode[] }

export type { Bounds, DrawFillRule, DrawLineCap, DrawLineJoin, DrawPathGeometry, DrawStrokeDescriptor, Transform2D };
