export interface Preferences {
  gestureSensitivity: number;
}

export const defaultPreferences: Preferences = { gestureSensitivity: 1 };

const storageKey = "crafty.preferences";

const isPreferences = (value: unknown): value is Preferences =>
  value !== null &&
  typeof value === "object" &&
  typeof (value as Preferences).gestureSensitivity === "number" &&
  Number.isFinite((value as Preferences).gestureSensitivity);

export const clampSensitivity = (value: number): number => Math.min(2, Math.max(0.5, value));

export const loadPreferences = (): Preferences => {
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (raw === null) return defaultPreferences;
    const parsed = JSON.parse(raw) as unknown;
    if (!isPreferences(parsed)) return defaultPreferences;
    return { gestureSensitivity: clampSensitivity(parsed.gestureSensitivity) };
  } catch {
    return defaultPreferences;
  }
};

export const savePreferences = (preferences: Preferences): void => {
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(preferences));
  } catch {
    return;
  }
};
