import type { ChatMessageProjection } from "../projection/chat-projection.js";
import type { MotionPreference } from "./animation.js";

export interface TuiFrameState {
  readonly animationTick: number;
  readonly columns: number;
  readonly effort: string;
  readonly error?: string;
  readonly input: string;
  readonly inputCursor: number;
  readonly messages: readonly ChatMessageProjection[];
  readonly modelId: string;
  readonly motion: MotionPreference;
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
}
