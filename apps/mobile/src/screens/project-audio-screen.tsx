import { AudioSurface } from "../components/audio-surface";
import { ProjectRouteCanvas } from "../components/project-route-canvas";
import { useProjectRoute } from "../project-route-context";

export const ProjectAudioScreen = () => {
  const project = useProjectRoute();
  return (
    <ProjectRouteCanvas title="Audio">
      <AudioSurface key={project.projectId} />
    </ProjectRouteCanvas>
  );
};
