import { TUI_DESIGN_TOKENS } from "./design-system.js";

export type BrailleAnimation = "breathe" | "orbit" | "wave";
export type MotionPreference = "full" | "reduced";

export const ANIMATION_INTERVAL_MS = TUI_DESIGN_TOKENS.motion.activeFrameMs;

const frames: Readonly<Record<BrailleAnimation, readonly string[]>> = {
  breathe: Object.freeze([
    "⠁",
    "⠑",
    "⠕",
    "⢕",
    "⢝",
    "⢟",
    "⢿",
    "⣿",
    "⢿",
    "⢟",
    "⢝",
    "⢕",
    "⠕",
    "⠑",
  ]),
  orbit: Object.freeze(["⠉", "⠘", "⠰", "⢠", "⣀", "⡄", "⠆", "⠃"]),
  wave: Object.freeze(["⠑⢄", "⠊⠆", "⠢⠑", "⢄⠢", "⠔⢄", "⠒⠔", "⠆⠒", "⠁⠆"]),
};

const ticksPerFrame: Readonly<Record<BrailleAnimation, number>> = {
  breathe: 2,
  orbit: 1,
  wave: 2,
};

export const brailleFrame = (
  animation: BrailleAnimation,
  tick: number,
  motion: MotionPreference,
): string => {
  if (motion === "reduced") return animation === "wave" ? "⠿⠿" : "⠿";
  const sequence = frames[animation];
  const index = Math.floor(Math.max(0, tick) / ticksPerFrame[animation]);
  return sequence[index % sequence.length] ?? sequence[0] ?? "⠿";
};

export const resolveMotionPreference = (
  environment: Readonly<Record<string, string | undefined>>,
): MotionPreference =>
  environment.CURIOSITY_MOTION === "reduce" ? "reduced" : "full";
