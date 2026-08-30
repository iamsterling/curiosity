import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import type { ProjectNavigationLevel } from "./components/project-pane-layout";

interface AppShellContextValue {
  readonly closeParentSidebar: () => void;
  readonly navigationLevel: ProjectNavigationLevel;
  readonly openParentSidebar: () => void;
  readonly parentSidebarOpen: boolean;
  readonly setNavigationLevel: (level: ProjectNavigationLevel) => void;
  readonly toggleParentSidebar: () => void;
}

const AppShellContext = createContext<AppShellContextValue | null>(null);

export const AppShellProvider = ({ children }: { readonly children: ReactNode }) => {
  const [navigationLevel, setNavigationLevel] =
    useState<ProjectNavigationLevel>("content");
  const [parentSidebarOpen, setParentSidebarOpen] = useState(false);
  const closeParentSidebar = useCallback(() => setParentSidebarOpen(false), []);
  const openParentSidebar = useCallback(() => setParentSidebarOpen(true), []);
  const toggleParentSidebar = useCallback(
    () => setParentSidebarOpen((current) => !current),
    [],
  );
  const value = useMemo(
    () => ({
      closeParentSidebar,
      navigationLevel,
      openParentSidebar,
      parentSidebarOpen,
      setNavigationLevel,
      toggleParentSidebar,
    }),
    [
      closeParentSidebar,
      navigationLevel,
      openParentSidebar,
      parentSidebarOpen,
      toggleParentSidebar,
    ],
  );
  return (
    <AppShellContext.Provider value={value}>
      {children}
    </AppShellContext.Provider>
  );
};

export const useAppShell = (): AppShellContextValue => {
  const shell = useContext(AppShellContext);
  if (!shell) throw new Error("APP_SHELL_CONTEXT_MISSING");
  return shell;
};
