"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import {
  clampSensitivity,
  defaultPreferences,
  loadPreferences,
  savePreferences,
  type Preferences,
} from "./preferences.js";
import { createAutosave } from "./autosave.js";
import { useEditor } from "./editor-context.js";
import type { MutableRef } from "./mutable-ref.js";
import { fetchDocument, postSnapshot, putDocument } from "./persistence.js";
import { saveWithStaleRetry } from "./save-with-retry.js";
import type { EditorWorkspace } from "./workspace.js";

/**
 * Editor chrome state: the shell-level client state that must exist below the
 * RSC boundary — save status, preferences, paste arming, the inspector's open
 * state, and the persistence callbacks. Renders no DOM of its own; the layout
 * composes the primitives and panels inside it, so only genuine client state
 * degrades to client.
 *
 * Preferences are hydrated in a mount effect, never during render:
 * `loadPreferences` touches `window.localStorage`, which does not exist on the
 * server — reading it during render makes the server and client disagree and
 * React throws a hydration mismatch. Server renders the defaults; the effect
 * replaces them with the stored values after mount.
 */

/** The floating chrome surfaces that can be open over the canvas. Panels
 *  consume their own state: each is dismissed and re-opened by the same
 *  toggles that open it, and the canvas is always the default focus. */
type OpenPanels = { layers: boolean; inspector: boolean };
type PanelName = keyof OpenPanels;

type EditorChromeContextValue = {
  status: string;
  setStatus: (status: string) => void;
  preferences: Preferences;
  updatePreferences: (next: Partial<Preferences>) => void;
  preferencesRef: MutableRef<Preferences>;
  pasteArmedRef: MutableRef<boolean>;
  workspace: EditorWorkspace;
  save: () => Promise<void>;
  reload: () => Promise<void>;
  snapshot: () => Promise<void>;
  openPanels: OpenPanels;
  togglePanel: (panel: PanelName) => void;
};

const EditorChromeContext = createContext<EditorChromeContextValue | null>(
  null,
);

export function useEditorChrome(): EditorChromeContextValue {
  const context = useContext(EditorChromeContext);
  if (!context)
    throw new Error(
      "useEditorChrome must be used within an EditorChromeProvider.",
    );
  return context;
}

export function EditorChromeProvider({
  workspace,
  initialConverted = false,
  children,
}: {
  workspace: EditorWorkspace;
  initialConverted?: boolean;
  children: ReactNode;
}) {
  const editor = useEditor();
  const [status, setStatus] = useState("Ready");
  const [preferences, setPreferences] =
    useState<Preferences>(defaultPreferences);
  const preferencesRef = useRef<Preferences>(defaultPreferences);
  const pasteArmedRef = useRef(false);
  const initialConvertedRef = useRef(initialConverted);
  const [openPanels, setOpenPanels] = useState<OpenPanels>({
    layers: false,
    inspector: false,
  });

  useEffect(() => {
    preferencesRef.current = preferences;
  }, [preferences]);

  useEffect(() => {
    const stored = loadPreferences();
    preferencesRef.current = stored;
    setPreferences(stored);
  }, []);

  useEffect(() => {
    if (initialConvertedRef.current)
      setStatus("Converted from legacy scene.json — saved as .ui");
  }, []);

  const updatePreferences = useCallback((next: Partial<Preferences>): void => {
    setPreferences((current) => {
      const merged: Preferences = {
        ...current,
        ...next,
        gestureSensitivity: clampSensitivity(
          next.gestureSensitivity ?? current.gestureSensitivity,
        ),
      };
      preferencesRef.current = merged;
      savePreferences(merged);
      return merged;
    });
  }, []);

  const save = useCallback(async (): Promise<void> => {
    setStatus("Saving...");
    try {
      const slug = workspace.file.slug;
      const body = await saveWithStaleRetry(
        () => editor.snapshotForSave(),
        (expectedRevision, document) =>
          putDocument(slug, expectedRevision, document),
      );
      editor.confirmSaved(body.revision);
      setStatus(`Saved revision ${body.revision}`);
    } catch (error: unknown) {
      setStatus(error instanceof Error ? error.message : "Save failed");
    }
  }, [editor, workspace]);

  const reload = useCallback(async (): Promise<void> => {
    try {
      const slug = workspace.file.slug;
      const body = await fetchDocument(slug);
      editor.replaceDocument(body.document, body.revision);
      setStatus(`Reloaded revision ${body.revision}`);
    } catch (error: unknown) {
      setStatus(error instanceof Error ? error.message : "Reload failed");
    }
  }, [editor, workspace]);

  const snapshot = useCallback(async (): Promise<void> => {
    try {
      const slug = workspace.file.slug;
      const body = await postSnapshot(slug);
      setStatus(`Snapshot ${body.metadata.sha256.slice(0, 12)}...`);
    } catch (error: unknown) {
      setStatus(error instanceof Error ? error.message : "Snapshot failed");
    }
  }, [workspace]);

  useEffect(() => {
    const autosave = createAutosave(editor, { debounceMs: 800, save });
    return autosave.dispose;
  }, [editor, save]);

  const togglePanel = useCallback((panel: PanelName): void => {
    setOpenPanels((current) => ({ ...current, [panel]: !current[panel] }));
  }, []);

  const value = useMemo<EditorChromeContextValue>(
    () => ({
      status,
      setStatus,
      preferences,
      updatePreferences,
      preferencesRef,
      pasteArmedRef,
      workspace,
      save,
      reload,
      snapshot,
      openPanels,
      togglePanel,
    }),
    [
      status,
      setStatus,
      preferences,
      updatePreferences,
      preferencesRef,
      pasteArmedRef,
      workspace,
      save,
      reload,
      snapshot,
      openPanels,
      togglePanel,
    ],
  );

  return (
    <EditorChromeContext.Provider value={value}>
      {children}
    </EditorChromeContext.Provider>
  );
}
