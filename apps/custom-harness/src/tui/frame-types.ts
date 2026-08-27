import type { ChatMessageProjection } from "../projection/chat-projection.js";
import type { MotionPreference } from "./animation.js";

export interface TuiCatalogView {
  readonly digest: string;
  readonly pluginIds: readonly string[];
  readonly toolNames: readonly string[];
  readonly workflowNames: readonly string[];
}

export interface TuiCapabilityView {
  readonly id: string;
  readonly reason: string;
  readonly state:
    | "catalogued"
    | "scaffolded"
    | "available"
    | "qualified"
    | "unavailable";
}

export interface TuiInspectorView {
  readonly capabilities: readonly TuiCapabilityView[];
  readonly catalog: TuiCatalogView;
  readonly profile: string;
}

export interface TuiPaletteItem {
  readonly description: string;
  readonly name: string;
  readonly status: "active" | "compatibility-deprecated";
}

export interface TuiPaletteView {
  readonly items: readonly TuiPaletteItem[];
  readonly query: string;
  readonly selectedIndex: number;
}

export interface TuiFrameState {
  readonly actorId?: string;
  readonly animationTick: number;
  readonly catalog?: TuiCatalogView;
  readonly columns: number;
  readonly effort: string;
  readonly error?: string;
  readonly input: string;
  readonly inputCursor: number;
  readonly messages: readonly ChatMessageProjection[];
  readonly modelId: string;
  readonly motion: MotionPreference;
  readonly inspector?: TuiInspectorView;
  readonly palette?: TuiPaletteView;
  readonly rows: number;
  readonly scrollOffset: number;
  readonly status: "idle" | "working";
  readonly streamingText?: string;
  readonly submittedText?: string;
  readonly threadTitle?: string;
  readonly workingDirectory: string;
}

export interface TerminalFrame {
  readonly cursor?: { readonly column: number; readonly row: number };
  readonly lines: readonly string[];
  readonly transcriptViewport?: {
    readonly endRow: number;
    readonly offset: number;
    readonly startRow: number;
  };
}
