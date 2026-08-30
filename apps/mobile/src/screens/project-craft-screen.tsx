import { CraftSurface } from "../components/craft-surface";
import { ProjectRouteCanvas } from "../components/project-route-canvas";
import { useProjectRoute } from "../project-route-context";

export const ProjectCraftScreen = () => {
  const project = useProjectRoute();
  return (
    <ProjectRouteCanvas title="Craft">
      <CraftSurface key={project.projectId} projectId={project.projectId} />
    </ProjectRouteCanvas>
  );
};
