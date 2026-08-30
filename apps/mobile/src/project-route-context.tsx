import { createContext, type ReactNode, useContext } from "react";
import type { ProjectRouteController } from "./use-project-route-controller";

const ProjectRouteContext = createContext<ProjectRouteController | null>(null);

export const ProjectRouteProvider = ({
  children,
  value,
}: {
  readonly children: ReactNode;
  readonly value: ProjectRouteController;
}) => (
  <ProjectRouteContext.Provider value={value}>
    {children}
  </ProjectRouteContext.Provider>
);

export const useProjectRoute = (): ProjectRouteController => {
  const project = useContext(ProjectRouteContext);
  if (!project) throw new Error("PROJECT_ROUTE_CONTEXT_MISSING");
  return project;
};
