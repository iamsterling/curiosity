import { requireNativeView } from "expo";
import type { ComponentType } from "react";
import {
  processColor,
  type ColorValue,
  type NativeSyntheticEvent,
  type ViewProps,
} from "react-native";

export type CanvasViewport = Readonly<{
  centerX: number;
  centerY: number;
  zoom: number;
}>;

export type CanvasPointerInput = Readonly<{
  altKey?: boolean;
  clickCount?: number;
  ctrlKey?: boolean;
  phase: "cancel" | "down" | "move" | "up";
  pointerId: number;
  shiftKey?: boolean;
  x: number;
  y: number;
}>;

export type CanvasAccessibilityCommand =
  | "activate"
  | "decrement"
  | "increment";

export type CuriosityCanvasViewProps = ViewProps &
  Readonly<{
    accentColor?: ColorValue;
    frameJSON?: string;
    onAccessibilityCommand?: (command: CanvasAccessibilityCommand) => void;
    onPointerInput?: (input: CanvasPointerInput) => void;
    onViewportChange?: (viewport: CanvasViewport) => void;
  }>;

type NativeCanvasViewProps = ViewProps &
  Readonly<{
    accentColor?: ReturnType<typeof processColor>;
    frameJSON?: string;
    onAccessibilityCommand?: (
      event: NativeSyntheticEvent<Readonly<{ command: CanvasAccessibilityCommand }>>,
    ) => void;
    onPointerInput?: (
      event: NativeSyntheticEvent<CanvasPointerInput>,
    ) => void;
    onViewportChange?: (
      event: NativeSyntheticEvent<CanvasViewport>,
    ) => void;
  }>;

const NativeCanvasView: ComponentType<NativeCanvasViewProps> =
  requireNativeView("CuriosityCanvas");

export const CuriosityCanvasView = ({
  accentColor,
  frameJSON,
  onAccessibilityCommand,
  onPointerInput,
  onViewportChange,
  ...props
}: CuriosityCanvasViewProps) => (
  <NativeCanvasView
    {...props}
    accentColor={processColor(accentColor)}
    frameJSON={frameJSON}
    onAccessibilityCommand={
      onAccessibilityCommand
        ? (event) => onAccessibilityCommand(event.nativeEvent.command)
        : undefined
    }
    onPointerInput={
      onPointerInput
        ? (event) => onPointerInput(event.nativeEvent)
        : undefined
    }
    onViewportChange={
      onViewportChange
        ? (event) => onViewportChange(event.nativeEvent)
        : undefined
    }
  />
);
