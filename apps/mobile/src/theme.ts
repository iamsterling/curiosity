import { DynamicColorIOS } from "react-native";

const adaptive = (light: string, dark: string) =>
  DynamicColorIOS({ dark, light });

export const palette = Object.freeze({
  canvas: adaptive("#f7f9fb", "#05080b"),
  controlTint: adaptive("#176f91", "#acdff4"),
  danger: adaptive("#ba302a", "#ff948d"),
  dangerGlass: adaptive("rgba(186,48,42,0.1)", "rgba(255,148,141,0.12)"),
  focus: adaptive("#087da8", "#79d7ff"),
  focusQuiet: adaptive("rgba(8,125,168,0.1)", "rgba(71,177,221,0.13)"),
  glassFallback: adaptive("rgba(255,255,255,0.48)", "rgba(11,19,24,0.3)"),
  glassLine: adaptive("rgba(25,55,70,0.12)", "rgba(220,243,255,0.13)"),
  glassStrong: adaptive("rgba(255,255,255,0.72)", "rgba(23,39,48,0.5)"),
  glassTint: adaptive("rgba(255,255,255,0.12)", "rgba(174,223,244,0.08)"),
  line: adaptive("rgba(25,55,70,0.1)", "rgba(210,235,246,0.12)"),
  overlay: adaptive("rgba(15,25,30,0.18)", "rgba(0,0,0,0.48)"),
  sidebar: adaptive("#edf1f3", "#10171b"),
  success: adaptive("#167954", "#75ddb0"),
  successGlass: adaptive("rgba(22,121,84,0.1)", "rgba(117,221,176,0.12)"),
  surface: adaptive("rgba(255,255,255,0.78)", "rgba(17,28,34,0.68)"),
  surfaceQuiet: adaptive("rgba(244,248,250,0.74)", "rgba(8,15,20,0.56)"),
  textMuted: adaptive("#687780", "#82929b"),
  textPrimary: adaptive("#122027", "#f2f7f9"),
  textSecondary: adaptive("#50616a", "#afbec5"),
  warning: adaptive("#90691f", "#d7b873"),
});
