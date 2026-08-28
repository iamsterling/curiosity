"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type MutableRefObject,
  type ReactNode,
} from "react";

interface StagePositioningValue {
  host: HTMLElement | null;
  actionElementRef: MutableRefObject<HTMLElement | null>;
  actionSizeRef: MutableRefObject<{ width: number; height: number }>;
  registerHost: (host: HTMLElement | null) => void;
  registerActionElement: (element: HTMLElement | null) => void;
}

const StagePositioningContext = createContext<StagePositioningValue | undefined>(undefined);

export function StagePositioningProvider({ children }: { children: ReactNode }) {
  const [host, setHost] = useState<HTMLElement | null>(null);
  const actionElementRef = useRef<HTMLElement | null>(null);
  const actionSizeRef = useRef({ width: 0, height: 0 });
  const registerHost = useCallback((element: HTMLElement | null) => setHost(element), []);
  const registerActionElement = useCallback((element: HTMLElement | null) => {
    actionElementRef.current = element;
  }, []);
  const value = useMemo(
    () => ({ host, actionElementRef, actionSizeRef, registerHost, registerActionElement }),
    [host, registerHost, registerActionElement],
  );
  return <StagePositioningContext.Provider value={value}>{children}</StagePositioningContext.Provider>;
}

export function useStagePositioning(): StagePositioningValue {
  const value = useContext(StagePositioningContext);
  if (!value) throw new Error("STAGE_POSITIONING_CONTEXT_MISSING");
  return value;
}

export const useOptionalStagePositioning = (): StagePositioningValue | undefined =>
  useContext(StagePositioningContext);
