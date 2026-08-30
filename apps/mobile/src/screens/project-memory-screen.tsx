import { MemorySurface } from "../components/memory-surface";
import { ProjectRouteCanvas } from "../components/project-route-canvas";
import { useProjectRoute } from "../project-route-context";

export const ProjectMemoryScreen = () => {
  const project = useProjectRoute();
  return (
    <ProjectRouteCanvas title="Memory">
      <MemorySurface key={project.projectId} />
    </ProjectRouteCanvas>
  );
};
