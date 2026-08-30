import { createContext, type ReactNode, useContext } from "react";
import { localCuriosityClient } from "./local-curiosity-runtime";
import { useCuriosityWorkspace } from "./use-curiosity-workspace";

type CuriosityWorkspace = ReturnType<typeof useCuriosityWorkspace>;

const CuriosityWorkspaceContext = createContext<CuriosityWorkspace | null>(null);

export const CuriosityWorkspaceProvider = ({
  children,
}: {
  readonly children: ReactNode;
}) => {
  const workspace = useCuriosityWorkspace(localCuriosityClient);
  return (
    <CuriosityWorkspaceContext.Provider value={workspace}>
      {children}
    </CuriosityWorkspaceContext.Provider>
  );
};

export const useCuriosityWorkspaceContext = (): CuriosityWorkspace => {
  const workspace = useContext(CuriosityWorkspaceContext);
  if (!workspace) throw new Error("CURIOSITY_WORKSPACE_CONTEXT_MISSING");
  return workspace;
};
